import { Router } from 'express';
import multer from 'multer';
import { uploadVideo, getVideoStatus, cloudinaryWebhook } from '../controllers/video';
import { uploadRateLimiter } from '../config/rateLimit';

import path from 'path';

const router = Router();
const upload = multer({ 
  dest: path.resolve(process.cwd(), 'uploads'),
  limits: {
    fileSize: 2 * 1024 * 1024 * 1024 // 2GB
  }
});

router.post('/upload', uploadRateLimiter, upload.single('video'), uploadVideo);
router.get('/status/:id', getVideoStatus);
router.post('/webhook', cloudinaryWebhook);

export default router;
