import { Context, Next } from 'hono';
import { isDevelopment } from '../config';
import { logger } from '../utils/logger';
import { NotFoundPage } from '../views/errors/404';
import { ErrorPage } from '../views/errors/500';

export async function errorHandler(c: Context, next: Next): Promise<Response | void> {
  try {
    await next();

    // Handle 404
    if (c.res.status === 404) {
      const user = c.get('user');
      return c.html(<NotFoundPage user={user} path={c.req.path} />, 404);
    }
  } catch (error) {
    // Log the error
    logger.error('Unhandled error:', error);

    const user = c.get('user');
    const errorMessage = error instanceof Error ? error.message : String(error);
    const stackTrace = error instanceof Error ? error.stack : undefined;

    // Return 500 error page
    return c.html(
      <ErrorPage
        user={user}
        error={isDevelopment ? (stackTrace || errorMessage) : undefined}
        isDevelopment={isDevelopment}
      />,
      500
    );
  }
}
