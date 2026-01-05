import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { CONFIG } from '../config';
import { logger } from '../utils/logger';

export interface UploadedFile {
  data: Buffer;
  name: string;
  mimetype: string;
  size: number;
}

export function ensureDirectories(): void {
  const dirs = [CONFIG.storage.uploadDir, CONFIG.storage.ptiffDir];

  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      logger.info(`Created directory: ${dir}`);
    }
  }
}

export function saveUploadedFile(file: UploadedFile, resourceId: string): string {
  ensureDirectories();

  const ext = path.extname(file.name);
  const filename = `${resourceId}_${uuidv4()}${ext}`;
  const filepath = path.join(CONFIG.storage.uploadDir, filename);

  fs.writeFileSync(filepath, file.data);
  logger.info(`Saved file: ${filepath}`);

  return filepath;
}

export function deleteFile(filepath: string): void {
  try {
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      logger.info(`Deleted file: ${filepath}`);
    }
  } catch (error) {
    logger.error(`Failed to delete file: ${filepath}`, error);
  }
}

export function getFileSize(filepath: string): number {
  try {
    const stats = fs.statSync(filepath);
    return stats.size;
  } catch (error) {
    logger.error(`Failed to get file size: ${filepath}`, error);
    return 0;
  }
}

export function fileExists(filepath: string): boolean {
  return fs.existsSync(filepath);
}

export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/tiff',
  'image/tif',
];

export function isAllowedFileType(mimetype: string): boolean {
  return ALLOWED_MIME_TYPES.includes(mimetype.toLowerCase());
}

export function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
}
