import { Hono } from 'hono';
import { getResourceById, getImagesByResourceId } from '../db/queries';
import { buildManifestV3 } from '../services/iiif';
import { logger } from '../utils/logger';

const iiif = new Hono();

// IIIF Presentation API v3 Manifest
iiif.get('/manifests/:id/manifest.json', (c) => {
  const resourceId = c.req.param('id');

  const resource = getResourceById(resourceId);
  if (!resource) {
    return c.json({ error: 'Resource not found' }, 404);
  }

  // Check if resource is public or user has access
  const user = c.get('user');
  if (resource.visibility === 'private' && (!user || user.id !== resource.user_id)) {
    return c.json({ error: 'Access denied' }, 403);
  }

  // Check if resource is ready
  if (resource.status !== 'ready') {
    return c.json({ error: 'Resource is not ready yet' }, 503);
  }

  const images = getImagesByResourceId(resourceId);

  try {
    const manifest = buildManifestV3(resource, images);

    // Set CORS headers for IIIF
    c.header('Access-Control-Allow-Origin', '*');
    c.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    c.header('Access-Control-Allow-Headers', 'Content-Type');

    logger.info(`Manifest generated for resource ${resourceId}`);

    return c.json(manifest);
  } catch (error) {
    logger.error(`Failed to generate manifest for resource ${resourceId}`, error);
    return c.json({ error: 'Failed to generate manifest' }, 500);
  }
});

// Handle OPTIONS for CORS
iiif.options('/manifests/:id/manifest.json', (c) => {
  c.header('Access-Control-Allow-Origin', '*');
  c.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type');
  return c.body(null, 204);
});

export default iiif;
