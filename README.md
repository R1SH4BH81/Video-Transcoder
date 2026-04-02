# Video Transcoding Service

A production-grade video transcoding service built with Node.js, Express, TypeScript, and React. It supports high-resolution uploads (up to 4K), dynamic transcoding, real-time progress updates, and secure email notifications.

## 🏗️ System Architecture

The system follows a distributed architecture to handle CPU-intensive video processing without blocking the main web server.

### 1. Web Server (Express + Socket.io)
- **File Upload**: Handles multi-part form data via `multer`. Supports files up to 2GB.
- **Initial Processing**: Uploads the raw video to Cloudinary using chunked uploads (`upload_large`) to ensure reliability.
- **Real-time**: Uses Socket.io to communicate progress (uploading, transcoding stages) back to the client.
- **Persistence**: PostgreSQL (via Prisma) tracks the status of every video job.

### 2. Task Queue (BullMQ + Redis)
The heart of the asynchronous processing. When a video is uploaded:
1. A **transcoding job** is added to the `video-transcode` queue.
2. BullMQ ensures the job is persisted in Redis until a worker is available.
3. If a worker fails, BullMQ handles retries (configured for 1 retry) automatically.

### 3. Transcoding Worker (fluent-ffmpeg)
- **Dynamic Selection**: The worker probes the source video's height using `ffprobe`. It only generates resolutions equal to or lower than the source (up to 4K/2160p).
- **Processing**: Uses `fluent-ffmpeg` to resize the video.
- **Cloudinary Integration**: Uploads each resolution back to Cloudinary as an `authenticated` resource (private).
- **Naming**: Automatically appends the resolution to the filename (e.g., `my_video 1080p.mp4`).

### 4. Notification Service
- Once transcoding is finished, a job is added to the `email-notification` queue.
- An email is sent via Gmail SMTP containing a secure, 24-hour signed link for the user to download their videos.

## 🚀 Key Features

- **4K Support**: Handles 4K (2160p), 2K (1440p), 1080p, 720p, 480p, and 360p.
- **Secure Downloads**: All links are Cloudinary Signed URLs that expire after 24 hours.
- **Resiliency**: BullMQ provides a robust mechanism for handling job failures and concurrency control.
- **Progressive UI**: Framer Motion powered dashboard showing live transcoding percentages.

## 🛠️ Tech Stack

- **Frontend**: React (Vite), Tailwind CSS, Socket.io-client, Lucide React, Framer Motion.
- **Backend**: Node.js, Express, TypeScript, Prisma, BullMQ, Cloudinary, Multer, fluent-ffmpeg, Nodemailer.
- **Infrastructure**: PostgreSQL, Upstash Redis.

## 🚦 Getting Started

1. Clone the repository.
2. Install dependencies in both `backend/` and `frontend/`.
3. Configure `.env` in the `backend/` folder (see `.env.example`).
4. Run `npx prisma db push` to setup the database.
5. Start both servers using `npm run dev`.

## ScreenShots
<img width="814" height="792" alt="image" src="https://github.com/user-attachments/assets/21949cd8-ec40-4b5d-959a-2c9d28311266" />

<img width="789" height="861" alt="image" src="https://github.com/user-attachments/assets/f36eaead-c53f-4045-8e71-8f91e04c7623" />
<img width="1777" height="342" alt="image" src="https://github.com/user-attachments/assets/3260a143-d0ce-41e2-9940-b96c336f5daa" />

