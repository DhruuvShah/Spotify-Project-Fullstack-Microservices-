import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./TopBar.css";

export default function TopBar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [dropOpen, setDropOpen] = useState(false);
  const dropRef = useRef(null);

  useEffect(() => {
    function onDown(e) {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  async function handleLogout() {
    setDropOpen(false);
    await logout();
    navigate("/login");
  }

  const initials = user
    ? (user.fullname.firstName[0] + user.fullname.lastName[0]).toUpperCase()
    : "";

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="topbar-nav-btn" onClick={() => navigate(-1)} title="Back" aria-label="Go back">
          <ChevronLeftIcon />
        </button>
        <button className="topbar-nav-btn" onClick={() => navigate(1)} title="Forward" aria-label="Go forward">
          <ChevronRightIcon />
        </button>
      </div>

      {user && (
        <div className="topbar-right">
          <div className="topbar-user" ref={dropRef}>
            <button
              className="topbar-user-btn"
              onClick={() => setDropOpen((o) => !o)}
              aria-expanded={dropOpen}
            >
              <span className="topbar-avatar">{initials}</span>
              <span className="topbar-username">{user.fullname.firstName}</span>
              <ChevronDownIcon rotated={dropOpen} />
            </button>

            {dropOpen && (
              <div className="topbar-dropdown">
                <div className="topbar-dd-info">
                  <span className="topbar-dd-name">
                    {user.fullname.firstName} {user.fullname.lastName}
                  </span>
                  <span className="topbar-dd-email">{user.email}</span>
                </div>
                <div className="topbar-dd-sep" />
                <Link
                  to="/profile"
                  className="topbar-dd-item"
                  onClick={() => setDropOpen(false)}
                >
                  Profile
                </Link>
                {user.role === "artist" && (
                  <Link
                    to="/artist/dashboard"
                    className="topbar-dd-item"
                    onClick={() => setDropOpen(false)}
                  >
                    Artist Studio
                  </Link>
                )}
                <div className="topbar-dd-sep" />
                <button className="topbar-dd-item danger" onClick={handleLogout}>
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function ChevronLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}
function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
function ChevronDownIcon({ rotated }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      width="12"
      height="12"
      style={{ transform: rotated ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
