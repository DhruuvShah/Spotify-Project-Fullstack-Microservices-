import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { usePlayer } from "../context/PlayerContext";
import {
  PlayIcon, PauseIcon, PrevIcon, NextIcon,
  ShuffleIcon, RepeatIcon, RepeatOneIcon,
  HeartIcon, MuteIcon, VolLowIcon, VolHighIcon,
  QueueIcon, MusicNoteIcon,
} from "./icons/index.jsx";
import "./BottomPlayer.css";

function fmt(s) {
  if (!s || isNaN(s)) return "0:00";
  const m   = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function QueueTrackCover({ src, alt }) {
  const [err, setErr] = useState(false);
  if (!src || err) {
    return (
      <div className="bp-queue-cover bp-queue-cover--fallback">
        <MusicNoteIcon width={16} height={16} />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className="bp-queue-cover"
      onError={() => setErr(true)}
      loading="lazy"
    />
  );
}

export default function BottomPlayer() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    currentTrack, queue, queueIndex, playing,
    currentTime, duration, volume, muted, likedIds,
    repeat, shuffle,
    togglePlay, next, prev, seek, changeVolume, toggleMute,
    toggleLike, toggleRepeat, toggleShuffle, playTrack,
  } = usePlayer();

  const [showQueue, setShowQueue] = useState(false);
  const [imgErr,    setImgErr]    = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const progressRef = useRef(null);
  const dragging    = useRef(false);

  useEffect(() => { setImgErr(false); }, [currentTrack?.id]);

  // Global keyboard shortcuts — only when no input is focused
  useEffect(() => {
    function onKey(e) {
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (document.activeElement?.isContentEditable) return;
      if (!currentTrack) return;
      switch (e.key) {
        case " ":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowLeft":
          e.preventDefault();
          seek(Math.max(0, currentTime - 5));
          break;
        case "ArrowRight":
          e.preventDefault();
          seek(Math.min(duration || 0, currentTime + 5));
          break;
        case "m":
        case "M":
          toggleMute();
          break;
        case "n":
        case "N":
          next();
          break;
        case "p":
        case "P":
          prev();
          break;
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [currentTrack, currentTime, duration, togglePlay, seek, toggleMute, next, prev]);

  const isOnPlayer = location.pathname.startsWith("/music/");
  if (!currentTrack || isOnPlayer) return null;

  const pct     = duration > 0 ? `${(currentTime / duration) * 100}%` : "0%";
  const isLiked = likedIds.has(currentTrack.id);

  // ── Custom progress bar pointer handlers ─────────────────────
  function computeSeekTime(e) {
    const rect = progressRef.current.getBoundingClientRect();
    const frac = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    return frac * (duration || 0);
  }

  function onProgressDown(e) {
    if (!duration) return;
    dragging.current = true;
    setIsDragging(true);
    progressRef.current.setPointerCapture(e.pointerId);
    seek(computeSeekTime(e));
  }

  function onProgressMove(e) {
    if (!dragging.current || !duration) return;
    seek(computeSeekTime(e));
  }

  function onProgressUp(e) {
    if (!dragging.current) return;
    dragging.current = false;
    setIsDragging(false);
    seek(computeSeekTime(e));
  }

  function goToPlayer() {
    navigate(`/music/${currentTrack.id}`);
    setShowQueue(false);
  }

  return (
    <>
      {/* ── Queue panel — floats above the player ── */}
      {showQueue && (
        <div className="bp-queue-panel" role="complementary" aria-label="Queue">
          <div className="bp-queue-header">
            <span className="bp-queue-title-label">Queue</span>
            <span className="bp-queue-count">
              {queue.length} {queue.length === 1 ? "track" : "tracks"}
            </span>
          </div>
          <div className="bp-queue-list">
            {queue.length === 0 ? (
              <p className="bp-queue-empty">Queue is empty</p>
            ) : (
              queue.map((track, i) => (
                <div
                  key={track.id + "-" + i}
                  className={`bp-queue-item${i === queueIndex ? " active" : ""}`}
                  onClick={() => playTrack(track, queue)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === "Enter") playTrack(track, queue); }}
                >
                  <QueueTrackCover src={track.coverImageUrl} alt={track.title} />
                  <div className="bp-queue-info">
                    <span className="bp-queue-track-name">{track.title}</span>
                    <span className="bp-queue-track-artist">{track.artist}</span>
                  </div>
                  {i === queueIndex && (
                    <span className="bp-queue-dot" aria-label="Now playing" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <div className="bp-root">
        {/* ── Left: cover + info + heart ── */}
        <div className="bp-track">
          <button
            className="bp-cover-btn"
            onClick={goToPlayer}
            aria-label={`Open ${currentTrack.title}`}
          >
            {!imgErr && currentTrack.coverImageUrl ? (
              <img
                src={currentTrack.coverImageUrl}
                alt={currentTrack.title}
                className="bp-cover"
                onError={() => setImgErr(true)}
              />
            ) : (
              <div className="bp-cover bp-cover--fallback">
                <MusicNoteIcon width={22} height={22} />
              </div>
            )}
          </button>

          <div className="bp-info">
            <button className="bp-title" onClick={goToPlayer}>
              {currentTrack.title}
            </button>
            <span className="bp-artist">{currentTrack.artist}</span>
          </div>

          <button
            className={`bp-like-btn${isLiked ? " active" : ""}`}
            onClick={() => toggleLike(currentTrack.id)}
            aria-label={isLiked ? "Unlike" : "Like"}
            aria-pressed={isLiked}
          >
            <HeartIcon filled={isLiked} width={18} height={18} />
          </button>
        </div>

        {/* ── Center: controls + custom progress bar ── */}
        <div className="bp-center">
          <div className="bp-controls">
            <button
              className={`bp-ctrl-btn${shuffle ? " active" : ""}`}
              onClick={toggleShuffle}
              aria-label={shuffle ? "Shuffle on" : "Shuffle off"}
              aria-pressed={shuffle}
            >
              <ShuffleIcon width={15} height={15} />
            </button>

            <button className="bp-ctrl-btn" onClick={prev} aria-label="Previous track">
              <PrevIcon width={18} height={18} />
            </button>

            <button
              className="bp-play-btn"
              onClick={togglePlay}
              aria-label={playing ? "Pause" : "Play"}
            >
              {playing
                ? <PauseIcon width={17} height={17} />
                : <PlayIcon  width={17} height={17} />}
            </button>

            <button className="bp-ctrl-btn" onClick={next} aria-label="Next track">
              <NextIcon width={18} height={18} />
            </button>

            <button
              className={`bp-ctrl-btn${repeat !== "off" ? " active" : ""}`}
              onClick={toggleRepeat}
              aria-label={
                repeat === "off" ? "Repeat off"
                : repeat === "all" ? "Repeat all"
                : "Repeat one"
              }
              aria-pressed={repeat !== "off"}
            >
              {repeat === "one"
                ? <RepeatOneIcon width={15} height={15} />
                : <RepeatIcon    width={15} height={15} />}
            </button>
          </div>

          {/* Custom div-based seek bar */}
          <div className="bp-progress">
            <span className="bp-time">{fmt(currentTime)}</span>

            <div
              ref={progressRef}
              className={`bp-progress-track${isDragging ? " dragging" : ""}`}
              onPointerDown={onProgressDown}
              onPointerMove={onProgressMove}
              onPointerUp={onProgressUp}
              onPointerCancel={onProgressUp}
              role="slider"
              aria-label="Seek"
              aria-valuemin={0}
              aria-valuemax={Math.round(duration || 0)}
              aria-valuenow={Math.round(currentTime)}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "ArrowLeft")  seek(Math.max(0, currentTime - 5));
                if (e.key === "ArrowRight") seek(Math.min(duration || 0, currentTime + 5));
              }}
            >
              <div className="bp-progress-fill"  style={{ width: pct }} />
              <div className="bp-progress-thumb" style={{ left: pct }} />
            </div>

            <span className="bp-time">{fmt(duration)}</span>
          </div>
        </div>

        {/* ── Right: volume (hover reveal) + queue ── */}
        <div className="bp-right">
          <div className="bp-vol-wrap">
            <button
              className="bp-ctrl-btn"
              onClick={toggleMute}
              aria-label={muted ? "Unmute" : "Mute"}
            >
              {muted || volume === 0
                ? <MuteIcon   width={18} height={18} />
                : volume < 0.5
                ? <VolLowIcon width={18} height={18} />
                : <VolHighIcon width={18} height={18} />}
            </button>
            <div className="bp-vol-slider-wrap">
              <input
                type="range"
                className="bp-vol-slider"
                min={0}
                max={1}
                step={0.01}
                value={muted ? 0 : volume}
                onChange={(e) => changeVolume(parseFloat(e.target.value))}
                aria-label="Volume"
                style={{ "--vol-pct": `${(muted ? 0 : volume) * 100}%` }}
              />
            </div>
          </div>

          <button
            className={`bp-ctrl-btn${showQueue ? " active" : ""}`}
            onClick={() => setShowQueue((s) => !s)}
            aria-label={showQueue ? "Hide queue" : "Show queue"}
            aria-pressed={showQueue}
          >
            <QueueIcon width={18} height={18} />
          </button>
        </div>

        {/* Mobile-only compact play/pause — center is hidden on mobile */}
        <button
          className="bp-mobile-play"
          onClick={togglePlay}
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing
            ? <PauseIcon width={14} height={14} />
            : <PlayIcon  width={14} height={14} />}
        </button>
      </div>
    </>
  );
}
