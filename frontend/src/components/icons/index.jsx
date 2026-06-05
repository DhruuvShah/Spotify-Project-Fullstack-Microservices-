/**
 * LUMINA Icon Library — backed by lucide-react.
 * Same export names and prop API as before; drop-in replacement.
 * LuminaLogoIcon and GoogleIcon stay as custom SVGs (brand).
 */
import {
  Play, Pause, SkipBack, SkipForward,
  Shuffle, Repeat, Repeat1,
  Volume2, Volume1, VolumeX,
  Heart, Plus, Trash2, Pencil,
  Check, X, Upload, LogOut,
  ChevronLeft, ChevronRight, ChevronDown,
  Search, ListMusic, Music, Music2, Home, User, List,
} from "lucide-react";

// ── Playback ─────────────────────────────────────────────────────
export function PlayIcon({ width = 20, height = 20, className, style }) {
  return <Play width={width} height={height} className={className} style={style} aria-hidden />;
}
export function PauseIcon({ width = 20, height = 20, className, style }) {
  return <Pause width={width} height={height} className={className} style={style} aria-hidden />;
}
export function PrevIcon({ width = 20, height = 20, className, style }) {
  return <SkipBack width={width} height={height} className={className} style={style} aria-hidden />;
}
export function NextIcon({ width = 20, height = 20, className, style }) {
  return <SkipForward width={width} height={height} className={className} style={style} aria-hidden />;
}
export function ShuffleIcon({ width = 20, height = 20, className, style }) {
  return <Shuffle width={width} height={height} className={className} style={style} aria-hidden />;
}
export function RepeatIcon({ width = 20, height = 20, className, style }) {
  return <Repeat width={width} height={height} className={className} style={style} aria-hidden />;
}
export function RepeatOneIcon({ width = 20, height = 20, className, style }) {
  return <Repeat1 width={width} height={height} className={className} style={style} aria-hidden />;
}

// ── Volume ───────────────────────────────────────────────────────
export function VolHighIcon({ width = 20, height = 20, className, style }) {
  return <Volume2 width={width} height={height} className={className} style={style} aria-hidden />;
}
export function VolLowIcon({ width = 20, height = 20, className, style }) {
  return <Volume1 width={width} height={height} className={className} style={style} aria-hidden />;
}
export function MuteIcon({ width = 20, height = 20, className, style }) {
  return <VolumeX width={width} height={height} className={className} style={style} aria-hidden />;
}

// ── Actions ──────────────────────────────────────────────────────
export function HeartIcon({ filled = false, width = 20, height = 20, className, style }) {
  return (
    <Heart
      width={width} height={height}
      className={className} style={style}
      fill={filled ? "currentColor" : "none"}
      aria-hidden
    />
  );
}
export function PlusIcon({ width = 20, height = 20, className, style }) {
  return <Plus width={width} height={height} className={className} style={style} aria-hidden />;
}
export function PlusListIcon({ width = 20, height = 20, className, style }) {
  return <Plus width={width} height={height} className={className} style={style} aria-hidden />;
}
export function TrashIcon({ width = 20, height = 20, className, style }) {
  return <Trash2 width={width} height={height} className={className} style={style} aria-hidden />;
}
export function PencilIcon({ width = 20, height = 20, className, style }) {
  return <Pencil width={width} height={height} className={className} style={style} aria-hidden />;
}
export function CheckIcon({ width = 20, height = 20, className, style }) {
  return <Check width={width} height={height} className={className} style={style} aria-hidden />;
}
export function XIcon({ width = 20, height = 20, className, style }) {
  return <X width={width} height={height} className={className} style={style} aria-hidden />;
}
export function UploadIcon({ width = 20, height = 20, className, style }) {
  return <Upload width={width} height={height} className={className} style={style} aria-hidden />;
}
export function LogoutIcon({ width = 20, height = 20, className, style }) {
  return <LogOut width={width} height={height} className={className} style={style} aria-hidden />;
}

// ── Navigation ───────────────────────────────────────────────────
export function ChevronLeftIcon({ width = 20, height = 20, className, style }) {
  return <ChevronLeft width={width} height={height} className={className} style={style} aria-hidden />;
}
export function ChevronRightIcon({ width = 20, height = 20, className, style }) {
  return <ChevronRight width={width} height={height} className={className} style={style} aria-hidden />;
}
export function ChevronDownIcon({ width = 20, height = 20, className, style }) {
  return <ChevronDown width={width} height={height} className={className} style={style} aria-hidden />;
}

// ── UI ───────────────────────────────────────────────────────────
export function SearchIcon({ width = 20, height = 20, className, style }) {
  return <Search width={width} height={height} className={className} style={style} aria-hidden />;
}
export function QueueIcon({ width = 20, height = 20, className, style }) {
  return <ListMusic width={width} height={height} className={className} style={style} aria-hidden />;
}
export function PlaylistIcon({ width = 20, height = 20, className, style }) {
  return <ListMusic width={width} height={height} className={className} style={style} aria-hidden />;
}
export function MusicNoteIcon({ width = 20, height = 20, className, style }) {
  return <Music width={width} height={height} className={className} style={style} aria-hidden />;
}
export function HomeIcon({ width = 20, height = 20, className, style }) {
  return <Home width={width} height={height} className={className} style={style} aria-hidden />;
}
export function UserIcon({ width = 20, height = 20, className, style }) {
  return <User width={width} height={height} className={className} style={style} aria-hidden />;
}
export function ArtistIcon({ width = 20, height = 20, className, style }) {
  return <Music2 width={width} height={height} className={className} style={style} aria-hidden />;
}
export function StudioIcon({ width = 20, height = 20, className, style }) {
  return <Music2 width={width} height={height} className={className} style={style} aria-hidden />;
}
export function ListIcon({ width = 20, height = 20, className, style }) {
  return <List width={width} height={height} className={className} style={style} aria-hidden />;
}

// ── Brand — stay as custom SVGs ───────────────────────────────────
export function LuminaLogoIcon({ width = 24, height = 24, className, style }) {
  return (
    <svg viewBox="0 0 24 24" width={width} height={height} fill="currentColor" className={className} style={style} aria-hidden>
      <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 3a7 7 0 0 1 7 7c0 1.3-.36 2.52-.98 3.56L8.44 4.98A6.97 6.97 0 0 1 12 5zm0 14a7 7 0 0 1-7-7c0-1.3.36-2.52.98-3.56l9.58 10.58A6.97 6.97 0 0 1 12 19z" />
    </svg>
  );
}
export function GoogleIcon({ width = 20, height = 20, className, style }) {
  return (
    <svg viewBox="0 0 24 24" width={width} height={height} className={className} style={style} aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}
