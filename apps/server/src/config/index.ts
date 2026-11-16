import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const EnvSchema = z.object({
  PORT: z.string().default('3001').transform((val) => parseInt(val, 10)),
  HOST: z.string().default('0.0.0.0'),
  NODE_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
  DATABASE_URL: z.string().optional(),
  DATABASE_POOL_SIZE: z.string().default('10').transform((val) => parseInt(val, 10)),
  DATABASE_SSL: z.enum(['true', 'false']).optional(),
  CLIENT_ORIGIN: z.string().optional(),
  CLIENT_URL: z.string().optional(),
  SESSION_SECRET: z.string().default('bhabhi-thulla-insecure-secret-change-in-prod'),
  GAME_STATE_ENCRYPTION_KEY: z.string().default('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  RECONNECT_GRACE_PERIOD_MS: z.string().default('120000').transform((val) => parseInt(val, 10)),
  RATE_LIMIT_WINDOW_MS: z.string().default('3000').transform((val) => parseInt(val, 10)),
  RATE_LIMIT_MAX: z.string().default('10').transform((val) => parseInt(val, 10)),
  ROOM_IDLE_TIMEOUT_MS: z.string().default('3600000').transform((val) => parseInt(val, 10)), // 1 hour
});

const parsedEnv = EnvSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('[CONFIG FATAL] Invalid environment configuration:', parsedEnv.error.format());
  throw new Error('Invalid environment configuration');
}

const env = parsedEnv.data;

// Production security assertions
if (env.NODE_ENV === 'production') {
  if (env.SESSION_SECRET === 'bhabhi-thulla-insecure-secret-change-in-prod') {
    throw new Error(
      '[SECURITY VIOLATION] SESSION_SECRET must be set to a secure unique random secret in production!'
    );
  }
  if (env.GAME_STATE_ENCRYPTION_KEY === '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef') {
    throw new Error(
      '[SECURITY VIOLATION] GAME_STATE_ENCRYPTION_KEY must be set to a secure unique 256-bit hex key in production!'
    );
  }
}

// Compute client origins
const configuredOrigins: string[] = [];
if (env.CLIENT_ORIGIN) {
  configuredOrigins.push(...env.CLIENT_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean));
}
if (env.CLIENT_URL) {
  configuredOrigins.push(env.CLIENT_URL.trim());
}

const defaultDevOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
  'http://localhost:3000',
];

const corsOrigins = Array.from(
  new Set([
    ...(configuredOrigins.length > 0 ? configuredOrigins : ['http://localhost:5173']),
    ...(env.NODE_ENV !== 'production' ? defaultDevOrigins : []),
  ])
);

export const config = {
  port: env.PORT,
  host: env.HOST,
  nodeEnv: env.NODE_ENV,
  isDev: env.NODE_ENV === 'development',
  isTest: env.NODE_ENV === 'test',
  isProd: env.NODE_ENV === 'production',
  databaseUrl: env.DATABASE_URL,
  databasePoolSize: env.DATABASE_POOL_SIZE,
  databaseSsl: env.DATABASE_SSL === 'true' || (env.NODE_ENV === 'production' && env.DATABASE_SSL !== 'false'),
  sessionSecret: env.SESSION_SECRET,
  gameStateEncryptionKey: env.GAME_STATE_ENCRYPTION_KEY,
  logLevel: env.LOG_LEVEL,
  reconnectGracePeriodMs: env.RECONNECT_GRACE_PERIOD_MS,
  rateLimitWindowMs: env.RATE_LIMIT_WINDOW_MS,
  rateLimitMax: env.RATE_LIMIT_MAX,
  roomIdleTimeoutMs: env.ROOM_IDLE_TIMEOUT_MS,
  corsOrigins,
  primaryClientUrl: configuredOrigins[0] || 'http://localhost:5173',
};
