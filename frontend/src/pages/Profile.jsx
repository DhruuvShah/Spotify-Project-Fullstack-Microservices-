import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { Play, ListMusic, Music, Music2, LogOut } from "lucide-react";
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

/* ── 2×2 cover collage for playlist cards ── */
function PlaylistCover({ musics, gradient }) {
  const covers = (musics ?? []).filter((m) => m.coverImageUrl).slice(0, 4);
  if (covers.length === 0)
    return (
      <div className="pf-pl-art" style={{ background: gradient }}>
        <PlaylistIcon />
      </div>
    );
  if (covers.length === 1)
    return (
      <div className="pf-pl-art pf-pl-art--single">
        <img src={covers[0].coverImageUrl} alt={covers[0].title} loading="lazy" decoding="async" />
      </div>
    );
  return (
    <div className="pf-pl-art pf-pl-art--grid">
      {Array.from({ length: 4 }).map((_, i) =>
        covers[i] ? (
          <img key={i} src={covers[i].coverImageUrl} alt={covers[i].title} loading="lazy" decoding="async" />
        ) : (
          <div key={i} className="pf-pl-art-empty" style={{ background: gradient }} />
        )
      )}
    </div>
  );
}

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
    }

    // Liked songs, personal playlists, and following — available to every account, artist or not
    setLikedLoading(true);
    axios.get(`${MUSIC_URL}/api/music/liked-tracks`, { withCredentials: true })
      .then((res) => setLikedTracks(res.data.musics ?? []))
      .catch(() => setLikedTracks([]))
      .finally(() => setLikedLoading(false));
    axios.get(`${MUSIC_URL}/api/music/user-playlists`, { withCredentials: true })
      .then(async (res) => {
        const basic = res.data.playlists;
        const detailed = await Promise.all(
          basic.map(async (pl) => {
            const id = pl._id ?? pl.id;
            if (!pl.musics || pl.musics.length === 0) return { ...pl, id, musics: [] };
            try {
              const r = await axios.get(`${MUSIC_URL}/api/music/user-playlist/${id}`, { withCredentials: true });
              return r.data.playlist;
            } catch {
              return { ...pl, id, musics: [] };
            }
          })
        );
        setUserPlaylists(detailed);
      })
      .catch(() => setUserPlaylists([]));
    axios.get(`${AUTH_URL}/api/auth/following`, { withCredentials: true })
      .then((res) => setFollowedArtists(res.data.artists))
      .catch(() => setFollowedArtists([]));
  }, [user]);

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
            {user.role === "artist" && (
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
            )}
            <div className="pf-stat-chip">
              <span className="pf-stat-num">{likedLoading ? "–" : likedTracks.length}</span>
              <span className="pf-stat-label">Liked</span>
            </div>
            {user.role !== "artist" && (
              <div className="pf-stat-chip">
                <span className="pf-stat-num">{likedLoading ? "–" : userPlaylists.length}</span>
                <span className="pf-stat-label">Playlists</span>
              </div>
            )}
            <div className="pf-stat-chip">
              <span className="pf-stat-num">{likedLoading ? "–" : followedArtists.length}</span>
              <span className="pf-stat-label">Following</span>
            </div>
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

      {/* ── Liked / Playlists / Following content ── */}
      {(() => {
        const tabs = user.role === "artist"
          ? [
              { key: "liked",     label: "Liked Songs" },
              { key: "following", label: "Following"   },
            ]
          : [
              { key: "liked",     label: "Liked Songs"  },
              { key: "playlists", label: "My Playlists" },
              { key: "following", label: "Following"    },
            ];
        return (
        <div className="pf-content">

          {/* Tab nav */}
          <nav className="pf-tabs" role="tablist" aria-label="Profile sections">
            {tabs.map((t) => (
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
                    <span className="pf-th-num"></span>
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
                      <PlaylistCover musics={pl.musics} gradient={GRADIENTS[i % GRADIENTS.length]} />
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
        );
      })()}
    </div>
  );
}

/* ── Icons — resolved via lucide-react imports at top ── */
function PlayIcon()    { return <Play     aria-hidden="true" />; }
function PlaylistIcon() { return <ListMusic width={28} height={28} aria-hidden="true" />; }
function MusicNoteIcon() { return <Music   aria-hidden="true" />; }
function StudioIcon()  { return <Music2   width={16} height={16} aria-hidden="true" />; }
function LogoutIcon()  { return <LogOut   width={16} height={16} aria-hidden="true" />; }
