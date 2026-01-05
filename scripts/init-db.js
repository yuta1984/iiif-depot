import { getDatabase, closeDatabase } from '../src/db/queries';
import { logger } from '../src/utils/logger';
import * as fs from 'fs';
import * as path from 'path';
import { CONFIG } from '../src/config';
function ensureDirectories() {
    const dirs = [
        path.dirname(CONFIG.dbPath),
        CONFIG.storage.uploadDir,
        CONFIG.storage.ptiffDir,
    ];
    for (const dir of dirs) {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            logger.info(`Created directory: ${dir}`);
        }
    }
}
function main() {
    logger.info('Initializing database...');
    try {
        // Ensure directories exist
        ensureDirectories();
        // Initialize database (schema will be created automatically)
        const db = getDatabase();
        logger.info('Database initialized successfully');
        // Close database
        closeDatabase();
    }
    catch (error) {
        logger.error('Failed to initialize database', error);
        process.exit(1);
    }
}
main();
//# sourceMappingURL=init-db.js.map