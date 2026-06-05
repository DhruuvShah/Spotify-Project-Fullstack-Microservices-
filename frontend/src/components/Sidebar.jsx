import { useState, useEffect, useRef } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { musicService } from "../services/music.service.js";
import {
  HomeIcon, SearchIcon, StudioIcon,
  PlusIcon, HeartIcon, PlaylistIcon, LogoutIcon,
} from "./icons/index.jsx";
import "./Sidebar.css";

const LIKED_GRADIENT = "linear-gradient(135deg, #c84b31, #6d5098)";

const PLAYLIST_GRADIENTS = [
  "linear-gradient(135deg, #a6331b, #c9a82b)",
  "linear-gradient(135deg, #6d5098, #c84b31)",
  "linear-gradient(135deg, #c9a82b, #8b6fc2)",
  "linear-gradient(135deg, #c84b31, #6d5098)",
  "linear-gradient(135deg, #8b6fc2, #a6331b)",
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [playlists, setPlaylists]   = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle]     = useState("");
  const [creating, setCreating]     = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    musicService.getUserPlaylists().then(setPlaylists).catch(() => {});
  }, [user]);

  useEffect(() => {
    if (showCreate) inputRef.current?.focus();
  }, [showCreate]);

  async function handleCreate(e) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const pl = await musicService.createUserPlaylist(newTitle.trim());
      setPlaylists((prev) => [pl, ...prev]);
      setNewTitle("");
      setShowCreate(false);
    } catch {}
    setCreating(false);
  }

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  const initials = user
    ? (user.fullname.firstName[0] + (user.fullname.lastName?.[0] ?? "")).toUpperCase()
    : "";

  return (
    <aside className="sidebar">
      {/* ── Logo ── */}
      <Link to="/" className="sidebar-logo" aria-label="LUMINA — go home">
        <img src="/lumina.svg" alt="" className="sidebar-logo-img" aria-hidden="true" width={28} height={28} />
      </Link>

      {/* ── Primary nav ── */}
      <nav className="sidebar-nav" aria-label="Main navigation">
        <NavLink
          to="/"
          end
          className={({ isActive }) => `sidebar-nav-item${isActive ? " active" : ""}`}
        >
          <HomeIcon width={20} height={20} />
          <span>Home</span>
        </NavLink>

        <NavLink
          to="/search"
          className={({ isActive }) => `sidebar-nav-item${isActive ? " active" : ""}`}
        >
          <SearchIcon width={20} height={20} />
          <span>Search</span>
        </NavLink>

        {user?.role === "artist" && (
          <NavLink
            to="/artist/dashboard"
            className={({ isActive }) => `sidebar-nav-item${isActive ? " active" : ""}`}
          >
            <StudioIcon width={20} height={20} />
            <span>Artist Studio</span>
          </NavLink>
        )}
      </nav>

      {/* ── Separator ── */}
      <div className="sidebar-sep" role="separator" aria-hidden="true" />

      {/* ── Library ── */}
      {user && (
        <div className="sidebar-library">
          <div className="sidebar-lib-header">
            <span className="sidebar-lib-label">Your Library</span>
            <button
              className="sidebar-lib-add"
              onClick={() => { setShowCreate((s) => !s); setNewTitle(""); }}
              aria-label="Create playlist"
              aria-expanded={showCreate}
            >
              <PlusIcon width={14} height={14} />
            </button>
          </div>

          {/* Slide-down create form */}
          <div
            className={`sidebar-create-wrap${showCreate ? " open" : ""}`}
            aria-hidden={!showCreate}
          >
            <form className="sidebar-create-form" onSubmit={handleCreate}>
              <input
                ref={inputRef}
                className="sidebar-create-input"
                type="text"
                placeholder="Playlist name…"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                maxLength={100}
                tabIndex={showCreate ? 0 : -1}
              />
              <button
                type="submit"
                className="sidebar-create-btn"
                disabled={creating || !newTitle.trim()}
                tabIndex={showCreate ? 0 : -1}
              >
                {creating ? "…" : "Create"}
              </button>
            </form>
          </div>

          <div className="sidebar-lib-list">
            {/* Liked Songs — always first */}
            <NavLink
              to="/profile"
              className={({ isActive }) => `sidebar-lib-item${isActive ? " active" : ""}`}
            >
              <div
                className="sidebar-lib-icon"
                style={{ background: LIKED_GRADIENT }}
                aria-hidden="true"
              >
                <HeartIcon width={14} height={14} />
              </div>
              <div className="sidebar-lib-info">
                <span className="sidebar-lib-name">Liked Songs</span>
                <span className="sidebar-lib-meta">Playlist</span>
              </div>
            </NavLink>

            {playlists.map((pl, i) => (
              <NavLink
                key={pl._id}
                to={`/user-playlist/${pl._id}`}
                className={({ isActive }) => `sidebar-lib-item${isActive ? " active" : ""}`}
              >
                <div
                  className="sidebar-lib-icon"
                  style={{ background: PLAYLIST_GRADIENTS[i % PLAYLIST_GRADIENTS.length] }}
                  aria-hidden="true"
                >
                  <PlaylistIcon width={14} height={14} />
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

      {/* ── Bottom: avatar + logout ── */}
      {user && (
        <div className="sidebar-user">
          <Link to="/profile" className="sidebar-user-info">
            <span className="sidebar-user-avatar" aria-hidden="true">{initials}</span>
            <span className="sidebar-user-name">
              {user.fullname.firstName} {user.fullname.lastName}
            </span>
          </Link>
          <button
            className="sidebar-user-logout"
            onClick={handleLogout}
            aria-label="Log out"
          >
            <LogoutIcon width={16} height={16} />
          </button>
        </div>
      )}
    </aside>
  );
}
