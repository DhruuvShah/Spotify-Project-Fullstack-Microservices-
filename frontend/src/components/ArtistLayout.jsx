import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LayoutGrid, Upload, User, LogOut, Menu, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import "./ArtistLayout.css";

export default function ArtistLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  async function handleLogout() {
    setSidebarOpen(false);
    await logout();
    navigate("/login");
  }

  const initials = user
    ? (user.fullname.firstName[0] + user.fullname.lastName[0]).toUpperCase()
    : "A";

  return (
    <div className="al-root">
      {/* Mobile top bar */}
      <header className="al-topbar">
        <button
          className="al-menu-btn"
          onClick={() => setSidebarOpen((o) => !o)}
          aria-label="Toggle sidebar"
        >
          {sidebarOpen ? <X aria-hidden /> : <Menu aria-hidden />}
        </button>
        <div className="al-topbar-brand">
          <SpotifyIcon />
          <span>Artist Studio</span>
        </div>
        <div className="al-topbar-avatar">{initials}</div>
      </header>

      {/* Sidebar overlay */}
      {sidebarOpen && (
        <div className="al-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`al-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="al-sidebar-brand">
          <SpotifyIcon />
          <span>Artist Studio</span>
        </div>

        <nav className="al-sidebar-nav">
          <NavLink
            to="/artist/dashboard"
            end
            className={({ isActive }) =>
              `al-nav-link ${isActive ? "active" : ""}`
            }
            onClick={() => setSidebarOpen(false)}
          >
            <LayoutGrid aria-hidden />
            <span>Dashboard</span>
          </NavLink>
          <NavLink
            to="/artist/dashboard/upload-music"
            className={({ isActive }) =>
              `al-nav-link ${isActive ? "active" : ""}`
            }
            onClick={() => setSidebarOpen(false)}
          >
            <Upload aria-hidden />
            <span>Upload Music</span>
          </NavLink>
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `al-nav-link ${isActive ? "active" : ""}`
            }
            onClick={() => setSidebarOpen(false)}
          >
            <User aria-hidden />
            <span>Profile</span>
          </NavLink>
        </nav>

        <div className="al-sidebar-footer">
          <div className="al-user-info">
            <div className="al-user-avatar">{initials}</div>
            <div className="al-user-meta">
              <span className="al-user-name">
                {user?.fullname?.firstName} {user?.fullname?.lastName}
              </span>
              <span className="al-user-role">Artist</span>
            </div>
          </div>
          <button className="al-logout-btn" onClick={handleLogout} title="Log out">
            <LogOut aria-hidden />
          </button>
        </div>
      </aside>

      {/* Page content */}
      <main className="al-content">
        <Outlet />
      </main>
    </div>
  );
}

/* ── Brand icon — stays custom ── */
function SpotifyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="al-spotify-icon">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  );
}
