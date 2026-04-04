import { Worker, Job } from 'bullmq';
import { redisConnection } from '../config/bullmq';
import prisma from '../config/prisma';
import cloudinary from '../config/cloudinary';
import { getIO } from '../config/socket';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';
import fs from 'fs';

import path from 'path';
import axios from 'axios';
import { Queue } from 'bullmq';

import { getFfmpegPath, getFfprobePath } from '../utils/ffmpeg-paths';

ffmpeg.setFfmpegPath(getFfmpegPath());
ffmpeg.setFfprobePath(getFfprobePath());

console.log(`[FFMPEG] Path: ${getFfmpegPath()}`);
console.log(`[FFPROBE] Path: ${getFfprobePath()}`);
// -------------------------------

const emailQueue = new Queue('email-notification', { connection: redisConnection });

const transcodeVideo = async (job: Job) => {
  const { videoId, cloudinaryUrl, email } = job.data;
  const io = getIO();

  try {
    const video = await prisma.video.findUnique({ where: { id: videoId } });
    if (!video) throw new Error('Video record not found');

    const originalFilename = video.filename || 'video';
    const tempDir = path.join(process.cwd(), 'temp', videoId);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const inputPath = path.join(tempDir, 'input.mp4');
    const writer = fs.createWriteStream(inputPath);

    // Download the video
    const response = await axios({
      url: cloudinaryUrl,
      method: 'GET',
      responseType: 'stream',
    });

    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    // Get video metadata to determine source height
    const metadata: any = await new Promise((resolve, reject) => {
      ffmpeg.ffprobe(inputPath, (err, metadata) => {
        if (err) reject(err);
        else resolve(metadata);
      });
    });

    const sourceHeight = metadata.streams.find((s: any) => s.codec_type === 'video')?.height || 0;
    console.log(`Source video height: ${sourceHeight}`);

    const allResolutions = [
      { name: '360p', height: 360, width: 640 },
      { name: '480p', height: 480, width: 854 },
      { name: '720p', height: 720, width: 1280 },
      { name: '1080p', height: 1080, width: 1920 },
      { name: '2k', height: 1440, width: 2560 },
      { name: '4k', height: 2160, width: 3840 },
    ];

    // Dynamically select target resolutions that are equal to or lower than source height
    const targetResolutions = allResolutions.filter(res => res.height <= sourceHeight);
    
    // If we couldn't detect height or it's very low, default to at least 360p
    if (targetResolutions.length === 0) {
      targetResolutions.push(allResolutions[0]);
    }

    const resultUrls: Record<string, string> = {};

    for (let i = 0; i < targetResolutions.length; i++) {
      const res = targetResolutions[i];
      const outputFilename = `${originalFilename} ${res.name}.mp4`;
      const outputPath = path.join(tempDir, outputFilename);

      await new Promise((resolve, reject) => {
        ffmpeg(inputPath)
          .size(`${res.width}x${res.height}`)
          .on('progress', (progress) => {
            const overallProgress = (i / targetResolutions.length) * 100 + ((progress.percent ?? 0) / targetResolutions.length);
            io.to(videoId).emit('status', {
              status: `TRANSCODING_${res.name}`,
              progress: Math.floor(overallProgress),
            });
            job.updateProgress(Math.floor(overallProgress));
          })
          .on('end', async () => {
            // Upload transcoded file to Cloudinary with the specific filename
            const uploadResult = await cloudinary.uploader.upload(outputPath, {
              resource_type: 'video',
              public_id: `transcoded/${videoId}/${res.name}`,
              type: 'authenticated',
              // Use use_filename and unique_filename: false to keep our custom name
              use_filename: true,
              unique_filename: false,
              filename_override: outputFilename
            });
            resultUrls[res.name] = uploadResult.public_id;
            fs.unlinkSync(outputPath);
            resolve(null);
          })
          .on('error', (err) => {
            console.error(`Error transcoding ${res.name}:`, err);
            reject(err);
          })
          .save(outputPath);
      });
    }

    // Update DB
    await prisma.video.update({
      where: { id: videoId },
      data: {
        status: 'COMPLETED',
        resolutions: resultUrls,
      },
    });

    io.to(videoId).emit('status', { status: 'COMPLETED', progress: 100 });

    // Add email job
    await emailQueue.add('send-email', {
      email,
      videoId,
    });

    // Final Cleanup
    fs.rmSync(tempDir, { recursive: true, force: true });

  } catch (error) {
    console.error('Transcode Worker Error:', error);
    await prisma.video.update({
      where: { id: videoId },
      data: { status: 'FAILED' },
    });
    io.to(videoId).emit('status', { status: 'FAILED', progress: 0 });
    throw error;
  }
};

const worker = new Worker('video-transcode', transcodeVideo, {
  connection: redisConnection,
  concurrency: 1,
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed with error ${err.message}`);
});

export default worker;
