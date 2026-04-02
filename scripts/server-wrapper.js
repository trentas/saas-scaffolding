#!/usr/bin/env node
/**
 * Graceful lifecycle wrapper for Next.js standalone server.
 * Factor 9: Disposability/Graceful Lifecycle.
 *
 * - Captures the HTTP server reference via http.createServer patch
 * - Handles SIGTERM / SIGINT for graceful shutdown
 * - Drains in-flight requests before exiting
 * - Sets globalThis.__gracefulShutdown so the health endpoint can return 503
 *
 * Usage (Dockerfile): CMD ["node", "server-wrapper.js"]
 */

const http = require('http');

const SHUTDOWN_TIMEOUT_MS = 30_000;

// ── Structured log helper (matches lib/debug.ts JSON format) ────────
function log(level, message, extra) {
  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    context: 'lifecycle',
    ...extra,
  };
  process.stdout.write(JSON.stringify(entry) + '\n');
}

// ── Capture HTTP server reference ───────────────────────────────────
let httpServer = null;
const originalCreateServer = http.createServer.bind(http);

http.createServer = function (...args) {
  httpServer = originalCreateServer(...args);
  log('info', 'HTTP server created', { pid: process.pid });
  return httpServer;
};

// ── Signal handlers ─────────────────────────────────────────────────
let isShuttingDown = false;

function handleShutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  // Set global flag so the health endpoint returns 503
  globalThis.__gracefulShutdown = true;

  log('info', `${signal} received — starting graceful shutdown`, {
    timeoutMs: SHUTDOWN_TIMEOUT_MS,
  });

  // Stop accepting new connections
  if (httpServer) {
    httpServer.close(() => {
      log('info', 'All connections drained, exiting');
      process.exit(0);
    });
  }

  // Force exit after timeout (safety net)
  setTimeout(() => {
    log('warn', 'Shutdown timeout reached, forcing exit');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS).unref();
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

// ── Start Next.js standalone server ─────────────────────────────────
log('info', 'Server starting', {
  pid: process.pid,
  nodeVersion: process.version,
});

require('./server.js');
