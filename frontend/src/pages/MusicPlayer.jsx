import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./MusicPlayer.css";

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
  const audioRef = useRef(null);
  const seekBarRef = useRef(null);

  const [music, setMusic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [imgErr, setImgErr] = useState(false);

  useEffect(() => {
    axios
      .get(`http://localhost:3002/api/music/get-details/${id}`, {
        withCredentials: true,
      })
      .then((res) => setMusic(res.data.music))
      .catch(() => setError("Track not found."))
      .finally(() => setLoading(false));
  }, [id]);

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play();
      setPlaying(true);
    }
  }

  function handleLoadedMetadata() {
    const audio = audioRef.current;
    setDuration(audio.duration);
    audio.volume = volume;
    audio.playbackRate = speed;
  }

  function handleTimeUpdate() {
    setCurrent(audioRef.current.currentTime);
  }

  function handleEnded() {
    setPlaying(false);
    setCurrent(0);
  }

  function handleSeekClick(e) {
    const bar = seekBarRef.current;
    if (!bar || !duration) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
    const newTime = ratio * duration;
    audioRef.current.currentTime = newTime;
    setCurrent(newTime);
  }

  function handleVolumeChange(e) {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setMuted(val === 0);
    audioRef.current.volume = val;
  }

  function toggleMute() {
    const audio = audioRef.current;
    const next = !muted;
    setMuted(next);
    audio.volume = next ? 0 : volume;
  }

  function changeSpeed(s) {
    setSpeed(s);
    audioRef.current.playbackRate = s;
  }

  function skip(delta) {
    const audio = audioRef.current;
    if (!audio) return;
    const newTime = Math.min(Math.max(0, audio.currentTime + delta), duration);
    audio.currentTime = newTime;
    setCurrent(newTime);
  }

  const pct = duration ? (current / duration) * 100 : 0;
  const volPct = `${(muted ? 0 : volume) * 100}%`;

  if (loading) {
    return (
      <div className="mp-state">
        <div className="mp-spinner" />
        <span>Loading track…</span>
      </div>
    );
  }

  if (error || !music) {
    return (
      <div className="mp-state mp-error">
        <p>{error || "Track not found."}</p>
        <button onClick={() => navigate(-1)}>Go back</button>
      </div>
    );
  }

  return (
    <div className="mp-root">
      <audio
        ref={audioRef}
        src={music.musicUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />

      <div className="mp-card">
        {/* Back */}
        <button className="mp-back-btn" onClick={() => navigate(-1)}>
          <ChevronDownIcon />
        </button>

        {/* Cover */}
        <div className={`mp-cover-wrap ${playing ? "mp-cover-playing" : ""}`}>
          {!imgErr && music.coverImageUrl ? (
            <img
              src={music.coverImageUrl}
              alt={music.title}
              className="mp-cover"
              onError={() => setImgErr(true)}
            />
          ) : (
            <div className="mp-cover mp-cover-fallback">
              <MusicNoteIcon />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="mp-info">
          <h1 className="mp-title">{music.title}</h1>
          <p className="mp-artist">{music.artist}</p>
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
            <span>{fmt(current)}</span>
            <span>{fmt(duration)}</span>
          </div>
        </div>

        {/* Main Controls */}
        <div className="mp-controls">
          <button className="mp-ctrl-btn" onClick={() => skip(-10)} title="Back 10s">
            <Replay10Icon />
          </button>
          <button className="mp-play-btn" onClick={togglePlay}>
            {playing ? <PauseIcon /> : <PlayIcon />}
          </button>
          <button className="mp-ctrl-btn" onClick={() => skip(10)} title="Forward 10s">
            <Forward10Icon />
          </button>
        </div>

        {/* Volume */}
        <div className="mp-volume-row">
          <button className="mp-vol-icon-btn" onClick={toggleMute} title={muted ? "Unmute" : "Mute"}>
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

/* ── Icons ──────────────────────────────────────────────────── */
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

function Replay10Icon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
      <text x="12" y="15.5" textAnchor="middle" fontSize="5.5" fontFamily="sans-serif" fontWeight="700" fill="currentColor">10</text>
    </svg>
  );
}

function Forward10Icon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z" />
      <text x="12" y="15.5" textAnchor="middle" fontSize="5.5" fontFamily="sans-serif" fontWeight="700" fill="currentColor">10</text>
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
