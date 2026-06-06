import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useToast } from "../../context/ToastContext";
import { ArrowLeft, Upload, Image, Camera, Music, File, AlertCircle, X, Play, Pause, Loader2 } from "lucide-react";
import "./UploadMusic.css";
import { MUSIC_URL } from "../../config.js";

/* ── Audio Player ─────────────────────────────────────────────── */
function AudioPlayer({ musicUrl, coverPreview, title }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    setPlaying(false);
    setCurrent(0);
    setDuration(0);
    audio.load();
  }, [musicUrl]);

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

  const onTimeUpdate = useCallback(() => {
    if (!dragging) setCurrent(audioRef.current?.currentTime ?? 0);
  }, [dragging]);

  function onLoadedMetadata() {
    setDuration(audioRef.current?.duration ?? 0);
  }

  function onEnded() {
    setPlaying(false);
    setCurrent(0);
  }

  function seek(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(
      0,
      Math.min(1, (e.clientX - rect.left) / rect.width),
    );
    const time = ratio * duration;
    audioRef.current.currentTime = time;
    setCurrent(time);
  }

  function fmt(s) {
    if (!isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60)
      .toString()
      .padStart(2, "0");
    return `${m}:${sec}`;
  }

  const pct = duration ? (current / duration) * 100 : 0;

  return (
    <div className="ap-root">
      <audio
        ref={audioRef}
        src={musicUrl}
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={onLoadedMetadata}
        onEnded={onEnded}
      />

      {/* Cover */}
      <div className="ap-cover">
        {coverPreview ? (
          <img src={coverPreview} alt="cover" className="ap-cover-img" />
        ) : (
          <div className="ap-cover-fallback">
            <MusicIcon />
          </div>
        )}
      </div>

      {/* Info + controls */}
      <div className="ap-body">
        <div className="ap-info">
          <span className="ap-title">{title || "Untitled Track"}</span>
          <span className="ap-label">Preview</span>
        </div>

        {/* Progress */}
        <div className="ap-progress-row">
          <span className="ap-time">{fmt(current)}</span>
          <div
            className="ap-track"
            onClick={seek}
            onMouseDown={() => setDragging(true)}
            onMouseUp={() => setDragging(false)}
          >
            <div className="ap-fill" style={{ width: `${pct}%` }} />
            <div className="ap-thumb" style={{ left: `${pct}%` }} />
          </div>
          <span className="ap-time">{fmt(duration)}</span>
        </div>
      </div>

      {/* Play / Pause */}
      <button type="button" className="ap-play-btn" onClick={togglePlay}>
        {playing ? <PauseIcon /> : <PlayIcon />}
      </button>
    </div>
  );
}

/* ── Main Component ───────────────────────────────────────────── */
export default function UploadMusic() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [musicFile, setMusicFile] = useState(null);
  const [musicPreviewUrl, setMusicPreviewUrl] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const musicInputRef = useRef(null);
  const coverInputRef = useRef(null);

  function handleCoverChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setCoverImage(file);
    setCoverPreview(URL.createObjectURL(file));
  }

  function handleMusicChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    applyMusicFile(file);
  }

  function applyMusicFile(file) {
    if (musicPreviewUrl) URL.revokeObjectURL(musicPreviewUrl);
    setMusicFile(file);
    setMusicPreviewUrl(URL.createObjectURL(file));
  }

  function clearMusicFile(e) {
    e.stopPropagation();
    if (musicPreviewUrl) URL.revokeObjectURL(musicPreviewUrl);
    setMusicFile(null);
    setMusicPreviewUrl(null);
  }

  function handleCoverDrop(e) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file || !file.type.startsWith("image/")) return;
    setCoverImage(file);
    setCoverPreview(URL.createObjectURL(file));
  }

  function handleMusicDrop(e) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file || !file.type.startsWith("audio/")) return;
    applyMusicFile(file);
  }

  function prevent(e) {
    e.preventDefault();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!title.trim()) return setError("Please enter a title.");
    if (!musicFile) return setError("Please select a music file.");
    if (!coverImage) return setError("Please select a cover image.");

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("musicFile", musicFile);
    formData.append("coverImage", coverImage);

    try {
      setLoading(true);
      await axios.post(`${MUSIC_URL}/api/music/upload`, formData, { withCredentials: true });
      toast.success("Track uploaded successfully!");
      navigate("/artist/dashboard");
    } catch (err) {
      const msg = err.response?.data?.message || "Upload failed. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  function formatBytes(bytes) {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <div className="up-root">
      <main className="up-main">
        <div className="up-card">
          <div className="up-card-header">
            <h1 className="up-title">Upload Track</h1>
            <p className="up-subtitle">Share your music with the world</p>
          </div>

          {error && (
            <div className="up-error">
              <AlertIcon /> {error}
            </div>
          )}

          <form className="up-form" onSubmit={handleSubmit}>
            <div className="up-form-body">
              {/* ── Cover Image ─────────────────────────── */}
              <div className="up-cover-col">
                <label className="up-label">Cover Image</label>
                <div
                  className={`up-drop-cover ${coverPreview ? "has-preview" : ""}`}
                  onClick={() => coverInputRef.current.click()}
                  onDrop={handleCoverDrop}
                  onDragOver={prevent}
                  onDragEnter={prevent}
                >
                  {coverPreview ? (
                    <img
                      src={coverPreview}
                      alt="cover preview"
                      className="up-cover-preview"
                    />
                  ) : (
                    <div className="up-drop-placeholder">
                      <ImageIcon />
                      <span className="up-drop-text">Drop image here</span>
                      <span className="up-drop-hint">or click to browse</span>
                    </div>
                  )}
                  {coverPreview && (
                    <div className="up-cover-overlay">
                      <CameraIcon />
                      <span>Change image</span>
                    </div>
                  )}
                </div>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  className="up-hidden-input"
                  onChange={handleCoverChange}
                />
                {coverImage && (
                  <p className="up-file-info">
                    <FileIcon /> {coverImage.name}
                    <span className="up-file-size">
                      {formatBytes(coverImage.size)}
                    </span>
                  </p>
                )}
              </div>

              {/* ── Right col ───────────────────────────── */}
              <div className="up-fields-col">
                {/* Title */}
                <div className="up-field">
                  <label className="up-label" htmlFor="up-title">
                    Track Title
                  </label>
                  <input
                    id="up-title"
                    type="text"
                    className="up-input"
                    placeholder="Enter track title…"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                {/* Music file drop zone */}
                <div className="up-field">
                  <label className="up-label">Music File</label>
                  <div
                    className={`up-drop-music ${musicFile ? "has-file" : ""}`}
                    onClick={() => !musicFile && musicInputRef.current.click()}
                    onDrop={handleMusicDrop}
                    onDragOver={prevent}
                    onDragEnter={prevent}
                  >
                    {musicFile ? (
                      <div className="up-music-selected">
                        <div className="up-music-icon-wrap">
                          <MusicIcon />
                        </div>
                        <div className="up-music-meta">
                          <span className="up-music-name">
                            {musicFile.name}
                          </span>
                          <span className="up-music-size">
                            {formatBytes(musicFile.size)}
                          </span>
                        </div>
                        <button
                          type="button"
                          className="up-music-change"
                          onClick={() => musicInputRef.current.click()}
                        >
                          Change
                        </button>
                        <button
                          type="button"
                          className="up-music-clear"
                          onClick={clearMusicFile}
                        >
                          <XIcon />
                        </button>
                      </div>
                    ) : (
                      <div className="up-drop-placeholder">
                        <UploadIcon />
                        <span className="up-drop-text">
                          Drop audio file here
                        </span>
                        <span className="up-drop-hint">
                          MP3, WAV, FLAC · Max 50 MB
                        </span>
                      </div>
                    )}
                  </div>
                  <input
                    ref={musicInputRef}
                    type="file"
                    accept="audio/*"
                    className="up-hidden-input"
                    onChange={handleMusicChange}
                  />
                </div>

                {/* ── Audio Player Preview ─────────────── */}
                {musicPreviewUrl && (
                  <div className="up-field">
                    <label className="up-label">Preview</label>
                    <AudioPlayer
                      musicUrl={musicPreviewUrl}
                      coverPreview={coverPreview}
                      title={title || musicFile?.name}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="up-actions">
              <button
                type="button"
                className="up-btn-cancel"
                onClick={() => navigate("/artist/dashboard")}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="up-btn-submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <SpinnerIcon /> Uploading…
                  </>
                ) : (
                  <>
                    <UploadIcon /> Upload Track
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

/* ── Icons — resolved via lucide-react imports at top ── */
function ArrowLeftIcon() { return <ArrowLeft  aria-hidden />; }
function UploadIcon()    { return <Upload      aria-hidden />; }
function ImageIcon()     { return <Image       aria-hidden />; }
function CameraIcon()    { return <Camera      aria-hidden />; }
function MusicIcon()     { return <Music       aria-hidden />; }
function FileIcon()      { return <File        aria-hidden />; }
function AlertIcon()     { return <AlertCircle aria-hidden />; }
function XIcon()         { return <X           aria-hidden />; }
function PlayIcon()      { return <Play        aria-hidden />; }
function PauseIcon()     { return <Pause       aria-hidden />; }
function SpinnerIcon()   { return <Loader2     className="up-spinner" aria-hidden />; }

function SpotifyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="12" fill="#1db954" />
      <path
        fill="#000"
        d="M17.9 10.9C14.7 9 9.35 8.8 6.3 9.75c-.5.15-1-.15-1.15-.6-.15-.5.15-1 .6-1.15 3.55-1.05 9.4-.85 13.1 1.35.45.25.6.85.35 1.3-.25.35-.85.5-1.3.25zm-.1 2.8c-.25.35-.75.5-1.1.25-2.7-1.65-6.8-2.15-9.95-1.15-.4.1-.85-.1-.95-.5-.1-.4.1-.85.5-.95 3.65-1.1 8.15-.55 11.25 1.35.3.15.45.65.25 1zm-1.25 2.75c-.2.3-.6.4-.9.2-2.35-1.45-5.3-1.75-8.8-.95-.35.1-.65-.15-.75-.45-.1-.35.15-.65.45-.75 3.8-.85 7.1-.5 9.7 1.1.35.15.4.55.3.85z"
      />
    </svg>
  );
}
