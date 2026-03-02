import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth';
import { getResourceById, getImagesByResourceId, getJobStatusesByResourceId } from '../db/queries';

const api = new Hono();

api.use('*', requireAuth);

// Get job status for a resource
api.get('/resources/:id/status', (c) => {
  const resourceId = c.req.param('id');
  const user = c.get('user')!;

  const resource = getResourceById(resourceId);
  if (!resource || resource.user_id !== user.id) {
    return c.json({ error: 'Not found' }, 404);
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
