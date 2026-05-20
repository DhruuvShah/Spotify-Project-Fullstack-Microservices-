import { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./Home.css";
import { useNavigate } from "react-router-dom";
import { usePlayer } from "../context/PlayerContext";
import { useSocket } from "../context/SocketContext";
import AddToPlaylistBtn from "../components/AddToPlaylistBtn";
import { MUSIC_URL } from "../config.js";

const PLAYLIST_GRADIENTS = [
  "linear-gradient(135deg, #1db954, #0a5c2b)",
  "linear-gradient(135deg, #e91429, #7b0d15)",
  "linear-gradient(135deg, #0d72ea, #083a7a)",
  "linear-gradient(135deg, #f59b23, #7d5012)",
  "linear-gradient(135deg, #af2896, #5c1551)",
  "linear-gradient(135deg, #148a08, #0a4d05)",
  "linear-gradient(135deg, #e8115b, #7a0b32)",
  "linear-gradient(135deg, #8d67ab, #4a3760)",
];

/* ── Music Card ─────────────────────────────────────────────── */
function MusicCard({ music, allMusics }) {
  const { playTrack, likedIds, toggleLike, currentTrack, playing } = usePlayer();
  const { emitPlay } = useSocket();
  const navigate = useNavigate();
  const [imgErr, setImgErr] = useState(false);
  const isCurrentlyPlaying = currentTrack?.id === music.id;

  function handlePlay(e) {
    e?.stopPropagation();
    emitPlay(music);
    playTrack(music, allMusics);
  }

  return (
    <div className={`home-music-card${isCurrentlyPlaying ? " is-playing" : ""}`} onClick={handlePlay}>
      <div className="hmc-cover-wrap">
        {!imgErr && music.coverImageUrl ? (
          <img
            src={music.coverImageUrl}
            alt={music.title}
            className="hmc-cover"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div className="hmc-cover hmc-cover-fallback">
            <MusicNoteIcon />
          </div>
        )}
        <button className="hmc-play-btn" title="Play" onClick={handlePlay}>
          <PlayIcon />
        </button>
      </div>
      <div className="hmc-info">
        <span className="hmc-title">{music.title}</span>
        <button
          className="hmc-artist hmc-artist-btn"
          onClick={(e) => { e.stopPropagation(); if (music.artistId) navigate(`/artist/${music.artistId}`); }}
        >
          {music.artist}
        </button>
      </div>
      <div className="hmc-bottom-bar">
        <AddToPlaylistBtn musicId={music.id} />
        <button
          className={`hmc-like-btn${likedIds.has(music.id) ? " liked" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            toggleLike(music.id);
          }}
          title={likedIds.has(music.id) ? "Unlike" : "Like"}
        >
          <HeartIcon filled={likedIds.has(music.id)} />
        </button>
      </div>
    </div>
  );
}

/* ── Playlist Card ──────────────────────────────────────────── */
function PlaylistCard({ playlist, index }) {
  const navigate = useNavigate();
  const { playTrack } = usePlayer();
  const { emitPlay } = useSocket();
  const gradient = PLAYLIST_GRADIENTS[index % PLAYLIST_GRADIENTS.length];
  const count = Array.isArray(playlist.musics) ? playlist.musics.length : 0;

  function handlePlay(e) {
    e.stopPropagation();
    axios
      .get(`${MUSIC_URL}/api/music/playlist/${playlist.id}`, { withCredentials: true })
      .then((res) => {
        const tracks = res.data.playlist?.musics;
        if (tracks?.length > 0) { emitPlay(tracks[0]); playTrack(tracks[0], tracks); }
      })
      .catch(() => {});
  }

  return (
    <div
      className="home-playlist-card"
      onClick={() => navigate(`/playlist/${playlist.id ?? playlist._id}`)}
    >
      <div className="hpc-cover" style={{ background: gradient }}>
        <PlaylistIcon />
        <button className="hpc-play-btn" onClick={handlePlay} title="Play playlist">
          <PlayIcon />
        </button>
      </div>
      <div className="hpc-info">
        <span className="hpc-title">{playlist.title}</span>
        <span className="hpc-meta">
          {playlist.artist} &bull; {count} {count === 1 ? "song" : "songs"}
        </span>
      </div>
    </div>
  );
}

/* ── User Playlist Card ─────────────────────────────────────── */
function UserPlaylistCard({ playlist, index, onDelete, onRename }) {
  const navigate = useNavigate();
  const { playTrack } = usePlayer();
  const { emitPlay } = useSocket();
  const [showRename, setShowRename] = useState(false);
  const [renameVal, setRenameVal] = useState(playlist.title);
  const [renameErr, setRenameErr] = useState("");
  const [renameLoading, setRenameLoading] = useState(false);
  const gradient = PLAYLIST_GRADIENTS[(index + 4) % PLAYLIST_GRADIENTS.length];
  const count = Array.isArray(playlist.musics) ? playlist.musics.length : 0;

  function handleDelete(e) {
    e.stopPropagation();
    if (!window.confirm(`Delete playlist "${playlist.title}"?`)) return;
    axios
      .delete(`${MUSIC_URL}/api/music/user-playlist/${playlist._id}`, { withCredentials: true })
      .then(() => onDelete(playlist._id))
      .catch(() => {});
  }

  function handleRenameSubmit(e) {
    e.preventDefault();
    if (!renameVal.trim()) { setRenameErr("Name is required"); return; }
    setRenameLoading(true);
    axios
      .patch(`${MUSIC_URL}/api/music/user-playlist/${playlist._id}`, { title: renameVal.trim() }, { withCredentials: true })
      .then(() => {
        onRename(playlist._id, renameVal.trim());
        setShowRename(false);
        setRenameErr("");
      })
      .catch((err) => setRenameErr(err.response?.data?.message || "Failed to rename"))
      .finally(() => setRenameLoading(false));
  }

  function handlePlay(e) {
    e.stopPropagation();
    axios
      .get(`${MUSIC_URL}/api/music/user-playlist/${playlist._id}`, { withCredentials: true })
      .then((res) => {
        const tracks = res.data.playlist?.musics;
        if (tracks?.length > 0) { emitPlay(tracks[0]); playTrack(tracks[0], tracks); }
      })
      .catch(() => {});
  }

  return (
    <>
      <div
        className="home-playlist-card"
        onClick={() => navigate(`/user-playlist/${playlist._id}`)}
      >
        <div className="hpc-cover" style={{ background: gradient }}>
          <PlaylistIcon />
          <button className="hpc-play-btn" onClick={handlePlay} title="Play playlist">
            <PlayIcon />
          </button>
        </div>
        <div className="hpc-info">
          <span className="hpc-title">{playlist.title}</span>
          <span className="hpc-meta">
            {count} {count === 1 ? "song" : "songs"} &bull; My playlist
          </span>
        </div>
        <div className="hpc-card-footer">
          <button
            className="hpc-action-btn"
            onClick={(e) => { e.stopPropagation(); setRenameVal(playlist.title); setShowRename(true); }}
            title="Rename playlist"
          >
            <PencilIcon />
          </button>
          <button className="hpc-action-btn danger" onClick={handleDelete} title="Delete playlist">
            <TrashIcon />
          </button>
        </div>
      </div>
      {showRename && (
        <div className="hm-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setShowRename(false); }}>
          <div className="hm-modal">
            <h2 className="hm-modal-title">Rename Playlist</h2>
            <form onSubmit={handleRenameSubmit} className="hm-modal-form">
              <input
                type="text"
                className="hm-modal-input"
                placeholder="Playlist name"
                value={renameVal}
                maxLength={100}
                autoFocus
                onChange={(e) => setRenameVal(e.target.value)}
              />
              {renameErr && <p className="hm-modal-error">{renameErr}</p>}
              <div className="hm-modal-actions">
                <button type="button" className="hm-modal-cancel" onClick={() => setShowRename(false)}>Cancel</button>
                <button type="submit" className="hm-modal-create" disabled={renameLoading}>
                  {renameLoading ? "Saving…" : "Rename"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

/* ── Create Playlist Modal ──────────────────────────────────── */
function CreatePlaylistModal({ onClose, onCreate }) {
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) { setError("Playlist name is required"); return; }
    setLoading(true);
    setError("");
    axios
      .post(`${MUSIC_URL}/api/music/user-playlist`, { title: title.trim() }, { withCredentials: true })
      .then((res) => { onCreate(res.data.playlist); onClose(); })
      .catch((err) => setError(err.response?.data?.message || "Failed to create playlist"))
      .finally(() => setLoading(false));
  }

  function handleBackdrop(e) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div className="hm-modal-backdrop" onClick={handleBackdrop}>
      <div className="hm-modal">
        <h2 className="hm-modal-title">New Playlist</h2>
        <form onSubmit={handleSubmit} className="hm-modal-form">
          <input
            ref={inputRef}
            type="text"
            className="hm-modal-input"
            placeholder="Playlist name"
            value={title}
            maxLength={100}
            onChange={(e) => setTitle(e.target.value)}
          />
          {error && <p className="hm-modal-error">{error}</p>}
          <div className="hm-modal-actions">
            <button type="button" className="hm-modal-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="hm-modal-create" disabled={loading}>
              {loading ? "Creating…" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Main Component ─────────────────────────────────────────── */
export default function Home() {
  const [musics, setMusics] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [userPlaylists, setUserPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  useEffect(() => {
    Promise.all([
      axios
        .get(`${MUSIC_URL}/api/music/`, { withCredentials: true })
        .then((res) =>
          setMusics(
            res.data.musics.map((m) => ({
              id: m.id ?? m._id,
              title: m.title,
              artist: m.artist,
              artistId: m.artistId,
              coverImageUrl: m.coverImageUrl,
              musicUrl: m.musicUrl,
            }))
          )
        ),
      axios
        .get(`${MUSIC_URL}/api/music/playlists`, { withCredentials: true })
        .then((res) =>
          setPlaylists(
            res.data.playlists.map((p) => ({
              id: p._id,
              title: p.title,
              artist: p.artist,
              musics: p.musics,
            }))
          )
        ),
      axios
        .get(`${MUSIC_URL}/api/music/user-playlists`, { withCredentials: true })
        .then((res) => setUserPlaylists(res.data.playlists))
        .catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  function handlePlaylistCreated(playlist) {
    setUserPlaylists((prev) => [playlist, ...prev]);
  }

  function handlePlaylistDeleted(id) {
    setUserPlaylists((prev) => prev.filter((p) => p._id !== id));
  }

  function handlePlaylistRenamed(id, newTitle) {
    setUserPlaylists((prev) => prev.map((p) => p._id === id ? { ...p, title: newTitle } : p));
  }

  return (
    <div className="home-root">
      <div className="home-greeting">
        <h1 className="home-greeting-text">{greeting}</h1>
      </div>

      <main className="home-main">
        {/* Featured Tracks */}
        <section className="home-section">
          <h2 className="home-section-title">Featured Tracks</h2>
          {loading ? (
            <p className="home-loading">Loading&hellip;</p>
          ) : musics.length === 0 ? (
            <p className="home-empty">No tracks available yet.</p>
          ) : (
            <div className="home-music-scroll">
              {musics.map((music, i) => (
                <MusicCard
                  key={music.id ?? i}
                  music={music}
                  allMusics={musics}
                />
              ))}
            </div>
          )}
        </section>

        {/* My Playlists */}
        <section className="home-section">
          <div className="home-section-header">
            <h2 className="home-section-title">My Playlists</h2>
            <button className="home-btn-create" onClick={() => setShowCreateModal(true)}>
              <PlusIcon /> New Playlist
            </button>
          </div>
          {loading ? (
            <p className="home-loading">Loading&hellip;</p>
          ) : userPlaylists.length === 0 ? (
            <p className="home-empty">No playlists yet. Create your first one!</p>
          ) : (
            <div className="home-playlist-grid">
              {userPlaylists.map((pl, i) => (
                <UserPlaylistCard
                  key={pl._id}
                  playlist={pl}
                  index={i}
                  onDelete={handlePlaylistDeleted}
                  onRename={handlePlaylistRenamed}
                />
              ))}
            </div>
          )}
        </section>

        {/* Artist Playlists */}
        <section className="home-section">
          <h2 className="home-section-title">Featured Playlists</h2>
          {loading ? (
            <p className="home-loading">Loading&hellip;</p>
          ) : playlists.length === 0 ? (
            <p className="home-empty">No playlists available yet.</p>
          ) : (
            <div className="home-playlist-grid">
              {playlists.map((pl, i) => (
                <PlaylistCard key={pl._id ?? pl.id ?? i} playlist={pl} index={i} />
              ))}
            </div>
          )}
        </section>
      </main>

      {showCreateModal && (
        <CreatePlaylistModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handlePlaylistCreated}
        />
      )}
    </div>
  );
}

/* ── Icons ── */
function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" width="14" height="14">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
    </svg>
  );
}
function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
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
function MusicNoteIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}
function PlaylistIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}
function HeartIcon({ filled }) {
  return filled ? (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  ) : (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}
