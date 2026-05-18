import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import "./Profile.css";

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [trackCount, setTrackCount] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (user?.role === "artist") {
      axios
        .get("http://localhost:3002/api/music/artist-musics", { withCredentials: true })
        .then((res) => setTrackCount(res.data.musics.length))
        .catch(() => setTrackCount(0));
    }
  }, [user]);

  async function handleLogout() {
    setLoggingOut(true);
    await logout();
    navigate("/login");
  }

  if (!user) return null;

  const initials = (user.fullname.firstName[0] + user.fullname.lastName[0]).toUpperCase();

  return (
    <div className="pf-root">
      <div className="pf-card">
        {/* Avatar */}
        <div className="pf-avatar-wrap">
          <div className="pf-avatar">{initials}</div>
          <div className="pf-avatar-glow" />
        </div>

        {/* Info */}
        <div className="pf-info">
          <h1 className="pf-name">
            {user.fullname.firstName} {user.fullname.lastName}
          </h1>
          <p className="pf-email">{user.email}</p>
          <span className={`pf-role-badge ${user.role}`}>
            {user.role === "artist" ? "Artist" : "Listener"}
          </span>
        </div>

        {/* Stats (artist only) */}
        {user.role === "artist" && (
          <div className="pf-stats">
            <div className="pf-stat">
              <span className="pf-stat-value">
                {trackCount === null ? "–" : trackCount}
              </span>
              <span className="pf-stat-label">Tracks</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="pf-actions">
          {user.role === "artist" && (
            <button
              className="pf-btn-studio"
              onClick={() => navigate("/artist/dashboard")}
            >
              <StudioIcon /> Artist Studio
            </button>
          )}
          <button
            className="pf-btn-logout"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            <LogoutIcon /> {loggingOut ? "Logging out…" : "Log out"}
          </button>
        </div>
      </div>
    </div>
  );
}

function StudioIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
      <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
    </svg>
  );
}
function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="16" height="16">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
