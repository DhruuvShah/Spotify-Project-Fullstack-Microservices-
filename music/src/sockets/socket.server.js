import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import config from "../config/config.js";
import cookie from "cookie";
import logger from "../utils/logger.js";

// Per-user "now playing" state for reconnect sync
const nowPlaying = new Map();

// Per-socket fixed-window rate limiter: max 10 play events per 5 s
const eventWindows = new Map();

function isRateLimited(socketId) {
  const now = Date.now();
  const win = eventWindows.get(socketId) ?? { count: 0, start: now };

  if (now - win.start > 5000) {
    eventWindows.set(socketId, { count: 1, start: now });
    return false;
  }

  if (win.count >= 10) return true;

  win.count++;
  eventWindows.set(socketId, win);
  return false;
}

function validatePlayPayload(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;
  const { track } = data;
  if (!track || typeof track !== "object" || Array.isArray(track)) return null;
  return { track };
}

function initSocketServer(httpServer) {
  const io = new Server(httpServer, {
    maxHttpBufferSize: 1e4,
    cors: {
      origin: (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, ""),
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const cookies = cookie.parse(socket.handshake.headers.cookie || "");
    // Bearer token from auth handshake (cross-origin production), cookie fallback (local dev)
    const token = socket.handshake.auth?.token || cookies.token;

    if (!token)
      return next(new Error("Authentication error: No token provided"));

    try {
      const decoded = jwt.verify(token, config.JWT_SECRET);
      socket.user = { id: decoded.id, role: decoded.role };
      next();
    } catch {
      return next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const { id: userId, role } = socket.user;
    logger.info({ userId, role }, "Socket connected");

    socket.join(userId);

    // Sync current state to newly connected / reconnected device
    const current = nowPlaying.get(userId);
    if (current) socket.emit("sync", current);

    socket.on("play", (data, ack) => {
      if (isRateLimited(socket.id)) {
        if (typeof ack === "function") ack({ status: "rate-limited" });
        return;
      }

      const payload = validatePlayPayload(data);
      if (!payload) {
        if (typeof ack === "function") ack({ status: "rejected" });
        return;
      }

      nowPlaying.set(userId, payload);
      socket.broadcast.to(userId).emit("play", payload);

      const roomSize = io.sockets.adapter.rooms.get(userId)?.size ?? 0;
      logger.info({ userId, roomSize }, "play broadcast");
      if (typeof ack === "function") ack({ status: "ok", roomSize, userId });
    });

    socket.on("error", (err) => {
      logger.error({ userId, err }, "Socket error");
    });

    socket.on("disconnect", () => {
      eventWindows.delete(socket.id);

      // Only clear stored state when the user's last device leaves
      const roomSize = io.sockets.adapter.rooms.get(userId)?.size ?? 0;
      if (roomSize === 0) nowPlaying.delete(userId);

      logger.info({ userId, role }, "Socket disconnected");
    });
  });
}

export default initSocketServer;
