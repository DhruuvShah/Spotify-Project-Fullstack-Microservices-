import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { usePlayer } from "../context/PlayerContext";
import "./MusicPlayer.css";
import { MUSIC_URL } from "../config.js";

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

function fmt(s) {
  if (!s || isNaN(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function MusicPlayer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const seekBarRef = useRef(null);

  const {
    currentTrack,
    playing,
    currentTime,
    duration,
    volume,
    muted,
    likedIds,
    audioRef,
    togglePlay,
    next,
    prev,
    seek,
    changeVolume,
    toggleMute,
    toggleLike,
    playTrack,
  } = usePlayer();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [imgErr, setImgErr] = useState(false);
  const [speed, setSpeed] = useState(1);

  // Reset image error and speed when track changes
  useEffect(() => {
    setImgErr(false);
    setSpeed(1);
  }, [id]);

  // If this track isn't already loaded in the player, fetch and start it
  useEffect(() => {
    if (currentTrack?.id === id) return;
    setLoading(true);
    setError("");
    axios
      .get(`${MUSIC_URL}/api/music/get-details/${id}`, {
        withCredentials: true,
      })
      .then((res) => playTrack(res.data.music))
      .catch(() => setError("Track not found."))
      .finally(() => setLoading(false));
  }, [id]);

  function changeSpeed(s) {
    setSpeed(s);
    if (audioRef.current) audioRef.current.playbackRate = s;
  }

  function handleSeekClick(e) {
    const bar = seekBarRef.current;
    if (!bar || !duration) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
    seek(ratio * duration);
  }

  function handleVolumeChange(e) {
    changeVolume(parseFloat(e.target.value));
  }

  const track = currentTrack;
  const pct = duration ? (currentTime / duration) * 100 : 0;
  const volPct = `${(muted ? 0 : volume) * 100}%`;
  const isLiked = track ? likedIds.has(track.id) : false;

  if (loading) {
    return (
      <div className="mp-state">
        <div className="mp-spinner" />
        <span>Loading track…</span>
      </div>
    );
  }

  if (error || !track) {
    return (
      <div className="mp-state mp-error">
        <p>{error || "Track not found."}</p>
        <button onClick={() => navigate(-1)}>Go back</button>
      </div>
    );
  }

  return (
    <div className="mp-root">
      <div className="mp-card">
        {/* Back */}
        <button className="mp-back-btn" onClick={() => navigate(-1)}>
          <ChevronDownIcon />
        </button>

        {/* Cover */}
        <div className={`mp-cover-wrap ${playing ? "mp-cover-playing" : ""}`}>
          {!imgErr && track.coverImageUrl ? (
            <img
              src={track.coverImageUrl}
              alt={track.title}
              className="mp-cover"
              onError={() => setImgErr(true)}
            />
          ) : (
            <div className="mp-cover mp-cover-fallback">
              <MusicNoteIcon />
            </div>
          )}
        </div>

        {/* Info + like */}
        <div className="mp-info">
          <div className="mp-info-text">
            <h1 className="mp-title">{track.title}</h1>
            <p className="mp-artist">{track.artist}</p>
          </div>
          <button
            className={`mp-like-btn${isLiked ? " liked" : ""}`}
            onClick={() => toggleLike(track.id)}
            title={isLiked ? "Unlike" : "Like"}
          >
            <HeartIcon filled={isLiked} />
          </button>
        </div>

        {/* Seek Bar */}
        <div className="mp-seek-wrap">
          <div
            className="mp-seek-bar"
            ref={seekBarRef}
            onClick={handleSeekClick}
          >
            <div className="mp-seek-track">
              <div className="mp-seek-fill" style={{ width: `${pct}%` }} />
            </div>
            <div className="mp-seek-thumb" style={{ left: `${pct}%` }} />
          </div>
          <div className="mp-time-row">
            <span>{fmt(currentTime)}</span>
            <span>{fmt(duration)}</span>
          </div>
        </div>

        {/* Main Controls */}
        <div className="mp-controls">
          <button className="mp-ctrl-btn" onClick={prev} title="Previous">
            <PrevIcon />
          </button>
          <button className="mp-play-btn" onClick={togglePlay}>
            {playing ? <PauseIcon /> : <PlayIcon />}
          </button>
          <button className="mp-ctrl-btn" onClick={next} title="Next">
            <NextIcon />
          </button>
        </div>

        {/* Volume */}
        <div className="mp-volume-row">
          <button
            className="mp-vol-icon-btn"
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
            className="mp-vol-slider"
            min={0}
            max={1}
            step={0.01}
            value={muted ? 0 : volume}
            onChange={handleVolumeChange}
            style={{ "--vol-pct": volPct }}
          />
        </div>

        {/* Speed */}
        <div className="mp-speed-row">
          <span className="mp-speed-label">Speed</span>
          <div className="mp-speed-chips">
            {SPEEDS.map((s) => (
              <button
                key={s}
                className={`mp-speed-chip ${speed === s ? "active" : ""}`}
                onClick={() => changeSpeed(s)}
              >
                {s}×
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
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
      <polygon points="6 3 20 12 6 21 6 3" />
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
function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
