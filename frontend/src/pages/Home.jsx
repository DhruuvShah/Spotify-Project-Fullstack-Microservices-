import { useState, useEffect } from "react";
import axios from "axios";
import "./Home.css";
import { useNavigate, useOutletContext } from "react-router-dom";
import { usePlayer } from "../context/PlayerContext";

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
function MusicCard({ music, allMusics, socketRef }) {
  const { playTrack, likedIds, toggleLike } = usePlayer();
  const [imgErr, setImgErr] = useState(false);

  function handlePlay(e) {
    e?.stopPropagation();
    socketRef.current?.emit("play", { musicId: music.id });
    playTrack(music, allMusics);
  }

  return (
    <div className="home-music-card" onClick={handlePlay}>
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
        <span className="hmc-artist">{music.artist}</span>
      </div>
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
  );
}

/* ── Playlist Card ──────────────────────────────────────────── */
function PlaylistCard({ playlist, index }) {
  const navigate = useNavigate();
  const gradient = PLAYLIST_GRADIENTS[index % PLAYLIST_GRADIENTS.length];
  const count = Array.isArray(playlist.musics) ? playlist.musics.length : 0;

  return (
    <div
      className="home-playlist-card"
      onClick={() => navigate(`/playlist/${playlist.id ?? playlist._id}`)}
    >
      <div className="hpc-cover" style={{ background: gradient }}>
        <PlaylistIcon />
        <div className="hpc-play-btn">
          <PlayIcon />
        </div>
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

/* ── Main Component ─────────────────────────────────────────── */
export default function Home() {
  const { socketRef } = useOutletContext();
  const [musics, setMusics] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  useEffect(() => {
    Promise.all([
      axios
        .get("http://localhost:3002/api/music/", { withCredentials: true })
        .then((res) =>
          setMusics(
            res.data.musics.map((m) => ({
              id: m.id ?? m._id,
              title: m.title,
              artist: m.artist,
              coverImageUrl: m.coverImageUrl,
              musicUrl: m.musicUrl,
            }))
          )
        ),
      axios
        .get("http://localhost:3002/api/music/playlists", {
          withCredentials: true,
        })
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
    ]).finally(() => setLoading(false));
  }, []);

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
                  socketRef={socketRef}
                />
              ))}
            </div>
          )}
        </section>

        {/* Playlists */}
        <section className="home-section">
          <h2 className="home-section-title">Playlists</h2>
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
    </div>
  );
}

/* ── Icons ── */
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
