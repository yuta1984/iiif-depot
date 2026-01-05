import { Context, Next } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import Redis from 'ioredis';
import { CONFIG, isProduction } from '../config';
import { v4 as uuidv4 } from 'uuid';
import { SessionData } from '../types';

const redis = new Redis({
  host: CONFIG.redis.host,
  port: CONFIG.redis.port,
});

const SESSION_KEY = 'iiif_session';
const SESSION_TTL = 7 * 24 * 60 * 60; // 7 days in seconds

declare module 'hono' {
  interface ContextVariableMap {
    session: SessionManager;
  }
}

export class SessionManager {
  private sessionId: string;
  private data: SessionData = {};
  private modified = false;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
  }

  async load(): Promise<void> {
    const data = await redis.get(`session:${this.sessionId}`);
    if (data) {
      this.data = JSON.parse(data);
    }
  }

  async save(): Promise<void> {
    if (this.modified) {
      await redis.setex(
        `session:${this.sessionId}`,
        SESSION_TTL,
        JSON.stringify(this.data)
      );
      this.modified = false;
    }
  }

  get<K extends keyof SessionData>(key: K): SessionData[K] {
    return this.data[key];
  }

  set<K extends keyof SessionData>(key: K, value: SessionData[K]): void {
    this.data[key] = value;
    this.modified = true;
  }

  delete<K extends keyof SessionData>(key: K): void {
    delete this.data[key];
    this.modified = true;
  }

  async destroy(): Promise<void> {
    await redis.del(`session:${this.sessionId}`);
    this.data = {};
    this.modified = false;
  }

  getSessionId(): string {
    return this.sessionId;
  }
}

export async function sessionMiddleware(c: Context, next: Next): Promise<void> {
  let sessionId = getCookie(c, SESSION_KEY);

  if (!sessionId) {
    sessionId = uuidv4();
  }

  const session = new SessionManager(sessionId);
  await session.load();

  c.set('session', session);

  await next();

  await session.save();

  // Set cookie
  setCookie(c, SESSION_KEY, sessionId, {
    maxAge: SESSION_TTL,
    httpOnly: true,
    secure: isProduction,
    sameSite: 'Lax',
    path: '/',
  });
}
