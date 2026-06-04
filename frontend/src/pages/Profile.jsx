import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { usePlayer } from "../context/PlayerContext";
import { useSocket } from "../context/SocketContext";
import "./Profile.css";
import { AUTH_URL, MUSIC_URL } from "../config.js";

const GRADIENTS = [
  "linear-gradient(135deg, #c84b31, #7a2414)",
  "linear-gradient(135deg, #6d5098, #3d2b5e)",
  "linear-gradient(135deg, #c9a82b, #8c7018)",
  "linear-gradient(135deg, #c84b31, #6d5098)",
  "linear-gradient(135deg, #a6331b, #6d5098)",
  "linear-gradient(135deg, #8b6fc2, #4a3570)",
];

function fmt(secs) {
  if (!secs) return "";
  return `${Math.floor(secs / 60)}:${String(Math.floor(secs % 60)).padStart(2, "0")}`;
}

function TrackCover({ src, alt }) {
  const [err, setErr] = useState(false);
  if (!src || err)
    return (
      <div className="pf-cover pf-cover-fallback" aria-hidden="true">
        <MusicNoteIcon />
      </div>
    );
  return (
    <img
      src={src}
      alt={alt}
      className="pf-cover"
      onError={() => setErr(true)}
      loading="lazy"
      decoding="async"
    />
  );
}

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { playTrack, currentTrack } = usePlayer();
  const { emitPlay } = useSocket();

  const [loggingOut, setLoggingOut] = useState(false);
  const [activeTab, setActiveTab] = useState("liked");

  // Artist stats
  const [trackCount, setTrackCount] = useState(null);
  const [followerCount, setFollowerCount] = useState(null);
  const [artistPlaylistCount, setArtistPlaylistCount] = useState(null);

  // User data
  const [likedTracks, setLikedTracks] = useState([]);
  const [likedLoading, setLikedLoading] = useState(false);
  const [userPlaylists, setUserPlaylists] = useState([]);
  const [followedArtists, setFollowedArtists] = useState([]);

  useEffect(() => {
    if (!user) return;

    if (user.role === "artist") {
      axios.get(`${MUSIC_URL}/api/music/artist-musics`, { withCredentials: true })
        .then((res) => setTrackCount(res.data.musics.length))
        .catch(() => setTrackCount(0));
      axios.get(`${MUSIC_URL}/api/music/playlist/artist`, { withCredentials: true })
        .then((res) => setArtistPlaylistCount(res.data.playlists.length))
        .catch(() => setArtistPlaylistCount(0));
      axios.get(`${AUTH_URL}/api/auth/artist/${user.id}`, { withCredentials: true })
        .then((res) => setFollowerCount(res.data.artist.followerCount))
        .catch(() => setFollowerCount(0));
    } else {
      setLikedLoading(true);
      axios.get(`${MUSIC_URL}/api/music/liked-tracks`, { withCredentials: true })
        .then((res) => setLikedTracks(res.data.musics ?? []))
        .catch(() => setLikedTracks([]))
        .finally(() => setLikedLoading(false));
      axios.get(`${MUSIC_URL}/api/music/user-playlists`, { withCredentials: true })
        .then((res) => setUserPlaylists(res.data.playlists))
        .catch(() => setUserPlaylists([]));
      axios.get(`${AUTH_URL}/api/auth/following`, { withCredentials: true })
        .then((res) => setFollowedArtists(res.data.artists))
        .catch(() => setFollowedArtists([]));
    }
  }, [user]);

  // Re-sync when another device mutates follows, playlists, or likes
  useEffect(() => {
    function onFollows() {
      axios.get(`${AUTH_URL}/api/auth/following`, { withCredentials: true })
        .then((res) => setFollowedArtists(res.data.artists))
        .catch(() => {});
    }
    function onPlaylists() {
      axios.get(`${MUSIC_URL}/api/music/user-playlists`, { withCredentials: true })
        .then((res) => setUserPlaylists(res.data.playlists))
        .catch(() => {});
    }
    function onLikes() {
      if (user?.role === "artist") return;
      axios.get(`${MUSIC_URL}/api/music/liked-tracks`, { withCredentials: true })
        .then((res) => setLikedTracks(res.data.musics ?? []))
        .catch(() => {});
    }
    window.addEventListener("lumina:sync:follows",   onFollows);
    window.addEventListener("lumina:sync:playlists", onPlaylists);
    window.addEventListener("lumina:sync:likes",     onLikes);
    return () => {
      window.removeEventListener("lumina:sync:follows",   onFollows);
      window.removeEventListener("lumina:sync:playlists", onPlaylists);
      window.removeEventListener("lumina:sync:likes",     onLikes);
    };
  }, [user?.role]);

  async function handleLogout() {
    setLoggingOut(true);
    await logout();
    navigate("/login");
  }

  async function handleUnfollow(artistId) {
    try {
      await axios.delete(`${AUTH_URL}/api/auth/follow/${artistId}`, { withCredentials: true });
      setFollowedArtists((prev) => prev.filter((a) => a.id !== artistId));
    } catch {}
  }

  if (!user) return null;

  const initials = ((user.fullname?.firstName?.[0] ?? "") + (user.fullname?.lastName?.[0] ?? "")).toUpperCase() || "?";
  const fullName = `${user.fullname?.firstName ?? ""} ${user.fullname?.lastName ?? ""}`.trim();

  return (
    <div className="pf-root">

      {/* ── Header ── */}
      <div className="pf-header">
        <div className="pf-avatar" aria-hidden="true">{initials}</div>

        <div className="pf-header-info">
          <span className={`pf-role-badge${user.role === "artist" ? " artist" : ""}`}>
            {user.role === "artist" ? "Artist" : "Listener"}
          </span>
          <h1 className="pf-name">{fullName}</h1>
          <p className="pf-email">{user.email}</p>

          <div className="pf-stats-row">
            {user.role === "artist" ? (
              <>
                <div className="pf-stat-chip">
                  <span className="pf-stat-num">{trackCount ?? "–"}</span>
                  <span className="pf-stat-label">Tracks</span>
                </div>
                <div className="pf-stat-chip">
                  <span className="pf-stat-num">{followerCount ?? "–"}</span>
                  <span className="pf-stat-label">Followers</span>
                </div>
                <div className="pf-stat-chip">
                  <span className="pf-stat-num">{artistPlaylistCount ?? "–"}</span>
                  <span className="pf-stat-label">Playlists</span>
                </div>
              </>
            ) : (
              <>
                <div className="pf-stat-chip">
                  <span className="pf-stat-num">{likedLoading ? "–" : likedTracks.length}</span>
                  <span className="pf-stat-label">Liked</span>
                </div>
                <div className="pf-stat-chip">
                  <span className="pf-stat-num">{likedLoading ? "–" : userPlaylists.length}</span>
                  <span className="pf-stat-label">Playlists</span>
                </div>
                <div className="pf-stat-chip">
                  <span className="pf-stat-num">{likedLoading ? "–" : followedArtists.length}</span>
                  <span className="pf-stat-label">Following</span>
                </div>
              </>
            )}
          </div>

          <div className="pf-actions">
            {user.role === "artist" && (
              <button
                className="pf-btn-studio"
                onClick={() => navigate("/artist/dashboard")}
                aria-label="Open Artist Studio"
              >
                <StudioIcon /> Artist Studio
              </button>
            )}
            <button
              className="pf-btn-logout"
              onClick={handleLogout}
              disabled={loggingOut}
              aria-label="Log out"
            >
              <LogoutIcon /> {loggingOut ? "Logging out…" : "Log out"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Listener content ── */}
      {user.role !== "artist" && (
        <div className="pf-content">

          {/* Tab nav */}
          <nav className="pf-tabs" role="tablist" aria-label="Profile sections">
            {[
              { key: "liked",     label: "Liked Songs"  },
              { key: "playlists", label: "My Playlists" },
              { key: "following", label: "Following"    },
            ].map((t) => (
              <button
                key={t.key}
                role="tab"
                className={`pf-tab${activeTab === t.key ? " active" : ""}`}
                onClick={() => setActiveTab(t.key)}
                aria-selected={activeTab === t.key}
              >
                {t.label}
              </button>
            ))}
          </nav>

          {/* ── Liked Songs ── */}
          {activeTab === "liked" && (
            <section className="pf-section">
              {likedLoading ? (
                <div className="pf-spinner-wrap"><div className="pf-spinner" aria-label="Loading" /></div>
              ) : likedTracks.length === 0 ? (
                <p className="pf-empty">No liked songs yet. Heart a track to save it here!</p>
              ) : (
                <>
                  <div className="pf-table-head" aria-hidden="true">
                    <span className="pf-th-num">#</span>
                    <span />
                    <span>Title</span>
                    <span className="pf-th-dur">Duration</span>
                  </div>
                  {likedTracks.map((track, i) => {
                    const tid = track.id ?? track._id;
                    const isActive = currentTrack?.id === tid || currentTrack?._id === tid;
                    return (
                      <div
                        key={tid ?? i}
                        className={`pf-track-row${isActive ? " is-playing" : ""}`}
                        onClick={() => { emitPlay(track); playTrack(track, likedTracks); }}
                      >
                        <div className="pf-idx">
                          <span className="pf-track-num">{i + 1}</span>
                          <button
                            className="pf-row-play"
                            onClick={(e) => { e.stopPropagation(); emitPlay(track); playTrack(track, likedTracks); }}
                            aria-label={`Play ${track.title}`}
                          >
                            <PlayIcon />
                          </button>
                        </div>
                        <TrackCover src={track.coverImageUrl} alt={track.title} />
                        <div className="pf-track-info">
                          <span className="pf-track-title">{track.title}</span>
                          <span className="pf-track-artist">{track.artist}</span>
                        </div>
                        <span className="pf-track-duration">{fmt(track.duration)}</span>
                      </div>
                    );
                  })}
                </>
              )}
            </section>
          )}

          {/* ── My Playlists ── */}
          {activeTab === "playlists" && (
            <section className="pf-section">
              {userPlaylists.length === 0 ? (
                <p className="pf-empty">No playlists yet. Create one from the Home page!</p>
              ) : (
                <div className="pf-playlist-grid">
                  {userPlaylists.map((pl, i) => (
                    <Link
                      key={pl._id}
                      to={`/user-playlist/${pl._id}`}
                      className="pf-playlist-card"
                      aria-label={`Open playlist ${pl.title}`}
                    >
                      <div className="pf-pl-art" style={{ background: GRADIENTS[i % GRADIENTS.length] }}>
                        <PlaylistIcon />
                      </div>
                      <div className="pf-pl-info">
                        <span className="pf-pl-title">{pl.title}</span>
                        <span className="pf-pl-count">
                          {pl.musics?.length ?? 0} {(pl.musics?.length ?? 0) === 1 ? "song" : "songs"}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* ── Following ── */}
          {activeTab === "following" && (
            <section className="pf-section">
              {followedArtists.length === 0 ? (
                <p className="pf-empty">Not following anyone yet. Discover artists on their profiles!</p>
              ) : (
                <div className="pf-artist-grid">
                  {followedArtists.map((artist) => (
                    <div key={artist.id} className="pf-artist-card">
                      <Link to={`/artist/${artist.id}`} className="pf-artist-card-link">
                        <div className="pf-artist-avatar" aria-hidden="true">
                          {artist.name?.[0]?.toUpperCase() ?? "?"}
                        </div>
                        <div className="pf-artist-card-info">
                          <span className="pf-artist-name">{artist.name}</span>
                          <span className="pf-following-chip">Following</span>
                          {artist.followerCount != null && (
                            <span className="pf-artist-followers">
                              {artist.followerCount.toLocaleString()} followers
                            </span>
                          )}
                        </div>
                      </Link>
                      <button
                        className="pf-unfollow-btn"
                        onClick={() => handleUnfollow(artist.id)}
                        aria-label={`Unfollow ${artist.name}`}
                      >
                        Unfollow
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

        </div>
      )}
    </div>
  );
}

/* ── Icons ── */
function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}
function PlaylistIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="28" height="28" aria-hidden="true">
      <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}
function MusicNoteIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
    </svg>
  );
}
function StudioIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true">
      <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
    </svg>
  );
}
function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="16" height="16" aria-hidden="true">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
