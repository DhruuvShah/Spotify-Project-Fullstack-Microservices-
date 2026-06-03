import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { usePlayer } from "../context/PlayerContext";
import { useSocket } from "../context/SocketContext";
import AddToPlaylistBtn from "../components/AddToPlaylistBtn";
import { PlayIcon, MusicNoteIcon } from "../components/icons/index.jsx";
import "./Search.css";
import { MUSIC_URL } from "../config.js";

function formatDuration(secs) {
  if (!secs) return "";
  const m = Math.floor(secs / 60);
  const s = String(Math.floor(secs % 60)).padStart(2, "0");
  return `${m}:${s}`;
}

function TrackCover({ src, alt }) {
  const [err, setErr] = useState(false);
  if (!src || err) {
    return (
      <div className="sr-cover sr-cover-fallback" aria-hidden="true">
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
      loading="lazy"
      decoding="async"
    />
  );
}

function SkeletonRow() {
  return (
    <div className="sr-row sr-row--skel" aria-hidden="true">
      <div className="sr-idx">
        <div className="sr-skel sr-skel--num" />
      </div>
      <div className="sr-skel sr-skel--cover" />
      <div className="sr-skel-info">
        <div className="sr-skel sr-skel--title" />
        <div className="sr-skel sr-skel--artist" />
      </div>
      <div className="sr-skel sr-skel--dur" />
      <span /><span />
    </div>
  );
}

export default function Search() {
  const { emitPlay } = useSocket();
  const { playTrack, likedIds, toggleLike, currentTrack, playing } = usePlayer();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const q = searchParams.get("q") ?? "";
    setQuery(q);
  }, [searchParams]);

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
        .get(`${MUSIC_URL}/api/music/search?q=${encodeURIComponent(q)}`, {
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

  function handleClear() {
    setQuery("");
    setSearchParams({}, { replace: true });
    inputRef.current?.focus();
  }

  function handlePlay(track) {
    emitPlay(track);
    playTrack(track, results);
  }

  const hasQuery = query.trim().length > 0;

  return (
    <div className="sr-root">
      {/* ── Search bar ── */}
      <div className="sr-header">
        <div className="sr-input-wrap">
          <SearchIcon className="sr-search-icon" />
          <input
            ref={inputRef}
            className="sr-input"
            type="text"
            placeholder="What do you want to listen to?"
            value={query}
            onChange={handleInputChange}
            autoFocus
            aria-label="Search"
          />
          {query && (
            <button
              className="sr-clear-btn"
              onClick={handleClear}
              title="Clear search"
              aria-label="Clear"
            >
              <XIcon />
            </button>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="sr-body">
        {/* Empty state — no query */}
        {!hasQuery && !loading && (
          <div className="sr-empty-state">
            <div className="sr-empty-icon-wrap" aria-hidden="true">
              <AnimatedMusicNote />
            </div>
            <p className="sr-empty-heading">Search for songs, artists, playlists</p>
            <p className="sr-empty-sub">Discover music that moves you</p>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="sr-section">
            <p className="sr-section-label">Songs</p>
            <div className="sr-list">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonRow key={i} />
              ))}
            </div>
          </div>
        )}

        {/* No results */}
        {!loading && hasQuery && results.length === 0 && (
          <div className="sr-no-results">
            <p className="sr-no-results-heading">
              No results for &ldquo;{query}&rdquo;
            </p>
            <p className="sr-no-results-sub">
              Try different keywords or check your spelling.
            </p>
          </div>
        )}

        {/* Results */}
        {!loading && results.length > 0 && (
          <div className="sr-section">
            <p className="sr-section-label">Songs</p>
            <div className="sr-list">
              {results.map((track, i) => {
                const id = track.id ?? track._id;
                const isActive =
                  currentTrack?.id === id || currentTrack?._id === id;
                const isPlayingNow = isActive && playing;
                return (
                  <div
                    key={id ?? i}
                    className={`sr-row${isActive ? " is-playing" : ""}`}
                    onClick={() => handlePlay(track)}
                  >
                    {/* Col 1: index / play / eq */}
                    <div className="sr-idx">
                      <span className="sr-num">{i + 1}</span>
                      <button
                        className="sr-row-play"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlay(track);
                        }}
                        aria-label={`Play ${track.title}`}
                      >
                        <PlayIcon />
                      </button>
                      <div
                        className={`sr-row-eq${isPlayingNow ? " sr-row-eq--on" : ""}`}
                        aria-hidden="true"
                      >
                        <span /><span /><span />
                      </div>
                    </div>

                    {/* Col 2: cover */}
                    <TrackCover src={track.coverImageUrl} alt={track.title} />

                    {/* Col 3: title + artist */}
                    <div className="sr-info">
                      <span className="sr-title">{track.title}</span>
                      <button
                        className="sr-artist-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (track.artistId) navigate(`/artist/${track.artistId}`);
                        }}
                      >
                        {track.artist}
                      </button>
                    </div>

                    {/* Col 4: duration */}
                    <span className="sr-duration">
                      {formatDuration(track.duration)}
                    </span>

                    {/* Col 5: like */}
                    <button
                      className={`sr-like-btn${likedIds.has(id) ? " liked" : ""}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLike(id);
                      }}
                      title={likedIds.has(id) ? "Unlike" : "Like"}
                      aria-label={likedIds.has(id) ? "Unlike" : "Like"}
                    >
                      <HeartIcon filled={likedIds.has(id)} />
                    </button>

                    {/* Col 6: add to playlist */}
                    <div
                      className="sr-atp-wrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <AddToPlaylistBtn musicId={id} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Private icons ─────────────────────────────────────────────── */

function SearchIcon({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
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
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
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

function AnimatedMusicNote() {
  return (
    <svg
      className="sr-empty-note"
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M26 46V18l24-5v22"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="20" cy="46" r="6" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="44" cy="41" r="6" stroke="currentColor" strokeWidth="2.5" />
    </svg>
  );
}
