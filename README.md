# Lumina — Full-Stack Music Streaming Platform

A full-stack, production-deployed music streaming app built with a microservices architecture. Users can browse, search, like, and stream tracks in real time across multiple devices. Artists can upload music, manage playlists and albums, and view analytics. Inspired by Spotify's product experience, built from scratch.

**Live demo:** [Deployed on Vercel + Render]

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                   React Frontend                     │
│              (Vite · React Router · Axios)           │
└────────┬──────────────┬───────────────┬─────────────┘
         │ REST          │ REST           │ WebSocket
         ▼              ▼               ▼
┌──────────────┐ ┌──────────────┐      Socket.io
│ Auth Service │ │ Music Service│◄────(same port
│   port 3000  │ │   port 3002  │      as Music)
└──────┬───────┘ └──────────────┘
       │ RabbitMQ (user_created event)
       ▼
┌──────────────────┐
│ Notification Svc │
│    port 3001     │
└──────────────────┘
       │ Gmail REST API (HTTPS)
       ▼
  Welcome Email
```

### Services

| Service | Tech | Responsibility |
|---------|------|----------------|
| **Auth** | Express, MongoDB, JWT, Passport | Registration, login, Google OAuth, follow system |
| **Music** | Express, MongoDB, Socket.io, ImageKit | Track upload, streaming, playlists, albums, likes, real-time sync |
| **Notification** | Express, MongoDB, RabbitMQ, Gmail API | Welcome emails triggered by auth events |
| **Frontend** | React 19, Vite, Axios, Socket.io-client | Full UI — browse, player, artist dashboard |

---

## Tech Stack

- **Backend:** Node.js (ES Modules), Express 5
- **Database:** MongoDB + Mongoose
- **Auth:** JWT (HTTP-only cookies), Google OAuth 2.0 via Passport
- **Real-time:** Socket.io (cross-device playback sync)
- **File Storage:** ImageKit CDN
- **Message Queue:** RabbitMQ (CloudAMQP)
- **Email:** Gmail REST API via `googleapis`
- **Frontend:** React 19, React Router v7, Axios, Lucide React
- **Deployment:** Render (backends), Vercel (frontend)

---

## Repository Structure

```
├── auth/           # Authentication & follow service (port 3000)
├── music/          # Music, playlists, albums, likes, Socket.io (port 3002)
├── notification/   # Email notifications via RabbitMQ (port 3001)
├── frontend/       # React SPA
└── README.md
```

Each service is independently deployable with its own `package.json`, `.env`, and MongoDB collection.

---

## Quick Start (Local Development)

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- RabbitMQ (local or CloudAMQP free tier)
- ImageKit account (free tier)
- Google Cloud project with OAuth 2.0 credentials + Gmail API enabled

### 1. Clone the repo

```bash
git clone https://github.com/DhruuvShah/Spotify-Project-Fullstack-Microservices-.git
cd Spotify-Project-Fullstack-Microservices-
```

### 2. Set up each service

Each service needs its own `.env` file. See each service's README for the required variables.

```bash
# Auth
cd auth && npm install

# Music
cd ../music && npm install

# Notification
cd ../notification && npm install

# Frontend
cd ../frontend && npm install
```

### 3. Start all services

Open 4 terminals:

```bash
# Terminal 1 — Auth (port 3000)
cd auth && npm run dev

# Terminal 2 — Music (port 3002)
cd music && npm run dev

# Terminal 3 — Notification (port 3001)
cd notification && npm run dev

# Terminal 4 — Frontend (port 5173)
cd frontend && npm run dev
```

Then open `http://localhost:5173`.

---

## Key Features

### For Users
- Register / login with email+password or Google OAuth
- Browse all tracks on the home feed
- Full-text search across the music library
- Like tracks — saved to a personal Liked Songs playlist
- Create and manage personal playlists
- Real-time playback sync across multiple devices (open two browser tabs — they stay in sync)
- Play history tracking
- Follow artists and view their profiles

### For Artists
- Dedicated Artist Studio dashboard
- Upload tracks with cover art (audio up to 50 MB, cover up to 5 MB)
- Create and manage playlists and albums
- Rename or delete uploaded tracks
- Analytics: total plays, likes, unique listeners per track

### Platform
- Welcome email on registration (Gmail API over HTTPS — works on Render's restricted network)
- Rate limiting on all sensitive endpoints
- In-memory caching (node-cache) on all read-heavy endpoints
- File deletion cascades: deleting a track removes it from playlists, albums, likes, and history

---

## Deployment

### Render (Backends)
Each service is deployed as a separate Render Web Service.

**Important:** Set `NODE_ENV=production` to enable secure cookies. Each service needs its own environment variables — see the service READMEs.

**Render SMTP note:** Render blocks outbound SMTP ports (25, 465, 587). The notification service uses the Gmail REST API (HTTPS port 443) to work around this — do **not** switch to nodemailer SMTP.

### Vercel (Frontend)
The `frontend/` folder deploys to Vercel directly. Set the two environment variables:

```
VITE_AUTH_URL=https://your-auth-service.onrender.com
VITE_MUSIC_URL=https://your-music-service.onrender.com
```

---

## Environment Variables Summary

| Variable | Auth | Music | Notification | Notes |
|----------|------|-------|-------------|-------|
| `MONGO_URI` | ✓ | ✓ | ✓ | Separate DBs per service |
| `JWT_SECRET` | ✓ | ✓ | | Must match across Auth + Music |
| `CLIENT_ID` | ✓ | | ✓ | Google OAuth client ID |
| `CLIENT_SECRET` | ✓ | | ✓ | Google OAuth client secret |
| `REFRESH_TOKEN` | | | ✓ | Gmail API refresh token |
| `EMAIL_USER` | | | ✓ | Gmail address to send from |
| `RABBITMQ_URI` | ✓ | | ✓ | CloudAMQP connection string |
| `IMAGEKIT_PUBLIC_KEY` | | ✓ | | |
| `IMAGEKIT_PRIVATE_KEY` | | ✓ | | |
| `IMAGEKIT_URL_ENDPOINT` | | ✓ | | |
| `FRONTEND_URL` | ✓ | ✓ | | For CORS |

---

## Common Pitfalls & Lessons Learned

| Problem | Root Cause | Fix |
|---------|-----------|-----|
| Emails never arrive on Render | Render blocks SMTP ports 465/587 at firewall | Use Gmail REST API (`googleapis`) over HTTPS |
| Node.js v21 Happy Eyeballs picks IPv6 | `dns.setDefaultResultOrder` and `family:4` are bypassed by Happy Eyeballs | Pre-resolve with `dns.resolve4()` or use HTTPS API |
| RabbitMQ messages silently dropped | Connection drops on free-tier idle; no reconnect logic | Add exponential backoff reconnect on `connection.on("close")` |
| ImageKit stores UUID filenames | `uuidv4()` was used instead of original filename | Sanitize `originalname` + append `Date.now()` |
| Autoplay blocked by browsers | Browser autoplay policy blocks unmuted audio | Start muted, play, then unmute |
| JWT cookie not sent cross-origin | Missing `withCredentials: true` on Axios | Add `withCredentials: true` to every Axios call |

---

## License

MIT
