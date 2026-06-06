import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Heart, Play, Pause, SkipBack, SkipForward,
  Shuffle, Repeat, Repeat1,
  Volume2, Volume1, VolumeX,
  Music, ChevronDown,
} from "lucide-react";
import { usePlayer } from "../context/PlayerContext";
import AddToPlaylistBtn from "../components/AddToPlaylistBtn";
import "./MusicPlayer.css";
import { MUSIC_URL } from "../config.js";

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

function fmt(s) {
  if (!s || isNaN(s)) return "0:00";
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
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
    repeat,
    shuffle,
    audioRef,
    togglePlay,
    next,
    prev,
    seek,
    changeVolume,
    toggleMute,
    toggleRepeat,
    toggleShuffle,
    toggleLike,
    playTrack,
  } = usePlayer();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [imgErr, setImgErr] = useState(false);
  const [speed, setSpeed] = useState(1);

  useEffect(() => {
    setImgErr(false);
    setSpeed(1);
  }, [id]);

  useEffect(() => {
    if (currentTrack?.id === id) return;
    setLoading(true);
    setError("");
    axios
      .get(`${MUSIC_URL}/api/music/get-details/${id}`, { withCredentials: true })
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
        <button className="mp-back-btn" onClick={() => navigate(-1)} aria-label="Go back">
          <ChevronDownIcon />
        </button>

        {/* Cover art */}
        <div className={`mp-cover-wrap${playing ? " mp-cover-playing" : ""}`}>
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
          <div className="mp-info-actions">
            <AddToPlaylistBtn musicId={track.id ?? track._id} />
            <button
              className={`mp-like-btn${isLiked ? " liked" : ""}`}
              onClick={() => toggleLike(track.id)}
              aria-label={isLiked ? "Unlike" : "Like"}
            >
              <HeartIcon filled={isLiked} />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mp-seek-wrap">
          <div className="mp-seek-bar" ref={seekBarRef} onClick={handleSeekClick}>
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

        {/* Controls: Shuffle Prev Play Next Repeat */}
        <div className="mp-controls">
          <button
            className={`mp-ctrl-btn mp-secondary-btn${shuffle ? " active" : ""}`}
            onClick={toggleShuffle}
            aria-label="Shuffle"
            title="Shuffle"
          >
            <ShuffleIcon />
          </button>
          <button
            className="mp-ctrl-btn mp-skip-btn"
            onClick={prev}
            aria-label="Previous"
            title="Previous"
          >
            <PrevIcon />
          </button>
          <button className="mp-play-btn" onClick={togglePlay} aria-label={playing ? "Pause" : "Play"}>
            {playing ? <PauseIcon /> : <PlayIcon />}
          </button>
          <button
            className="mp-ctrl-btn mp-skip-btn"
            onClick={next}
            aria-label="Next"
            title="Next"
          >
            <NextIcon />
          </button>
          <button
            className={`mp-ctrl-btn mp-secondary-btn${repeat !== "off" ? " active" : ""}`}
            onClick={toggleRepeat}
            aria-label="Repeat"
            title="Repeat"
          >
            {repeat === "one" ? <RepeatOneIcon /> : <RepeatIcon />}
          </button>
        </div>

        {/* Volume */}
        <div className="mp-volume-row">
          <button
            className="mp-vol-icon-btn"
            onClick={toggleMute}
            aria-label={muted ? "Unmute" : "Mute"}
          >
            {muted || volume === 0 ? <MuteIcon /> : volume < 0.5 ? <VolLowIcon /> : <VolHighIcon />}
          </button>
          <input
            type="range"
            className="mp-vol-slider"
            min={0}
            max={1}
            step={0.01}
            value={muted ? 0 : volume}
            onChange={(e) => changeVolume(parseFloat(e.target.value))}
            style={{ "--vol-pct": volPct }}
            aria-label="Volume"
          />
        </div>

        {/* Speed */}
        <div className="mp-speed-row">
          <span className="mp-speed-label">Speed</span>
          <div className="mp-speed-chips">
            {SPEEDS.map((s) => (
              <button
                key={s}
                className={`mp-speed-chip${speed === s ? " active" : ""}`}
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

/* ── Icons — resolved via lucide-react imports at top ── */
function HeartIcon({ filled }) {
  return <Heart fill={filled ? "currentColor" : "none"} aria-hidden="true" />;
}
function PlayIcon()      { return <Play      aria-hidden="true" />; }
function PauseIcon()     { return <Pause     aria-hidden="true" />; }
function PrevIcon()      { return <SkipBack  aria-hidden="true" />; }
function NextIcon()      { return <SkipForward aria-hidden="true" />; }
function ShuffleIcon()   { return <Shuffle   aria-hidden="true" />; }
function RepeatIcon()    { return <Repeat    aria-hidden="true" />; }
function RepeatOneIcon() { return <Repeat1   aria-hidden="true" />; }
function VolHighIcon()   { return <Volume2   aria-hidden="true" />; }
function VolLowIcon()    { return <Volume1   aria-hidden="true" />; }
function MuteIcon()      { return <VolumeX   aria-hidden="true" />; }
function MusicNoteIcon() { return <Music     aria-hidden="true" />; }
function ChevronDownIcon() { return <ChevronDown aria-hidden="true" />; }
