import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./ArtistDashboard.css";
import axios from "axios";
import { ListMusic, Plus, Play, Music, Pencil, Trash2, Check, X, Search } from "lucide-react";
import { usePlayer } from "../../context/PlayerContext";
import { useToast } from "../../context/ToastContext";
import { Modal } from "../../components/Modal.jsx";
import { ConfirmModal } from "../../components/ConfirmModal.jsx";
import { MUSIC_URL } from "../../config.js";

/* ── Playlist cover: 2×2 grid of first 4 music covers ── */
function PlaylistCover({ musics }) {
  const covers = musics.slice(0, 4);
  if (covers.length === 0)
    return <div className="pl-cover pl-cover-empty"><PlaylistIcon /></div>;
  if (covers.length === 1)
    return (
      <div className="pl-cover pl-cover-single">
        <img src={covers[0].coverImageUrl} alt={covers[0].title} loading="lazy" decoding="async" />
      </div>
    );
  return (
    <div className="pl-cover pl-cover-grid">
      {Array.from({ length: 4 }).map((_, i) => {
        const m = covers[i];
        return m ? (
          <img key={i} src={m.coverImageUrl} alt={m.title} className="pl-cover-cell" loading="lazy" decoding="async" />
        ) : (
          <div key={i} className="pl-cover-cell pl-cover-cell-empty" />
        );
      })}
    </div>
  );
}

/* ── Track cover with img + fallback ── */
function TrackCover({ src, alt }) {
  const [err, setErr] = useState(false);
  if (!src || err)
    return <div className="track-cover track-cover-fallback"><MusicNoteIcon /></div>;
  return <img src={src} alt={alt} className="track-cover track-cover-img" onError={() => setErr(true)} loading="lazy" decoding="async" />;
}

/* ── Create / Rename Modal (uses shared Modal component) ── */
function CreateModal({ title: modalTitle, placeholder, initialValue = "", submitLabel = "Create", onClose, onCreate }) {
  const [value, setValue] = useState(initialValue);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (!value.trim()) { setError(`${placeholder} is required`); return; }
    setLoading(true);
    onCreate(value.trim(), setError, setLoading);
  }

  return (
    <Modal open={true} onClose={onClose} title={modalTitle}>
      <form onSubmit={handleSubmit} className="ad-modal-form">
        <input
          type="text"
          className="ad-modal-input"
          placeholder={placeholder}
          value={value}
          maxLength={100}
          onChange={(e) => setValue(e.target.value)}
          autoFocus
        />
        {error && <p className="ad-modal-error">{error}</p>}
        <div className="ad-modal-actions">
          <button type="button" className="ad-modal-cancel" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="ad-modal-create" disabled={loading}>
            {loading ? `${submitLabel}…` : submitLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ── Song Picker Modal (own backdrop, has search + click-to-add) ── */
function SongPickerModal({ targetTitle, type, targetId, allTracks, currentMusics, onAdded, onClose }) {
  const { toast } = useToast();
  const [justAddedIds, setJustAddedIds] = useState(new Set());
  const [search, setSearch] = useState("");
  const searchRef = useRef(null);

  useEffect(() => { searchRef.current?.focus(); }, []);

  const currentIds = new Set(currentMusics.map((m) => String(m.id ?? m._id)));
  const available = allTracks.filter((t) => {
    const id = String(t._id ?? t.id);
    return !currentIds.has(id) && !justAddedIds.has(id);
  });
  const filtered = search.trim()
    ? available.filter(
        (t) =>
          t.title.toLowerCase().includes(search.toLowerCase()) ||
          (t.artist || "").toLowerCase().includes(search.toLowerCase())
      )
    : available;

  function addTrack(track) {
    const musicId = String(track._id ?? track.id);
    const url =
      type === "playlist"
        ? `${MUSIC_URL}/api/music/user-playlist/${targetId}/add/${musicId}`
        : `${MUSIC_URL}/api/music/album/${targetId}/add/${musicId}`;

    axios
      .patch(url, {}, { withCredentials: true })
      .then(() => {
        setJustAddedIds((prev) => new Set([...prev, musicId]));
        onAdded(type, targetId, track);
        toast.success(`Added to ${type}`);
      })
      .catch(() => { toast.error("Failed to add track"); });
  }

  return (
    <div
      className="ad-modal-backdrop"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="ad-modal ad-picker-modal">
        <h2 className="ad-modal-title">Add song to "{targetTitle}"</h2>

        {/* Search */}
        <div className="ad-picker-search-wrap">
          <SearchIcon />
          <input
            ref={searchRef}
            type="text"
            className="ad-picker-search"
            placeholder="Search tracks…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="ad-picker-list">
          {filtered.length === 0 ? (
            <p className="ad-picker-empty">
              {search ? "No matching tracks." : `All your tracks are already in this ${type}.`}
            </p>
          ) : (
            filtered.map((track) => {
              const id = String(track._id ?? track.id);
              return (
                <div key={id} className="ad-picker-row" onClick={() => addTrack(track)}>
                  <TrackCover src={track.coverImageUrl} alt={track.title} />
                  <div className="ad-picker-info">
                    <span className="ad-picker-name">{track.title}</span>
                    <span className="ad-picker-artist">{track.artist}</span>
                  </div>
                  <span className="ad-picker-add" aria-hidden="true"><PlusIcon /></span>
                </div>
              );
            })
          )}
        </div>

        <hr className="ad-picker-divider" />
        <div className="ad-modal-actions">
          <button className="ad-modal-cancel" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Component ── */
export default function ArtistDashboard() {
  const navigate = useNavigate();
  const { playTrack, currentTrack } = usePlayer();
  const { toast } = useToast();

  const [musics, setMusics] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [showCreateAlbum, setShowCreateAlbum] = useState(false);
  const [activeTab, setActiveTab] = useState("tracks");
  const [addSongTarget, setAddSongTarget] = useState(null);
  const [renameTarget, setRenameTarget] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [confirmState, setConfirmState] = useState({ open: false, message: "", onConfirm: null });

  useEffect(() => {
    axios.get(`${MUSIC_URL}/api/music/artist-musics`, { withCredentials: true })
      .then((res) => setMusics(res.data.musics.map((m) => ({ ...m, id: m._id ?? m.id }))))
      .catch(() => {});
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
        setPlaylists(detailed);
      })
      .catch(() => {});
    axios.get(`${MUSIC_URL}/api/music/album/artist`, { withCredentials: true })
      .then((res) => setAlbums(res.data.albums))
      .catch(() => setAlbums([]));
  }, []);

  useEffect(() => {
    if (activeTab !== "analytics") return;
    setAnalyticsLoading(true);
    axios.get(`${MUSIC_URL}/api/music/analytics`, { withCredentials: true })
      .then((res) => setAnalytics(res.data))
      .catch(() => setAnalytics(null))
      .finally(() => setAnalyticsLoading(false));
  }, [activeTab]);

  function startEdit(e, music) {
    e.stopPropagation();
    setEditingId(music._id ?? music.id);
    setEditTitle(music.title);
  }

  function saveEdit(e, musicId) {
    e.stopPropagation();
    if (!editTitle.trim()) return;
    axios
      .patch(`${MUSIC_URL}/api/music/${musicId}`, { title: editTitle.trim() }, { withCredentials: true })
      .then((res) => {
        setMusics((prev) =>
          prev.map((m) => (m._id ?? m.id) === musicId ? { ...m, title: res.data.music.title } : m)
        );
        setEditingId(null);
        toast.success("Track updated");
      })
      .catch(() => { toast.error("Failed to update track"); });
  }

  function cancelEdit(e) {
    e.stopPropagation();
    setEditingId(null);
  }

  function deleteMusic(e, musicId) {
    e.stopPropagation();
    setConfirmState({
      open: true,
      message: "Delete this track? This cannot be undone.",
      onConfirm: () => {
        axios
          .delete(`${MUSIC_URL}/api/music/${musicId}`, { withCredentials: true })
          .then(() => { setMusics((prev) => prev.filter((m) => (m._id ?? m.id) !== musicId)); toast.success("Track deleted"); })
          .catch(() => { toast.error("Failed to delete track"); });
      },
    });
  }

  function handleCreatePlaylist(title, setError, setLoading) {
    axios.post(`${MUSIC_URL}/api/music/user-playlist`, { title }, { withCredentials: true })
      .then((res) => {
        setPlaylists((prev) => [...prev, { ...res.data.playlist, musics: [] }]);
        setShowCreatePlaylist(false);
        toast.success("Playlist created");
      })
      .catch((err) => {
        setError(err.response?.data?.message || "Failed to create playlist");
        setLoading(false);
      });
  }

  function handleCreateAlbum(title, setError, setLoading) {
    axios.post(`${MUSIC_URL}/api/music/album`, { title }, { withCredentials: true })
      .then((res) => {
        setAlbums((prev) => [{ ...res.data.album, musics: [] }, ...prev]);
        setShowCreateAlbum(false);
        toast.success("Album created");
      })
      .catch((err) => {
        setError(err.response?.data?.message || "Failed to create album");
        setLoading(false);
      });
  }

  function handleSongAdded(type, targetId, track) {
    const musicObj = { ...track, id: track._id ?? track.id };
    if (type === "playlist") {
      setPlaylists((prev) =>
        prev.map((pl) =>
          String(pl.id ?? pl._id) === targetId
            ? { ...pl, musics: [...(pl.musics ?? []), musicObj] }
            : pl
        )
      );
    } else {
      setAlbums((prev) =>
        prev.map((al) =>
          String(al.id ?? al._id) === targetId
            ? { ...al, musics: [...(al.musics ?? []), musicObj] }
            : al
        )
      );
    }
  }

  function removeFromPlaylist(playlistId, musicId) {
    axios
      .patch(`${MUSIC_URL}/api/music/user-playlist/${playlistId}/remove/${musicId}`, {}, { withCredentials: true })
      .then(() => {
        setPlaylists((prev) =>
          prev.map((pl) =>
            String(pl.id ?? pl._id) === String(playlistId)
              ? { ...pl, musics: pl.musics.filter((m) => String(m.id ?? m._id) !== String(musicId)) }
              : pl
          )
        );
        toast.success("Removed from playlist");
      })
      .catch(() => { toast.error("Failed to remove track"); });
  }

  function removeFromAlbum(albumId, musicId) {
    axios
      .patch(`${MUSIC_URL}/api/music/album/${albumId}/remove/${musicId}`, {}, { withCredentials: true })
      .then(() => {
        setAlbums((prev) =>
          prev.map((al) =>
            String(al.id ?? al._id) === String(albumId)
              ? { ...al, musics: al.musics.filter((m) => String(m.id ?? m._id) !== String(musicId)) }
              : al
          )
        );
        toast.success("Removed from album");
      })
      .catch(() => { toast.error("Failed to remove track"); });
  }

  function deletePlaylist(playlistId) {
    setConfirmState({
      open: true,
      message: "Delete this playlist? This cannot be undone.",
      onConfirm: () => {
        axios
          .delete(`${MUSIC_URL}/api/music/user-playlist/${playlistId}`, { withCredentials: true })
          .then(() => { setPlaylists((prev) => prev.filter((pl) => String(pl.id ?? pl._id) !== String(playlistId))); toast.success("Playlist deleted"); })
          .catch(() => { toast.error("Failed to delete playlist"); });
      },
    });
  }

  function deleteAlbum(albumId) {
    setConfirmState({
      open: true,
      message: "Delete this album? This cannot be undone.",
      onConfirm: () => {
        axios
          .delete(`${MUSIC_URL}/api/music/album/${albumId}`, { withCredentials: true })
          .then(() => { setAlbums((prev) => prev.filter((al) => String(al.id ?? al._id) !== String(albumId))); toast.success("Album deleted"); })
          .catch(() => { toast.error("Failed to delete album"); });
      },
    });
  }

  function handleRename(newTitle, setError, setLoading) {
    const { type, id } = renameTarget;
    const url =
      type === "playlist"
        ? `${MUSIC_URL}/api/music/user-playlist/${id}`
        : `${MUSIC_URL}/api/music/album/${id}`;
    axios
      .patch(url, { title: newTitle }, { withCredentials: true })
      .then(() => {
        if (type === "playlist") {
          setPlaylists((prev) =>
            prev.map((pl) => String(pl.id ?? pl._id) === id ? { ...pl, title: newTitle } : pl)
          );
        } else {
          setAlbums((prev) =>
            prev.map((al) => String(al.id ?? al._id) === id ? { ...al, title: newTitle } : al)
          );
        }
        setRenameTarget(null);
        toast.success("Renamed successfully");
      })
      .catch((err) => {
        setError(err.response?.data?.message || "Failed to rename");
        setLoading(false);
      });
  }

  const TABS = [
    { key: "tracks",    label: "Music"     },
    { key: "playlists", label: "Playlists" },
    { key: "albums",    label: "Albums"    },
    { key: "analytics", label: "Analytics" },
  ];

  return (
    <div className="ad-root">
      <main className="ad-main">

        {/* ── Tab nav ── */}
        <nav className="ad-tabs" aria-label="Dashboard sections">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              className={`ad-tab${activeTab === tab.key ? " active" : ""}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* ══ MY MUSIC ══ */}
        {activeTab === "tracks" && (
          <section className="ad-section">
            <div className="ad-section-header">
              <div>
                <h1 className="ad-section-title">Music</h1>
                <p className="ad-section-sub">{musics.length} tracks</p>
              </div>
              <button className="ad-btn-primary" onClick={() => navigate("/artist/dashboard/upload-music")}>
                <PlusIcon /> Upload Track
              </button>
            </div>

            <div className="ad-track-list">
              <div className="ad-track-header">
                <span className="col-num"></span>
                <span className="col-title">Title</span>
                <span className="col-artist">Artist</span>
                <span className="col-play" />
                <span className="col-actions" />
              </div>

              {musics.length === 0 && (
                <p className="ad-empty">No tracks yet. Upload your first!</p>
              )}

              {musics.map((music, i) => {
                const id = music._id ?? music.id;
                const isEditing = editingId === id;
                return (
                  <div
                    key={id ?? i}
                    className={`ad-track-row${!isEditing && currentTrack?.id === id ? " is-playing" : ""}`}
                    onClick={() => !isEditing && playTrack(music, musics)}
                  >
                    <span className="col-num track-num">{i + 1}</span>

                    <div className="col-title track-title-cell">
                      <TrackCover src={music.coverImageUrl} alt={music.title} />
                      {isEditing ? (
                        <input
                          className="ad-edit-input"
                          value={editTitle}
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEdit(e, id);
                            if (e.key === "Escape") cancelEdit(e);
                          }}
                        />
                      ) : (
                        <span className="track-name">{music.title}</span>
                      )}
                    </div>

                    <span className="col-artist track-artist">{music.artist}</span>

                    <div className="col-play">
                      <button
                        className="track-play-btn"
                        title="Play"
                        onClick={(e) => { e.stopPropagation(); playTrack(music, musics); }}
                      >
                        <PlayIcon />
                      </button>
                    </div>

                    <div className="col-actions" onClick={(e) => e.stopPropagation()}>
                      {isEditing ? (
                        <>
                          <button className="ad-action-btn save" title="Save" onClick={(e) => saveEdit(e, id)}>
                            <CheckIcon />
                          </button>
                          <button className="ad-action-btn" title="Cancel" onClick={cancelEdit}>
                            <XIcon />
                          </button>
                        </>
                      ) : (
                        <>
                          <button className="ad-action-btn" title="Edit" onClick={(e) => startEdit(e, music)}>
                            <PencilIcon />
                          </button>
                          <button className="ad-action-btn danger" title="Delete" onClick={(e) => deleteMusic(e, id)}>
                            <TrashIcon />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ══ PLAYLISTS ══ */}
        {activeTab === "playlists" && (
          <section className="ad-section">
            <div className="ad-section-header">
              <div>
                <h1 className="ad-section-title">Playlists</h1>
                <p className="ad-section-sub">{playlists.length} playlists</p>
              </div>
              <button className="ad-btn-primary" onClick={() => setShowCreatePlaylist(true)}>
                <PlusIcon /> New Playlist
              </button>
            </div>

            {playlists.length === 0 ? (
              <p className="ad-empty">No playlists yet. Create your first one!</p>
            ) : (
              <div className="ad-playlist-grid">
                {playlists.map((pl, i) => {
                  const plId = String(pl.id ?? pl._id ?? i);
                  return (
                    <div key={plId} className="ad-playlist-card">
                      <PlaylistCover musics={pl.musics ?? []} />
                      <div className="pl-info">
                        <div className="pl-info-text">
                          <span className="pl-title">{pl.title}</span>
                          <span className="pl-artist">{pl.artist}</span>
                          <span className="pl-count">
                            {(pl.musics ?? []).length} {(pl.musics ?? []).length === 1 ? "song" : "songs"}
                          </span>
                        </div>
                        <button
                          className="pl-add-song-btn"
                          title="Add song"
                          onClick={() => setAddSongTarget({ type: "playlist", id: plId, title: pl.title, currentMusics: pl.musics ?? [] })}
                        >
                          <PlusIcon />
                        </button>
                      </div>
                      {(pl.musics ?? []).length > 0 && (
                        <div className="pl-songs">
                          {pl.musics.map((m, idx) => {
                            const mId = String(m.id ?? m._id ?? idx);
                            return (
                              <div key={mId} className="pl-song-row">
                                <TrackCover src={m.coverImageUrl} alt={m.title} />
                                <div className="pl-song-info">
                                  <span className="pl-song-title">{m.title}</span>
                                  <span className="pl-song-artist">{m.artist}</span>
                                </div>
                                <button
                                  className="pl-song-play"
                                  title="Play"
                                  onClick={(e) => { e.stopPropagation(); playTrack(m, pl.musics); }}
                                >
                                  <PlayIcon />
                                </button>
                                <button
                                  className="pl-song-remove"
                                  title="Remove from playlist"
                                  onClick={(e) => { e.stopPropagation(); removeFromPlaylist(plId, mId); }}
                                >
                                  <XSmallIcon />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      <div className="pl-card-actions">
                        <button
                          className="pl-card-btn"
                          onClick={() => setRenameTarget({ type: "playlist", id: plId, currentTitle: pl.title })}
                        >
                          <PencilIcon /> Rename
                        </button>
                        <button className="pl-card-btn danger" onClick={() => deletePlaylist(plId)}>
                          <TrashIcon /> Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ══ ALBUMS ══ */}
        {activeTab === "albums" && (
          <section className="ad-section">
            <div className="ad-section-header">
              <div>
                <h1 className="ad-section-title">Albums</h1>
                <p className="ad-section-sub">{albums.length} albums</p>
              </div>
              <button className="ad-btn-primary" onClick={() => setShowCreateAlbum(true)}>
                <PlusIcon /> New Album
              </button>
            </div>

            {albums.length === 0 ? (
              <p className="ad-empty">No albums yet. Create your first album!</p>
            ) : (
              <div className="ad-playlist-grid">
                {albums.map((al, i) => {
                  const alId = String(al.id ?? al._id ?? i);
                  return (
                    <div key={alId} className="ad-playlist-card">
                      <PlaylistCover musics={al.musics ?? []} />
                      <div className="pl-info">
                        <div className="pl-info-text">
                          <span className="pl-title">{al.title}</span>
                          <span className="pl-artist">{al.artist}</span>
                          <span className="pl-count">
                            {(al.musics ?? []).length} {(al.musics ?? []).length === 1 ? "song" : "songs"}
                          </span>
                        </div>
                        <button
                          className="pl-add-song-btn"
                          title="Add song"
                          onClick={() => setAddSongTarget({ type: "album", id: alId, title: al.title, currentMusics: al.musics ?? [] })}
                        >
                          <PlusIcon />
                        </button>
                      </div>
                      {(al.musics ?? []).length > 0 && (
                        <div className="pl-songs">
                          {al.musics.map((m, idx) => {
                            const mId = String(m.id ?? m._id ?? idx);
                            return (
                              <div key={mId} className="pl-song-row">
                                <TrackCover src={m.coverImageUrl} alt={m.title} />
                                <div className="pl-song-info">
                                  <span className="pl-song-title">{m.title}</span>
                                  <span className="pl-song-artist">{m.artist}</span>
                                </div>
                                <button
                                  className="pl-song-play"
                                  title="Play"
                                  onClick={(e) => { e.stopPropagation(); playTrack(m, al.musics); }}
                                >
                                  <PlayIcon />
                                </button>
                                <button
                                  className="pl-song-remove"
                                  title="Remove from album"
                                  onClick={(e) => { e.stopPropagation(); removeFromAlbum(alId, mId); }}
                                >
                                  <XSmallIcon />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      <div className="pl-card-actions">
                        <button
                          className="pl-card-btn"
                          onClick={() => setRenameTarget({ type: "album", id: alId, currentTitle: al.title })}
                        >
                          <PencilIcon /> Rename
                        </button>
                        <button className="pl-card-btn danger" onClick={() => deleteAlbum(alId)}>
                          <TrashIcon /> Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ══ ANALYTICS ══ */}
        {activeTab === "analytics" && (
          <section className="ad-section">
            <div className="ad-section-header">
              <div>
                <h1 className="ad-section-title">Analytics</h1>
                <p className="ad-section-sub">Play counts &amp; listener stats</p>
              </div>
            </div>

            {analyticsLoading ? (
              <div className="ad-spinner-wrap"><div className="ad-spinner" aria-label="Loading analytics" /></div>
            ) : !analytics ? (
              <p className="ad-empty">Could not load analytics.</p>
            ) : (
              <>
                <div className="ad-analytics-stats">
                  <div className="ad-stat-card">
                    <span className="ad-stat-value">{analytics.trackCount}</span>
                    <span className="ad-stat-label">Tracks</span>
                  </div>
                  <div className="ad-stat-card">
                    <span className="ad-stat-value">{analytics.totals.totalPlays}</span>
                    <span className="ad-stat-label">Total Plays</span>
                  </div>
                  <div className="ad-stat-card">
                    <span className="ad-stat-value">{analytics.totals.totalLikes}</span>
                    <span className="ad-stat-label">Total Likes</span>
                  </div>
                </div>

                <div className="ad-track-list">
                  <div className="ad-analytics-header">
                    <span>Track</span>
                    <span className="col-right">Plays</span>
                    <span className="col-right">Listeners</span>
                    <span className="col-right">Likes</span>
                  </div>
                  {analytics.analytics.map((row) => (
                    <div key={String(row.id)} className="ad-analytics-row">
                      <span className="ad-analytics-title">{row.title}</span>
                      <span className="col-right ad-analytics-num">{row.totalPlays}</span>
                      <span className="col-right ad-analytics-num">{row.uniqueListeners}</span>
                      <span className="col-right ad-analytics-num">{row.totalLikes}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>
        )}

      </main>

      {showCreatePlaylist && (
        <CreateModal
          title="New Playlist"
          placeholder="Playlist name"
          onClose={() => setShowCreatePlaylist(false)}
          onCreate={handleCreatePlaylist}
        />
      )}
      {showCreateAlbum && (
        <CreateModal
          title="New Album"
          placeholder="Album name"
          onClose={() => setShowCreateAlbum(false)}
          onCreate={handleCreateAlbum}
        />
      )}
      {renameTarget && (
        <CreateModal
          title={`Rename ${renameTarget.type === "playlist" ? "Playlist" : "Album"}`}
          placeholder={renameTarget.type === "playlist" ? "Playlist name" : "Album name"}
          initialValue={renameTarget.currentTitle}
          submitLabel="Rename"
          onClose={() => setRenameTarget(null)}
          onCreate={handleRename}
        />
      )}
      {addSongTarget && (
        <SongPickerModal
          type={addSongTarget.type}
          targetId={addSongTarget.id}
          targetTitle={addSongTarget.title}
          allTracks={musics}
          currentMusics={addSongTarget.currentMusics}
          onAdded={handleSongAdded}
          onClose={() => setAddSongTarget(null)}
        />
      )}
      <ConfirmModal
        open={confirmState.open}
        onClose={() => setConfirmState((s) => ({ ...s, open: false }))}
        onConfirm={confirmState.onConfirm ?? (() => {})}
        title="Confirm Delete"
        message={confirmState.message}
      />
    </div>
  );
}

/* ── Icons — resolved via lucide-react imports at top ── */
function PlaylistIcon()  { return <ListMusic aria-hidden="true" />; }
function PlusIcon()      { return <Plus      aria-hidden="true" />; }
function PlayIcon()      { return <Play      aria-hidden="true" />; }
function MusicNoteIcon() { return <Music     aria-hidden="true" />; }
function PencilIcon()    { return <Pencil    width={14} height={14} aria-hidden="true" />; }
function TrashIcon()     { return <Trash2    width={14} height={14} aria-hidden="true" />; }
function CheckIcon()     { return <Check     width={14} height={14} aria-hidden="true" />; }
function XIcon()         { return <X         width={14} height={14} aria-hidden="true" />; }
function XSmallIcon()    { return <X         width={12} height={12} aria-hidden="true" />; }
function SearchIcon()    { return <Search    aria-hidden="true" />; }
