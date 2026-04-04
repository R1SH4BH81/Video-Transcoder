import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getFfmpegPath, getFfprobePath } from './ffmpeg-paths';

describe('FFMPEG Path Utilities', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.FFMPEG_PATH = '';
    process.env.FFPROBE_PATH = '';
  });

  it('should use environment variable for FFMPEG_PATH if provided', () => {
    process.env.FFMPEG_PATH = '/custom/ffmpeg';
    expect(getFfmpegPath()).toBe('/custom/ffmpeg');
  });

  it('should use environment variable for FFPROBE_PATH if provided', () => {
    process.env.FFPROBE_PATH = '/custom/ffprobe';
    expect(getFfprobePath()).toBe('/custom/ffprobe');
  });

  // Additional tests could mock fs.existsSync or static package returns
});
