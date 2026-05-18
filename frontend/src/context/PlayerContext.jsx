import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";

const PlayerContext = createContext(null);

function normalize(t) {
  return {
    id: String(t.id ?? t._id),
    title: t.title,
    artist: t.artist,
    coverImageUrl: t.coverImageUrl ?? "",
    musicUrl: t.musicUrl,
  };
}

export function PlayerProvider({ children }) {
  const { user } = useAuth();
  const audioRef = useRef(null);

  // Use refs for queue/index so callbacks always see the latest values without stale closures
  const queueRef = useRef([]);
  const queueIdxRef = useRef(0);

  const [currentTrack, setCurrentTrack] = useState(null);
  const [queue, setQueue] = useState([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [likedIds, setLikedIds] = useState(new Set());

  function syncQueue(q) {
    queueRef.current = q;
    setQueue(q);
  }

  function syncQueueIndex(idx) {
    queueIdxRef.current = idx;
    setQueueIndex(idx);
  }

  // Load liked IDs on login, clear on logout
  useEffect(() => {
    if (!user) {
      setLikedIds(new Set());
      setCurrentTrack(null);
      syncQueue([]);
      setPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      return;
    }
    axios
      .get("http://localhost:3002/api/music/likes", { withCredentials: true })
      .then((res) => setLikedIds(new Set(res.data.likedIds)))
      .catch(() => {});
  }, [user?.id]);

  const playTrack = useCallback((track, allTracks = []) => {
    const norm = normalize(track);
    const normAll = allTracks.length > 0 ? allTracks.map(normalize) : [norm];
    const idx = normAll.findIndex((t) => t.id === norm.id);
    const finalIdx = idx >= 0 ? idx : 0;

    setCurrentTrack(norm);
    syncQueue(normAll);
    syncQueueIndex(finalIdx);
    setCurrentTime(0);
    setDuration(0);
    setPlaying(true);
  }, []);

  function jumpTo(track, idx) {
    setCurrentTrack(track);
    syncQueueIndex(idx);
    setCurrentTime(0);
    setDuration(0);
    setPlaying(true);
  }

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play();
    } else {
      audio.pause();
    }
  }, []);

  const next = useCallback(() => {
    const q = queueRef.current;
    if (!q.length) return;
    const nextIdx = queueIdxRef.current + 1 < q.length ? queueIdxRef.current + 1 : 0;
    jumpTo(q[nextIdx], nextIdx);
  }, []);

  const prev = useCallback(() => {
    const audio = audioRef.current;
    // If more than 3s in, restart; otherwise go to previous
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      setCurrentTime(0);
      return;
    }
    const q = queueRef.current;
    if (!q.length) return;
    const prevIdx = queueIdxRef.current - 1 >= 0 ? queueIdxRef.current - 1 : q.length - 1;
    jumpTo(q[prevIdx], prevIdx);
  }, []);

  const seek = useCallback((time) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = time;
    setCurrentTime(time);
  }, []);

  const changeVolume = useCallback((val) => {
    setVolume(val);
    setMuted(val === 0);
    if (audioRef.current) audioRef.current.volume = val;
  }, []);

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    setMuted((m) => {
      const next = !m;
      audio.volume = next ? 0 : volume;
      return next;
    });
  }, [volume]);

  const toggleLike = useCallback(
    async (id) => {
      const isLiked = likedIds.has(id);
      // Optimistic update
      setLikedIds((prev) => {
        const next = new Set(prev);
        if (isLiked) next.delete(id);
        else next.add(id);
        return next;
      });
      try {
        if (isLiked) {
          await axios.delete(`http://localhost:3002/api/music/like/${id}`, {
            withCredentials: true,
          });
        } else {
          await axios.post(
            `http://localhost:3002/api/music/like/${id}`,
            {},
            { withCredentials: true }
          );
        }
      } catch {
        // Revert on error
        setLikedIds((prev) => {
          const next = new Set(prev);
          if (isLiked) next.add(id);
          else next.delete(id);
          return next;
        });
      }
    },
    [likedIds]
  );

  const addToQueue = useCallback((track) => {
    syncQueue([...queueRef.current, normalize(track)]);
  }, []);

  // Audio event handlers
  function handleTimeUpdate() {
    if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
  }

  function handleLoadedMetadata() {
    const audio = audioRef.current;
    if (!audio) return;
    setDuration(audio.duration);
    audio.volume = muted ? 0 : volume;
    audio.play().catch(() => {});
  }

  function handleEnded() {
    const q = queueRef.current;
    const qi = queueIdxRef.current;
    const nextIdx = qi + 1 < q.length ? qi + 1 : null;
    if (nextIdx === null) {
      setPlaying(false);
    } else {
      jumpTo(q[nextIdx], nextIdx);
    }
  }

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        queue,
        queueIndex,
        playing,
        currentTime,
        duration,
        volume,
        muted,
        likedIds,
        audioRef,
        playTrack,
        togglePlay,
        next,
        prev,
        seek,
        changeVolume,
        toggleMute,
        toggleLike,
        addToQueue,
      }}
    >
      {children}
      {currentTrack && (
        <audio
          key={currentTrack.id}
          ref={audioRef}
          src={currentTrack.musicUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
          onPause={() => setPlaying(false)}
          onPlay={() => setPlaying(true)}
        />
      )}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  return useContext(PlayerContext);
}
