import { NavLink } from "react-router-dom";
import { Home, Search, User, Music2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import "./MobileNav.css";

export default function MobileNav() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <nav className="mobile-nav">
      <NavLink to="/" end className={({ isActive }) => `mobile-nav-item${isActive ? " active" : ""}`}>
        <Home width={22} height={22} aria-hidden />
        <span>Home</span>
      </NavLink>
      <NavLink to="/search" className={({ isActive }) => `mobile-nav-item${isActive ? " active" : ""}`}>
        <Search width={22} height={22} aria-hidden />
        <span>Search</span>
      </NavLink>
      <NavLink to="/profile" className={({ isActive }) => `mobile-nav-item${isActive ? " active" : ""}`}>
        <User width={22} height={22} aria-hidden />
        <span>Profile</span>
      </NavLink>
      {user?.role === "artist" && (
        <NavLink to="/artist/dashboard" className={({ isActive }) => `mobile-nav-item${isActive ? " active" : ""}`}>
          <Music2 width={22} height={22} aria-hidden />
          <span>Studio</span>
        </NavLink>
      )}
    </nav>
  );
}
