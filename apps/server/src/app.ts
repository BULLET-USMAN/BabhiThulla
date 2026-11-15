import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { config } from './config/index.js';

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: [config.clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      credentials: true,
    })
  );

  app.use(express.json());

  // Health and readiness endpoints
  app.get('/api/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      service: 'bhabhi-thulla-server',
      version: '0.1.0',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/api/version', (_req: Request, res: Response) => {
    res.status(200).json({
      version: '0.1.0',
      phase: 1,
      phaseName: 'Foundation & UI Design System',
      multiplayerReady: false,
    });
  });

  // Global 404 handler for undefined API routes
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      error: 'Not Found',
      message: 'The requested resource does not exist.',
    });
  });

  // Global error handler
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[SERVER ERROR]', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: config.isDev ? err.message : 'An unexpected error occurred.',
    });
  });

  return app;
}
