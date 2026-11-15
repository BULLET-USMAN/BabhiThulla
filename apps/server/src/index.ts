import http from 'http';
import { createApp } from './app.js';
import { config } from './config/index.js';
import { setupSocketServer } from './socket/index.js';

const app = createApp();
const server = http.createServer(app);

// Attach Socket.IO server to HTTP server
const io = setupSocketServer(server);

server.listen(config.port, () => {
  console.log(`========================================`);
  console.log(`  Bhabhi Thulla Multiplayer Server (Phase 3)`);
  console.log(`  Environment: ${config.nodeEnv}`);
  console.log(`  Listening on: http://localhost:${config.port}`);
  console.log(`  Health check: http://localhost:${config.port}/api/health`);
  console.log(`========================================`);
});

// Graceful shutdown handling
function handleShutdown(signal: string) {
  console.log(`\n[SHUTDOWN] Received ${signal}. Closing Socket.IO & HTTP server gracefully...`);

  io.close(() => {
    console.log('[SHUTDOWN] Socket.IO closed cleanly.');
  });

  server.close(() => {
    console.log('[SHUTDOWN] HTTP server closed cleanly. Exiting process.');
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
