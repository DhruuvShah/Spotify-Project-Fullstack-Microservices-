# Frontend — Lumina

React 19 single-page application for the Lumina music streaming platform. Communicates with the Auth service and Music service over REST, and maintains a WebSocket connection to the Music service for real-time cross-device playback sync.

**Framework:** Vite + React 19
**Port (dev):** `5173`

---

## Tech Stack

| Package | Version | Purpose |
|---------|---------|---------|
| react | 19.2.6 | UI framework |
| react-dom | 19.2.6 | DOM rendering |
| react-router-dom | 7.15.1 | Client-side routing |
| axios | 1.16.1 | HTTP requests |
| socket.io-client | 4.8.3 | Real-time WebSocket connection |
| lucide-react | 1.17.0 | Icon library |
| vite | 8.0.12 | Build tool & dev server |

---

## Environment Variables

Create `frontend/.env`:

```env
VITE_AUTH_URL=http://localhost:3000
VITE_MUSIC_URL=http://localhost:3002
```

For production (Vercel), set these in the Vercel dashboard under Project → Settings → Environment Variables:

```env
VITE_AUTH_URL=https://your-auth-service.onrender.com
VITE_MUSIC_URL=https://your-music-service.onrender.com
```

---

## Running Locally

```bash
cd frontend
npm install
cp .env.example .env   # fill in your values
npm run dev            # starts on http://localhost:5173
```

**Build for production:**
```bash
npm run build          # outputs to dist/
npm run preview        # preview the production build locally
```

---

## Project Structure

```
frontend/
├── public/
│   └── lumina.svg          # Favicon + sidebar logo (LuminaMark icon)
├── src/
│   ├── config.js           # Service URLs from env vars
│   ├── main.jsx            # App entry point — wraps in all context providers
│   ├── App.jsx             # Route definitions
│   ├── context/
│   │   ├── AuthContext.jsx     # User session & token management
│   │   ├── PlayerContext.jsx   # Music player state & controls
│   │   ├── SocketContext.jsx   # Cross-device sync via Socket.io
│   │   └── ToastContext.jsx    # Toast notification system
│   ├── pages/
│   │   ├── Home.jsx            # Music feed & browse
│   │   ├── Login.jsx           # Login (email + Google OAuth)
│   │   ├── Register.jsx        # Registration (user or artist)
│   │   ├── Profile.jsx         # User profile management
│   │   ├── Search.jsx          # Full-text track search
│   │   ├── PlaylistDetail.jsx  # Artist playlist view
│   │   ├── UserPlaylistDetail.jsx # User playlist view
│   │   ├── ArtistProfile.jsx   # Public artist page
│   │   ├── NotFound.jsx        # 404 page
│   │   └── artist/
│   │       ├── ArtistDashboard.jsx  # Artist control panel
│   │       └── UploadMusic.jsx      # Upload + manage tracks
│   ├── components/
│   │   ├── Sidebar.jsx         # Left navigation
│   │   ├── BottomPlayer.jsx    # Persistent music player bar
│   │   ├── Navbar.jsx          # Top navigation (artist layout)
│   │   ├── Layout.jsx          # User layout wrapper
│   │   ├── ArtistLayout.jsx    # Artist layout wrapper
│   │   ├── ConfirmModal.jsx    # Reusable confirmation dialog
│   │   ├── ErrorBoundary.jsx   # Top-level error boundary
│   │   ├── MobileNav.jsx       # Mobile bottom navigation
│   │   ├── AddToPlaylistBtn.jsx # Add-to-playlist dropdown
│   │   └── icons/
│   │       └── index.jsx       # Lucide-react icon wrappers
│   └── services/
│       └── tokenStore.js       # In-memory JWT cache
```

---

## Context Providers

All four providers wrap the entire app in `main.jsx`. Provider order matters — `PlayerContext` depends on `AuthContext`.

### AuthContext

**File:** `src/context/AuthContext.jsx`

Manages the logged-in user session globally.

**Provides:**
```js
const { user, token, loading, setUser, setToken, logout } = useAuth();
```

| Value | Type | Description |
|-------|------|-------------|
| `user` | Object / null | `{ _id, email, fullname, role }` |
| `token` | String / null | Raw JWT string |
| `loading` | Boolean | True while the initial `/me` check is in flight |
| `setUser(u)` | Function | Update user after profile edit |
| `setToken(t)` | Function | Update token manually |
| `logout()` | Function | Clear session, redirect to `/login` |

**How it works:**
1. On mount, calls `GET /api/auth/me` (with cookie) to restore session
2. If the cookie is valid, sets `user` and `token`
3. Registers a global Axios interceptor: any `401` response → automatic logout
4. Token is also cached in `tokenStore` (module-level memory, survives re-renders)

---

### PlayerContext

**File:** `src/context/PlayerContext.jsx`

All music playback state and controls.

**Provides:**
```js
const {
  currentTrack, queue, queueIndex, playing,
  currentTime, duration, volume, muted,
  likedIds, repeat, shuffle, audioRef,
  playTrack, togglePlay, next, prev,
  seek, changeVolume, toggleMute,
  toggleRepeat, toggleShuffle,
  toggleLike, addToQueue
} = usePlayer();
```

| Value / Method | Description |
|---------------|-------------|
| `currentTrack` | Track object currently loaded, or `null` |
| `queue` | Array of track objects in play queue |
| `queueIndex` | Current position in queue |
| `playing` | Boolean play/pause state |
| `currentTime` | Playback position in seconds |
| `duration` | Total track duration in seconds |
| `volume` | 0.0–1.0 |
| `muted` | Boolean |
| `likedIds` | `Set` of liked track ID strings |
| `repeat` | `"off"` / `"all"` / `"one"` |
| `shuffle` | Boolean |
| `audioRef` | React ref to the `<audio>` element |
| `playTrack(track, queue?)` | Load + play a track; optionally set queue |
| `togglePlay()` | Play / pause |
| `next()` | Skip to next (respects shuffle) |
| `prev()` | Skip to previous or restart |
| `seek(seconds)` | Jump to position |
| `changeVolume(0-1)` | Set volume |
| `toggleMute()` | Toggle mute |
| `toggleRepeat()` | Cycle off → all → one |
| `toggleShuffle()` | Toggle shuffle mode |
| `toggleLike(trackId)` | Like/unlike; syncs with server |
| `addToQueue(track)` | Append track to queue |

**Autoplay note:** Browsers block audio autoplay if the user hasn't interacted with the page. The player starts muted, plays, then immediately unmutes — bypassing the autoplay policy while keeping full volume for the user.

---

### SocketContext

**File:** `src/context/SocketContext.jsx`

Manages the Socket.io connection and cross-device playback sync.

**Provides:**
```js
const { emitPlay } = useSocket();
```

| Method | Description |
|--------|-------------|
| `emitPlay(track)` | Broadcast that you started playing this track to your other devices |

**How cross-device sync works:**
1. On login, the frontend connects to the Music service WebSocket with the JWT
2. The Music service places all sockets for the same user in one room
3. When you play a track and call `emitPlay(track)`, the server broadcasts a `play` event to your other devices
4. Other devices receive the `play` event and update their player state
5. On reconnect, the server sends a `sync` event with the currently playing track

The socket will **not** echo the event back to the sender — the server skips the originating socket when broadcasting.

---

### ToastContext

**File:** `src/context/ToastContext.jsx`

Lightweight in-app notification toasts.

**Provides:**
```js
const { toast } = useToast();

toast.success("Track added to playlist");
toast.error("Upload failed — file too large");
toast.info("Connecting...");
```

Options: `{ duration: 5000 }` — auto-dismiss delay in ms (default: 3500ms). Max 4 toasts visible at once.

---

## Pages

### User Pages

| Page | Route | Description |
|------|-------|-------------|
| Home | `/` | Browseable music feed with trending tracks |
| Login | `/login` | Email+password login or "Continue with Google" |
| Register | `/register` | Choose role (Listener or Creator), fill in details, or use Google |
| Search | `/search` | Full-text search tracks by title |
| Profile | `/profile` | View and edit your profile details |
| Playlist Detail | `/playlist/:id` | View an artist-created playlist and play from it |
| User Playlist Detail | `/user-playlist/:id` | View and manage one of your own playlists |
| Artist Profile | `/artist/:id` | Public artist page with tracks and follow button |
| Not Found | `*` | 404 page |

### Artist Pages

Only accessible to users with `role: "artist"`.

| Page | Route | Description |
|------|-------|-------------|
| Artist Dashboard | `/artist/dashboard` | Stats overview, follower count, quick links |
| Artist Studio | `/artist/upload` | Upload tracks, manage uploads, create/manage playlists and albums |

---

## Authentication Flow

```
User submits login form
        │
        ▼
POST /api/auth/login (or /register)
        │
        ▼
Auth service sets HTTP-only JWT cookie + returns token in body
        │
        ▼
Frontend: tokenStore.set(token) → AuthContext.setUser(user)
        │
        ▼
Axios uses withCredentials: true on every request → cookie sent automatically
        │
        ▼
Any 401 response → AuthContext interceptor → logout() → redirect to /login
```

**Google OAuth flow:**
```
Click "Continue with Google"
        │
        ▼
Browser navigates to GET /api/auth/google (auth service)
        │
        ▼
Google consent screen → user approves
        │
        ▼
/api/auth/google/callback → sets cookie → redirects to frontend
        │
        ▼
AuthContext.useEffect fires → GET /api/auth/me → restores session
```

---

## Making API Calls

Every Axios call must include `{ withCredentials: true }` so the browser sends the HTTP-only auth cookie cross-origin:

```js
import axios from "axios";
import { AUTH_URL, MUSIC_URL } from "../config.js";

// GET request
const res = await axios.get(`${MUSIC_URL}/api/music`, { withCredentials: true });

// POST with body
const res = await axios.post(
  `${MUSIC_URL}/api/music/like/${trackId}`,
  {},
  { withCredentials: true }
);

// File upload
const formData = new FormData();
formData.append("musicFile", audioFile);
formData.append("coverImage", imageFile);
formData.append("title", "My Track");

const res = await axios.post(`${MUSIC_URL}/api/music/upload`, formData, {
  withCredentials: true,
  headers: { "Content-Type": "multipart/form-data" },
});
```

---

## Route Protection

Routes are defined in `App.jsx`. Protected routes check `AuthContext.user` and redirect to `/login` if unauthenticated. Artist routes additionally check `user.role === "artist"`.

```
/                   → Home (auth required)
/login              → Login (public)
/register           → Register (public)
/search             → Search (auth required)
/profile            → Profile (auth required)
/playlist/:id       → PlaylistDetail (auth required)
/user-playlist/:id  → UserPlaylistDetail (auth required)
/artist/:id         → ArtistProfile (auth required)
/artist/dashboard   → ArtistDashboard (artist role required)
/artist/upload      → UploadMusic (artist role required)
*                   → NotFound
```

---

## Styling

- Each page and component has a co-located `.css` file
- Global design tokens defined in `src/index.css` as CSS custom properties
- Design system: warm cream backgrounds (`#f9f9f6`), burnt-orange brand color (`#c84b31`), Playfair Display serif headings loaded from Google Fonts
- Icons: `lucide-react` throughout (custom SVGs kept only for Google brand icon and LuminaMark)

---

## Deployment (Vercel)

1. Connect your GitHub repo to Vercel
2. Set the framework to **Vite** and root directory to `frontend`
3. Set environment variables in the Vercel dashboard:
   ```
   VITE_AUTH_URL=https://your-auth-service.onrender.com
   VITE_MUSIC_URL=https://your-music-service.onrender.com
   ```
4. Deploy — Vite's `dist/` is served automatically

**SPA routing:** Add a `vercel.json` in the `frontend/` folder if page refresh returns 404:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

---

## Common Issues

| Symptom | Cause | Fix |
|---------|-------|-----|
| API calls return 401 | `withCredentials: true` missing | Add it to every Axios request |
| Google OAuth callback fails | Frontend URL not in auth service CORS | Set `FRONTEND_URL` in auth service env vars |
| Socket doesn't connect | JWT missing when socket initializes | `SocketContext` waits for `AuthContext.token` before connecting |
| Autoplay blocked on first visit | Browser autoplay policy | Player starts muted then unmutes — no action needed |
| `VITE_AUTH_URL` is undefined | Env var not set in Vercel | Add it in Vercel project settings and redeploy |
| Page refresh returns 404 on Vercel | SPA routing not configured | Add `vercel.json` with rewrite rule above |
