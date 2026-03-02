import { config } from 'dotenv';

// Load .env file
config();

// Validate required environment variables at startup
const REQUIRED_VARS = [
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'SESSION_SECRET',
] as const;

for (const key of REQUIRED_VARS) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export const CONFIG = {
  // App settings
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',

  // Database
  dbPath: process.env.DB_PATH || './data/db/iiif-depot.db',

  // Google OAuth
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback',
  },

  // Session
  sessionSecret: process.env.SESSION_SECRET || 'change-this-in-production',

  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },

  // Storage
  storage: {
    uploadDir: process.env.UPLOAD_DIR || './data/images/original',
    ptiffDir: process.env.PTIFF_DIR || './data/images/ptiff',
    defaultQuotaMB: parseInt(process.env.DEFAULT_QUOTA_MB || '100', 10),
  },

  // Cantaloupe
  cantaloupeUrl: process.env.CANTALOUPE_URL || 'http://localhost:8182/iiif/2',
  cantaloupePublicUrl: process.env.CANTALOUPE_PUBLIC_URL || process.env.CANTALOUPE_URL || 'http://localhost:8182/iiif/2',

  // Admin
  adminEmails: (process.env.ADMIN_EMAILS || '').split(',').map(email => email.trim()).filter(Boolean),
};

export const isDevelopment = CONFIG.nodeEnv === 'development';
export const isProduction = CONFIG.nodeEnv === 'production';
