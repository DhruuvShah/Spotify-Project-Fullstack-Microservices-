import http from "http";
import app from "./src/app.js";
import connectDB, { closeDB } from "./src/db/db.js";
import initSocketServer from "./src/sockets/socket.server.js";
import logger from "./src/utils/logger.js";

/* ── Catch truly unexpected errors before anything starts ── */
process.on("uncaughtException", (err) => {
  logger.error({ err }, "Uncaught exception — shutting down");
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  const err = reason instanceof Error ? reason : new Error(String(reason));
  logger.error({ err }, "Unhandled rejection — shutting down");
  process.exit(1);
});

const httpServer = http.createServer(app);

/* ── Graceful shutdown ── */
async function shutdown(signal) {
  logger.info({ signal }, "Shutdown signal received");

  httpServer.close(async () => {
    try {
      await closeDB();
      logger.info("Graceful shutdown complete");
      process.exit(0);
    } catch (err) {
      logger.error({ err }, "Error during shutdown");
      process.exit(1);
    }
  });

  // Force-kill if server hasn't closed within 10 s
  setTimeout(() => {
    logger.warn("Forced shutdown after 10 s timeout");
    process.exit(1);
  }, 10_000).unref();
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

/* ── Boot ── */
const PORT = process.env.PORT || 3002;

connectDB();
initSocketServer(httpServer);

httpServer.listen(PORT, () => {
  logger.info({ port: PORT }, "Music service started");
});
