import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./ArtistDashboard.css";
import axios from "axios";
import { usePlayer } from "../../context/PlayerContext";

/* ── Playlist cover: 2×2 grid of first 4 music covers ── */
function PlaylistCover({ musics }) {
  const covers = musics.slice(0, 4);
  if (covers.length === 0)
    return <div className="pl-cover pl-cover-empty"><PlaylistIcon /></div>;
  if (covers.length === 1)
    return <div className="pl-cover"><img src={covers[0].coverImageUrl} alt={covers[0].title} className="pl-cover-single" /></div>;

  return (
    <div className="pl-cover pl-cover-grid">
      {Array.from({ length: 4 }).map((_, i) => {
        const m = covers[i];
        return m ? (
          <img key={i} src={m.coverImageUrl} alt={m.title} className="pl-cover-cell" />
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
  return <img src={src} alt={alt} className="track-cover track-cover-img" onError={() => setErr(true)} />;
}

/* ── Create / Rename Modal ── */
function CreateModal({ title: modalTitle, placeholder, initialValue = "", submitLabel = "Create", onClose, onCreate }) {
  const [value, setValue] = useState(initialValue);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  function handleSubmit(e) {
    e.preventDefault();
    if (!value.trim()) { setError(`${placeholder} is required`); return; }
    setLoading(true);
    onCreate(value.trim(), setError, setLoading);
  }
  function handleBackdrop(e) { if (e.target === e.currentTarget) onClose(); }

  return (
    <div className="ad-modal-backdrop" onClick={handleBackdrop}>
      <div className="ad-modal">
        <h2 className="ad-modal-title">{modalTitle}</h2>
        <form onSubmit={handleSubmit} className="ad-modal-form">
          <input ref={inputRef} type="text" className="ad-modal-input" placeholder={placeholder}
            value={value} maxLength={100} onChange={(e) => setValue(e.target.value)} />
          {error && <p className="ad-modal-error">{error}</p>}
          <div className="ad-modal-actions">
            <button type="button" className="ad-modal-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="ad-modal-create" disabled={loading}>
              {loading ? `${submitLabel}…` : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Song Picker Modal ── */
function SongPickerModal({ targetTitle, type, targetId, allTracks, currentMusics, onAdded, onClose }) {
  const [justAddedIds, setJustAddedIds] = useState(new Set());

  const currentIds = new Set(currentMusics.map((m) => String(m.id ?? m._id)));
  const available = allTracks.filter((t) => {
    const id = String(t._id ?? t.id);
    return !currentIds.has(id) && !justAddedIds.has(id);
  });

  function addTrack(track) {
    const musicId = String(track._id ?? track.id);
    const url = type === "playlist"
      ? `http://localhost:3002/api/music/playlist/${targetId}/add/${musicId}`
      : `http://localhost:3002/api/music/album/${targetId}/add/${musicId}`;

    axios
      .patch(url, {}, { withCredentials: true })
      .then(() => {
        setJustAddedIds((prev) => new Set([...prev, musicId]));
        onAdded(type, targetId, track);
      })
      .catch(() => {});
  }

  return (
    <div className="ad-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="ad-modal ad-picker-modal">
        <h2 className="ad-modal-title">Add song to "{targetTitle}"</h2>
        <div className="ad-picker-list">
          {available.length === 0 ? (
            <p className="ad-picker-empty">All your tracks are already in this {type}.</p>
          ) : (
            available.map((track) => {
              const id = String(track._id ?? track.id);
              return (
                <div key={id} className="ad-picker-row" onClick={() => addTrack(track)}>
                  <TrackCover src={track.coverImageUrl} alt={track.title} />
                  <div className="ad-picker-info">
                    <span className="ad-picker-name">{track.title}</span>
                    <span className="ad-picker-artist">{track.artist}</span>
                  </div>
                  <span className="ad-picker-add"><PlusIcon /></span>
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

  const [musics, setMusics] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [showCreateAlbum, setShowCreateAlbum] = useState(false);
  const [activeTab, setActiveTab] = useState("tracks");
  const [addSongTarget, setAddSongTarget] = useState(null); // { type, id, title, currentMusics }
  const [renameTarget, setRenameTarget] = useState(null); // { type: "playlist"|"album", id, currentTitle }

  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");

  useEffect(() => {
    axios.get("http://localhost:3002/api/music/artist-musics", { withCredentials: true })
      .then((res) => setMusics(res.data.musics.map((m) => ({ ...m, id: m._id ?? m.id }))))
      .catch(() => {});
    axios.get("http://localhost:3002/api/music/playlist/artist", { withCredentials: true })
      .then((res) => setPlaylists(res.data.playlists))
      .catch(() => {});
    axios.get("http://localhost:3002/api/music/album/artist", { withCredentials: true })
      .then((res) => setAlbums(res.data.albums))
      .catch(() => setAlbums([]));
  }, []);

  useEffect(() => {
    if (activeTab !== "analytics") return;
    setAnalyticsLoading(true);
    axios.get("http://localhost:3002/api/music/analytics", { withCredentials: true })
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
      .patch(`http://localhost:3002/api/music/${musicId}`, { title: editTitle.trim() }, { withCredentials: true })
      .then((res) => {
        setMusics((prev) => prev.map((m) =>
          (m._id ?? m.id) === musicId ? { ...m, title: res.data.music.title } : m
        ));
        setEditingId(null);
      })
      .catch(() => {});
  }

  function cancelEdit(e) {
    e.stopPropagation();
    setEditingId(null);
  }

  function deleteMusic(e, musicId) {
    e.stopPropagation();
    if (!window.confirm("Delete this track? This cannot be undone.")) return;
    axios
      .delete(`http://localhost:3002/api/music/${musicId}`, { withCredentials: true })
      .then(() => setMusics((prev) => prev.filter((m) => (m._id ?? m.id) !== musicId)))
      .catch(() => {});
  }

  function handleCreatePlaylist(title, setError, setLoading) {
    axios.post("http://localhost:3002/api/music/playlist", { title, musics: [] }, { withCredentials: true })
      .then((res) => {
        setPlaylists((prev) => [...prev, { ...res.data.playlist, musics: [] }]);
        setShowCreatePlaylist(false);
      })
      .catch((err) => {
        setError(err.response?.data?.message || "Failed to create playlist");
        setLoading(false);
      });
  }

  function handleCreateAlbum(title, setError, setLoading) {
    axios.post("http://localhost:3002/api/music/album", { title }, { withCredentials: true })
      .then((res) => {
        setAlbums((prev) => [{ ...res.data.album, musics: [] }, ...prev]);
        setShowCreateAlbum(false);
      })
      .catch((err) => {
        setError(err.response?.data?.message || "Failed to create album");
        setLoading(false);
      });
  }

  function handleSongAdded(type, targetId, track) {
    const musicObj = { ...track, id: track._id ?? track.id };
    if (type === "playlist") {
      setPlaylists((prev) => prev.map((pl) =>
        String(pl.id ?? pl._id) === targetId
          ? { ...pl, musics: [...(pl.musics ?? []), musicObj] }
          : pl
      ));
    } else {
      setAlbums((prev) => prev.map((al) =>
        String(al.id ?? al._id) === targetId
          ? { ...al, musics: [...(al.musics ?? []), musicObj] }
          : al
      ));
    }
  }

  function removeFromPlaylist(playlistId, musicId) {
    axios
      .patch(`http://localhost:3002/api/music/playlist/${playlistId}/remove/${musicId}`, {}, { withCredentials: true })
      .then(() => {
        setPlaylists((prev) => prev.map((pl) =>
          String(pl.id ?? pl._id) === String(playlistId)
            ? { ...pl, musics: pl.musics.filter((m) => String(m.id ?? m._id) !== String(musicId)) }
            : pl
        ));
      })
      .catch(() => {});
  }

  function removeFromAlbum(albumId, musicId) {
    axios
      .patch(`http://localhost:3002/api/music/album/${albumId}/remove/${musicId}`, {}, { withCredentials: true })
      .then(() => {
        setAlbums((prev) => prev.map((al) =>
          String(al.id ?? al._id) === String(albumId)
            ? { ...al, musics: al.musics.filter((m) => String(m.id ?? m._id) !== String(musicId)) }
            : al
        ));
      })
      .catch(() => {});
  }

  function deletePlaylist(playlistId) {
    if (!window.confirm("Delete this playlist? This cannot be undone.")) return;
    axios
      .delete(`http://localhost:3002/api/music/playlist/${playlistId}`, { withCredentials: true })
      .then(() => setPlaylists((prev) => prev.filter((pl) => String(pl.id ?? pl._id) !== String(playlistId))))
      .catch(() => {});
  }

  function deleteAlbum(albumId) {
    if (!window.confirm("Delete this album? This cannot be undone.")) return;
    axios
      .delete(`http://localhost:3002/api/music/album/${albumId}`, { withCredentials: true })
      .then(() => setAlbums((prev) => prev.filter((al) => String(al.id ?? al._id) !== String(albumId))))
      .catch(() => {});
  }

  function handleRename(newTitle, setError, setLoading) {
    const { type, id } = renameTarget;
    const url = type === "playlist"
      ? `http://localhost:3002/api/music/playlist/${id}`
      : `http://localhost:3002/api/music/album/${id}`;
    axios
      .patch(url, { title: newTitle }, { withCredentials: true })
      .then(() => {
        if (type === "playlist") {
          setPlaylists((prev) => prev.map((pl) =>
            String(pl.id ?? pl._id) === id ? { ...pl, title: newTitle } : pl
          ));
        } else {
          setAlbums((prev) => prev.map((al) =>
            String(al.id ?? al._id) === id ? { ...al, title: newTitle } : al
          ));
        }
        setRenameTarget(null);
      })
      .catch((err) => {
        setError(err.response?.data?.message || "Failed to rename");
        setLoading(false);
      });
  }

  return (
    <div className="ad-root">
      <main className="ad-main">

        {/* ── Tab nav ── */}
        <nav className="ad-tabs">
          {[
            { key: "tracks", label: "My Music" },
            { key: "analytics", label: "Analytics" },
            { key: "playlists", label: "Playlists" },
            { key: "albums", label: "Albums" },
          ].map((tab) => (
            <button key={tab.key} className={`ad-tab ${activeTab === tab.key ? "active" : ""}`}
              onClick={() => setActiveTab(tab.key)}>
              {tab.label}
            </button>
          ))}
        </nav>

        {/* ══ MY MUSIC ══ */}
        {activeTab === "tracks" && (
          <section className="ad-section">
            <div className="ad-section-header">
              <div>
                <h1 className="ad-section-title">My Music</h1>
                <p className="ad-section-sub">{musics.length} tracks</p>
              </div>
              <button className="ad-btn-primary" onClick={() => navigate("/artist/dashboard/upload-music")}>
                <PlusIcon /> Upload Track
              </button>
            </div>

            <div className="ad-track-list">
              <div className="ad-track-header">
                <span className="col-num">#</span>
                <span className="col-title">Title</span>
                <span className="col-artist">Artist</span>
                <span className="col-play"></span>
                <span className="col-actions"></span>
              </div>

              {musics.map((music, i) => {
                const id = music._id ?? music.id;
                const isEditing = editingId === id;
                return (
                  <div key={id ?? i}
                    className={`ad-track-row${!isEditing && currentTrack?.id === (music._id ?? music.id) ? " is-playing" : ""}`}
                    onClick={() => !isEditing && playTrack(music, musics)}>
                    <span className="col-num track-num">{i + 1}</span>

                    <div className="col-title track-title-cell">
                      <TrackCover src={music.coverImageUrl} alt={music.title} />
                      {isEditing ? (
                        <input className="ad-edit-input" value={editTitle} autoFocus
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
                      <button className="track-play-btn" title="Play"
                        onClick={(e) => { e.stopPropagation(); playTrack(music, musics); }}>
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
                          <button className="ad-action-btn danger" title="Delete"
                            onClick={(e) => deleteMusic(e, id)}>
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
              <p className="ad-empty">Loading analytics…</p>
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
                                <button className="pl-song-play" title="Play"
                                  onClick={(e) => { e.stopPropagation(); playTrack(m, pl.musics); }}>
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
                        <button className="pl-card-btn" onClick={() => setRenameTarget({ type: "playlist", id: plId, currentTitle: pl.title })}>
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
                                <button className="pl-song-play" title="Play"
                                  onClick={(e) => { e.stopPropagation(); playTrack(m, al.musics); }}>
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
                        <button className="pl-card-btn" onClick={() => setRenameTarget({ type: "album", id: alId, currentTitle: al.title })}>
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

      </main>

      {showCreatePlaylist && (
        <CreateModal title="New Playlist" placeholder="Playlist name"
          onClose={() => setShowCreatePlaylist(false)} onCreate={handleCreatePlaylist} />
      )}
      {showCreateAlbum && (
        <CreateModal title="New Album" placeholder="Album name"
          onClose={() => setShowCreateAlbum(false)} onCreate={handleCreateAlbum} />
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
    </div>
  );
}

/* ── Icons ── */
function PlaylistIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}
function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
function PlayIcon() {
  return <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>;
}
function MusicNoteIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
    </svg>
  );
}
function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" width="14" height="14">
      <polyline points="20 6 9 17 4 12" />
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
function XSmallIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" width="12" height="12">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
