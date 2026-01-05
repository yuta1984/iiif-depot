import Database from 'better-sqlite3';
import { logger } from '../utils/logger';

export function createSchema(db: Database.Database): void {
  logger.info('Creating database schema...');

  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      profile TEXT,
      avatar_url TEXT,
      storage_quota INTEGER NOT NULL DEFAULT 104857600,
      storage_used INTEGER NOT NULL DEFAULT 0,
      is_admin INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  // IIIF Resources table
  db.exec(`
    CREATE TABLE IF NOT EXISTS iiif_resources (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      attribution TEXT,
      license TEXT,
      metadata TEXT,
      status TEXT NOT NULL CHECK(status IN ('processing', 'ready', 'failed')),
      visibility TEXT NOT NULL DEFAULT 'public' CHECK(visibility IN ('public', 'private')),
      homepage TEXT,
      viewing_direction TEXT DEFAULT 'left-to-right',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Images table
  db.exec(`
    CREATE TABLE IF NOT EXISTS images (
      id TEXT PRIMARY KEY,
      resource_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      original_filename TEXT NOT NULL,
      file_path TEXT NOT NULL,
      ptiff_path TEXT,
      file_size INTEGER NOT NULL,
      width INTEGER,
      height INTEGER,
      mime_type TEXT NOT NULL,
      order_index INTEGER NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('uploaded', 'processing', 'ready', 'failed')),
      job_id TEXT,
      error_message TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (resource_id) REFERENCES iiif_resources(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Job Status table
  db.exec(`
    CREATE TABLE IF NOT EXISTS job_status (
      id TEXT PRIMARY KEY,
      image_id TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('waiting', 'active', 'completed', 'failed')),
      progress INTEGER NOT NULL DEFAULT 0,
      error_message TEXT,
      started_at INTEGER,
      completed_at INTEGER,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (image_id) REFERENCES images(id) ON DELETE CASCADE
    )
  `);

  // Create quota_requests table
  db.exec(`
    CREATE TABLE IF NOT EXISTS quota_requests (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      current_quota INTEGER NOT NULL,
      requested_quota INTEGER NOT NULL,
      reason TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT '新着' CHECK(status IN ('新着', '閲覧済み', '対応済み')),
      admin_note TEXT,
      admin_id TEXT,
      viewed_at INTEGER,
      handled_at INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  // Create indexes for performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_resources_user_id ON iiif_resources(user_id);
    CREATE INDEX IF NOT EXISTS idx_resources_status ON iiif_resources(status);
    CREATE INDEX IF NOT EXISTS idx_resources_visibility ON iiif_resources(visibility);
    CREATE INDEX IF NOT EXISTS idx_resources_created_at ON iiif_resources(created_at);
    CREATE INDEX IF NOT EXISTS idx_images_resource_id ON images(resource_id);
    CREATE INDEX IF NOT EXISTS idx_images_user_id ON images(user_id);
    CREATE INDEX IF NOT EXISTS idx_images_status ON images(status);
    CREATE INDEX IF NOT EXISTS idx_job_status_image_id ON job_status(image_id);
    CREATE INDEX IF NOT EXISTS idx_job_status_status ON job_status(status);
    CREATE INDEX IF NOT EXISTS idx_quota_requests_user_id ON quota_requests(user_id);
    CREATE INDEX IF NOT EXISTS idx_quota_requests_status ON quota_requests(status);
    CREATE INDEX IF NOT EXISTS idx_quota_requests_created_at ON quota_requests(created_at);
  `);

  // Run migrations for existing databases
  runMigrations(db);

  logger.info('Database schema created successfully');
}

function runMigrations(db: Database.Database): void {
  logger.info('Running database migrations...');

  // Check if homepage and viewing_direction columns exist
  const tableInfo = db.pragma('table_info(iiif_resources)') as Array<{ name: string }>;
  const columnNames = tableInfo.map(col => col.name);

  // Migration: Add homepage column if it doesn't exist
  if (!columnNames.includes('homepage')) {
    logger.info('Adding homepage column to iiif_resources table');
    db.exec('ALTER TABLE iiif_resources ADD COLUMN homepage TEXT');
  }

  // Migration: Add viewing_direction column if it doesn't exist
  if (!columnNames.includes('viewing_direction')) {
    logger.info('Adding viewing_direction column to iiif_resources table');
    db.exec("ALTER TABLE iiif_resources ADD COLUMN viewing_direction TEXT DEFAULT 'left-to-right'");
  }

  // Migration: Create quota_requests table if it doesn't exist
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as Array<{ name: string }>;
  const tableNames = tables.map(t => t.name);

  if (!tableNames.includes('quota_requests')) {
    logger.info('Creating quota_requests table');
    db.exec(`
      CREATE TABLE IF NOT EXISTS quota_requests (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        current_quota INTEGER NOT NULL,
        requested_quota INTEGER NOT NULL,
        reason TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT '新着' CHECK(status IN ('新着', '閲覧済み', '対応済み')),
        admin_note TEXT,
        admin_id TEXT,
        viewed_at INTEGER,
        handled_at INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_quota_requests_user_id ON quota_requests(user_id);
      CREATE INDEX IF NOT EXISTS idx_quota_requests_status ON quota_requests(status);
      CREATE INDEX IF NOT EXISTS idx_quota_requests_created_at ON quota_requests(created_at);
    `);
  }

  logger.info('Database migrations completed');
}
