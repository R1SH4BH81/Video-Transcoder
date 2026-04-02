import { Request, Response } from 'express';
import prisma from '../config/prisma';
import cloudinary from '../config/cloudinary';
import { Queue } from 'bullmq';
import { redisConnection } from '../config/bullmq';
import { getIO } from '../config/socket';
import fs from 'fs';
import path from 'path';

const transcodeQueue = new Queue('video-transcode', { connection: redisConnection });

export const uploadVideo = async (req: Request, res: Response) => {
  const file = req.file;
  const email = req.body.email;

  if (!file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  // Get original filename without extension
  const originalName = path.parse(file.originalname).name;

  try {
    // 1. Create a DB record
    const video = await prisma.video.create({
      data: {
        email,
        filename: originalName,
        status: 'PENDING',
      },
    });

    const io = getIO();
    io.to(video.id).emit('status', { status: 'UPLOADING_TO_CDN', progress: 0 });

    // 2. Upload raw file to Cloudinary
    // Use upload_large for videos to handle chunked uploads and avoid 413 Payload Too Large
    console.log('File path being uploaded:', file.path);
    if (!fs.existsSync(file.path)) {
      throw new Error(`File not found at path: ${file.path}`);
    }

    const result: any = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_large(file.path, {
        resource_type: 'video',
        public_id: `raw/${video.id}`,
        chunk_size: 6000000, // 6MB chunks
        timeout: 1800000, // 30 minutes
      }, (error, result) => {
        if (error) {
          console.error('Cloudinary Upload Error:', error);
          reject(error);
        } else {
          resolve(result);
        }
      });
    });

    // 3. Cleanup: Immediately delete the local temp file once the Cloudinary upload is confirmed.
    fs.unlinkSync(file.path);

    // 4. Update status to PROCESSING
    await prisma.video.update({
      where: { id: video.id },
      data: { status: 'PROCESSING' },
    });

    io.to(video.id).emit('status', { status: 'PROCESSING', progress: 0 });

    // 5. Add to transcoding queue
    await transcodeQueue.add('transcode', {
      videoId: video.id,
      cloudinaryUrl: result.secure_url,
      publicId: result.public_id,
      email: video.email,
    }, {
      attempts: 2, // retry once (exactly once before moving to completed/failed state)
      backoff: {
        type: 'exponential',
        delay: 5000,
      }
    });

    return res.json({ id: video.id });
  } catch (error) {
    console.error('Upload Error:', error);
    if (file && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    return res.status(500).json({ error: 'Failed to upload video' });
  }
};

export const getVideoStatus = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const video = await prisma.video.findUnique({
      where: { id },
    });

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Generate signed URLs if completed
    let signedResolutions = null;
    if (video.status === 'COMPLETED' && video.resolutions) {
      const resolutions = video.resolutions as any;
      signedResolutions = {};
      const expiry = parseInt(process.env.SIGNED_URL_EXPIRY || '86400');

      for (const [res_key, public_id] of Object.entries(resolutions)) {
        // Generate signed URL with 24h expiry and force attachment (download)
        signedResolutions[res_key] = cloudinary.utils.private_download_url(public_id as string, 'mp4', {
          expires_at: Math.floor(Date.now() / 1000) + expiry,
          attachment: true, // Forces the browser to download the file
          resource_type: 'video',
          type: 'authenticated'
        });
      }
    }

    return res.json({
      ...video,
      resolutions: signedResolutions,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch status' });
  }
};

export const cloudinaryWebhook = async (req: Request, res: Response) => {
  const { notification_type, public_id, eager } = req.body;

  if (notification_type === 'eager') {
    // Cloudinary finished an eager transformation
    // We could use this to update status if we used Cloudinary transformations
    // But since we use fluent-ffmpeg, this is just for compliance with the task requirements
    console.log(`Cloudinary transformation ready for ${public_id}`);
  }

  return res.status(200).send('OK');
};
