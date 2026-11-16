import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { config } from '../config/index.js';

const { Pool } = pg;

async function runMigrations() {
  console.log('[MIGRATION] Starting database migration...');

  if (!config.databaseUrl) {
    if (config.isTest || config.isDev) {
      console.log('[MIGRATION] No DATABASE_URL specified. In-memory database will run migrations automatically.');
      process.exit(0);
    }
    console.error('[MIGRATION ERROR] DATABASE_URL is required to run migrations.');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: config.databaseUrl,
    max: 1,
    ssl: config.databaseSsl ? { rejectUnauthorized: false } : undefined,
  });

  try {
    const db = drizzle(pool);
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const migrationsFolder = path.resolve(__dirname, '../../drizzle');

    console.log(`[MIGRATION] Applying migrations from: ${migrationsFolder}`);
    await migrate(db, { migrationsFolder });
    console.log('[MIGRATION SUCCESS] All schema migrations applied successfully.');
    await pool.end();
    process.exit(0);
  } catch (err: unknown) {
    console.error('[MIGRATION FATAL ERROR] Migration failed:', err);
    await pool.end();
    process.exit(1);
  }
}

runMigrations();
