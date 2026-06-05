import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Play, Music } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { usePlayer } from "../context/PlayerContext";
import { useSocket } from "../context/SocketContext";
import "./ArtistProfile.css";
import { AUTH_URL, MUSIC_URL } from "../config.js";

function fmt(secs) {
  if (!secs) return "";
  return `${Math.floor(secs / 60)}:${String(Math.floor(secs % 60)).padStart(2, "0")}`;
}

function TrackCover({ src, alt }) {
  const [err, setErr] = useState(false);
  if (!src || err)
    return (
      <div className="ap-cover ap-cover-fallback" aria-hidden="true">
        <MusicNoteIcon />
      </div>
    );
  return (
    <img
      src={src}
      alt={alt}
      className="ap-cover"
      onError={() => setErr(true)}
      loading="lazy"
    />
  );
}

export default function ArtistProfile() {
  const { artistId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { playTrack, currentTrack } = usePlayer();
  const { emitPlay } = useSocket();

  const [artist, setArtist] = useState(null);
  const [musics, setMusics] = useState([]);
  const [albumCount, setAlbumCount] = useState(null);
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
        setFollowing(artistRes.data.artist.isFollowing ?? false);
        setMusics(musicRes.data.musics ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    axios
      .get(`${MUSIC_URL}/api/music/album/by-artist/${artistId}`, { withCredentials: true })
      .then((res) => setAlbumCount(res.data.albums?.length ?? 0))
      .catch(() => setAlbumCount(0));
  }, [artistId]);

  async function handleFollow() {
    if (!artist) return;
    setFollowLoading(true);
    try {
      if (following) {
        await axios.delete(`${AUTH_URL}/api/auth/follow/${artistId}`, { withCredentials: true });
        setFollowing(false);
        setArtist((a) => ({ ...a, followerCount: (a.followerCount ?? 1) - 1 }));
      } else {
        await axios.post(`${AUTH_URL}/api/auth/follow/${artistId}`, {}, { withCredentials: true });
        setFollowing(true);
        setArtist((a) => ({ ...a, followerCount: (a.followerCount ?? 0) + 1 }));
      }
    } catch {}
    setFollowLoading(false);
  }

  if (loading)
    return (
      <div className="ap-state">
        <div className="ap-spinner" />
      </div>
    );

  if (!artist)
    return (
      <div className="ap-state ap-error">
        <p>Artist not found.</p>
        <button onClick={() => navigate(-1)}>Go back</button>
      </div>
    );

  const isOwnProfile = user?.id === artistId;
  const initials = artist.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const bannerImg = musics.find((m) => m.coverImageUrl)?.coverImageUrl;

  return (
    <div className="ap-root">
      {/* ── Banner ── */}
      <div className="ap-banner">
        {bannerImg && (
          <img
            src={bannerImg}
            className="ap-banner-bg"
            alt=""
            aria-hidden="true"
          />
        )}
        <div className="ap-banner-overlay" />
        <div className="ap-banner-inner">
          <div className="ap-banner-avatar" aria-hidden="true">
            {initials}
          </div>
          <div className="ap-banner-info">
            <span className="ap-type-label">Artist</span>
            <h1 className="ap-banner-name">{artist.name}</h1>
            <p className="ap-banner-followers">
              {(artist.followerCount ?? 0).toLocaleString()} followers
            </p>
          </div>
        </div>
      </div>

      {/* ── Below banner: follow + stats ── */}
      <div className="ap-below-banner">
        {!isOwnProfile && (
          <button
            className={`ap-follow-btn${following ? " following" : ""}`}
            onClick={handleFollow}
            disabled={followLoading}
          >
            {following ? "Following" : "Follow"}
          </button>
        )}

        <div className="ap-stats-row">
          <div className="ap-stat-chip">
            <span className="ap-stat-num">{musics.length}</span>
            <span className="ap-stat-chip-label">Tracks</span>
          </div>
          <div className="ap-stat-chip">
            <span className="ap-stat-num">{albumCount ?? "–"}</span>
            <span className="ap-stat-chip-label">Albums</span>
          </div>
          <div className="ap-stat-chip">
            <span className="ap-stat-num">
              {(artist.followerCount ?? 0).toLocaleString()}
            </span>
            <span className="ap-stat-chip-label">Followers</span>
          </div>
        </div>
      </div>

      {/* ── Track list ── */}
      <section className="ap-tracks">
        <h2 className="ap-section-title">Popular</h2>
        {musics.length === 0 ? (
          <p className="ap-empty">No tracks uploaded yet.</p>
        ) : (
          <>
            <div className="ap-table-head">
              <span className="ap-th-num">#</span>
              <span />
              <span>Title</span>
              <span className="ap-th-dur">Duration</span>
            </div>

            {musics.map((track, i) => {
              const tid = track.id ?? track._id;
              const isActive =
                currentTrack?.id === tid || currentTrack?._id === tid;
              return (
                <div
                  key={tid ?? i}
                  className={`ap-track-row${isActive ? " is-playing" : ""}`}
                  onClick={() => {
                    emitPlay(track);
                    playTrack(track, musics);
                  }}
                >
                  {/* Index / play overlay */}
                  <div className="ap-idx">
                    <span className="ap-track-num">{i + 1}</span>
                    <button
                      className="ap-row-play"
                      onClick={(e) => {
                        e.stopPropagation();
                        emitPlay(track);
                        playTrack(track, musics);
                      }}
                      aria-label={`Play ${track.title}`}
                    >
                      <PlayIcon />
                    </button>
                  </div>

                  {/* Cover */}
                  <TrackCover src={track.coverImageUrl} alt={track.title} />

                  {/* Title + artist */}
                  <div className="ap-track-info">
                    <span className="ap-track-title">{track.title}</span>
                    <span className="ap-track-artist">{track.artist}</span>
                  </div>

                  {/* Duration */}
                  <span className="ap-track-duration">{fmt(track.duration)}</span>
                </div>
              );
            })}
          </>
        )}
      </section>
    </div>
  );
}

/* ── Icons — resolved via lucide-react imports at top ── */
function PlayIcon()      { return <Play  aria-hidden="true" />; }
function MusicNoteIcon() { return <Music aria-hidden="true" />; }
