import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./MobileNav.css";

export default function MobileNav() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <nav className="mobile-nav">
      <NavLink to="/" end className={({ isActive }) => `mobile-nav-item${isActive ? " active" : ""}`}>
        <HomeIcon />
        <span>Home</span>
      </NavLink>
      <NavLink to="/search" className={({ isActive }) => `mobile-nav-item${isActive ? " active" : ""}`}>
        <SearchIcon />
        <span>Search</span>
      </NavLink>
      <NavLink to="/profile" className={({ isActive }) => `mobile-nav-item${isActive ? " active" : ""}`}>
        <ProfileIcon />
        <span>Profile</span>
      </NavLink>
      {user?.role === "artist" && (
        <NavLink to="/artist/dashboard" className={({ isActive }) => `mobile-nav-item${isActive ? " active" : ""}`}>
          <StudioIcon />
          <span>Studio</span>
        </NavLink>
      )}
    </nav>
  );
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
      <path d="M12.97 2.59a1.5 1.5 0 0 0-1.94 0l-7.5 6.363A1.5 1.5 0 0 0 3 10.097V19.5A1.5 1.5 0 0 0 4.5 21h4.75a.75.75 0 0 0 .75-.75V14h4v6.25c0 .414.336.75.75.75H19.5a1.5 1.5 0 0 0 1.5-1.5v-9.403a1.5 1.5 0 0 0-.53-1.144l-7.5-6.363z" />
    </svg>
  );
}
function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" width="22" height="22">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
function ProfileIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
      <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
    </svg>
  );
}
function StudioIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
      <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
    </svg>
  );
}
