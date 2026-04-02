import { ConnectionOptions } from 'bullmq';
import dotenv from 'dotenv';

dotenv.config();

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redisConnection: ConnectionOptions = {
  url: redisUrl,
  tls: redisUrl.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined,
  maxRetriesPerRequest: null, // Required for BullMQ
};
