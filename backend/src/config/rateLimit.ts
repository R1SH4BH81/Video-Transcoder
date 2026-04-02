import { rateLimit } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

// Global rate limiter: 100 requests per 15 minutes
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    // @ts-expect-error - ioredis and rate-limit-redis types mismatch but compatible
    sendCommand: (...args: string[]) => redisClient.call(...args),
  }),
  message: { error: 'Too many requests, please try again later.' },
});

// Strict rate limiter for uploads: 5 uploads per hour per IP
export const uploadRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    singleCount: false,
  },
  store: new RedisStore({
    // @ts-expect-error - ioredis and rate-limit-redis types mismatch but compatible
    sendCommand: (...args: string[]) => redisClient.call(...args),
  }),
  message: { error: 'Upload limit reached. Please try again in an hour.' },
});
