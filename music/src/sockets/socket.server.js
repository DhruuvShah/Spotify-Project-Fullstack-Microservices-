import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import config from "../config/config.js";
import cookie from "cookie";

function initSocketServer(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const cookies = cookie.parse(socket.handshake.headers.cookie || "");
    const token = cookies.token;

    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }

    try {
      const decoded = jwt.verify(token, config.JWT_SECRET);
      // Store only what's needed — never log the full payload
      socket.user = { id: decoded.id, role: decoded.role };
      next();
    } catch {
      return next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`Socket connected: userId=${socket.user.id} role=${socket.user.role}`);
    socket.join(socket.user.id);

    socket.on("play", (data) => {
      if (!data || typeof data !== "object") return;
      // Relay full track payload to all other devices for this user
      socket.broadcast.to(socket.user.id).emit("play", data);
    });

    socket.on("error", (err) => {
      console.error(`Socket error userId=${socket.user?.id}:`, err.message);
    });

    socket.on("disconnect", () => {
      socket.leave(socket.user.id);
    });
  });
}

export default initSocketServer;
