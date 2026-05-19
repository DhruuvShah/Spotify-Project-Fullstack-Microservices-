import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { usePlayer } from "../context/PlayerContext";
import { useSocket } from "../context/SocketContext";
import "./PlaylistDetail.css";

function TrackCover({ src, alt }) {
  const [err, setErr] = useState(false);
  if (!src || err) return <div className="pd-cover pd-cover-fallback"><MusicNoteIcon /></div>;
  return <img src={src} alt={alt} className="pd-cover" onError={() => setErr(true)} />;
}

function PlaylistHeaderCover({ musics }) {
  const covers = musics.filter((m) => m.coverImageUrl).slice(0, 4);
  if (covers.length === 0) return <PlaylistBigIcon />;
  if (covers.length === 1)
    return <img src={covers[0].coverImageUrl} alt={covers[0].title} className="pd-cover-single" />;
  return (
    <div className="pd-cover-grid">
      {Array.from({ length: 4 }).map((_, i) =>
        covers[i] ? (
          <img key={i} src={covers[i].coverImageUrl} alt={covers[i].title} />
        ) : (
          <div key={i} className="pd-cover-grid-cell-empty" />
        )
      )}
    </div>
  );
}

export default function UserPlaylistDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { playTrack, currentTrack } = usePlayer();
  const { emitPlay } = useSocket();

  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    axios
      .get(`http://localhost:3002/api/music/user-playlist/${id}`, { withCredentials: true })
      .then((res) => setPlaylist(res.data.playlist))
      .catch(() => setError("Playlist not found."))
      .finally(() => setLoading(false));
  }, [id]);

  function removeSong(musicId) {
    axios
      .patch(`http://localhost:3002/api/music/user-playlist/${id}/remove/${musicId}`, {}, { withCredentials: true })
      .then(() => setPlaylist((prev) => ({
        ...prev,
        musics: prev.musics.filter((m) => (m.id ?? m._id) !== musicId),
      })))
      .catch(() => {});
  }

  if (loading) return <div className="pd-state"><div className="pd-spinner" /></div>;
  if (error || !playlist)
    return (
      <div className="pd-state pd-error">
        <p>{error || "Playlist not found."}</p>
        <button onClick={() => navigate(-1)}>Go back</button>
      </div>
    );

  const musics = Array.isArray(playlist.musics) ? playlist.musics : [];

  return (
    <div className="pd-root">
      <div className="pd-header">
        <button className="pd-back-btn" onClick={() => navigate(-1)}><ChevronLeftIcon /></button>
        <div className="pd-header-body">
          <div className="pd-header-cover">
            <PlaylistHeaderCover musics={musics} />
          </div>
          <div className="pd-header-info">
            <span className="pd-type">My Playlist</span>
            <h1 className="pd-title">{playlist.title}</h1>
            <p className="pd-count">{musics.length} {musics.length === 1 ? "song" : "songs"}</p>
          </div>
        </div>
      </div>

      <div className="pd-tracks">
        {musics.length === 0 ? (
          <p className="pd-empty">This playlist has no songs yet. Add songs from search or home!</p>
        ) : (
          musics.map((track, i) => (
            <div key={track.id ?? track._id ?? i}
              className={`pd-track-row${currentTrack?.id === (track.id ?? track._id) ? " is-playing" : ""}`}
              onClick={() => { emitPlay(track); playTrack(track, musics); }}>
              <span className="pd-track-num">{i + 1}</span>
              <TrackCover src={track.coverImageUrl} alt={track.title} />
              <div className="pd-track-info">
                <span className="pd-track-title">{track.title}</span>
                <span className="pd-track-artist">{track.artist}</span>
              </div>
              <div className="pd-track-play"><PlayIcon /></div>
              <button
                className="pd-remove-btn"
                title="Remove from playlist"
                onClick={(e) => { e.stopPropagation(); removeSong(track.id ?? track._id); }}
              >
                <XIcon />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function MusicNoteIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
    </svg>
  );
}
function PlaylistBigIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}
function PlayIcon() {
  return <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>;
}
function ChevronLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}
function XIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" width="14" height="14">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
