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
      console.log("[LUMINA] socket connected, id:", socket.id);
    });

    socket.on("play", ({ track }) => {
      console.log("[LUMINA] play received, track:", track?.id);
      if (track) playTrack(track, [track]);
    });

    // Fired when reconnecting to an already-playing session (server sends last known state)
    socket.on("sync", ({ track }) => {
      console.log("[LUMINA] sync received, track:", track?.id);
      if (track) playTrack(track, [track]);
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err.message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user?.id, token]);

  function emitPlay(track) {
    console.log("[LUMINA] emitPlay, socket:", !!socketRef.current, "track:", track?.id);
    socketRef.current?.emit("play", { track });
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
