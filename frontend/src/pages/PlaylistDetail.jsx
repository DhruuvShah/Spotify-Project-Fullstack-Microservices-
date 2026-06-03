import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { usePlayer } from "../context/PlayerContext";
import { useSocket } from "../context/SocketContext";
import AddToPlaylistBtn from "../components/AddToPlaylistBtn";
import "./PlaylistDetail.css";
import { MUSIC_URL } from "../config.js";

function formatDuration(secs) {
  if (!secs) return "";
  return `${Math.floor(secs / 60)}:${String(Math.floor(secs % 60)).padStart(2, "0")}`;
}

function totalDuration(musics) {
  const secs = musics.reduce((acc, m) => acc + (m.duration || 0), 0);
  if (!secs) return null;
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  return h > 0 ? `${h} hr ${m} min` : `${m} min`;
}

function PlaylistHeaderCover({ musics }) {
  const covers = musics.filter((m) => m.coverImageUrl).slice(0, 4);
  if (covers.length === 0) {
    return (
      <div className="pd-hero-cover-wrap pd-hero-cover-empty">
        <PlaylistBigIcon />
      </div>
    );
  }
  if (covers.length === 1) {
    return (
      <div className="pd-hero-cover-wrap">
        <img
          src={covers[0].coverImageUrl}
          alt={covers[0].title}
          className="pd-cover-single"
          loading="lazy"
          decoding="async"
        />
      </div>
    );
  }
  return (
    <div className="pd-hero-cover-wrap">
      <div className="pd-cover-grid">
        {Array.from({ length: 4 }).map((_, i) =>
          covers[i] ? (
            <img key={i} src={covers[i].coverImageUrl} alt={covers[i].title} loading="lazy" decoding="async" />
          ) : (
            <div key={i} className="pd-cover-grid-cell-empty" />
          )
        )}
      </div>
    </div>
  );
}

export default function PlaylistDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { playTrack, likedIds, toggleLike, currentTrack, playing } = usePlayer();
  const { emitPlay } = useSocket();
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    axios
      .get(`${MUSIC_URL}/api/music/playlist/${id}`, { withCredentials: true })
      .then((res) => setPlaylist(res.data.playlist))
      .catch(() => setError("Playlist not found."))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!openMenuId) return;
    function handler(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuId(null);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [openMenuId]);

  if (loading) return <div className="pd-state"><div className="pd-spinner" /></div>;

  if (error || !playlist) {
    return (
      <div className="pd-state pd-error">
        <p>{error || "Playlist not found."}</p>
        <button onClick={() => navigate(-1)}>Go back</button>
      </div>
    );
  }

  const musics = Array.isArray(playlist.musics) ? playlist.musics : [];
  const dur = totalDuration(musics);

  function handlePlayAll() {
    if (!musics.length) return;
    emitPlay(musics[0]);
    playTrack(musics[0], musics);
  }

  function handleShuffle() {
    if (!musics.length) return;
    const idx = Math.floor(Math.random() * musics.length);
    emitPlay(musics[idx]);
    playTrack(musics[idx], musics);
  }

  return (
    <div className="pd-root">
      {/* ── Hero header ── */}
      <div className="pd-hero">
        <PlaylistHeaderCover musics={musics} />

        <div className="pd-hero-info">
          <p className="pd-type-label">Playlist</p>
          <h1 className="pd-hero-title">{playlist.title}</h1>
          {playlist.artist && (
            <p className="pd-hero-creator">{playlist.artist}</p>
          )}
          <p className="pd-hero-meta">
            {musics.length} {musics.length === 1 ? "song" : "songs"}
            {dur ? ` · ${dur}` : ""}
          </p>

          <div className="pd-actions">
            <button
              className="pd-play-all-btn"
              onClick={handlePlayAll}
              disabled={!musics.length}
            >
              Play All
            </button>
            <button
              className="pd-shuffle-btn"
              onClick={handleShuffle}
              disabled={!musics.length}
            >
              Shuffle
            </button>
            <button className="pd-header-heart-btn" aria-label="Save playlist">
              <HeartIcon filled={false} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Track table ── */}
      <div className="pd-tracks">
        {musics.length === 0 ? (
          <p className="pd-empty">This playlist has no songs yet.</p>
        ) : (
          <>
            <div className="pd-table-head">
              <span className="pd-th-num">#</span>
              <span>Title</span>
              <span className="pd-th-artist">Artist</span>
              <span className="pd-th-dur">Duration</span>
            </div>

            {musics.map((track, i) => {
              const tid = track.id ?? track._id;
              const isActive =
                currentTrack?.id === tid || currentTrack?._id === tid;
              const liked = likedIds.has(tid);

              return (
                <div
                  key={tid ?? i}
                  className={`pd-track-row${isActive ? " is-playing" : ""}`}
                  onClick={() => { emitPlay(track); playTrack(track, musics); }}
                >
                  {/* # / play triangle */}
                  <div className="pd-idx">
                    <span className="pd-track-num">{i + 1}</span>
                    <button
                      className="pd-row-play"
                      onClick={(e) => {
                        e.stopPropagation();
                        emitPlay(track);
                        playTrack(track, musics);
                      }}
                      aria-label={`Play ${track.title}`}
                    >
                      <PlayIcon />
                    </button>
                  </div>

                  {/* Title */}
                  <span className="pd-track-title">{track.title}</span>

                  {/* Artist */}
                  <button
                    className="pd-track-artist-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (track.artistId) navigate(`/artist/${track.artistId}`);
                    }}
                  >
                    {track.artist}
                  </button>

                  {/* Duration */}
                  <span className="pd-track-duration">
                    {formatDuration(track.duration)}
                  </span>

                  {/* Like */}
                  <button
                    className={`pd-like-btn${liked ? " liked" : ""}`}
                    onClick={(e) => { e.stopPropagation(); toggleLike(tid); }}
                    title={liked ? "Unlike" : "Like"}
                    aria-label={liked ? "Unlike" : "Like"}
                  >
                    <HeartIcon filled={liked} />
                  </button>

                  {/* Add to playlist */}
                  <div onClick={(e) => e.stopPropagation()}>
                    <AddToPlaylistBtn musicId={tid} />
                  </div>

                  {/* Context menu */}
                  <div
                    className="pd-menu-wrap"
                    ref={openMenuId === tid ? menuRef : null}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      className={`pd-menu-btn${openMenuId === tid ? " active" : ""}`}
                      onClick={() =>
                        setOpenMenuId(openMenuId === tid ? null : tid)
                      }
                      aria-label="More options"
                    >
                      <DotsIcon />
                    </button>

                    {openMenuId === tid && (
                      <div className="pd-menu-drop">
                        <button
                          className="pd-menu-item"
                          onClick={() => {
                            toggleLike(tid);
                            setOpenMenuId(null);
                          }}
                        >
                          <HeartIcon filled={liked} />
                          {liked ? "Unlike" : "Like"}
                        </button>
                        {track.artistId && (
                          <button
                            className="pd-menu-item"
                            onClick={() => {
                              navigate(`/artist/${track.artistId}`);
                              setOpenMenuId(null);
                            }}
                          >
                            <ArtistIcon />
                            Go to Artist
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}

/* ── Icons ─────────────────────────────────────────────────────── */

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

function HeartIcon({ filled }) {
  return filled ? (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
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
      aria-hidden="true"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function PlaylistBigIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
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

function DotsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="12" cy="5" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="12" cy="19" r="1.5" />
    </svg>
  );
}

function ArtistIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.58-7 8-7s8 3 8 7" />
    </svg>
  );
}
