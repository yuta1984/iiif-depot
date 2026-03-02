import { Hono } from 'hono';
import { TosPage } from '../views/legal/tos';

const legal = new Hono();

// Terms of Service page
legal.get('/tos', (c) => {
  const user = c.get('user'); // Get user from auth middleware if logged in
  return c.html(<TosPage user={user} />);
});

export default legal;
