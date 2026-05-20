import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { usePlayer } from "../context/PlayerContext";
import { useSocket } from "../context/SocketContext";
import "./ArtistProfile.css";
import { AUTH_URL, MUSIC_URL } from "../config.js";

export default function ArtistProfile() {
  const { artistId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { playTrack, currentTrack } = usePlayer();
  const { emitPlay } = useSocket();

  const [artist, setArtist] = useState(null);
  const [musics, setMusics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      axios.get(`${AUTH_URL}/api/auth/artist/${artistId}`, { withCredentials: true }),
      axios.get(`${MUSIC_URL}/api/music/by-artist/${artistId}`, { withCredentials: true }),
    ])
      .then(([artistRes, musicRes]) => {
        setArtist(artistRes.data.artist);
        setFollowing(artistRes.data.artist.isFollowing);
        setMusics(musicRes.data.musics);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [artistId]);

  async function handleFollow() {
    if (!artist) return;
    setFollowLoading(true);
    try {
      if (following) {
        await axios.delete(`${AUTH_URL}/api/auth/follow/${artistId}`, { withCredentials: true });
        setFollowing(false);
        setArtist((a) => ({ ...a, followerCount: a.followerCount - 1 }));
      } else {
        await axios.post(`${AUTH_URL}/api/auth/follow/${artistId}`, {}, { withCredentials: true });
        setFollowing(true);
        setArtist((a) => ({ ...a, followerCount: a.followerCount + 1 }));
      }
    } catch {}
    setFollowLoading(false);
  }

  if (loading) return <div className="ap-loading"><div className="ap-spinner" /></div>;
  if (!artist) return (
    <div className="ap-root">
      <p className="ap-error">Artist not found.</p>
      <button className="ap-back-btn" onClick={() => navigate(-1)}>← Go back</button>
    </div>
  );

  const isOwnProfile = user?.id === artistId;
  const initials = artist.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="ap-root">
      <button className="ap-back-btn" onClick={() => navigate(-1)} title="Go back" aria-label="Go back">
        <ChevronLeftIcon />
      </button>
      {/* ── Header ── */}
      <div className="ap-header">
        <div className="ap-avatar">{initials}</div>
        <div className="ap-header-info">
          <span className="ap-role-label">Artist</span>
          <h1 className="ap-name">{artist.name}</h1>
          <p className="ap-followers">{artist.followerCount} followers</p>

          {!isOwnProfile && (
            <button
              className={`ap-follow-btn ${following ? "following" : ""}`}
              onClick={handleFollow}
              disabled={followLoading}
            >
              {following ? "Following" : "Follow"}
            </button>
          )}
        </div>
      </div>

      {/* ── Tracks ── */}
      <section className="ap-section">
        <h2 className="ap-section-title">Tracks</h2>
        {musics.length === 0 ? (
          <p className="ap-empty">No tracks uploaded yet.</p>
        ) : (
          <div className="ap-track-list">
            {musics.map((music, i) => (
              <div key={music.id ?? music._id ?? i}
                className={`ap-track-row${currentTrack?.id === (music.id ?? music._id) ? " is-playing" : ""}`}
                onClick={() => { emitPlay(music); playTrack(music, musics); }}>
                <span className="ap-track-num">{i + 1}</span>
                <TrackCover src={music.coverImageUrl} alt={music.title} />
                <div className="ap-track-info">
                  <span className="ap-track-name">{music.title}</span>
                  <span className="ap-track-artist">{music.artist}</span>
                </div>
                <button className="ap-play-btn" title="Play"
                  onClick={(e) => { e.stopPropagation(); emitPlay(music); playTrack(music, musics); }}>
                  <PlayIcon />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function TrackCover({ src, alt }) {
  const [err, setErr] = useState(false);
  if (!src || err)
    return <div className="ap-track-cover ap-track-cover-fallback"><MusicNoteIcon /></div>;
  return <img src={src} alt={alt} className="ap-track-cover" onError={() => setErr(true)} />;
}

function ChevronLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}
function PlayIcon() {
  return <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><polygon points="5 3 19 12 5 21 5 3" /></svg>;
}
function MusicNoteIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
      <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
    </svg>
  );
}
