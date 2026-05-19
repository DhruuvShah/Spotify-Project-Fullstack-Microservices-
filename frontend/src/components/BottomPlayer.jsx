import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { usePlayer } from "../context/PlayerContext";
import "./BottomPlayer.css";

function fmt(s) {
  if (!s || isNaN(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function QueueCover({ src, alt }) {
  const [err, setErr] = useState(false);
  if (!src || err) {
    return (
      <div className="bp-queue-cover bp-queue-cover-fallback">
        <MusicNoteIcon />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className="bp-queue-cover"
      onError={() => setErr(true)}
    />
  );
}

export default function BottomPlayer() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    currentTrack,
    queue,
    queueIndex,
    playing,
    currentTime,
    duration,
    volume,
    muted,
    likedIds,
    togglePlay,
    next,
    prev,
    seek,
    changeVolume,
    toggleMute,
    toggleLike,
    playTrack,
  } = usePlayer();

  const [showQueue, setShowQueue] = useState(false);
  const [imgErr, setImgErr] = useState(false);

  useEffect(() => {
    setImgErr(false);
  }, [currentTrack?.id]);

  // Hide on the full-screen player page (it has its own controls)
  const isOnPlayer = location.pathname.startsWith("/music/");
  if (!currentTrack || isOnPlayer) return null;

  const pct = duration ? `${(currentTime / duration) * 100}%` : "0%";
  const volPct = `${(muted ? 0 : volume) * 100}%`;
  const isLiked = likedIds.has(currentTrack.id);

  function goToPlayer() {
    navigate(`/music/${currentTrack.id}`);
    setShowQueue(false);
  }

  return (
    <>
      {showQueue && (
        <div className="bp-queue-panel">
          <div className="bp-queue-header">
            Queue &mdash; {queue.length} {queue.length === 1 ? "track" : "tracks"}
          </div>
          <div className="bp-queue-list">
            {queue.length === 0 ? (
              <p className="bp-queue-empty">Queue is empty</p>
            ) : (
              queue.map((track, i) => (
                <div
                  key={track.id + "-" + i}
                  className={`bp-queue-item ${i === queueIndex ? "active" : ""}`}
                  onClick={() => playTrack(track, queue)}
                >
                  <QueueCover src={track.coverImageUrl} alt={track.title} />
                  <div className="bp-queue-info">
                    <span className="bp-queue-title">{track.title}</span>
                    <span className="bp-queue-artist">{track.artist}</span>
                  </div>
                  {i === queueIndex && (
                    <span className="bp-queue-playing-dot" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <div className="bp-root">
        {/* ── Left: track info ── */}
        <div className="bp-track">
          {!imgErr && currentTrack.coverImageUrl ? (
            <img
              src={currentTrack.coverImageUrl}
              alt={currentTrack.title}
              className="bp-cover"
              onClick={goToPlayer}
              onError={() => setImgErr(true)}
            />
          ) : (
            <div className="bp-cover bp-cover-fallback" onClick={goToPlayer}>
              <MusicNoteIcon />
            </div>
          )}
          <div className="bp-info">
            <span className="bp-title" onClick={goToPlayer}>
              {currentTrack.title}
            </span>
            <span className="bp-artist">{currentTrack.artist}</span>
          </div>
          <button
            className={`bp-like-btn${isLiked ? " liked" : ""}`}
            onClick={() => toggleLike(currentTrack.id)}
            title={isLiked ? "Unlike" : "Like"}
          >
            <HeartIcon filled={isLiked} />
          </button>
          {/* Mobile-only compact play/pause — bp-center is hidden on mobile */}
          <button
            className="bp-mobile-play"
            onClick={togglePlay}
            title={playing ? "Pause" : "Play"}
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? <PauseIcon /> : <PlayIcon />}
          </button>
        </div>

        {/* ── Center: controls + seek ── */}
        <div className="bp-center">
          <div className="bp-controls">
            <button className="bp-ctrl-btn" onClick={prev} title="Previous">
              <PrevIcon />
            </button>
            <button className="bp-play-btn" onClick={togglePlay} title={playing ? "Pause" : "Play"}>
              {playing ? <PauseIcon /> : <PlayIcon />}
            </button>
            <button className="bp-ctrl-btn" onClick={next} title="Next">
              <NextIcon />
            </button>
          </div>
          <div className="bp-progress">
            <span className="bp-time">{fmt(currentTime)}</span>
            <input
              type="range"
              className="bp-seek"
              min={0}
              max={duration || 1}
              step={0.5}
              value={currentTime}
              onChange={(e) => seek(parseFloat(e.target.value))}
              style={{ "--pct": pct }}
            />
            <span className="bp-time bp-time-right">{fmt(duration)}</span>
          </div>
        </div>

        {/* ── Right: volume + queue ── */}
        <div className="bp-right">
          <button
            className="bp-vol-btn"
            onClick={toggleMute}
            title={muted ? "Unmute" : "Mute"}
          >
            {muted || volume === 0 ? (
              <MuteIcon />
            ) : volume < 0.5 ? (
              <VolLowIcon />
            ) : (
              <VolHighIcon />
            )}
          </button>
          <input
            type="range"
            className="bp-vol-slider"
            min={0}
            max={1}
            step={0.01}
            value={muted ? 0 : volume}
            onChange={(e) => changeVolume(parseFloat(e.target.value))}
            style={{ "--vol-pct": volPct }}
          />
          <button
            className={`bp-queue-btn${showQueue ? " active" : ""}`}
            onClick={() => setShowQueue((s) => !s)}
            title="Queue"
          >
            <QueueIcon />
          </button>
        </div>
      </div>
    </>
  );
}

/* ── Icons ── */
function HeartIcon({ filled }) {
  return filled ? (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}
function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}
function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <rect x="5" y="4" width="4" height="16" rx="1" />
      <rect x="15" y="4" width="4" height="16" rx="1" />
    </svg>
  );
}
function PrevIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <polygon points="19 20 9 12 19 4 19 20" />
      <line x1="5" y1="19" x2="5" y2="5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function NextIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5 4 15 12 5 20 5 4" />
      <line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function VolHighIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}
function VolLowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}
function MuteIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <line x1="23" y1="9" x2="17" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="17" y1="9" x2="23" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function MusicNoteIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}
function QueueIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}
