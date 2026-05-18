import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./ArtistDashboard.css";
import axios from "axios";
import { usePlayer } from "../../context/PlayerContext";

/* ── Playlist cover: 2×2 grid of first 4 music covers ─────────── */
function PlaylistCover({ musics }) {
  const covers = musics.slice(0, 4);

  if (covers.length === 0) {
    return (
      <div className="pl-cover pl-cover-empty">
        <PlaylistIcon />
      </div>
    );
  }

  if (covers.length === 1) {
    return (
      <div className="pl-cover">
        <img
          src={covers[0].coverImageUrl}
          alt={covers[0].title}
          className="pl-cover-single"
        />
      </div>
    );
  }

  return (
    <div className="pl-cover pl-cover-grid">
      {Array.from({ length: 4 }).map((_, i) => {
        const m = covers[i];
        return m ? (
          <img
            key={i}
            src={m.coverImageUrl}
            alt={m.title}
            className="pl-cover-cell"
          />
        ) : (
          <div key={i} className="pl-cover-cell pl-cover-cell-empty" />
        );
      })}
    </div>
  );
}

/* ── Track cover with img + fallback ──────────────────────────── */
function TrackCover({ src, alt }) {
  const [err, setErr] = useState(false);
  if (!src || err) {
    return (
      <div className="track-cover track-cover-fallback">
        <MusicNoteIcon />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className="track-cover track-cover-img"
      onError={() => setErr(true)}
    />
  );
}

/* ── Main Component ───────────────────────────────────────────── */
export default function ArtistDashboard() {
  const navigate = useNavigate();
  const { playTrack } = usePlayer();
  const [musics, setMusics] = useState([
    {
      id: 1,
      title: "Midnight Pulse",
      artist: "Dhruv Shah",
      coverImageUrl: "https://picsum.photos/seed/mp/80",
      musicUrl: "#",
    },
    {
      id: 2,
      title: "Neon Gravity",
      artist: "Dhruv Shah",
      coverImageUrl: "https://picsum.photos/seed/ng/80",
      musicUrl: "#",
    },
    {
      id: 3,
      title: "Solar Wind",
      artist: "Dhruv Shah",
      coverImageUrl: "https://picsum.photos/seed/sol/80",
      musicUrl: "#",
    },
    {
      id: 4,
      title: "Glass Circuit",
      artist: "Dhruv Shah",
      coverImageUrl: "https://picsum.photos/seed/gc/80",
      musicUrl: "#",
    },
    {
      id: 5,
      title: "Freefall",
      artist: "Dhruv Shah",
      coverImageUrl: "https://picsum.photos/seed/ff/80",
      musicUrl: "#",
    },
  ]);

  const [playlists, setPlaylists] = useState([
    {
      id: 1,
      title: "Chill Vibes",
      artist: "Dhruv Shah",
      musics: [musics[0], musics[1]],
    },
    {
      id: 2,
      title: "Upbeat Mix",
      artist: "Dhruv Shah",
      musics: [musics[2], musics[3], musics[4]],
    },
    {
      id: 3,
      title: "Empty Playlist",
      artist: "Dhruv Shah",
      musics: [],
    },
  ]);

  useEffect(() => {
    axios
      .get("http://localhost:3002/api/music/artist-musics", {
        withCredentials: true,
      })
      .then((res) => {
        setMusics(
          res.data.musics.map((m) => ({
            id: m._id,
            title: m.title,
            artist: m.artist,
            coverImageUrl: m.coverImageUrl,
            musicUrl: m.musicUrl,
          })),
        );
      });
    axios
      .get("http://localhost:3002/api/music/playlist/artist", {
        withCredentials: true,
      })
      .then((res) => {
        setPlaylists(res.data.playlists);
      });
  }, []);

  const [expandedPl, setExpandedPl] = useState(null);

  function toggleExpand(id) {
    setExpandedPl((prev) => (prev === id ? null : id));
  }

  return (
    <div className="ad-root">
      <main className="ad-main">

        {/* ══ MY MUSIC ══════════════════════════════════ */}
        <section className="ad-section">
          <div className="ad-section-header">
            <div>
              <h1 className="ad-section-title">My Music</h1>
              <p className="ad-section-sub">{musics.length} tracks</p>
            </div>
            <button className="ad-btn-primary" onClick={() => navigate("/artist/dashboard/upload-music")}>
              <PlusIcon /> Upload Track 
            </button>
          </div>

          <div className="ad-track-list">
            <div className="ad-track-header">
              <span className="col-num">#</span>
              <span className="col-title">Title</span>
              <span className="col-artist">Artist</span>
              <span className="col-play"></span>
            </div>

            {musics.map((music, i) => (
              <div key={music._id ?? music.id ?? i} className="ad-track-row" onClick={() => playTrack(music, musics)}>
                <span className="col-num track-num">{i + 1}</span>

                <div className="col-title track-title-cell">
                  <TrackCover src={music.coverImageUrl} alt={music.title} />
                  <span className="track-name">{music.title}</span>
                </div>

                <span className="col-artist track-artist">{music.artist}</span>

                <div className="col-play">
                  <button
                    className="track-play-btn"
                    title="Play"
                    onClick={(e) => {
                      e.stopPropagation();
                      playTrack(music, musics);
                    }}
                  >
                    <PlayIcon />
                  </button>
                </div>

              </div>
            ))}
          </div>
        </section>

        {/* ══ PLAYLISTS ═════════════════════════════════ */}
        <section className="ad-section">
          <div className="ad-section-header">
            <div>
              <h1 className="ad-section-title">Playlists</h1>
              <p className="ad-section-sub">{playlists.length} playlists</p>
            </div>
            <button className="ad-btn-primary">
              <PlusIcon /> New Playlist
            </button>
          </div>

          <div className="ad-playlist-grid">
            {playlists.map((pl, i) => (
              <div key={pl._id ?? pl.id ?? i} className="ad-playlist-card">
                <PlaylistCover musics={pl.musics} />

                <div className="pl-info">
                  <div className="pl-info-text">
                    <span className="pl-title">{pl.title}</span>
                    <span className="pl-artist">{pl.artist}</span>
                    <span className="pl-count">
                      {pl.musics.length} {pl.musics.length === 1 ? "song" : "songs"}
                    </span>
                  </div>

                </div>

                {expandedPl === (pl._id ?? pl.id) && pl.musics.length > 0 && (
                  <div className="pl-songs">
                    {pl.musics.map((m, idx) => (
                      <div key={m._id ?? m.id ?? idx} className="pl-song-row">
                        <TrackCover src={m.coverImageUrl} alt={m.title} />
                        <div className="pl-song-info">
                          <span className="pl-song-title">{m.title}</span>
                          <span className="pl-song-artist">{m.artist}</span>
                        </div>
                        <button
                          className="pl-song-play"
                          title="Play"
                          onClick={(e) => { e.stopPropagation(); playTrack(m, pl.musics); }}
                        >
                          <PlayIcon />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

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
function PlusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
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
