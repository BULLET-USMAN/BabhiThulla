import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { newDb } from 'pg-mem';
import * as schema from './schema.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/index.js';

const { Pool } = pg;

export type AppDatabase = NodePgDatabase<typeof schema>;

let databaseInstance: AppDatabase | null = null;
let pgPool: pg.Pool | null = null;
let isUsingInMemory = false;
let isInitialized = false;

/**
 * Initializes the database connection pool or in-memory fallback.
 * Automatically runs schema migrations if in-memory or on fresh setup.
 */
export async function initDatabase(forceInMemory = false): Promise<AppDatabase> {
  if (databaseInstance && isInitialized) {
    return databaseInstance;
  }

  const databaseUrl = config.databaseUrl;
  const isTest = config.isTest;

  if (!forceInMemory && !isTest && databaseUrl) {
    try {
      logger.info('Connecting to PostgreSQL database...', {
        url: databaseUrl.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'),
        ssl: config.databaseSsl,
        poolSize: config.databasePoolSize,
      });

      const pool = new Pool({
        connectionString: databaseUrl,
        max: config.databasePoolSize,
        ssl: config.databaseSsl ? { rejectUnauthorized: false } : undefined,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      });

      // Test connection
      const client = await pool.connect();
      client.release();

      pgPool = pool;
      databaseInstance = drizzle(pool, { schema });
      isUsingInMemory = false;
      isInitialized = true;
      logger.info('Connected to PostgreSQL successfully.');
      return databaseInstance;
    } catch (err: unknown) {
      if (config.isProd) {
        logger.error('[CRITICAL] Failed to connect to production PostgreSQL database!', {
          error: (err as Error).message,
        });
        throw err;
      }
      logger.warn('Could not connect to PostgreSQL server. Falling back to persistent in-memory database.', {
        error: (err as Error).message,
      });
    }
  }

  // In-Memory SQLite/Postgres via pg-mem for hermetic testing and local standalone dev
  logger.info('Initializing isolated in-memory PostgreSQL engine via pg-mem...');
  const memDb = newDb({ autoCreateForeignKeyIndices: true });

  // Load and apply SQL migration
  try {
    const currentFile = fileURLToPath(import.meta.url);
    const drizzleDir = path.resolve(path.dirname(currentFile), '../../drizzle');
    const migrationFiles = fs
      .readdirSync(drizzleDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    for (const file of migrationFiles) {
      const fullPath = path.join(drizzleDir, file);
      const sqlContent = fs.readFileSync(fullPath, 'utf8');
      const statements = sqlContent.split('--> statement-breakpoint');
      for (const statement of statements) {
        const trimmed = statement.trim();
        if (trimmed) {
          memDb.public.none(trimmed);
        }
      }
    }
    logger.info(`Applied ${migrationFiles.length} migration(s) to in-memory database.`);
  } catch (err: unknown) {
    logger.error('Failed to apply migrations to in-memory database', { err });
  }

  const adapter = memDb.adapters.createPg();
  const pool = new adapter.Pool();

  // Drizzle ORM node-postgres passes custom getTypeParser and rowMode: 'array',
  // which pg-mem rejects unless adapted into array values.
  const patchQueryMethod = (target: any) => {
    const origQuery = target.query.bind(target);
    target.query = function (queryConfig: any, ...args: any[]) {
      let isArray = false;
      if (queryConfig && typeof queryConfig === 'object') {
        if (queryConfig.types?.getTypeParser) {
          delete queryConfig.types.getTypeParser;
        }
        if (queryConfig.rowMode === 'array') {
          isArray = true;
          delete queryConfig.rowMode;
        }
      }

      const transformRes = (res: any) => {
        if (isArray && res && Array.isArray(res.rows)) {
          res.rows = res.rows.map((r: any) =>
            typeof r === 'object' && r !== null ? Object.values(r) : r
          );
        }
        return res;
      };

      const lastArg = args[args.length - 1];
      if (typeof lastArg === 'function') {
        const origCb = lastArg;
        args[args.length - 1] = (err: any, res: any) => {
          if (err) return origCb(err);
          return origCb(null, transformRes(res));
        };
        return origQuery(queryConfig, ...args);
      }

      const p = origQuery(queryConfig, ...args);
      if (p && typeof p.then === 'function') {
        return p.then(transformRes);
      }
      return transformRes(p);
    };
  };

  patchQueryMethod(pool);
  const origConnect = pool.connect.bind(pool);
  pool.connect = async function (...args: any[]) {
    const client = await (origConnect as any)(...args);
    patchQueryMethod(client);
    return client;
  };

  pgPool = pool as unknown as pg.Pool;
  databaseInstance = drizzle(pgPool, { schema });
  isUsingInMemory = true;
  isInitialized = true;

  return databaseInstance;
}

export function getDb(): AppDatabase {
  if (!databaseInstance) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return databaseInstance;
}

export async function isDbHealthy(): Promise<{
  connected: boolean;
  type: 'postgres' | 'in-memory';
  latencyMs: number;
}> {
  const start = Date.now();
  try {
    if (!databaseInstance || !pgPool) {
      return { connected: false, type: 'in-memory', latencyMs: 0 };
    }
    await pgPool.query('SELECT 1');
    return {
      connected: true,
      type: isUsingInMemory ? 'in-memory' : 'postgres',
      latencyMs: Date.now() - start,
    };
  } catch {
    return { connected: false, type: isUsingInMemory ? 'in-memory' : 'postgres', latencyMs: Date.now() - start };
  }
}

export async function closeDatabase(): Promise<void> {
  if (pgPool) {
    await pgPool.end();
    pgPool = null;
  }
  databaseInstance = null;
  isInitialized = false;
}
