import ffmpegStatic from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';
import fs from 'fs';

export const getFfmpegPath = (): string => {
  // 1. Explicitly set PATH
  if (process.env.FFMPEG_PATH) return process.env.FFMPEG_PATH;

  // 2. Check if ffmpeg-static worked and returned a valid path.
  if (ffmpegStatic && fs.existsSync(ffmpegStatic)) {
    return ffmpegStatic;
  }

  // 3. Fallback to system PATH
  return 'ffmpeg';
};

export const getFfprobePath = (): string => {
  if (process.env.FFPROBE_PATH) return process.env.FFPROBE_PATH;

  if (ffprobeStatic && ffprobeStatic.path && fs.existsSync(ffprobeStatic.path)) {
    return ffprobeStatic.path;
  }

  return 'ffprobe';
};
