# Music Service

Core content service. Handles track uploads, streaming metadata, playlists (artist-created and user-created), albums, likes, play history, analytics, and real-time cross-device playback sync via Socket.io.

**Port:** `3002` (REST API and Socket.io on the same port)

---

## Tech Stack

| Package | Version | Purpose |
|---------|---------|---------|
| express | 5.2.1 | HTTP framework |
| mongoose | 9.6.2 | MongoDB ODM |
| socket.io | 4.8.3 | Real-time cross-device sync |
| multer | 2.1.1 | Multipart file upload handling |
| @imagekit/nodejs | 7.6.1 | CDN file storage |
| jsonwebtoken | — | JWT verification (shared secret with Auth) |
| express-rate-limit | 8.5.2 | API rate limiting |
| node-cache | 5.1.2 | In-memory response caching |
| helmet | 8.2.0 | Security headers |
| pino / pino-http | 10.3.1 / 11.0.0 | Structured JSON logging |
| cors | — | CORS headers |

---

## Environment Variables

Create `music/.env`:

```env
PORT=3002
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/music-db

# Must be identical to the value in auth/.env
JWT_SECRET=your_super_secret_jwt_key

# ImageKit — from imagekit.io dashboard
IMAGEKIT_PUBLIC_KEY=public_xxxxxxxxxxxx
IMAGEKIT_PRIVATE_KEY=private_xxxxxxxxxxxx
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_id

# For CORS
FRONTEND_URL=http://localhost:5173
```

### Getting ImageKit credentials

1. Sign up at [imagekit.io](https://imagekit.io) (free tier: 20 GB storage, 20 GB bandwidth/month)
2. Go to Developer Options → API Keys
3. Copy `Public Key`, `Private Key`, and `URL Endpoint`

---

## API Reference

All endpoints require authentication unless noted. Authentication is via the `token` HTTP-only cookie set by the auth service, or `Authorization: Bearer <token>` header.

### Music

Base path: `/api/music`

---

#### `POST /api/music/upload`
Upload a new track. **Artist only.**

**Content-Type:** `multipart/form-data`

**Form fields:**

| Field | Type | Limit | Required |
|-------|------|-------|----------|
| `musicFile` | audio file | 50 MB | Yes |
| `coverImage` | image file | 5 MB | Yes |
| `title` | string | — | Yes |

**Accepted audio formats:** mp3, wav, ogg, flac, aac

**Accepted image formats:** jpeg, jpg, png, webp, gif

**Response `201`:**
```json
{
  "message": "Music uploaded successfully",
  "music": {
    "_id": "...",
    "title": "My Track",
    "audioUrl": "https://ik.imagekit.io/.../track.mp3",
    "coverImageUrl": "https://ik.imagekit.io/.../cover.jpg",
    "artistId": "...",
    "duration": 213,
    "createdAt": "..."
  }
}
```

Files are stored in ImageKit under `/spotify/musics/` and `/spotify/covers/`. The filename is `{sanitized_original_name}_{timestamp}.{ext}` so it stays human-readable in the dashboard.

---

#### `GET /api/music`
Browse all tracks with pagination.

**Query params:**

| Param | Default | Max | Description |
|-------|---------|-----|-------------|
| `skip` | 0 | — | Offset |
| `limit` | 20 | 50 | Tracks per page |

**Response `200`:**
```json
{
  "musics": [ { "_id": "...", "title": "...", "audioUrl": "...", "coverImageUrl": "...", "artistId": { "fullname": {...} } } ],
  "total": 142
}
```

Cached for 60 seconds.

---

#### `GET /api/music/search`
Full-text search across track titles.

**Query params:**

| Param | Required | Max Length | Description |
|-------|----------|-----------|-------------|
| `q` | Yes | 200 chars | Search query |

Returns up to 20 results. Cached per query string.

**Response `200`:**
```json
{ "results": [ { "_id": "...", "title": "...", "coverImageUrl": "...", "artistId": {...} } ] }
```

**Rate limited:** 30 requests / minute per IP.

---

#### `GET /api/music/get-details/:id`
Get full details for a single track.

**Response `200`:**
```json
{
  "music": {
    "_id": "...", "title": "...", "audioUrl": "...",
    "coverImageUrl": "...", "artistId": { "fullname": {...}, "email": "..." },
    "duration": 213, "plays": 5021, "createdAt": "..."
  }
}
```

---

#### `GET /api/music/artist-musics`
Get all tracks uploaded by the currently logged-in artist. **Artist only.**

**Response `200`:**
```json
{ "musics": [ ... ] }
```

Not cached (artists need real-time data in their dashboard).

---

#### `PATCH /api/music/:id`
Edit a track's title. **Artist only, must be track owner.**

**Request body:**
```json
{ "title": "New Title" }
```

**Response `200`:**
```json
{ "message": "Music updated", "music": { ... } }
```

---

#### `DELETE /api/music/:id`
Delete a track and cascade-remove it from all playlists, albums, likes, and history. Also deletes both files from ImageKit. **Artist only, must be track owner.**

**Response `200`:**
```json
{ "message": "Music deleted successfully" }
```

---

#### `GET /api/music/by-artist/:artistId`
Get the public track listing for any artist. Max 20 tracks.

**Response `200`:**
```json
{ "musics": [ ... ] }
```

Cached for 120 seconds.

---

### Likes

Base path: `/api/music`

#### `GET /api/music/likes`
Get the IDs of all tracks the current user has liked (lightweight — for toggle state).

**Response `200`:**
```json
{ "likedIds": ["<id1>", "<id2>"] }
```

---

#### `GET /api/music/liked-tracks`
Get the full track objects for liked tracks, sorted newest-liked first.

**Response `200`:**
```json
{ "tracks": [ { "_id": "...", "title": "...", "coverImageUrl": "...", ... } ] }
```

---

#### `POST /api/music/like/:id`
Like a track.

**Response `201`:**
```json
{ "message": "Liked" }
```

**Errors:**
- `409` — Already liked

---

#### `DELETE /api/music/like/:id`
Unlike a track.

**Response `200`:**
```json
{ "message": "Unliked" }
```

---

### Play History

#### `POST /api/music/history/:id`
Record that the current user played a track. Keeps a rolling window of the 50 most recent plays per user.

**Response `200`:**
```json
{ "message": "History recorded" }
```

---

#### `GET /api/music/history`
Get the current user's play history (most recent first, max 20).

**Response `200`:**
```json
{
  "history": [
    { "musicId": { "_id": "...", "title": "...", "coverImageUrl": "..." }, "playedAt": "..." }
  ]
}
```

---

### Artist Playlists

Base path: `/api/music`

Artist-created playlists are public and browseable by all users.

---

#### `POST /api/music/playlist`
Create a new playlist. **Artist only.**

**Request body:**
```json
{ "title": "My Playlist" }
```

**Response `201`:**
```json
{ "playlist": { "_id": "...", "title": "...", "artistId": "...", "musics": [] } }
```

---

#### `GET /api/music/playlist/artist`
Get all playlists created by the logged-in artist. **Artist only.**

Cached for 120 seconds.

---

#### `GET /api/music/playlists`
Browse all artist playlists. Available to all users.

Returns up to 50 playlists, each with a `coverImages` array (up to 4 cover image URLs from the first tracks) for rendering a 2×2 collage.

**Response `200`:**
```json
{
  "playlists": [
    {
      "_id": "...", "title": "...",
      "coverImages": ["https://...", "https://...", "https://...", "https://..."],
      "musics": ["<id1>", "<id2>"]
    }
  ]
}
```

Cached for 120 seconds.

---

#### `GET /api/music/playlist/:id`
Get full playlist details including all track objects. Cached for 300 seconds.

---

#### `PATCH /api/music/playlist/:id/add/:musicId`
Add a track to an artist playlist. **Artist only, must own playlist.**

---

#### `PATCH /api/music/playlist/:id/remove/:musicId`
Remove a track from an artist playlist. **Artist only, must own playlist.**

---

#### `PATCH /api/music/playlist/:id`
Rename a playlist. **Artist only, must own playlist.**

**Request body:** `{ "title": "New Name" }`

---

#### `DELETE /api/music/playlist/:id`
Delete a playlist. **Artist only, must own playlist.**

---

### Albums

Base path: `/api/music`

Same ownership rules as artist playlists. Albums are private to the artist (not publicly browseable as a collection, but individual tracks are).

#### `POST /api/music/album` — Create album (artist only)
#### `GET /api/music/album/artist` — Get artist's albums (cached 120s)
#### `PATCH /api/music/album/:id/add/:musicId` — Add track to album
#### `PATCH /api/music/album/:id/remove/:musicId` — Remove track from album
#### `PATCH /api/music/album/:id` — Rename album (`{ "title": "..." }`)
#### `DELETE /api/music/album/:id` — Delete album

---

### User Playlists

Base path: `/api/music`

User-created playlists. Private to the owning user.

#### `POST /api/music/user-playlist` — Create playlist (title max 100 chars)
#### `GET /api/music/user-playlists` — Get user's playlists (with `coverImages` array)
#### `GET /api/music/user-playlist/:id` — Get playlist details (cached 300s)
#### `PATCH /api/music/user-playlist/:id/add/:musicId` — Add track
#### `PATCH /api/music/user-playlist/:id/remove/:musicId` — Remove track
#### `PATCH /api/music/user-playlist/:id` — Rename playlist
#### `DELETE /api/music/user-playlist/:id` — Delete playlist

---

### Analytics

#### `GET /api/analytics`
Get performance stats for the logged-in artist's tracks. **Artist only.**

**Response `200`:**
```json
{
  "analytics": [
    {
      "_id": "...",
      "title": "Track Name",
      "plays": 8421,
      "likes": 312,
      "uniqueListeners": 2104
    }
  ]
}
```

Cached for 300 seconds.

---

## Real-Time Sync (Socket.io)

All connected clients for the same user share a room. When one device starts playing a track, all other devices receive the update and sync their player state.

**Connection URL:** `ws://localhost:3002` (same host as the REST API)

**Authentication:** Pass the JWT as a query parameter:
```js
const socket = io(MUSIC_URL, {
  auth: { token: "<jwt>" }
});
```

Connection is rejected with `connect_error` if the token is missing or invalid.

### Events

#### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `play` | `{ track: { _id, title, audioUrl, coverImageUrl, ... } }` | Broadcast that you started playing a track |

**Rate limit:** 10 `play` events per 5 seconds per socket. Exceeding this drops the events silently.

**Acknowledgement response:**
```json
{ "status": "ok", "roomSize": 2, "userId": "..." }
```

#### Server → Client

| Event | Payload | When |
|-------|---------|------|
| `play` | `{ track: { ... } }` | Another device started a different track |
| `sync` | `{ track: { ... } }` | On reconnect — server sends the currently playing track if one exists |

---

## Caching Reference

| Endpoint | TTL | Invalidated on |
|----------|-----|----------------|
| All music list | 60s | Upload, delete |
| Single track | 60s | Edit, delete |
| Artist's tracks | 60s | Upload, delete |
| Public artist tracks | 120s | Upload, delete |
| Artist playlists | 120s | Create, rename, delete |
| All playlists | 120s | Create, rename, delete |
| Playlist detail | 300s | Add/remove track, rename, delete |
| User playlists | 60s | Create, rename, delete |
| User playlist detail | 300s | Add/remove track, rename, delete |
| Albums | 120s | Create, rename, delete |
| Analytics | 300s | Any track activity |

---

## Data Models

### Music
```
_id            ObjectId
title          String (indexed for text search)
audioUrl       String
audioFileId    String (ImageKit fileId for deletion)
coverImageUrl  String
coverFileId    String (ImageKit fileId for deletion)
artistId       ObjectId → User
duration       Number (seconds)
plays          Number
createdAt      Date
```

### Playlist (artist-created)
```
_id       ObjectId
title     String
artistId  ObjectId → User
musics    [ObjectId → Music]
createdAt Date
```

### Album
```
_id       ObjectId
title     String
artistId  ObjectId → User
musics    [ObjectId → Music]
createdAt Date
```

### UserPlaylist
```
_id       ObjectId
title     String
userId    ObjectId → User
musics    [ObjectId → Music]
createdAt Date
```

### Like
```
_id       ObjectId
userId    ObjectId → User
musicId   ObjectId → Music
createdAt Date
```

### History
```
_id       ObjectId
userId    ObjectId → User
musicId   ObjectId → Music
playedAt  Date
```

---

## Running Locally

```bash
cd music
npm install
cp .env.example .env   # fill in your values
npm run dev            # starts on port 3002 with nodemon
```

---

## Common Issues

| Symptom | Cause | Fix |
|---------|-------|-----|
| Upload returns 400 | File size > limit or wrong MIME type | Check audio ≤50 MB, image ≤5 MB, correct format |
| ImageKit files have UUID names | Old code used `uuidv4()` | Current code uses `sanitizedName_timestamp.ext` |
| Socket connection rejected | Invalid/expired JWT | Ensure the `token` cookie is present or pass `auth.token` in socket options |
| Cached data stale after edit | Cache not invalidated | All write operations call `cache.flushAll()` — verify mutation hit the right endpoint |
