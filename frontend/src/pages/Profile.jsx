import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { usePlayer } from "../context/PlayerContext";
import "./Profile.css";

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { playTrack, likedIds, currentTrack } = usePlayer();

  const [loggingOut, setLoggingOut] = useState(false);

  // artist stats
  const [trackCount, setTrackCount] = useState(null);
  const [followerCount, setFollowerCount] = useState(null);
  const [artistPlaylistCount, setArtistPlaylistCount] = useState(null);

  // user data
  const [history, setHistory] = useState([]);
  const [userPlaylists, setUserPlaylists] = useState([]);
  const [followedArtists, setFollowedArtists] = useState([]);

  useEffect(() => {
    if (!user) return;

    if (user.role === "artist") {
      axios.get("http://localhost:3002/api/music/artist-musics", { withCredentials: true })
        .then((res) => setTrackCount(res.data.musics.length))
        .catch(() => setTrackCount(0));

      axios.get("http://localhost:3002/api/music/playlist/artist", { withCredentials: true })
        .then((res) => setArtistPlaylistCount(res.data.playlists.length))
        .catch(() => setArtistPlaylistCount(0));

      axios.get("http://localhost:3000/api/auth/artist/" + user.id, { withCredentials: true })
        .then((res) => setFollowerCount(res.data.artist.followerCount))
        .catch(() => setFollowerCount(0));
    } else {
      axios.get("http://localhost:3002/api/music/history", { withCredentials: true })
        .then((res) => setHistory(res.data.musics))
        .catch(() => setHistory([]));

      axios.get("http://localhost:3002/api/music/user-playlists", { withCredentials: true })
        .then((res) => setUserPlaylists(res.data.playlists))
        .catch(() => setUserPlaylists([]));

      axios.get("http://localhost:3000/api/auth/following", { withCredentials: true })
        .then((res) => setFollowedArtists(res.data.artists))
        .catch(() => setFollowedArtists([]));
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
      {/* ── Header ── */}
      <div className="pf-header">
        <div className="pf-avatar-wrap">
          <div className="pf-avatar">{initials}</div>
          <div className="pf-avatar-glow" />
        </div>

        <div className="pf-header-info">
          <span className={`pf-role-badge ${user.role}`}>
            {user.role === "artist" ? "Artist" : "Listener"}
          </span>
          <h1 className="pf-name">
            {user.fullname.firstName} {user.fullname.lastName}
          </h1>
          <p className="pf-email">{user.email}</p>

          <div className="pf-stats">
            {user.role === "artist" ? (
              <>
                <div className="pf-stat">
                  <span className="pf-stat-value">{trackCount ?? "–"}</span>
                  <span className="pf-stat-label">Tracks</span>
                </div>
                <div className="pf-stat">
                  <span className="pf-stat-value">{followerCount ?? "–"}</span>
                  <span className="pf-stat-label">Followers</span>
                </div>
                <div className="pf-stat">
                  <span className="pf-stat-value">{artistPlaylistCount ?? "–"}</span>
                  <span className="pf-stat-label">Playlists</span>
                </div>
              </>
            ) : (
              <>
                <div className="pf-stat">
                  <span className="pf-stat-value">{likedIds.size}</span>
                  <span className="pf-stat-label">Liked</span>
                </div>
                <div className="pf-stat">
                  <span className="pf-stat-value">{userPlaylists.length}</span>
                  <span className="pf-stat-label">Playlists</span>
                </div>
                <div className="pf-stat">
                  <span className="pf-stat-value">{followedArtists.length}</span>
                  <span className="pf-stat-label">Following</span>
                </div>
              </>
            )}
          </div>

          <div className="pf-actions">
            {user.role === "artist" && (
              <button className="pf-btn-studio" onClick={() => navigate("/artist/dashboard")}>
                <StudioIcon /> Artist Studio
              </button>
            )}
            <button className="pf-btn-logout" onClick={handleLogout} disabled={loggingOut}>
              <LogoutIcon /> {loggingOut ? "Logging out…" : "Log out"}
            </button>
          </div>
        </div>
      </div>

      {/* ── User content sections ── */}
      {user.role !== "artist" && (
        <div className="pf-sections">

          {/* Recently Played */}
          <section className="pf-section">
            <h2 className="pf-section-title">Recently Played</h2>
            {history.length === 0 ? (
              <p className="pf-empty">No listening history yet. Play some tracks!</p>
            ) : (
              <div className="pf-track-list">
                {history.slice(0, 10).map((track, i) => (
                  <div key={track.id ?? i}
                    className={`pf-track-row${currentTrack?.id === (track.id ?? track._id) ? " is-playing" : ""}`}
                    onClick={() => playTrack(track, history)}>
                    <TrackCover src={track.coverImageUrl} alt={track.title} />
                    <div className="pf-track-info">
                      <span className="pf-track-name">{track.title}</span>
                      <span className="pf-track-artist">{track.artist}</span>
                    </div>
                    <button
                      className="pf-track-play"
                      title="Play"
                      onClick={(e) => { e.stopPropagation(); playTrack(track, history); }}
                    >
                      <PlayIcon />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* My Playlists */}
          <section className="pf-section">
            <h2 className="pf-section-title">My Playlists</h2>
            {userPlaylists.length === 0 ? (
              <p className="pf-empty">No playlists yet. Create one from the Home page!</p>
            ) : (
              <div className="pf-playlist-grid">
                {userPlaylists.map((pl) => (
                  <Link key={pl._id} to={`/user-playlist/${pl._id}`} className="pf-playlist-card">
                    <div className="pf-pl-icon"><PlaylistIcon /></div>
                    <div className="pf-pl-info">
                      <span className="pf-pl-title">{pl.title}</span>
                      <span className="pf-pl-count">
                        {pl.musics.length} {pl.musics.length === 1 ? "song" : "songs"}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Following */}
          <section className="pf-section">
            <h2 className="pf-section-title">Following</h2>
            {followedArtists.length === 0 ? (
              <p className="pf-empty">Not following anyone yet. Discover artists on their profiles!</p>
            ) : (
              <div className="pf-artist-list">
                {followedArtists.map((artist) => (
                  <Link key={artist.id} to={`/artist/${artist.id}`} className="pf-artist-row">
                    <div className="pf-artist-avatar">
                      {artist.name[0].toUpperCase()}
                    </div>
                    <div className="pf-artist-info">
                      <span className="pf-artist-name">{artist.name}</span>
                      <span className="pf-artist-followers">{artist.followerCount} followers</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

        </div>
      )}
    </div>
  );
}

function TrackCover({ src, alt }) {
  const [err, setErr] = useState(false);
  if (!src || err) {
    return (
      <div className="pf-track-cover pf-track-cover-fallback">
        <MusicNoteIcon />
      </div>
    );
  }
  return <img src={src} alt={alt} className="pf-track-cover" onError={() => setErr(true)} />;
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
function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}
function PlaylistIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
      <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}
function MusicNoteIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
      <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
    </svg>
  );
}
