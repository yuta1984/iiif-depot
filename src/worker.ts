import { Worker } from 'bullmq';
import { CONFIG } from './config';
import { logger } from './utils/logger';
import { processImage } from './jobs/processors';
import { ImageProcessingJobData } from './types';

const connection = {
  host: CONFIG.redis.host,
  port: CONFIG.redis.port,
};

const worker = new Worker<ImageProcessingJobData>(
  'image-processing',
  async (job) => {
    logger.info(`Worker processing job ${job.id}`);
    await processImage(job);
  },
  {
    connection,
    concurrency: 2, // Process 2 images at a time
    limiter: {
      max: 10,
      duration: 1000, // Max 10 jobs per second
    },
  }
);

worker.on('completed', (job) => {
  logger.info(`Job ${job.id} completed successfully`);
});

worker.on('failed', (job, err) => {
  logger.error(`Job ${job?.id} failed`, err);
});

worker.on('error', (err) => {
  logger.error('Worker error', err);
});

logger.info('Image processing worker started');

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing worker...');
  await worker.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, closing worker...');
  await worker.close();
  process.exit(0);
});
