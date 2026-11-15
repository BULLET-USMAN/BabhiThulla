import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { z } from 'zod';
import { config } from './config/index.js';
import { guestRepository } from './db/guestRepository.js';
import { statisticsRepository } from './db/statisticsRepository.js';
import { matchHistoryRepository } from './db/matchHistoryRepository.js';
import { isDbHealthy } from './db/connection.js';
import { roomManager } from './rooms/roomManager.js';
import { NicknameSchema, AvatarSchema } from './security/validation.js';

const RegisterGuestSchema = z.object({
  displayName: NicknameSchema,
  avatarId: AvatarSchema,
  existingGuestId: z.string().optional(),
});

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: config.corsOrigins,
      credentials: true,
    })
  );

  app.use(express.json());

  // 1. Health and readiness endpoints
  app.get('/api/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      service: 'bhabhi-thulla-server',
      version: '0.5.0',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/api/ready', async (_req: Request, res: Response) => {
    const dbStatus = await isDbHealthy();
    const rooms = roomManager.getAllRooms();
    const activeMatchesCount = rooms.filter((r) => r.status === 'playing').length;
    const totalPlayersCount = rooms.reduce((acc, r) => acc + r.members.length, 0);

    const isHealthy = dbStatus.connected;
    const statusCode = isHealthy ? 200 : 503;

    res.status(statusCode).json({
      ready: isHealthy,
      database: dbStatus,
      activeRooms: rooms.length,
      activeMatches: activeMatchesCount,
      connectedPlayers: totalPlayersCount,
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/api/version', (_req: Request, res: Response) => {
    res.status(200).json({
      version: '0.5.0',
      phase: 5,
      phaseName: 'Multiplayer Reliability, Persistence, Statistics & Anti-Cheat',
      multiplayerReady: true,
      persistentStorage: true,
      authoritativeStats: true,
    });
  });

  // 2. Guest Identity & Session Authentication
  app.post('/api/guest/register', async (req: Request, res: Response) => {
    const parsed = RegisterGuestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Bad Request',
        message: parsed.error.issues[0]?.message || 'Invalid registration payload.',
      });
      return;
    }

    try {
      const { displayName, avatarId, existingGuestId } = parsed.data;
      const { guest, sessionToken } = await guestRepository.registerGuest(
        displayName,
        avatarId,
        existingGuestId
      );

      res.status(200).json({
        success: true,
        data: {
          guest: {
            id: guest.id,
            displayName: guest.displayName,
            avatarId: guest.avatarId,
            createdAt: new Date(guest.createdAt).getTime(),
          },
          sessionToken,
        },
      });
    } catch (err: unknown) {
      res.status(500).json({
        error: 'Registration Failed',
        message: (err as Error).message,
      });
    }
  });

  app.get('/api/guest/me', async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    const guestIdHeader = req.headers['x-guest-id'] as string;

    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!token || !guestIdHeader) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing authentication headers.',
      });
      return;
    }

    try {
      const auth = await guestRepository.validateSession(guestIdHeader, token);
      if (!auth.valid || !auth.guest) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid or expired session token.',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          id: auth.guest.id,
          displayName: auth.guest.displayName,
          avatarId: auth.guest.avatarId,
          createdAt: new Date(auth.guest.createdAt).getTime(),
        },
      });
    } catch (err: unknown) {
      res.status(500).json({
        error: 'Auth Verification Failed',
        message: (err as Error).message,
      });
    }
  });

  // 3. Player Statistics
  app.get('/api/stats/:guestId', async (req: Request, res: Response) => {
    const rawId = req.params.guestId;
    const guestId = Array.isArray(rawId) ? rawId[0] : rawId;
    if (!guestId) {
      res.status(400).json({ error: 'Bad Request', message: 'Missing guest ID.' });
      return;
    }

    try {
      const stats = await statisticsRepository.getPlayerStats(guestId);
      if (!stats) {
        res.status(404).json({
          error: 'Not Found',
          message: 'Player statistics not found for this guest.',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (err: unknown) {
      res.status(500).json({
        error: 'Failed to retrieve stats',
        message: (err as Error).message,
      });
    }
  });

  // 4. Paginated Match History
  app.get('/api/matches/history', async (req: Request, res: Response) => {
    try {
      const guestId = req.query.guestId as string | undefined;
      const roomCode = req.query.roomCode as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

      const history = await matchHistoryRepository.getMatchHistory({
        guestId,
        roomCode,
        limit,
        offset,
      });

      res.status(200).json({
        success: true,
        data: history,
      });
    } catch (err: unknown) {
      res.status(500).json({
        error: 'Failed to retrieve match history',
        message: (err as Error).message,
      });
    }
  });

  // 5. Room Leaderboard
  app.get('/api/rooms/:roomCode/leaderboard', async (req: Request, res: Response) => {
    const rawCode = req.params.roomCode;
    const roomCode = Array.isArray(rawCode) ? rawCode[0] : rawCode;
    if (!roomCode) {
      res.status(400).json({ error: 'Bad Request', message: 'Missing room code.' });
      return;
    }

    try {
      const leaderboard = await statisticsRepository.getRoomLeaderboard(roomCode);
      res.status(200).json({
        success: true,
        data: leaderboard,
      });
    } catch (err: unknown) {
      res.status(500).json({
        error: 'Failed to retrieve room leaderboard',
        message: (err as Error).message,
      });
    }
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
