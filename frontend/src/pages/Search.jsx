import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { usePlayer } from "../context/PlayerContext";
import { useSocket } from "../context/SocketContext";
import AddToPlaylistBtn from "../components/AddToPlaylistBtn";
import "./Search.css";

function TrackCover({ src, alt }) {
  const [err, setErr] = useState(false);
  if (!src || err) {
    return (
      <div className="sr-cover sr-cover-fallback">
        <MusicNoteIcon />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className="sr-cover"
      onError={() => setErr(true)}
    />
  );
}

export default function Search() {
  const { emitPlay } = useSocket();
  const { playTrack, likedIds, toggleLike, currentTrack } = usePlayer();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);

  // Sync URL → input when navigating here from Navbar
  useEffect(() => {
    const q = searchParams.get("q") ?? "";
    setQuery(q);
  }, [searchParams]);

  // Debounced search whenever query changes
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (!q) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(() => {
      axios
        .get(`http://localhost:3002/api/music/search?q=${encodeURIComponent(q)}`, {
          withCredentials: true,
        })
        .then((res) => setResults(res.data.musics))
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 400);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  function handleInputChange(e) {
    const val = e.target.value;
    setQuery(val);
    if (val.trim()) {
      setSearchParams({ q: val }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  }

  function handlePlay(track) {
    emitPlay(track);
    playTrack(track, results);
  }

  return (
    <div className="sr-root">
      <div className="sr-header">
        <div className="sr-input-wrap">
          <SearchIcon />
          <input
            className="sr-input"
            type="text"
            placeholder="Search songs, artists…"
            value={query}
            onChange={handleInputChange}
            autoFocus
          />
          {query && (
            <button
              className="sr-clear-btn"
              onClick={() => {
                setQuery("");
                setSearchParams({}, { replace: true });
              }}
              title="Clear"
            >
              <XIcon />
            </button>
          )}
        </div>
      </div>

      <div className="sr-body">
        {!query.trim() && (
          <p className="sr-hint">Start typing to search for songs or artists.</p>
        )}

        {loading && <p className="sr-loading">Searching&hellip;</p>}

        {!loading && query.trim() && results.length === 0 && (
          <p className="sr-empty">No results for &ldquo;{query}&rdquo;</p>
        )}

        {!loading && results.length > 0 && (
          <>
            <h2 className="sr-results-title">
              {results.length} result{results.length !== 1 ? "s" : ""} for &ldquo;{query}&rdquo;
            </h2>
            <div className="sr-list">
              {results.map((track, i) => (
                <div
                  key={track.id ?? i}
                  className={`sr-row${currentTrack?.id === (track.id ?? track._id) ? " is-playing" : ""}`}
                  onClick={() => handlePlay(track)}
                >
                  <span className="sr-num">{i + 1}</span>
                  <TrackCover src={track.coverImageUrl} alt={track.title} />
                  <div className="sr-info">
                    <span className="sr-title">{track.title}</span>
                    <button
                      className="sr-artist sr-artist-btn"
                      onClick={(e) => { e.stopPropagation(); if (track.artistId) navigate(`/artist/${track.artistId}`); }}
                    >
                      {track.artist}
                    </button>
                  </div>
                  <button
                    className={`sr-like-btn${likedIds.has(track.id) ? " liked" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLike(track.id);
                    }}
                    title={likedIds.has(track.id) ? "Unlike" : "Like"}
                  >
                    <HeartIcon filled={likedIds.has(track.id)} />
                  </button>
                  <div onClick={(e) => e.stopPropagation()}>
                    <AddToPlaylistBtn musicId={track.id} />
                  </div>
                  <button
                    className="sr-play-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlay(track);
                    }}
                    title="Play"
                  >
                    <PlayIcon />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Icons ── */
function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
function XIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
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
function MusicNoteIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}
function HeartIcon({ filled }) {
  return filled ? (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}
