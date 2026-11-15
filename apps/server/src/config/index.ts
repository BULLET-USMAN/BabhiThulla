import dotenv from 'dotenv';
dotenv.config();

const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl,
  isDev: (process.env.NODE_ENV || 'development') === 'development',
  corsOrigins: Array.from(
    new Set([
      clientUrl,
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:4173',
      'http://127.0.0.1:4173',
      'http://localhost:3000',
    ])
  ),
};
