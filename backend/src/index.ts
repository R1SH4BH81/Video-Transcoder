import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { initSocket } from './config/socket';
import videoRoutes from './routes/video';
import { globalRateLimiter } from './config/rateLimit';
import fs from 'fs';
import path from 'path';
import './workers/transcode'; 
import './workers/email';     

dotenv.config();

// Ensure required directories exist
const uploadDir = path.resolve(process.cwd(), 'uploads');
const tempDir = path.resolve(process.cwd(), 'temp');

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

const app = express();
const server = http.createServer(app);

app.set('trust proxy', 1);
app.use(globalRateLimiter);

// --- DYNAMIC CORS CONFIG ---
const corsOptions = {
  // Pulls from .env, defaults to '*' only if .env is missing (not recommended for prod)
  //test 
  origin: process.env.FRONTEND_URL, 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

app.use(cors(corsOptions));
// ---------------------------

app.use(express.json({ limit: '2gb' }));
app.use(express.urlencoded({ limit: '2gb', extended: true }));

// Routes
app.use('/api/video', videoRoutes);

// Socket.io initialization
initSocket(server);

// Pulls PORT from .env
const PORT = process.env.PORT || 5609;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`CORS allowed for: ${process.env.FRONTEND_URL}`);
});
