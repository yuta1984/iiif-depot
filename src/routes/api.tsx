import { Hono } from 'hono';
import { getResourceById, getImagesByResourceId, getJobStatusesByResourceId } from '../db/queries';

const api = new Hono();

// Get job status for a resource
api.get('/resources/:id/status', (c) => {
  const resourceId = c.req.param('id');

  const resource = getResourceById(resourceId);
  if (!resource) {
    return c.json({ error: 'Resource not found' }, 404);
  }

  const images = getImagesByResourceId(resourceId);
  const jobStatuses = getJobStatusesByResourceId(resourceId);

  const imageStatuses = images.map((image) => {
    const jobStatus = jobStatuses.find(js => js.image_id === image.id);

    return {
      id: image.id,
      filename: image.original_filename,
      status: image.status,
      progress: jobStatus?.progress || 0,
      error: image.error_message,
    };
  });

  return c.json({
    resource: {
      id: resource.id,
      title: resource.title,
      status: resource.status,
    },
    images: imageStatuses,
    allCompleted: images.every(img => img.status === 'ready' || img.status === 'failed'),
  });
});

export default api;
