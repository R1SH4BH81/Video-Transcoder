import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { initSocket } from './config/socket';
import videoRoutes from './routes/video';
import { globalRateLimiter } from './config/rateLimit';
import fs from 'fs';
import path from 'path';
import './workers/transcode'; // Import to start the worker
import './workers/email';     // Import to start the worker

dotenv.config();

// Ensure required directories exist
const uploadDir = path.resolve(process.cwd(), 'uploads');
const tempDir = path.resolve(process.cwd(), 'temp');

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

const app = express();
const server = http.createServer(app);

app.set('trust proxy', 1); // Trust the first proxy (needed for accurate IP rate limiting)
app.use(globalRateLimiter);
app.use(cors());
app.use(express.json({ limit: '2gb' }));
app.use(express.urlencoded({ limit: '2gb', extended: true }));

// Routes
app.use('/api/video', videoRoutes);

// Socket.io initialization
initSocket(server);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
