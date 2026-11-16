import http from 'http';
import { createApp } from './app.js';
import { config } from './config/index.js';
import { setupSocketServer } from './socket/index.js';
import { initDatabase, closeDatabase } from './db/connection.js';
import { roomManager } from './rooms/roomManager.js';
import { logger } from './utils/logger.js';

async function bootstrap() {
  // Initialize Database (PostgreSQL with automatic migration & fallback)
  await initDatabase();

  // Recover active interrupted matches and paused rooms from persistent snapshots
  await roomManager.recoverActiveRoomsFromDatabase();

  const app = createApp();
  const server = http.createServer(app);

  // Attach Socket.IO server to HTTP server
  const io = setupSocketServer(server);

  server.listen(config.port, config.host, () => {
    console.log(`========================================`);
    console.log(`  Bhabhi Thulla Multiplayer Server (Phase 6)`);
    console.log(`  Environment: ${config.nodeEnv}`);
    console.log(`  Listening on: http://${config.host}:${config.port}`);
    console.log(`  Health check: http://${config.host}:${config.port}/health`);
    console.log(`  Readiness:    http://${config.host}:${config.port}/ready`);
    console.log(`========================================`);
  });

  // Graceful shutdown handling
  async function handleShutdown(signal: string) {
    logger.info(`Received ${signal}. Closing Socket.IO, HTTP server & database gracefully...`);

    io.close(() => {
      logger.info('Socket.IO closed cleanly.');
    });

    server.close(async () => {
      await closeDatabase();
      logger.info('HTTP server and Database closed cleanly. Exiting process.');
      process.exit(0);
    });

    // Force exit after 5 seconds if connections linger
    setTimeout(() => {
      console.error('[SHUTDOWN] Forcefully shutting down after timeout.');
      process.exit(1);
    }, 5000);
  }

  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));
}

bootstrap().catch((err) => {
  console.error('[BOOTSTRAP FATAL ERROR]', err);
  process.exit(1);
});
