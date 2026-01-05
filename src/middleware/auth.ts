import { Context, Next } from 'hono';
import { getUserById } from '../db/queries';
import { User } from '../types';

declare module 'hono' {
  interface ContextVariableMap {
    user?: User;
  }
}

export async function authMiddleware(c: Context, next: Next): Promise<void> {
  const session = c.get('session');
  const userId = session.get('userId');

  if (userId) {
    const user = getUserById(userId);
    if (user) {
      c.set('user', user);
    }
  }

  await next();
}

export async function requireAuth(c: Context, next: Next): Promise<void | Response> {
  const user = c.get('user');

  if (!user) {
    return c.redirect('/auth/login');
  }

  await next();
}

export async function requireAdmin(c: Context, next: Next): Promise<void | Response> {
  const user = c.get('user');

  if (!user) {
    return c.redirect('/auth/login');
  }

  if (!user.is_admin) {
    return c.html('<h1>403 Forbidden</h1><p>Admin access required</p>', 403);
  }

  await next();
}
