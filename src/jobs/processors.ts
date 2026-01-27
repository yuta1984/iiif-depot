import { Job } from 'bullmq';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';
import { ImageProcessingJobData } from '../types';
import { updateImage, getImageById, createJobStatus, updateJobStatus, getJobStatusById, incrementStorageUsed, getResourceById, updateResource, getImagesByResourceId } from '../db/queries';
import { logger } from '../utils/logger';
import { CONFIG } from '../config';

const execAsync = promisify(exec);

export async function processImage(job: Job<ImageProcessingJobData>): Promise<void> {
  const { imageId, resourceId, userId, originalPath, ptiffPath } = job.data;

  logger.info(`Processing image ${imageId} from ${originalPath}`);

  // Update image status
  updateImage(imageId, { status: 'processing' });

  // Create or update job status (handle retry attempts)
  const existingJobStatus = getJobStatusById(job.id!);

  if (existingJobStatus) {
    // Retry attempt: update existing job status
    logger.info(`Retrying job ${job.id} for image ${imageId}`);
    updateJobStatus(job.id!, {
      status: 'active',
      progress: 0,
      error_message: null,
      started_at: Date.now(),
      completed_at: null,
    });
  } else {
    // First attempt: create new job status
    createJobStatus({
      id: job.id!,
      image_id: imageId,
      status: 'active',
      progress: 0,
      error_message: null,
      started_at: Date.now(),
      completed_at: null,
    });
  }

  try {
    // Ensure output directory exists
    const outputDir = path.dirname(ptiffPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Update progress: 10%
    await job.updateProgress(10);
    updateJobStatus(job.id!, { progress: 10 });

    // Get image dimensions first
    logger.info(`Getting dimensions for ${originalPath}`);
    const { stdout: identifyOutput } = await execAsync(
      `identify -format "%w %h" "${originalPath}"`
    );
    const [width, height] = identifyOutput.trim().split(' ').map(Number);

    logger.info(`Image dimensions: ${width}x${height}`);

    // Update progress: 30%
    await job.updateProgress(30);
    updateJobStatus(job.id!, { progress: 30 });

    // Convert to pyramid TIFF
    logger.info(`Converting to pyramid TIFF: ${ptiffPath}`);
    const convertCommand = `convert "${originalPath}" -define tiff:tile-geometry=256x256 -compress lzw 'ptif:${ptiffPath}'`;

    await execAsync(convertCommand);

    logger.info(`Pyramid TIFF created: ${ptiffPath}`);

    // Update progress: 80%
    await job.updateProgress(80);
    updateJobStatus(job.id!, { progress: 80 });

    // Get PTIFF file size
    const ptiffStats = fs.statSync(ptiffPath);
    const ptiffSize = ptiffStats.size;

    // Update image record
    updateImage(imageId, {
      status: 'ready',
      ptiff_path: ptiffPath,
      width,
      height,
    });

    // Update job status
    updateJobStatus(job.id!, {
      status: 'completed',
      progress: 100,
      completed_at: Date.now(),
    });

    // Update storage usage (add PTIFF size)
    incrementStorageUsed(userId, ptiffSize);

    // Update progress: 100%
    await job.updateProgress(100);

    logger.info(`Image ${imageId} processed successfully`);

    // Check if all images in the resource are ready
    const allImages = getImagesByResourceId(resourceId);
    const allReady = allImages.every(img => img.status === 'ready' || img.status === 'failed');

    if (allReady) {
      const hasFailed = allImages.some(img => img.status === 'failed');
      updateResource(resourceId, {
        status: hasFailed ? 'failed' : 'ready',
      });
      logger.info(`Resource ${resourceId} status updated to ${hasFailed ? 'failed' : 'ready'}`);
    }
  } catch (error) {
    logger.error(`Image processing failed for ${imageId}`, error);

    const errorMessage = error instanceof Error ? error.message : String(error);

    // Update image status
    updateImage(imageId, {
      status: 'failed',
      error_message: errorMessage,
    });

    // Update job status
    updateJobStatus(job.id!, {
      status: 'failed',
      error_message: errorMessage,
      completed_at: Date.now(),
    });

    // Check if all images are done (including failed)
    const allImages = getImagesByResourceId(resourceId);
    const allDone = allImages.every(img => img.status === 'ready' || img.status === 'failed');

    if (allDone) {
      updateResource(resourceId, { status: 'failed' });
    }

    throw error; // Re-throw to let BullMQ handle retries
  }
}
