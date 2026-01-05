import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth';
import {
  getResourceById,
  getResourcesByUserId,
  createResource,
  updateResource,
  deleteResource,
  getImagesByResourceId,
  createImage,
  deleteImage,
  getUserById,
  incrementStorageUsed,
  decrementStorageUsed,
  updateImage,
  getJobStatusesByResourceId,
} from '../db/queries';
import { ResourceList } from '../views/resources/list';
import { ResourceNew } from '../views/resources/new';
import { ResourceDetail } from '../views/resources/detail';
import { ResourceEdit } from '../views/resources/edit';
import { ProgressPage } from '../views/resources/progress';
import { validateResourceMetadata, sanitizeString } from '../utils/validators';
import { saveUploadedFile, isAllowedFileType, sanitizeFilename, deleteFile, getFileSize } from '../services/storage';
import { imageProcessingQueue } from '../jobs/queue';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import { ImageProcessingJobData } from '../types';

const resources = new Hono();

resources.use('*', requireAuth);

// List user's resources
resources.get('/', (c) => {
  const user = c.get('user')!;
  const userResources = getResourcesByUserId(user.id);

  // Get thumbnail (first image) and image count for each resource
  const resourcesWithThumbnails = userResources.map(resource => {
    const images = getImagesByResourceId(resource.id);
    return {
      ...resource,
      thumbnail: images.length > 0 ? images[0] : null,
      imageCount: images.length
    };
  });

  return c.html(<ResourceList user={user} resources={resourcesWithThumbnails} />);
});

// New resource form
resources.get('/new', (c) => {
  const user = c.get('user')!;
  return c.html(<ResourceNew user={user} />);
});

// Create resource
resources.post('/', async (c) => {
  const user = c.get('user')!;

  try {
    const formData = await c.req.parseBody();

    const title = sanitizeString(String(formData.title || ''));
    const description = sanitizeString(String(formData.description || ''));
    const attribution = sanitizeString(String(formData.attribution || ''));
    const license = sanitizeString(String(formData.license || ''));
    const homepage = sanitizeString(String(formData.homepage || ''));
    const viewingDirection = String(formData.viewingDirection || 'left-to-right') as 'left-to-right' | 'right-to-left' | 'top-to-bottom';

    // Parse custom metadata
    const metadataArray: Array<{ label: string; value: string }> = [];
    let metadataIndex = 0;
    while (formData[`metadata[${metadataIndex}][label]`]) {
      const label = sanitizeString(String(formData[`metadata[${metadataIndex}][label]`]));
      const value = sanitizeString(String(formData[`metadata[${metadataIndex}][value]`]));
      if (label && value) {
        metadataArray.push({ label, value });
      }
      metadataIndex++;
    }
    const metadata = metadataArray.length > 0 ? JSON.stringify(metadataArray) : null;

    // Validate metadata
    const errors = validateResourceMetadata(title, description, attribution, license);

    // Validate homepage URL if provided
    if (homepage) {
      try {
        new URL(homepage);
      } catch (e) {
        errors.push({ field: 'homepage', message: '有効なURLを入力してください' });
      }
    }

    if (errors.length > 0) {
      const errorMap: { [key: string]: string } = {};
      errors.forEach(err => {
        errorMap[err.field] = err.message;
      });
      return c.html(<ResourceNew user={user} errors={errorMap} />);
    }

    // Handle file uploads
    const files = formData['images[]'];
    if (!files) {
      return c.html(<ResourceNew user={user} errors={{ images: '画像ファイルを選択してください' }} />);
    }

    const fileArray = Array.isArray(files) ? files : [files];
    logger.info(`Received ${fileArray.length} files for upload`);

    // Validate file types and calculate total size
    let totalSize = 0;
    for (const file of fileArray) {
      if (typeof file === 'string') continue;

      if (!isAllowedFileType(file.type)) {
        return c.html(<ResourceNew user={user} errors={{ images: `対応していないファイル形式です: ${file.type}` }} />);
      }

      totalSize += file.size;
    }

    // Check storage quota
    const remainingQuota = user.storage_quota - user.storage_used;
    if (totalSize > remainingQuota) {
      return c.html(<ResourceNew user={user} errors={{ images: 'ストレージ容量が不足しています' }} />);
    }

    // Create resource
    const resourceId = uuidv4();
    const resource = createResource({
      id: resourceId,
      user_id: user.id,
      title,
      description: description || null,
      attribution: attribution || null,
      license: license || null,
      metadata,
      status: 'processing',
      visibility: 'public',
      homepage: homepage || null,
      viewing_direction: viewingDirection,
    });

    // Save files and create image records
    let orderIndex = 0;
    for (const file of fileArray) {
      if (typeof file === 'string') {
        logger.warn('Skipping string file entry');
        continue;
      }

      logger.info(`Processing file ${orderIndex + 1}: ${file.name}, size: ${file.size}, type: ${file.type}`);

      const imageId = uuidv4();
      const filePath = saveUploadedFile(
        {
          data: Buffer.from(await file.arrayBuffer()),
          name: sanitizeFilename(file.name),
          mimetype: file.type,
          size: file.size,
        },
        resourceId
      );

      const image = createImage({
        id: imageId,
        resource_id: resourceId,
        user_id: user.id,
        original_filename: file.name,
        file_path: filePath,
        ptiff_path: null,
        file_size: file.size,
        width: null,
        height: null,
        mime_type: file.type,
        order_index: orderIndex++,
        status: 'uploaded',
        job_id: null,
        error_message: null,
      });

      // Enqueue image processing job
      const jobData: ImageProcessingJobData = {
        imageId: image.id,
        resourceId: resource.id,
        userId: user.id,
        originalPath: filePath,
        ptiffPath: filePath.replace('/original/', '/ptiff/').replace(/\.(jpg|jpeg|png|tiff?)$/i, '.tif'),
      };

      const job = await imageProcessingQueue.add(`process-${imageId}`, jobData);

      // Update image with job ID
      updateImage(imageId, { job_id: job.id });

      logger.info(`Enqueued image processing job ${job.id} for image ${imageId}`);
    }

    // Update storage used
    incrementStorageUsed(user.id, totalSize);

    logger.info(`Resource ${resourceId} created with ${orderIndex} images (total ${fileArray.length} files received)`);

    // Check storage threshold and add warning if needed
    const updatedUser = getUserById(user.id);
    let redirectUrl = `/resources/${resourceId}/progress`;

    if (updatedUser) {
      const usedPercent = (updatedUser.storage_used / updatedUser.storage_quota) * 100;
      if (usedPercent >= 90) {
        redirectUrl += '?warning=storage_90_warning';
      } else if (usedPercent >= 80) {
        redirectUrl += '?warning=storage_80_warning';
      }
    }

    return c.redirect(redirectUrl);
  } catch (error) {
    logger.error('Resource creation error', error);
    return c.html(<ResourceNew user={user} errors={{ _form: 'リソースの作成に失敗しました' }} />);
  }
});

// View resource
resources.get('/:id', (c) => {
  const user = c.get('user')!;
  const resourceId = c.req.param('id');

  const resource = getResourceById(resourceId);
  if (!resource) {
    return c.html('<h1>404 Not Found</h1>', 404);
  }

  const isOwner = resource.user_id === user.id;
  if (!isOwner && resource.visibility === 'private') {
    return c.html('<h1>403 Forbidden</h1>', 403);
  }

  const images = getImagesByResourceId(resourceId);

  return c.html(<ResourceDetail user={user} resource={resource} images={images} isOwner={isOwner} />);
});

// Progress page
resources.get('/:id/progress', (c) => {
  const user = c.get('user')!;
  const resourceId = c.req.param('id');

  const resource = getResourceById(resourceId);
  if (!resource) {
    return c.html('<h1>404 Not Found</h1>', 404);
  }

  if (resource.user_id !== user.id) {
    return c.html('<h1>403 Forbidden</h1>', 403);
  }

  const images = getImagesByResourceId(resourceId);
  const jobStatuses = getJobStatusesByResourceId(resourceId);

  return c.html(<ProgressPage user={user} resource={resource} images={images} jobStatuses={jobStatuses} />);
});

// Edit resource form
resources.get('/:id/edit', (c) => {
  const user = c.get('user')!;
  const resourceId = c.req.param('id');

  const resource = getResourceById(resourceId);
  if (!resource) {
    return c.html('<h1>404 Not Found</h1>', 404);
  }

  if (resource.user_id !== user.id) {
    return c.html('<h1>403 Forbidden</h1>', 403);
  }

  return c.html(<ResourceEdit user={user} resource={resource} />);
});

// Update resource
resources.post('/:id', async (c) => {
  const user = c.get('user')!;
  const resourceId = c.req.param('id');

  const resource = getResourceById(resourceId);
  if (!resource) {
    return c.html('<h1>404 Not Found</h1>', 404);
  }

  if (resource.user_id !== user.id) {
    return c.html('<h1>403 Forbidden</h1>', 403);
  }

  try {
    const formData = await c.req.parseBody();

    const title = sanitizeString(String(formData.title || ''));
    const description = sanitizeString(String(formData.description || ''));
    const attribution = sanitizeString(String(formData.attribution || ''));
    const license = sanitizeString(String(formData.license || ''));
    const homepage = sanitizeString(String(formData.homepage || ''));
    const viewingDirection = String(formData.viewingDirection || 'left-to-right') as 'left-to-right' | 'right-to-left' | 'top-to-bottom';
    const visibility = String(formData.visibility || 'public') as 'public' | 'private';

    // Parse custom metadata
    const metadataArray: Array<{ label: string; value: string }> = [];
    let metadataIndex = 0;
    while (formData[`metadata[${metadataIndex}][label]`]) {
      const label = sanitizeString(String(formData[`metadata[${metadataIndex}][label]`]));
      const value = sanitizeString(String(formData[`metadata[${metadataIndex}][value]`]));
      if (label && value) {
        metadataArray.push({ label, value });
      }
      metadataIndex++;
    }
    const metadata = metadataArray.length > 0 ? JSON.stringify(metadataArray) : null;

    // Validate metadata
    const errors = validateResourceMetadata(title, description, attribution, license);

    // Validate homepage URL if provided
    if (homepage) {
      try {
        new URL(homepage);
      } catch (e) {
        errors.push({ field: 'homepage', message: '有効なURLを入力してください' });
      }
    }

    if (errors.length > 0) {
      const errorMap: { [key: string]: string } = {};
      errors.forEach(err => {
        errorMap[err.field] = err.message;
      });
      return c.html(<ResourceEdit user={user} resource={resource} errors={errorMap} />);
    }

    // Update resource
    updateResource(resourceId, {
      title,
      description: description || null,
      attribution: attribution || null,
      license: license || null,
      metadata,
      homepage: homepage || null,
      viewing_direction: viewingDirection,
      visibility,
    });

    logger.info(`Resource ${resourceId} updated`);

    return c.redirect(`/resources/${resourceId}`);
  } catch (error) {
    logger.error('Resource update error', error);
    return c.html(<ResourceEdit user={user} resource={resource} errors={{ _form: 'リソースの更新に失敗しました' }} />);
  }
});

// Delete resource
resources.post('/:id/delete', (c) => {
  const user = c.get('user')!;
  const resourceId = c.req.param('id');

  const resource = getResourceById(resourceId);
  if (!resource) {
    return c.html('<h1>404 Not Found</h1>', 404);
  }

  if (resource.user_id !== user.id) {
    return c.html('<h1>403 Forbidden</h1>', 403);
  }

  try {
    // Get images to delete files and update storage
    const images = getImagesByResourceId(resourceId);
    let totalSize = 0;

    logger.info(`Starting deletion of resource ${resourceId} with ${images.length} images`);

    for (const image of images) {
      // Calculate total size: original file + ptiff file
      const originalSize = image.file_size;
      const ptiffSize = image.ptiff_path ? getFileSize(image.ptiff_path) : 0;
      const imageTotal = originalSize + ptiffSize;

      totalSize += imageTotal;

      logger.info(`Image ${image.id}: original=${formatBytes(originalSize)}, ptiff=${formatBytes(ptiffSize)}, total=${formatBytes(imageTotal)}`);

      // Delete files
      deleteFile(image.file_path);
      if (image.ptiff_path) {
        deleteFile(image.ptiff_path);
      }
    }

    logger.info(`Total size to release: ${formatBytes(totalSize)}`);

    // Delete resource (cascades to images and job_status)
    deleteResource(resourceId);

    // Update storage usage
    decrementStorageUsed(user.id, totalSize);

    logger.info(`Resource ${resourceId} deleted successfully`);

    return c.redirect('/resources');
  } catch (error) {
    logger.error('Resource deletion error', error);
    return c.redirect(`/resources/${resourceId}`);
  }
});

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

export default resources;
