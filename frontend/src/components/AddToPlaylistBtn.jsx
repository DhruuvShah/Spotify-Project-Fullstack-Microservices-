import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { Plus, ListMusic, Check } from "lucide-react";
import { useToast } from "../context/ToastContext";
import "./AddToPlaylistBtn.css";
import { MUSIC_URL } from "../config.js";

export default function AddToPlaylistBtn({ musicId }) {
  const { toast } = useToast();
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
      .get(`${MUSIC_URL}/api/music/user-playlists`, { withCredentials: true })
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
        `${MUSIC_URL}/api/music/user-playlist/${playlistId}/add/${musicId}`,
        {},
        { withCredentials: true }
      )
      .then(() => {
        setAddedId(playlistId);
        toast.success("Added to playlist");
        setTimeout(() => {
          setAddedId(null);
          setOpen(false);
        }, 900);
      })
      .catch(() => { toast.error("Failed to add to playlist"); });
  }

  return (
    <div className="atp-wrap">
      <button
        ref={btnRef}
        className={`atp-btn${open ? " active" : ""}`}
        title="Add to playlist"
        onClick={handleToggle}
      >
        <Plus width={14} height={14} aria-hidden />
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
                {addedId === pl._id ? <Check width={14} height={14} aria-hidden /> : <ListMusic width={14} height={14} aria-hidden />}
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

