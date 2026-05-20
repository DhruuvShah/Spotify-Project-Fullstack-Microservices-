import { useState, useEffect } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import "./Sidebar.css";
import { MUSIC_URL } from "../config.js";

export default function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();
  const [playlists, setPlaylists] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!user) return;
    axios
      .get(`${MUSIC_URL}/api/music/user-playlists`, { withCredentials: true })
      .then((res) => setPlaylists(res.data.playlists))
      .catch(() => {});
  }, [user, location.pathname]);

  async function handleCreate(e) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const res = await axios.post(
        `${MUSIC_URL}/api/music/user-playlist`,
        { title: newTitle.trim() },
        { withCredentials: true }
      );
      setPlaylists((prev) => [res.data.playlist, ...prev]);
      setNewTitle("");
      setShowCreate(false);
    } catch {}
    setCreating(false);
  }

  return (
    <aside className="sidebar">
      <Link to="/" className="sidebar-logo">
        <SpotifyIcon />
        <span>Spotify</span>
      </Link>

      <nav className="sidebar-nav">
        <NavLink to="/" end className={({ isActive }) => `sidebar-nav-item${isActive ? " active" : ""}`}>
          <HomeIcon />
          <span>Home</span>
        </NavLink>
        <NavLink to="/search" className={({ isActive }) => `sidebar-nav-item${isActive ? " active" : ""}`}>
          <SearchIcon />
          <span>Search</span>
        </NavLink>
        {user?.role === "artist" && (
          <NavLink to="/artist/dashboard" className={({ isActive }) => `sidebar-nav-item${isActive ? " active" : ""}`}>
            <StudioIcon />
            <span>Artist Studio</span>
          </NavLink>
        )}
      </nav>

      {user && (
        <div className="sidebar-library">
          <div className="sidebar-lib-header">
            <button className="sidebar-lib-title-btn">
              <LibraryIcon />
              <span>Your Library</span>
            </button>
            <button
              className="sidebar-lib-add"
              onClick={() => { setShowCreate((s) => !s); setNewTitle(""); }}
              title="Create playlist"
              aria-label="Create playlist"
            >
              <PlusIcon />
            </button>
          </div>

          {showCreate && (
            <form className="sidebar-create-form" onSubmit={handleCreate}>
              <input
                className="sidebar-create-input"
                type="text"
                placeholder="Playlist name"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                autoFocus
                maxLength={100}
              />
              <button type="submit" className="sidebar-create-btn" disabled={creating}>
                {creating ? "…" : "Create"}
              </button>
            </form>
          )}

          <div className="sidebar-lib-list">
            <NavLink
              to="/profile"
              className={({ isActive }) => `sidebar-lib-item${isActive ? " active" : ""}`}
            >
              <div className="sidebar-lib-icon liked">
                <HeartIcon />
              </div>
              <div className="sidebar-lib-info">
                <span className="sidebar-lib-name">Liked Songs</span>
                <span className="sidebar-lib-meta">Playlist</span>
              </div>
            </NavLink>

            {playlists.map((pl) => (
              <NavLink
                key={pl._id}
                to={`/user-playlist/${pl._id}`}
                className={({ isActive }) => `sidebar-lib-item${isActive ? " active" : ""}`}
              >
                <div className="sidebar-lib-icon playlist">
                  <MusicListIcon />
                </div>
                <div className="sidebar-lib-info">
                  <span className="sidebar-lib-name">{pl.title}</span>
                  <span className="sidebar-lib-meta">Playlist</span>
                </div>
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}

function SpotifyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  );
}
function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
      <path d="M12.97 2.59a1.5 1.5 0 0 0-1.94 0l-7.5 6.363A1.5 1.5 0 0 0 3 10.097V19.5A1.5 1.5 0 0 0 4.5 21h4.75a.75.75 0 0 0 .75-.75V14h4v6.25c0 .414.336.75.75.75H19.5a1.5 1.5 0 0 0 1.5-1.5v-9.403a1.5 1.5 0 0 0-.53-1.144l-7.5-6.363z" />
    </svg>
  );
}
function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" width="24" height="24">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
function LibraryIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
      <path d="M3 22a1 1 0 0 1-1-1V3a1 1 0 0 1 2 0v18a1 1 0 0 1-1 1zM15.5 2.134A1 1 0 0 0 14 3v18a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V6.464a1 1 0 0 0-.5-.866l-6-3.464zM9 2a1 1 0 0 0-1 1v18a1 1 0 1 0 2 0V3a1 1 0 0 0-1-1z" />
    </svg>
  );
}
function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" width="16" height="16">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}
function MusicListIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="18" height="18">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}
function StudioIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
      <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
    </svg>
  );
}
