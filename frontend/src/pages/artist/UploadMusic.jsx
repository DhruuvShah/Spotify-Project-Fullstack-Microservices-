import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
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
      await axios
        .post(`${MUSIC_URL}/api/music/upload`, formData, {
          withCredentials: true,
        })
        .then(() => {
          navigate("/artist/dashboard");
        });
    } catch (err) {
      setError(
        err.response?.data?.message || "Upload failed. Please try again.",
      );
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

/* ── Icons ────────────────────────────────────────────────────── */
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
function ArrowLeftIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}
function UploadIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}
function ImageIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}
function CameraIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}
function MusicIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}
function FileIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}
function AlertIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}
function XIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
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
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </svg>
  );
}
function SpinnerIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      className="up-spinner"
    >
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  );
}
