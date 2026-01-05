import Database from 'better-sqlite3';
import { User, IIIFResource, Image, JobStatus, QuotaRequest } from '../types';
import { CONFIG } from '../config';
import { createSchema } from './schema';
import { logger } from '../utils/logger';

let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (!db) {
    logger.info(`Opening database at ${CONFIG.dbPath}`);
    db = new Database(CONFIG.dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    createSchema(db);
  }
  return db;
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
    logger.info('Database closed');
  }
}

// ========== User Queries ==========

export function getUserById(userId: string): User | null {
  const db = getDatabase();
  return db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as User | undefined || null;
}

export function getUserByEmail(email: string): User | null {
  const db = getDatabase();
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email) as User | undefined || null;
}

export function createUser(user: Omit<User, 'created_at' | 'updated_at'>): User {
  const db = getDatabase();
  const now = Date.now();
  const stmt = db.prepare(`
    INSERT INTO users (id, email, name, profile, avatar_url, storage_quota, storage_used, is_admin, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    user.id,
    user.email,
    user.name,
    user.profile,
    user.avatar_url,
    user.storage_quota,
    user.storage_used,
    user.is_admin ? 1 : 0,
    now,
    now
  );

  return getUserById(user.id)!;
}

export function updateUser(userId: string, updates: Partial<Omit<User, 'id' | 'email' | 'created_at' | 'updated_at'>>): User | null {
  const db = getDatabase();
  const now = Date.now();
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.name !== undefined) {
    fields.push('name = ?');
    values.push(updates.name);
  }
  if (updates.profile !== undefined) {
    fields.push('profile = ?');
    values.push(updates.profile);
  }
  if (updates.avatar_url !== undefined) {
    fields.push('avatar_url = ?');
    values.push(updates.avatar_url);
  }
  if (updates.storage_quota !== undefined) {
    fields.push('storage_quota = ?');
    values.push(updates.storage_quota);
  }
  if (updates.storage_used !== undefined) {
    fields.push('storage_used = ?');
    values.push(updates.storage_used);
  }
  if (updates.is_admin !== undefined) {
    fields.push('is_admin = ?');
    values.push(updates.is_admin ? 1 : 0);
  }

  if (fields.length === 0) {
    return getUserById(userId);
  }

  fields.push('updated_at = ?');
  values.push(now);
  values.push(userId);

  const stmt = db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`);
  stmt.run(...values);

  return getUserById(userId);
}

export function getAllUsers(limit = 50, offset = 0): User[] {
  const db = getDatabase();
  return db.prepare('SELECT * FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?')
    .all(limit, offset) as User[];
}

export function incrementStorageUsed(userId: string, bytes: number): void {
  const db = getDatabase();
  const user = getUserById(userId);
  const oldUsed = user?.storage_used || 0;

  db.prepare('UPDATE users SET storage_used = storage_used + ?, updated_at = ? WHERE id = ?')
    .run(bytes, Date.now(), userId);

  const updatedUser = getUserById(userId);
  const newUsed = updatedUser?.storage_used || 0;

  logger.info(`Storage quota increased for user ${userId}: ${formatBytes(oldUsed)} -> ${formatBytes(newUsed)} (+${formatBytes(bytes)})`);
}

export function decrementStorageUsed(userId: string, bytes: number): void {
  const db = getDatabase();
  const user = getUserById(userId);
  const oldUsed = user?.storage_used || 0;

  db.prepare('UPDATE users SET storage_used = MAX(0, storage_used - ?), updated_at = ? WHERE id = ?')
    .run(bytes, Date.now(), userId);

  const updatedUser = getUserById(userId);
  const newUsed = updatedUser?.storage_used || 0;

  logger.info(`Storage quota released for user ${userId}: ${formatBytes(oldUsed)} -> ${formatBytes(newUsed)} (-${formatBytes(bytes)})`);
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

export function updateUserQuota(userId: string, quotaBytes: number): void {
  const db = getDatabase();
  db.prepare('UPDATE users SET storage_quota = ?, updated_at = ? WHERE id = ?')
    .run(quotaBytes, Date.now(), userId);
}

export function updateUserAdmin(userId: string, isAdmin: boolean): void {
  const db = getDatabase();
  db.prepare('UPDATE users SET is_admin = ?, updated_at = ? WHERE id = ?')
    .run(isAdmin ? 1 : 0, Date.now(), userId);
}

// ========== IIIF Resource Queries ==========

export function getResourceById(resourceId: string): IIIFResource | null {
  const db = getDatabase();
  return db.prepare('SELECT * FROM iiif_resources WHERE id = ?').get(resourceId) as IIIFResource | undefined || null;
}

export function getResourcesByUserId(userId: string, limit = 50, offset = 0): IIIFResource[] {
  const db = getDatabase();
  return db.prepare('SELECT * FROM iiif_resources WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?')
    .all(userId, limit, offset) as IIIFResource[];
}

export function getPublicResources(limit = 50, offset = 0): IIIFResource[] {
  const db = getDatabase();
  return db.prepare('SELECT * FROM iiif_resources WHERE visibility = ? AND status = ? ORDER BY created_at DESC LIMIT ? OFFSET ?')
    .all('public', 'ready', limit, offset) as IIIFResource[];
}

export function createResource(resource: Omit<IIIFResource, 'created_at' | 'updated_at'>): IIIFResource {
  const db = getDatabase();
  const now = Date.now();
  const stmt = db.prepare(`
    INSERT INTO iiif_resources (id, user_id, title, description, attribution, license, metadata, status, visibility, homepage, viewing_direction, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    resource.id,
    resource.user_id,
    resource.title,
    resource.description,
    resource.attribution,
    resource.license,
    resource.metadata,
    resource.status,
    resource.visibility,
    resource.homepage,
    resource.viewing_direction,
    now,
    now
  );

  return getResourceById(resource.id)!;
}

export function updateResource(resourceId: string, updates: Partial<Omit<IIIFResource, 'id' | 'user_id' | 'created_at' | 'updated_at'>>): IIIFResource | null {
  const db = getDatabase();
  const now = Date.now();
  const fields: string[] = [];
  const values: any[] = [];

  Object.entries(updates).forEach(([key, value]) => {
    if (value !== undefined && key !== 'id' && key !== 'user_id' && key !== 'created_at' && key !== 'updated_at') {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  });

  if (fields.length === 0) {
    return getResourceById(resourceId);
  }

  fields.push('updated_at = ?');
  values.push(now);
  values.push(resourceId);

  const stmt = db.prepare(`UPDATE iiif_resources SET ${fields.join(', ')} WHERE id = ?`);
  stmt.run(...values);

  return getResourceById(resourceId);
}

export function deleteResource(resourceId: string): void {
  const db = getDatabase();
  db.prepare('DELETE FROM iiif_resources WHERE id = ?').run(resourceId);
}

// ========== Image Queries ==========

export function getImageById(imageId: string): Image | null {
  const db = getDatabase();
  return db.prepare('SELECT * FROM images WHERE id = ?').get(imageId) as Image | undefined || null;
}

export function getImagesByResourceId(resourceId: string): Image[] {
  const db = getDatabase();
  return db.prepare('SELECT * FROM images WHERE resource_id = ? ORDER BY order_index ASC')
    .all(resourceId) as Image[];
}

export function createImage(image: Omit<Image, 'created_at' | 'updated_at'>): Image {
  const db = getDatabase();
  const now = Date.now();
  const stmt = db.prepare(`
    INSERT INTO images (id, resource_id, user_id, original_filename, file_path, ptiff_path, file_size, width, height, mime_type, order_index, status, job_id, error_message, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    image.id,
    image.resource_id,
    image.user_id,
    image.original_filename,
    image.file_path,
    image.ptiff_path,
    image.file_size,
    image.width,
    image.height,
    image.mime_type,
    image.order_index,
    image.status,
    image.job_id,
    image.error_message,
    now,
    now
  );

  return getImageById(image.id)!;
}

export function updateImage(imageId: string, updates: Partial<Omit<Image, 'id' | 'resource_id' | 'user_id' | 'created_at' | 'updated_at'>>): Image | null {
  const db = getDatabase();
  const now = Date.now();
  const fields: string[] = [];
  const values: any[] = [];

  Object.entries(updates).forEach(([key, value]) => {
    if (value !== undefined && !['id', 'resource_id', 'user_id', 'created_at', 'updated_at'].includes(key)) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  });

  if (fields.length === 0) {
    return getImageById(imageId);
  }

  fields.push('updated_at = ?');
  values.push(now);
  values.push(imageId);

  const stmt = db.prepare(`UPDATE images SET ${fields.join(', ')} WHERE id = ?`);
  stmt.run(...values);

  return getImageById(imageId);
}

export function deleteImage(imageId: string): void {
  const db = getDatabase();
  db.prepare('DELETE FROM images WHERE id = ?').run(imageId);
}

// ========== Job Status Queries ==========

export function getJobStatusById(jobId: string): JobStatus | null {
  const db = getDatabase();
  return db.prepare('SELECT * FROM job_status WHERE id = ?').get(jobId) as JobStatus | undefined || null;
}

export function getJobStatusByImageId(imageId: string): JobStatus | null {
  const db = getDatabase();
  return db.prepare('SELECT * FROM job_status WHERE image_id = ? ORDER BY created_at DESC LIMIT 1')
    .get(imageId) as JobStatus | undefined || null;
}

export function getJobStatusesByResourceId(resourceId: string): JobStatus[] {
  const db = getDatabase();
  return db.prepare(`
    SELECT js.* FROM job_status js
    INNER JOIN images i ON js.image_id = i.id
    WHERE i.resource_id = ?
    ORDER BY js.created_at ASC
  `).all(resourceId) as JobStatus[];
}

export function createJobStatus(jobStatus: Omit<JobStatus, 'created_at'>): JobStatus {
  const db = getDatabase();
  const now = Date.now();
  const stmt = db.prepare(`
    INSERT INTO job_status (id, image_id, status, progress, error_message, started_at, completed_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    jobStatus.id,
    jobStatus.image_id,
    jobStatus.status,
    jobStatus.progress,
    jobStatus.error_message,
    jobStatus.started_at,
    jobStatus.completed_at,
    now
  );

  return getJobStatusById(jobStatus.id)!;
}

export function updateJobStatus(jobId: string, updates: Partial<Omit<JobStatus, 'id' | 'image_id' | 'created_at'>>): JobStatus | null {
  const db = getDatabase();
  const fields: string[] = [];
  const values: any[] = [];

  Object.entries(updates).forEach(([key, value]) => {
    if (value !== undefined && !['id', 'image_id', 'created_at'].includes(key)) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  });

  if (fields.length === 0) {
    return getJobStatusById(jobId);
  }

  values.push(jobId);

  const stmt = db.prepare(`UPDATE job_status SET ${fields.join(', ')} WHERE id = ?`);
  stmt.run(...values);

  return getJobStatusById(jobId);
}

// ========== Quota Request Queries ==========

export function getQuotaRequestById(requestId: string): QuotaRequest | null {
  const db = getDatabase();
  return db.prepare('SELECT * FROM quota_requests WHERE id = ?').get(requestId) as QuotaRequest | undefined || null;
}

export function getQuotaRequestsByUserId(userId: string, limit = 50, offset = 0): QuotaRequest[] {
  const db = getDatabase();
  return db.prepare('SELECT * FROM quota_requests WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?')
    .all(userId, limit, offset) as QuotaRequest[];
}

export function getPendingQuotaRequestByUserId(userId: string): QuotaRequest | null {
  const db = getDatabase();
  return db.prepare("SELECT * FROM quota_requests WHERE user_id = ? AND status IN ('新着', '閲覧済み') ORDER BY created_at DESC LIMIT 1")
    .get(userId) as QuotaRequest | undefined || null;
}

export function getAllQuotaRequests(status?: string, limit = 100, offset = 0): QuotaRequest[] {
  const db = getDatabase();
  if (status) {
    return db.prepare('SELECT * FROM quota_requests WHERE status = ? ORDER BY created_at DESC LIMIT ? OFFSET ?')
      .all(status, limit, offset) as QuotaRequest[];
  }
  return db.prepare('SELECT * FROM quota_requests ORDER BY created_at DESC LIMIT ? OFFSET ?')
    .all(limit, offset) as QuotaRequest[];
}

export function getQuotaRequestStats(): { total: number; new: number; viewed: number; handled: number } {
  const db = getDatabase();
  const result = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = '新着' THEN 1 ELSE 0 END) as new,
      SUM(CASE WHEN status = '閲覧済み' THEN 1 ELSE 0 END) as viewed,
      SUM(CASE WHEN status = '対応済み' THEN 1 ELSE 0 END) as handled
    FROM quota_requests
  `).get() as { total: number; new: number; viewed: number; handled: number };

  return result;
}

export function createQuotaRequest(request: Omit<QuotaRequest, 'created_at' | 'updated_at'>): QuotaRequest {
  const db = getDatabase();
  const now = Date.now();
  const stmt = db.prepare(`
    INSERT INTO quota_requests (
      id, user_id, current_quota, requested_quota, reason, status,
      admin_note, admin_id, viewed_at, handled_at, created_at, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    request.id,
    request.user_id,
    request.current_quota,
    request.requested_quota,
    request.reason,
    request.status,
    request.admin_note,
    request.admin_id,
    request.viewed_at,
    request.handled_at,
    now,
    now
  );

  return getQuotaRequestById(request.id)!;
}

export function updateQuotaRequest(
  requestId: string,
  updates: Partial<Omit<QuotaRequest, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): QuotaRequest | null {
  const db = getDatabase();
  const now = Date.now();
  const fields: string[] = [];
  const values: any[] = [];

  Object.entries(updates).forEach(([key, value]) => {
    if (value !== undefined && !['id', 'user_id', 'created_at', 'updated_at'].includes(key)) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  });

  if (fields.length === 0) {
    return getQuotaRequestById(requestId);
  }

  fields.push('updated_at = ?');
  values.push(now);
  values.push(requestId);

  const stmt = db.prepare(`UPDATE quota_requests SET ${fields.join(', ')} WHERE id = ?`);
  stmt.run(...values);

  return getQuotaRequestById(requestId);
}

export function markQuotaRequestAsViewed(requestId: string): QuotaRequest | null {
  const now = Date.now();
  return updateQuotaRequest(requestId, {
    status: '閲覧済み',
    viewed_at: now
  });
}

export function markQuotaRequestAsHandled(
  requestId: string,
  adminId: string,
  adminNote?: string
): QuotaRequest | null {
  const now = Date.now();
  return updateQuotaRequest(requestId, {
    status: '対応済み',
    admin_id: adminId,
    admin_note: adminNote || null,
    handled_at: now
  });
}
