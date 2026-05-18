import { useState, useEffect } from "react";
import axios from "axios";
import "./Home.css";
import { useNavigate } from "react-router-dom";

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
function MusicCard({ music }) {
  const navigate = useNavigate();
  const [imgErr, setImgErr] = useState(false);

  return (
    <div className="home-music-card" onClick={() => navigate(`/music/${music.id}`)}>
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
        <a
          href={music.musicUrl}
          className="hmc-play-btn"
          title="Play"
          onClick={(e) => e.stopPropagation()}
        >
          <PlayIcon />
        </a>
      </div>
      <div className="hmc-info">
        <span className="hmc-title">{music.title}</span>
        <span className="hmc-artist">{music.artist}</span>
      </div>
    </div>
  );
}

/* ── Playlist Card ──────────────────────────────────────────── */
function PlaylistCard({ playlist, index }) {
  const gradient = PLAYLIST_GRADIENTS[index % PLAYLIST_GRADIENTS.length];
  const count = Array.isArray(playlist.musics) ? playlist.musics.length : 0;

  return (
    <div className="home-playlist-card">
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
  const navigate = useNavigate();
  const [musics, setMusics] = useState([
    {
      id: "1",
      title: "Sample Track 1",
      artist: "Artist A",
      coverImageUrl: "",
      musicUrl: "#",
    },
    {
      id: "2",
      title: "Sample Track 2",
      artist: "Artist B",
      coverImageUrl: "",
      musicUrl: "#",
    },
    {
      id: "3",
      title: "Sample Track 3",
      artist: "Artist C",
      coverImageUrl: "",
      musicUrl: "#",
    },
    {
      id: "4",
      title: "Sample Track 4",
      artist: "Artist D",
      coverImageUrl: "",
      musicUrl: "#",
    },
    {
      id: "5",
      title: "Sample Track 5",
      artist: "Artist E",
      coverImageUrl: "",
      musicUrl: "#",
    },
  ]);
  const [playlists, setPlaylists] = useState([
    { _id: "1", title: "Sample Playlist 1", artist: "Curator A", musics: [] },
    { _id: "2", title: "Sample Playlist 2", artist: "Curator B", musics: [] },
    { _id: "3", title: "Sample Playlist 3", artist: "Curator C", musics: [] },
  ]);
  const [loading, setLoading] = useState(true);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  useEffect(() => {
    Promise.all([
      axios
        .get("http://localhost:3002/api/music/", { withCredentials: true })
        .then((res) => {
          setMusics(
            res.data.musics.map((m) => ({
              id: m.id ?? m._id,
              title: m.title,
              artist: m.artist,
              coverImageUrl: m.coverImageUrl,
              musicUrl: m.musicUrl,
            })),
          );
        }),
      axios
        .get("http://localhost:3002/api/music/playlists", {
          withCredentials: true,
        })
        .then((res) => {
          setPlaylists(
            res.data.playlists.map((p) => ({
              id: p._id,
              title: p.title,
              artist: p.artist,
              musics: p.musics,
            })),
          );
        }),
    ]).finally(() => setLoading(false));
  }, []);

  return (
    <div className="home-root">
      {/* Greeting */}
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
                <MusicCard key={music.id ?? i} music={music} />
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
                <PlaylistCard key={pl._id ?? i} playlist={pl} index={i} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

/* ── Icons ──────────────────────────────────────────────────── */
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
