import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import { randomUUID } from "crypto";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";
import logger from "./utils/logger.js";
import { errorHandler } from "./middlewares/errorHandler.middleware.js";
import musicRoutes from "./routes/music.routes.js";
import playlistRoutes from "./routes/playlist.routes.js";
import albumRoutes from "./routes/album.routes.js";
import userPlaylistRoutes from "./routes/userPlaylist.routes.js";
import likeRoutes from "./routes/like.routes.js";
import historyRoutes from "./routes/history.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";

const app = express();

// Render (and most cloud platforms) sit behind a reverse proxy; without this
// Express reads the proxy's IP for every request — all users share one rate-limit
// bucket and hit 429 almost immediately.
app.set("trust proxy", 1);

/* ── Security headers ── */
app.use(helmet());

/* ── Request logging + request-ID ── */
app.use(pinoHttp({ logger, genReqId: () => randomUUID() }));

/* ── CORS ── */
app.use(
  cors({
    origin: (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, ""),
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());

/* ── Rate limiting ── */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  // Health checks fire on every page load; they must never consume quota.
  skip: (req) => req.path === "/health",
  message: { message: "Too many requests, please try again later." },
});

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Upload limit reached, please try again later." },
});

if (process.env.NODE_ENV !== "test") {
  app.use(globalLimiter);
  app.use("/api/music/upload", uploadLimiter);
}

/* ── Root + Health ── */
app.get("/", (req, res) => res.status(200).json({ service: "music", status: "ok" }));
app.get("/health", (req, res) => {
  const dbReady = mongoose.connection.readyState === 1;
  return res
    .status(dbReady ? 200 : 503)
    .json({ status: dbReady ? "ok" : "degraded", reqId: req.id });
});

/* ── Routes ── */
app.use("/api/music", musicRoutes);
app.use("/api/music", playlistRoutes);
app.use("/api/music", albumRoutes);
app.use("/api/music", userPlaylistRoutes);
app.use("/api/music", likeRoutes);
app.use("/api/music", historyRoutes);
app.use("/api/music", analyticsRoutes);

/* ── Error handler ── */
app.use(errorHandler);

export default app;
