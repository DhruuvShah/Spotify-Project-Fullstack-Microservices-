import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";
import { MUSIC_URL } from "../config.js";

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

  // Refs so callbacks always see latest values without stale closures
  const queueRef    = useRef([]);
  const queueIdxRef = useRef(0);
  const repeatRef   = useRef("off");
  const shuffleRef  = useRef(false);

  const [currentTrack, setCurrentTrack] = useState(null);
  const [queue,        setQueue]         = useState([]);
  const [queueIndex,   setQueueIndex]    = useState(0);
  const [playing,      setPlaying]       = useState(false);
  const [currentTime,  setCurrentTime]   = useState(0);
  const [duration,     setDuration]      = useState(0);
  const [volume,       setVolume]        = useState(1);
  const [muted,        setMuted]         = useState(false);
  const [likedIds,     setLikedIds]      = useState(new Set());
  const [repeat,       setRepeat]        = useState("off"); // "off" | "all" | "one"
  const [shuffle,      setShuffle]       = useState(false);

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
      .get(`${MUSIC_URL}/api/music/likes`, { withCredentials: true })
      .then((res) => setLikedIds(new Set(res.data.likedIds)))
      .catch(() => {});
  }, [user?.id]);

  const playTrack = useCallback((track, allTracks = []) => {
    const norm    = normalize(track);
    const normAll = allTracks.length > 0 ? allTracks.map(normalize) : [norm];
    const idx     = normAll.findIndex((t) => t.id === norm.id);
    const finalIdx = idx >= 0 ? idx : 0;

    setCurrentTrack(norm);
    syncQueue(normAll);
    syncQueueIndex(finalIdx);
    setCurrentTime(0);
    setDuration(0);
    setPlaying(true);

    axios
      .post(`${MUSIC_URL}/api/music/history/${norm.id}`, {}, { withCredentials: true })
      .catch(() => {});
  }, []);

  function jumpTo(track, idx) {
    setCurrentTrack(track);
    syncQueueIndex(idx);
    setCurrentTime(0);
    setDuration(0);
    setPlaying(true);
  }

  function pickNextIdx() {
    const q = queueRef.current;
    if (!q.length) return null;
    if (shuffleRef.current && q.length > 1) {
      const options = q.map((_, i) => i).filter((i) => i !== queueIdxRef.current);
      return options[Math.floor(Math.random() * options.length)];
    }
    const n = queueIdxRef.current + 1;
    return n < q.length ? n : 0;
  }

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) audio.play();
    else audio.pause();
  }, []);

  const next = useCallback(() => {
    const q = queueRef.current;
    if (!q.length) return;
    const idx = pickNextIdx();
    if (idx !== null) jumpTo(q[idx], idx);
  }, []);

  const prev = useCallback(() => {
    const audio = audioRef.current;
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

  const toggleRepeat = useCallback(() => {
    setRepeat((r) => {
      const next = r === "off" ? "all" : r === "all" ? "one" : "off";
      repeatRef.current = next;
      return next;
    });
  }, []);

  const toggleShuffle = useCallback(() => {
    setShuffle((s) => {
      shuffleRef.current = !s;
      return !s;
    });
  }, []);

  const toggleLike = useCallback(
    async (id) => {
      const isLiked = likedIds.has(id);
      setLikedIds((prev) => {
        const next = new Set(prev);
        if (isLiked) next.delete(id);
        else next.add(id);
        return next;
      });
      try {
        if (isLiked) {
          await axios.delete(`${MUSIC_URL}/api/music/like/${id}`, { withCredentials: true });
        } else {
          await axios.post(`${MUSIC_URL}/api/music/like/${id}`, {}, { withCredentials: true });
        }
      } catch {
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

  function handleTimeUpdate() {
    if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
  }

  function handleLoadedMetadata() {
    const audio = audioRef.current;
    if (!audio) return;
    setDuration(audio.duration);
    audio.volume = muted ? 0 : volume;
    audio.play().catch(() => {
      // Autoplay blocked by browser (no user gesture) — show paused state
      setPlaying(false);
    });
  }

  function handleEnded() {
    const q  = queueRef.current;
    const qi = queueIdxRef.current;

    if (repeatRef.current === "one") {
      const audio = audioRef.current;
      if (audio) { audio.currentTime = 0; audio.play().catch(() => {}); }
      return;
    }

    if (shuffleRef.current && q.length > 1) {
      const options  = q.map((_, i) => i).filter((i) => i !== qi);
      const nextIdx  = options[Math.floor(Math.random() * options.length)];
      jumpTo(q[nextIdx], nextIdx);
      return;
    }

    const nextIdx = qi + 1 < q.length ? qi + 1 : null;
    if (nextIdx !== null) {
      jumpTo(q[nextIdx], nextIdx);
    } else if (repeatRef.current === "all") {
      jumpTo(q[0], 0);
    } else {
      setPlaying(false);
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
        repeat,
        shuffle,
        audioRef,
        playTrack,
        togglePlay,
        next,
        prev,
        seek,
        changeVolume,
        toggleMute,
        toggleRepeat,
        toggleShuffle,
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
