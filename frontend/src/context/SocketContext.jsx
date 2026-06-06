import { createContext, useContext, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";
import { usePlayer } from "./PlayerContext";
import { MUSIC_URL } from "../config.js";

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user, token } = useAuth();
  const { playTrack, currentTrack } = usePlayer();
  const socketRef = useRef(null);
  const fromSocketRef = useRef(false);
  const lastTrackIdRef = useRef(null);

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

    socket.on("play", ({ track }) => {
      if (track) {
        fromSocketRef.current = true;
        playTrack(track, [track]);
      }
    });

    socket.on("sync", ({ track }) => {
      if (track) {
        fromSocketRef.current = true;
        playTrack(track, [track]);
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user?.id, token, playTrack]);

  // Auto-sync when currentTrack changes locally (e.g., next, prev, auto-play)
  useEffect(() => {
    if (!currentTrack) return;
    
    if (fromSocketRef.current) {
      // Change came from socket, don't echo back
      fromSocketRef.current = false;
      lastTrackIdRef.current = currentTrack.id;
      return;
    }

    // Change came locally, emit if it's a new track
    if (currentTrack.id !== lastTrackIdRef.current) {
      emitPlay(currentTrack);
    }
  }, [currentTrack]);

  function emitPlay(track) {
    if (!socketRef.current) return;
    lastTrackIdRef.current = track?.id;
    socketRef.current.emit("play", { track });
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
