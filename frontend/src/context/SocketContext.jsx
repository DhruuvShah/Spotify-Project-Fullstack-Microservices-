import { createContext, useContext, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";
import { usePlayer } from "./PlayerContext";
import { MUSIC_URL } from "../config.js";

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user, token } = useAuth();
  const { playTrack } = usePlayer();
  const socketRef = useRef(null);

  useEffect(() => {
    if (!user || !token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const socket = io(MUSIC_URL, {
      transports: ["websocket", "polling"],
      withCredentials: true,
      auth: { token },
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[LUMINA] connected | socketId:", socket.id, "| userId:", user?.id);
    });

    socket.on("disconnect", (reason) => {
      console.warn("[LUMINA] disconnected | reason:", reason);
    });

    socket.on("play", ({ track }) => {
      console.log("[LUMINA] play received | trackId:", track?.id);
      if (track) playTrack(track, [track]);
    });

    socket.on("sync", ({ track }) => {
      console.log("[LUMINA] sync received | trackId:", track?.id);
      if (track) playTrack(track, [track]);
    });

    socket.on("connect_error", (err) => {
      console.error("[LUMINA] connect_error:", err.message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user?.id, token]);

  function emitPlay(track) {
    if (!socketRef.current) {
      console.warn("[LUMINA] emitPlay: no socket");
      return;
    }
    console.log("[LUMINA] emitPlay | trackId:", track?.id, "| connected:", socketRef.current.connected);
    socketRef.current.emit("play", { track }, (ack) => {
      console.log("[LUMINA] server ack:", JSON.stringify(ack));
    });
  }

  return (
    <SocketContext.Provider value={{ emitPlay }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
