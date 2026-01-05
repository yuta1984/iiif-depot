import { Hono } from 'hono';
import { jsx } from 'hono/jsx';
import { generateAuthUrl, generateState, getTokensFromCode, getUserInfo } from '../services/oauth';
import { getUserByEmail, createUser } from '../db/queries';
import { LoginPage } from '../views/auth/login';
import { CONFIG } from '../config';
import { logger } from '../utils/logger';

const auth = new Hono();

// Login page
auth.get('/login', (c) => {
  return c.html(<LoginPage />);
});

// Initiate Google OAuth flow
auth.get('/google', async (c) => {
  const session = c.get('session');
  const state = generateState();

  // Store state in session for CSRF protection
  session.set('oauthState', state);

  const authUrl = generateAuthUrl(state);
  return c.redirect(authUrl);
});

// OAuth callback
auth.get('/google/callback', async (c) => {
  const session = c.get('session');
  const code = c.req.query('code');
  const state = c.req.query('state');
  const storedState = session.get('oauthState');

  // Verify state for CSRF protection
  if (!state || !storedState || state !== storedState) {
    logger.error('OAuth state mismatch');
    return c.html('<h1>Authentication Failed</h1><p>State mismatch. Please try again.</p>', 400);
  }

  // Clear state from session
  session.delete('oauthState');

  if (!code) {
    logger.error('No authorization code received');
    return c.html('<h1>Authentication Failed</h1><p>No authorization code received.</p>', 400);
  }

  try {
    // Exchange code for tokens
    const tokens = await getTokensFromCode(code);

    // Get user info from Google
    const googleUser = await getUserInfo(tokens.access_token);

    // Check if user exists
    let user = getUserByEmail(googleUser.email);

    if (!user) {
      // Create new user
      const isAdmin = CONFIG.adminEmails.includes(googleUser.email);
      const defaultQuotaBytes = CONFIG.storage.defaultQuotaMB * 1024 * 1024;

      user = createUser({
        id: googleUser.id,
        email: googleUser.email,
        name: googleUser.name,
        profile: null,
        avatar_url: googleUser.picture || null,
        storage_quota: defaultQuotaBytes,
        storage_used: 0,
        is_admin: isAdmin,
      });

      logger.info(`New user created: ${user.email}`);
    } else {
      logger.info(`User logged in: ${user.email}`);
    }

    // Store user ID in session
    session.set('userId', user.id);

    return c.redirect('/');
  } catch (error) {
    logger.error('OAuth callback error', error);
    return c.html('<h1>Authentication Failed</h1><p>An error occurred during authentication. Please try again.</p>', 500);
  }
});

// Logout
auth.post('/logout', async (c) => {
  const session = c.get('session');
  await session.destroy();

  return c.redirect('/');
});

export default auth;
