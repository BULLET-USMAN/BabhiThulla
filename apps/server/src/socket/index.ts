import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { config } from '../config/index.js';
import { RateLimiter } from '../security/rateLimiter.js';
import { registerRoomHandlers } from './handlers/roomHandlers.js';
import { registerGameHandlers } from './handlers/gameHandlers.js';
import { registerConnectionHandlers } from './handlers/connectionHandlers.js';
import { registerReactionHandlers } from './handlers/reactionHandlers.js';
import { roomManager } from '../rooms/roomManager.js';
import { logger } from '../utils/logger.js';

export function setupSocketServer(httpServer: HttpServer): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: config.corsOrigins,
      credentials: true,
      methods: ['GET', 'POST'],
    },
    pingInterval: 25000,
    pingTimeout: 20000,
  });

  const rateLimiter = new RateLimiter(
    process.env.NODE_ENV === 'test' ? 1000 : 30,
    1000
  );

  const reactionRateLimiter = new RateLimiter(
    process.env.NODE_ENV === 'test' ? 1000 : 5,
    3000
  );

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    // Register all event namespaces
    registerRoomHandlers(io, socket, rateLimiter);
    registerGameHandlers(io, socket, rateLimiter);
    registerConnectionHandlers(io, socket);
    registerReactionHandlers(io, socket, reactionRateLimiter);
  });

  // Background room cleanup timer (every 60 seconds)
  const cleanupInterval = setInterval(() => {
    roomManager.cleanupInactiveRooms();
  }, 60000);

  // Prevent interval from keeping Node.js process alive during shutdown
  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }

  logger.info('Socket.IO real-time server initialized.');
  return io;
}
