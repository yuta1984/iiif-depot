import { Queue } from 'bullmq';
import { CONFIG } from '../config';
import { ImageProcessingJobData } from '../types';

const connection = {
  host: CONFIG.redis.host,
  port: CONFIG.redis.port,
};

export const imageProcessingQueue = new Queue<ImageProcessingJobData>('image-processing', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: {
      age: 24 * 3600, // Keep for 24 hours
      count: 1000,
    },
    removeOnFail: {
      age: 7 * 24 * 3600, // Keep failed for 7 days
    },
  },
});
