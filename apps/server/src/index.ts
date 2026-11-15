import http from 'http';
import { createApp } from './app.js';
import { config } from './config/index.js';

const app = createApp();
const server = http.createServer(app);

server.listen(config.port, () => {
  console.log(`========================================`);
  console.log(`  Bhabhi Thulla Server (Phase 1)`);
  console.log(`  Environment: ${config.nodeEnv}`);
  console.log(`  Listening on: http://localhost:${config.port}`);
  console.log(`  Health check: http://localhost:${config.port}/api/health`);
  console.log(`========================================`);
});

// Graceful shutdown handling
function handleShutdown(signal: string) {
  console.log(`\n[SHUTDOWN] Received ${signal}. Closing HTTP server gracefully...`);
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
