import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Home.css";
import { usePlayer }  from "../context/PlayerContext";
import { useSocket }  from "../context/SocketContext";
import { useAuth }    from "../context/AuthContext";
import AddToPlaylistBtn from "../components/AddToPlaylistBtn";
import { ConfirmModal } from "../components/ConfirmModal.jsx";
import {
  PlayIcon, HeartIcon, PlusIcon, TrashIcon, PencilIcon,
  MusicNoteIcon, PlaylistIcon,
} from "../components/icons/index.jsx";
import { MUSIC_URL } from "../config.js";

/* LUMINA warm palette gradients — replaces Spotify green/blue */
const PLAYLIST_GRADIENTS = [
  "linear-gradient(135deg, #c84b31, #7a2414)",
  "linear-gradient(135deg, #6d5098, #3d2b5e)",
  "linear-gradient(135deg, #c9a82b, #8c7018)",
  "linear-gradient(135deg, #c84b31, #6d5098)",
  "linear-gradient(135deg, #a6331b, #6d5098)",
  "linear-gradient(135deg, #8b6fc2, #4a3570)",
  "linear-gradient(135deg, #e2be45, #a6331b)",
  "linear-gradient(135deg, #c9a82b, #3d2b5e)",
];

/* ── Section header with editorial two-line hierarchy ─────────── */
function SectionHead({ eyebrow, title, action }) {
  return (
    <div className="home-section-head">
      <div>
        <p className="home-section-eyebrow">{eyebrow}</p>
        <h2 className="home-section-title">{title}</h2>
      </div>
      {action}
    </div>
  );
}

/* ── Track card skeleton ──────────────────────────────────────── */
function SkeletonTrackCard() {
  return (
    <div className="home-skel-track">
      <div className="home-skel-cover" />
      <div className="home-skel-body">
        <div className="home-skel-line" />
        <div className="home-skel-line home-skel-short" />
      </div>
    </div>
  );
}

/* ── Playlist card skeleton ───────────────────────────────────── */
function SkeletonPlaylistCard() {
  return (
    <div className="home-skel-playlist">
      <div className="home-skel-cover-sq" />
      <div className="home-skel-body">
        <div className="home-skel-line" />
        <div className="home-skel-line home-skel-short" />
      </div>
    </div>
  );
}

/* ── Music card (horizontal scroll) ──────────────────────────── */
function MusicCard({ music, allMusics }) {
  const { playTrack, likedIds, toggleLike, currentTrack, playing } = usePlayer();
  const { emitPlay } = useSocket();
  const navigate = useNavigate();
  const [imgErr, setImgErr] = useState(false);

  const isActive      = currentTrack?.id === music.id;
  const isPlayingNow  = isActive && playing;

  function handlePlay(e) {
    e?.stopPropagation();
    emitPlay(music);
    playTrack(music, allMusics);
  }

  return (
    <div
      className={`home-music-card${isActive ? " is-playing" : ""}`}
      onClick={handlePlay}
      role="button"
      tabIndex={0}
      aria-label={`Play ${music.title}`}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handlePlay(e); }}
    >
      <div className="hmc-cover-wrap">
        {!imgErr && music.coverImageUrl ? (
          <img
            src={music.coverImageUrl}
            alt={music.title}
            className="hmc-cover"
            onError={() => setImgErr(true)}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="hmc-cover hmc-cover--fallback">
            <MusicNoteIcon width={36} height={36} />
          </div>
        )}

        {/* Equalizer overlay — animated when actively playing */}
        <div className={`hmc-eq${isPlayingNow ? " hmc-eq--on" : ""}`} aria-hidden="true">
          <span className="hmc-eq-bar" />
          <span className="hmc-eq-bar" />
          <span className="hmc-eq-bar" />
        </div>

        <button
          className="hmc-play-btn"
          onClick={handlePlay}
          aria-label={`Play ${music.title}`}
          tabIndex={-1}
        >
          <PlayIcon width={18} height={18} />
        </button>
      </div>

      <div className="hmc-info">
        <span className="hmc-title">{music.title}</span>
        <button
          className="hmc-artist"
          onClick={(e) => {
            e.stopPropagation();
            if (music.artistId) navigate(`/artist/${music.artistId}`);
          }}
        >
          {music.artist}
        </button>
      </div>

      <div className="hmc-actions">
        <AddToPlaylistBtn musicId={music.id} />
        <button
          className={`hmc-like-btn${likedIds.has(music.id) ? " liked" : ""}`}
          onClick={(e) => { e.stopPropagation(); toggleLike(music.id); }}
          aria-label={likedIds.has(music.id) ? "Unlike" : "Like"}
          aria-pressed={likedIds.has(music.id)}
        >
          <HeartIcon filled={likedIds.has(music.id)} width={15} height={15} />
        </button>
      </div>
    </div>
  );
}

/* ── Featured playlist card ───────────────────────────────────── */
function PlaylistCard({ playlist, index }) {
  const navigate    = useNavigate();
  const { playTrack } = usePlayer();
  const { emitPlay }  = useSocket();
  const gradient    = PLAYLIST_GRADIENTS[index % PLAYLIST_GRADIENTS.length];
  const count       = Array.isArray(playlist.musics) ? playlist.musics.length : 0;
  const covers      = playlist.coverImages || [];

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
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter") navigate(`/playlist/${playlist.id ?? playlist._id}`); }}
    >
      <div className="hpc-cover" style={covers.length === 0 ? { background: gradient } : undefined}>
        {covers.length > 0 ? (
          <div className="hpc-collage">
            {[0, 1, 2, 3].map((i) =>
              covers[i] ? (
                <img key={i} src={covers[i]} alt="" className="hpc-collage-img" loading="lazy" decoding="async" />
              ) : (
                <div key={i} className="hpc-collage-empty" style={{ background: gradient }} />
              )
            )}
          </div>
        ) : (
          <PlaylistIcon width={32} height={32} />
        )}
        <button className="hpc-play-btn" onClick={handlePlay} aria-label="Play playlist">
          <PlayIcon width={16} height={16} />
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

/* ── User playlist card (with rename + delete) ────────────────── */
function UserPlaylistCard({ playlist, index, onDelete, onRename }) {
  const navigate    = useNavigate();
  const { playTrack } = usePlayer();
  const { emitPlay }  = useSocket();
  const [showRename,    setShowRename]    = useState(false);
  const [renameVal,     setRenameVal]     = useState(playlist.title);
  const [renameErr,     setRenameErr]     = useState("");
  const [renameLoading, setRenameLoading] = useState(false);
  const [confirmOpen,   setConfirmOpen]   = useState(false);
  const gradient = PLAYLIST_GRADIENTS[(index + 4) % PLAYLIST_GRADIENTS.length];
  const count    = Array.isArray(playlist.musics) ? playlist.musics.length : 0;
  const covers   = playlist.coverImages || [];
  const renameRef = useRef(null);

  useEffect(() => {
    if (showRename) renameRef.current?.focus();
  }, [showRename]);

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

  function handleDelete(e) {
    e.stopPropagation();
    setConfirmOpen(true);
  }

  function doDelete() {
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
      .patch(
        `${MUSIC_URL}/api/music/user-playlist/${playlist._id}`,
        { title: renameVal.trim() },
        { withCredentials: true },
      )
      .then(() => { onRename(playlist._id, renameVal.trim()); setShowRename(false); setRenameErr(""); })
      .catch((err) => setRenameErr(err.response?.data?.message || "Failed to rename"))
      .finally(() => setRenameLoading(false));
  }

  return (
    <>
      <div
        className="home-playlist-card"
        onClick={() => navigate(`/user-playlist/${playlist._id}`)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter") navigate(`/user-playlist/${playlist._id}`); }}
      >
        <div className="hpc-cover" style={covers.length === 0 ? { background: gradient } : undefined}>
          {covers.length > 0 ? (
            <div className="hpc-collage">
              {[0, 1, 2, 3].map((i) =>
                covers[i] ? (
                  <img key={i} src={covers[i]} alt="" className="hpc-collage-img" loading="lazy" decoding="async" />
                ) : (
                  <div key={i} className="hpc-collage-empty" style={{ background: gradient }} />
                )
              )}
            </div>
          ) : (
            <PlaylistIcon width={32} height={32} />
          )}
          <button className="hpc-play-btn" onClick={handlePlay} aria-label="Play playlist">
            <PlayIcon width={16} height={16} />
          </button>
        </div>
        <div className="hpc-info">
          <span className="hpc-title">{playlist.title}</span>
          <span className="hpc-meta">
            {count} {count === 1 ? "song" : "songs"} &bull; My playlist
          </span>
        </div>
        {/* Actions revealed on card hover */}
        <div className="hpc-footer">
          <button
            className="hpc-action-btn"
            onClick={(e) => { e.stopPropagation(); setRenameVal(playlist.title); setShowRename(true); }}
            aria-label="Rename playlist"
          >
            <PencilIcon width={13} height={13} />
          </button>
          <button
            className="hpc-action-btn danger"
            onClick={handleDelete}
            aria-label="Delete playlist"
          >
            <TrashIcon width={13} height={13} />
          </button>
        </div>
      </div>

      {showRename && (
        <PlaylistModal
          title="Rename Playlist"
          value={renameVal}
          onChange={(v) => setRenameVal(v)}
          error={renameErr}
          loading={renameLoading}
          submitLabel={renameLoading ? "Saving…" : "Rename"}
          onSubmit={handleRenameSubmit}
          onClose={() => setShowRename(false)}
          inputId="rename-playlist"
          inputRef={renameRef}
        />
      )}
      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={doDelete}
        title="Delete Playlist"
        message={`Delete "${playlist.title}"? This cannot be undone.`}
      />
    </>
  );
}

/* ── Shared playlist name modal ───────────────────────────────── */
function PlaylistModal({ title, value, onChange, error, loading, submitLabel, onSubmit, onClose, inputId, inputRef }) {
  useEffect(() => {
    function handleEsc(e) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  function onBackdrop(e) { if (e.target === e.currentTarget) onClose(); }

  return (
    <div className="hm-backdrop" onClick={onBackdrop} role="dialog" aria-modal="true" aria-labelledby="hm-title">
      <div className="hm-modal">
        <h2 className="hm-title" id="hm-title">{title}</h2>
        <form onSubmit={onSubmit}>
          <div className="hm-fl-group">
            <input
              ref={inputRef}
              id={inputId}
              type="text"
              className="hm-fl-input"
              placeholder=" "
              value={value}
              maxLength={100}
              onChange={(e) => onChange(e.target.value)}
            />
            <label htmlFor={inputId} className="hm-fl-label">Playlist name</label>
          </div>
          {error && <p className="hm-error" role="alert">{error}</p>}
          <div className="hm-actions">
            <button type="button" className="hm-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="hm-submit" disabled={loading}>{submitLabel}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Create playlist modal ────────────────────────────────────── */
function CreatePlaylistModal({ onClose, onCreate }) {
  const [title,   setTitle]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const inputRef = useRef(null);

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

  return (
    <PlaylistModal
      title="New Playlist"
      value={title}
      onChange={setTitle}
      error={error}
      loading={loading}
      submitLabel={loading ? "Creating…" : "Create"}
      onSubmit={handleSubmit}
      onClose={onClose}
      inputId="create-playlist"
      inputRef={inputRef}
    />
  );
}

/* ── Main page component ──────────────────────────────────────── */
export default function Home() {
  const { user }                   = useAuth();
  const [musics,        setMusics]        = useState([]);
  const [playlists,     setPlaylists]     = useState([]);
  const [userPlaylists, setUserPlaylists] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [showCreate,    setShowCreate]    = useState(false);

  const hour   = new Date().getHours();
  const period = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
  const name   = user?.fullname?.firstName ?? "";

  useEffect(() => {
    Promise.all([
      axios
        .get(`${MUSIC_URL}/api/music/`, { withCredentials: true })
        .then((res) =>
          setMusics(
            res.data.musics.map((m) => ({
              id:            m.id ?? m._id,
              title:         m.title,
              artist:        m.artist,
              artistId:      m.artistId,
              coverImageUrl: m.coverImageUrl,
              musicUrl:      m.musicUrl,
            }))
          )
        ),
      axios
        .get(`${MUSIC_URL}/api/music/playlists`, { withCredentials: true })
        .then((res) =>
          setPlaylists(
            res.data.playlists.map((p) => ({
              id:          p._id,
              title:       p.title,
              artist:      p.artist,
              musics:      p.musics,
              coverImages: p.coverImages || [],
            }))
          )
        ),
      axios
        .get(`${MUSIC_URL}/api/music/user-playlists`, { withCredentials: true })
        .then((res) => setUserPlaylists(res.data.playlists))
        .catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  function handleCreated(pl)          { setUserPlaylists((p) => [pl, ...p]); }
  function handleDeleted(id)          { setUserPlaylists((p) => p.filter((x) => x._id !== id)); }
  function handleRenamed(id, newTitle) { setUserPlaylists((p) => p.map((x) => x._id === id ? { ...x, title: newTitle } : x)); }

  return (
    <div className="home-root">
      {/* ── Greeting ── */}
      <header className="home-greeting">
        <h1 className="home-greeting-text">
          Good {period}{name ? `, ${name}` : ""}
        </h1>
      </header>

      <main className="home-main">
        {/* ── Featured Tracks ── */}
        <section className="home-section">
          <SectionHead eyebrow="DISCOVER" title="Featured Tracks" />
          {loading ? (
            <div className="home-music-scroll">
              {Array.from({ length: 8 }).map((_, i) => <SkeletonTrackCard key={i} />)}
            </div>
          ) : musics.length === 0 ? (
            <p className="home-empty">No tracks available yet.</p>
          ) : (
            <div className="home-music-scroll">
              {musics.map((m, i) => (
                <MusicCard key={m.id ?? i} music={m} allMusics={musics} />
              ))}
            </div>
          )}
        </section>

        {/* ── My Playlists ── */}
        <section className="home-section">
          <SectionHead
            eyebrow="MY LIBRARY"
            title="My Playlists"
            action={
              <button className="home-btn-create" onClick={() => setShowCreate(true)}>
                <PlusIcon width={13} height={13} />
                New Playlist
              </button>
            }
          />
          {loading ? (
            <div className="home-playlist-grid">
              {Array.from({ length: 4 }).map((_, i) => <SkeletonPlaylistCard key={i} />)}
            </div>
          ) : userPlaylists.length === 0 ? (
            <p className="home-empty">No playlists yet — create your first one.</p>
          ) : (
            <div className="home-playlist-grid">
              {userPlaylists.map((pl, i) => (
                <UserPlaylistCard
                  key={pl._id}
                  playlist={pl}
                  index={i}
                  onDelete={handleDeleted}
                  onRename={handleRenamed}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── Featured Playlists ── */}
        <section className="home-section">
          <SectionHead eyebrow="CURATED" title="Featured Playlists" />
          {loading ? (
            <div className="home-playlist-grid">
              {Array.from({ length: 4 }).map((_, i) => <SkeletonPlaylistCard key={i} />)}
            </div>
          ) : playlists.length === 0 ? (
            <p className="home-empty">No playlists available yet.</p>
          ) : (
            <div className="home-playlist-grid">
              {playlists.map((pl, i) => (
                <PlaylistCard key={pl.id ?? pl._id ?? i} playlist={pl} index={i} />
              ))}
            </div>
          )}
        </section>
      </main>

      {showCreate && (
        <CreatePlaylistModal
          onClose={() => setShowCreate(false)}
          onCreate={handleCreated}
        />
      )}
    </div>
  );
}
