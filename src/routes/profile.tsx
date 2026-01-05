import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth';
import { updateUser } from '../db/queries';
import { ProfileView } from '../views/profile/view';
import { ProfileEdit } from '../views/profile/edit';
import { validateProfileUpdate, sanitizeString } from '../utils/validators';
import { logger } from '../utils/logger';

const profile = new Hono();

// Require authentication for all profile routes
profile.use('*', requireAuth);

// View profile
profile.get('/', (c) => {
  const user = c.get('user')!;
  return c.html(<ProfileView user={user} />);
});

// Edit profile form
profile.get('/edit', (c) => {
  const user = c.get('user')!;
  return c.html(<ProfileEdit user={user} />);
});

// Update profile
profile.post('/edit', async (c) => {
  const user = c.get('user')!;
  const formData = await c.req.parseBody();

  const name = sanitizeString(String(formData.name || ''));
  const profileText = sanitizeString(String(formData.profile || ''));

  // Validate input
  const errors = validateProfileUpdate(name, profileText);

  if (errors.length > 0) {
    const errorMap: { [key: string]: string } = {};
    errors.forEach(err => {
      errorMap[err.field] = err.message;
    });
    return c.html(<ProfileEdit user={user} errors={errorMap} />);
  }

  // Update user
  try {
    const updated = updateUser(user.id, {
      name,
      profile: profileText || null,
    });

    if (updated) {
      logger.info(`Profile updated for user ${user.id}`);
      return c.redirect('/profile');
    } else {
      throw new Error('Failed to update profile');
    }
  } catch (error) {
    logger.error('Profile update error', error);
    return c.html(
      <ProfileEdit
        user={user}
        errors={{ _form: 'プロフィールの更新に失敗しました' }}
      />
    );
  }
});

export default profile;
