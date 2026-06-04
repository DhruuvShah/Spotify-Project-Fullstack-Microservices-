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
      transports: ["polling"],
      withCredentials: true,
      auth: { token },
    });
    socketRef.current = socket;

    socket.on("play", ({ track }) => {
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
