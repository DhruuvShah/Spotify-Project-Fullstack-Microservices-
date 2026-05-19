import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import "./AddToPlaylistBtn.css";

export default function AddToPlaylistBtn({ musicId }) {
  const [open, setOpen] = useState(false);
  const [playlists, setPlaylists] = useState(null);
  const [loading, setLoading] = useState(false);
  const [addedId, setAddedId] = useState(null);
  const [dropStyle, setDropStyle] = useState({});
  const btnRef = useRef(null);
  const dropRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e) {
      const inBtn = btnRef.current?.contains(e.target);
      const inDrop = dropRef.current?.contains(e.target);
      if (!inBtn && !inDrop) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  useEffect(() => {
    if (!open || playlists !== null) return;
    setLoading(true);
    axios
      .get("http://localhost:3002/api/music/user-playlists", { withCredentials: true })
      .then((res) => setPlaylists(res.data.playlists))
      .catch(() => setPlaylists([]))
      .finally(() => setLoading(false));
  }, [open, playlists]);

  function handleToggle(e) {
    e.stopPropagation();
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const dropdownHeight = 220;
      const spaceAbove = rect.top;
      const rightGap = Math.max(8, window.innerWidth - rect.right);
      if (spaceAbove >= dropdownHeight) {
        setDropStyle({
          bottom: `${window.innerHeight - rect.top + 6}px`,
          right: `${rightGap}px`,
        });
      } else {
        setDropStyle({
          top: `${rect.bottom + 6}px`,
          right: `${rightGap}px`,
        });
      }
    }
    setOpen((o) => !o);
  }

  function handleAdd(playlistId) {
    axios
      .patch(
        `http://localhost:3002/api/music/user-playlist/${playlistId}/add/${musicId}`,
        {},
        { withCredentials: true }
      )
      .then(() => {
        setAddedId(playlistId);
        setTimeout(() => {
          setAddedId(null);
          setOpen(false);
        }, 900);
      })
      .catch(() => {});
  }

  return (
    <div className="atp-wrap">
      <button
        ref={btnRef}
        className={`atp-btn${open ? " active" : ""}`}
        title="Add to playlist"
        onClick={handleToggle}
      >
        <PlusListIcon />
      </button>

      {createPortal(
        open ? (
          <div ref={dropRef} className="atp-dropdown" style={dropStyle}>
            <p className="atp-label">Add to playlist</p>
            {loading && <p className="atp-empty">Loading…</p>}
            {!loading && playlists?.length === 0 && (
              <p className="atp-empty">No playlists yet</p>
            )}
            {!loading && playlists?.map((pl) => (
              <button
                key={pl._id}
                className={`atp-item${addedId === pl._id ? " added" : ""}`}
                onClick={(e) => { e.stopPropagation(); if (!addedId) handleAdd(pl._id); }}
              >
                {addedId === pl._id ? <CheckIcon /> : <ListIcon />}
                <span className="atp-item-name">{pl.title}</span>
              </button>
            ))}
          </div>
        ) : null,
        document.body
      )}
    </div>
  );
}

function PlusListIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
function ListIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="14" height="14">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
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
