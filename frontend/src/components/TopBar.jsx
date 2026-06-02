import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  SearchIcon, ChevronDownIcon,
  ChevronLeftIcon, ChevronRightIcon,
} from "./icons/index.jsx";
import "./TopBar.css";

export default function TopBar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const dropRef = useRef(null);

  // Activate glass layer once the scroll container passes 20px
  useEffect(() => {
    const scroller = document.querySelector(".app-scroll");
    if (!scroller) return;
    const onScroll = () => setScrolled(scroller.scrollTop > 20);
    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => scroller.removeEventListener("scroll", onScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const onDown = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setDropOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  async function handleLogout() {
    setDropOpen(false);
    await logout();
    navigate("/login");
  }

  const initials = user
    ? (user.fullname.firstName[0] + (user.fullname.lastName?.[0] ?? "")).toUpperCase()
    : "";

  return (
    <header className={`topbar${scrolled ? " topbar--scrolled" : ""}`}>
      {/* Back / Forward navigation */}
      <div className="topbar-left">
        <button
          className="topbar-nav-btn"
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          <ChevronLeftIcon width={18} height={18} />
        </button>
        <button
          className="topbar-nav-btn"
          onClick={() => navigate(1)}
          aria-label="Go forward"
        >
          <ChevronRightIcon width={18} height={18} />
        </button>
      </div>

      {/* Search + user */}
      <div className="topbar-right">
        <Link to="/search" className="topbar-icon-btn" aria-label="Search">
          <SearchIcon width={20} height={20} />
        </Link>

        {user && (
          <div className="topbar-user" ref={dropRef}>
            <button
              className="topbar-user-btn"
              onClick={() => setDropOpen((o) => !o)}
              aria-expanded={dropOpen}
              aria-haspopup="menu"
            >
              <span className="topbar-avatar" aria-hidden="true">{initials}</span>
              <span className="topbar-username">{user.fullname.firstName}</span>
              <ChevronDownIcon
                width={12}
                height={12}
                style={{
                  transform: dropOpen ? "rotate(180deg)" : "none",
                  transition: "transform 200ms ease",
                  flexShrink: 0,
                }}
              />
            </button>

            {dropOpen && (
              <div className="topbar-dropdown" role="menu">
                <div className="topbar-dd-info" aria-hidden="true">
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
                  role="menuitem"
                >
                  Profile
                </Link>
                {user.role === "artist" && (
                  <Link
                    to="/artist/dashboard"
                    className="topbar-dd-item"
                    onClick={() => setDropOpen(false)}
                    role="menuitem"
                  >
                    Artist Studio
                  </Link>
                )}
                <div className="topbar-dd-sep" />
                <button
                  className="topbar-dd-item danger"
                  onClick={handleLogout}
                  role="menuitem"
                >
                  Log out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
