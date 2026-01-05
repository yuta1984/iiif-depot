import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { CONFIG } from './config';
import { logger } from './utils/logger';
import { sessionMiddleware } from './middleware/session';
import { authMiddleware } from './middleware/auth';
import { errorHandler } from './middleware/error';
import { HomePage } from './views/index';

// Import routes
import auth from './routes/auth';
import profile from './routes/profile';
import resources from './routes/resources';
import iiif from './routes/iiif';
import api from './routes/api';
import admin from './routes/admin';
import quota from './routes/quota';

const app = new Hono();

// Error handling middleware (must be first)
app.use('*', errorHandler);

// Global middleware
app.use('*', sessionMiddleware);
app.use('*', authMiddleware);

// Mount routes
app.route('/auth', auth);
app.route('/profile', profile);
app.route('/resources', resources);
app.route('/iiif', iiif);
app.route('/api', api);
app.route('/admin', admin);
app.route('/quota', quota);

// Home page
app.get('/', async (c) => {
  const user = c.get('user');
  return c.html(<HomePage user={user} />);
});

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok' });
});

// Start server
const port = CONFIG.port;

logger.info(`Starting IIIF Depot server on port ${port}...`);

serve({
  fetch: app.fetch,
  port,
});

logger.info(`Server running at http://localhost:${port}`);
