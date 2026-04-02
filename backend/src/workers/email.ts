import { Worker, Job } from 'bullmq';
import { redisConnection } from '../config/bullmq';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendEmail = async (job: Job) => {
  const { email, videoId } = job.data;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const processLink = `${frontendUrl}?processId=${videoId}`;

  const mailOptions = {
    from: '"Video Transcoding Service" <noreply@transcode.com>',
    to: email,
    subject: 'Your video transcoding is complete!',
    html: `<p>Hello!</p>
           <p>Your video has been successfully transcoded. You can view it here:</p>
           <a href="${processLink}">${processLink}</a>
           <p>Thanks for using our service!</p>`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: %s', info.messageId);
  } catch (error) {
    console.error('Email Worker Error:', error);
    throw error;
  }
};

const worker = new Worker('email-notification', sendEmail, {
  connection: redisConnection,
  concurrency: 1,
});

worker.on('failed', (job, err) => {
  console.error(`Email Job ${job?.id} failed with error ${err.message}`);
});

export default worker;
