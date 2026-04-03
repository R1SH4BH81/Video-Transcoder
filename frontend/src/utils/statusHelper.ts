export const getStatusMessage = (status: string) => {
  switch (status) {
    case 'PENDING': return 'Queued for processing...';
    case 'UPLOADING_TO_CDN': return 'Uploading to CDN...';
    case 'PROCESSING': return 'Initializing transcoding...';
    case 'TRANSCODING_360p': return 'Transcoding to 360p...';
    case 'TRANSCODING_480p': return 'Transcoding to 480p...';
    case 'TRANSCODING_720p': return 'Transcoding to 720p...';
    case 'TRANSCODING_1080p': return 'Transcoding to 1080p...';
    case 'TRANSCODING_2k': return 'Transcoding to 2k...';
    case 'TRANSCODING_4k': return 'Transcoding to 4k...';
    case 'COMPLETED': return 'Transcoding complete!';
    case 'FAILED': return 'Processing failed.';
    default: return 'Processing...';
  }
};
