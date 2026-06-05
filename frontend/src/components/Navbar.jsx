import { useState, useRef, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Search, ChevronDown, User, Music2, LogOut, Menu, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import "./Navbar.css";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleOutsideClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  async function handleLogout() {
    setDropdownOpen(false);
    setMenuOpen(false);
    await logout();
    navigate("/login");
  }

  function handleSearch(e) {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      navigate(`/search?q=${encodeURIComponent(q)}`);
      setMenuOpen(false);
    }
  }

  const initials = user
    ? (user.fullname.firstName[0] + user.fullname.lastName[0]).toUpperCase()
    : "";

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <SpotifyIcon className="navbar-brand-icon" />
        <span>Spotify</span>
      </Link>

      {/* Search bar — desktop center, hidden on mobile */}
      {user && (
        <form className="navbar-search" onSubmit={handleSearch}>
          <Search width={16} height={16} aria-hidden />
          <input
            type="text"
            className="navbar-search-input"
            placeholder="Search songs, artists…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>
      )}

      {/* Desktop links */}
      <div className={`navbar-links ${menuOpen ? "open" : ""}`}>
        {/* Mobile search (inside menu) */}
        {user && (
          <form className="navbar-search-mobile" onSubmit={handleSearch}>
            <Search width={16} height={16} aria-hidden />
            <input
              type="text"
              className="navbar-search-input"
              placeholder="Search songs, artists…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
        )}

        <NavLink
          to="/"
          end
          className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
          onClick={() => setMenuOpen(false)}
        >
          Home
        </NavLink>

        {!user ? (
          <>
            <Link to="/login" className="nav-link" onClick={() => setMenuOpen(false)}>
              Log in
            </Link>
            <Link to="/register" className="nav-btn-signup" onClick={() => setMenuOpen(false)}>
              Sign up
            </Link>
          </>
        ) : (
          <>
            {user.role === "artist" && (
              <Link
                to="/artist/dashboard"
                className="nav-link"
                onClick={() => setMenuOpen(false)}
              >
                Artist Studio
              </Link>
            )}

            <div className="nav-user" ref={dropdownRef}>
              <button
                className="nav-user-btn"
                onClick={() => setDropdownOpen((o) => !o)}
                aria-expanded={dropdownOpen}
              >
                <span className="nav-avatar">{initials}</span>
                <span className="nav-username">{user.fullname.firstName}</span>
                <ChevronDown width={14} height={14} className={`nav-chevron ${dropdownOpen ? "rotated" : ""}`} aria-hidden />
              </button>

              {dropdownOpen && (
                <div className="nav-dropdown">
                  <div className="nav-dropdown-header">
                    <span className="nav-dropdown-name">
                      {user.fullname.firstName} {user.fullname.lastName}
                    </span>
                    <span className="nav-dropdown-email">{user.email}</span>
                    <span className={`nav-role-badge ${user.role}`}>{user.role}</span>
                  </div>
                  <div className="nav-dropdown-divider" />
                  <Link
                    to="/profile"
                    className="nav-dropdown-item"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <User width={16} height={16} aria-hidden /> Profile
                  </Link>
                  {user.role === "artist" && (
                    <Link
                      to="/artist/dashboard"
                      className="nav-dropdown-item"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <Music2 width={16} height={16} aria-hidden /> Artist Studio
                    </Link>
                  )}
                  <div className="nav-dropdown-divider" />
                  <button className="nav-dropdown-item danger" onClick={handleLogout}>
                    <LogOut width={16} height={16} aria-hidden /> Log out
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Mobile hamburger */}
      <button
        className="nav-hamburger"
        onClick={() => setMenuOpen((o) => !o)}
        aria-label="Toggle menu"
      >
        {menuOpen ? <X width={22} height={22} aria-hidden /> : <Menu width={22} height={22} aria-hidden />}
      </button>
    </nav>
  );
}

/* ── Brand icon — stays custom ── */
function SpotifyIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  );
}
