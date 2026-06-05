# Auth Service

Handles user registration, login, Google OAuth 2.0, JWT session management, and the artist-follow system. Publishes a `user_created` RabbitMQ event on every new signup so the notification service can send a welcome email.

**Port:** `3000`

---

## Tech Stack

| Package | Version | Purpose |
|---------|---------|---------|
| express | 5.2.1 | HTTP framework |
| mongoose | 9.6.1 | MongoDB ODM |
| jsonwebtoken | 9.0.3 | JWT signing & verification |
| bcryptjs | 3.0.3 | Password hashing |
| passport | 0.7.0 | OAuth middleware |
| passport-google-oauth20 | 2.0.0 | Google OAuth 2.0 strategy |
| express-rate-limit | 8.5.2 | Brute-force protection |
| express-validator | 7.3.2 | Request validation |
| node-cache | 5.1.2 | In-memory response caching |
| amqplib | 1.0.7 | RabbitMQ client |
| cookie-parser | — | HTTP-only cookie parsing |
| cors | — | CORS headers |
| morgan | 1.10.1 | HTTP request logging |

---

## Environment Variables

Create `auth/.env`:

```env
PORT=3000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/auth-db
JWT_SECRET=your_super_secret_jwt_key

# Google OAuth — from Google Cloud Console
CLIENT_ID=your_google_client_id
CLIENT_SECRET=your_google_client_secret

# RabbitMQ — CloudAMQP free tier works
RABBITMQ_URI=amqps://user:pass@host/vhost

# Where your frontend lives (for OAuth redirect + CORS)
FRONTEND_URL=http://localhost:5173

NODE_ENV=development
```

### Getting Google OAuth credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials
2. Create an OAuth 2.0 Client ID (Web application)
3. Add Authorized redirect URIs:
   - `http://localhost:3000/api/auth/google/callback` (development)
   - `https://your-auth-service.onrender.com/api/auth/google/callback` (production)
4. Copy `CLIENT_ID` and `CLIENT_SECRET`

---

## API Reference

Base path: `/api/auth`

### Authentication

#### `POST /api/auth/register`
Register a new user with email and password.

**Rate limited:** 10 requests / 15 minutes per IP

**Request body:**
```json
{
  "email": "user@example.com",
  "password": "StrongPass123",
  "fullname": {
    "firstName": "Dhruv",
    "lastName": "Shah"
  },
  "role": "user"
}
```

`role` must be `"user"` or `"artist"`.

**Response `201`:**
```json
{
  "token": "<jwt>",
  "user": {
    "_id": "...",
    "email": "user@example.com",
    "fullname": { "firstName": "Dhruv", "lastName": "Shah" },
    "role": "user"
  }
}
```

Also sets an HTTP-only `token` cookie (30-day expiry) and publishes a `user_created` event to RabbitMQ.

**Errors:**
- `400` — Validation failed (email format, password length, missing fields)
- `409` — Email already registered

---

#### `POST /api/auth/login`
Login with email and password.

**Rate limited:** 10 requests / 15 minutes per IP

**Request body:**
```json
{
  "email": "user@example.com",
  "password": "StrongPass123"
}
```

**Response `200`:** Same shape as `/register`.

**Errors:**
- `400` — Missing fields
- `401` — Invalid credentials

---

#### `GET /api/auth/me`
Return the currently authenticated user. Also auto-refreshes the JWT cookie if it expires within 7 days.

**Auth:** Requires `token` cookie or `Authorization: Bearer <token>` header.

**Response `200`:**
```json
{
  "user": { "_id": "...", "email": "...", "fullname": { ... }, "role": "user" },
  "token": "<refreshed_jwt_if_needed>"
}
```

**Errors:**
- `401` — No/invalid token

---

#### `POST /api/auth/logout`
Clear the auth cookie.

**Response `200`:**
```json
{ "message": "Logged out successfully" }
```

---

#### `GET /api/auth/google`
Redirect the user to Google's OAuth consent screen.

No request body needed — just open this URL in the browser.

---

#### `GET /api/auth/google/callback`
Google redirects here after the user approves access.

Sets the JWT cookie and redirects to:
- `/artist/dashboard` if the user's role is `"artist"`
- `/` for regular users

On first Google login, a new user record is created and a `user_created` RabbitMQ event is published.

---

### Follow System

Base path: `/api/follow`

All follow routes require authentication.

---

#### `POST /api/follow/follow/:artistId`
Follow an artist.

**Params:** `artistId` — MongoDB ObjectId of the artist user.

**Response `201`:**
```json
{ "message": "Followed successfully" }
```

**Errors:**
- `400` — Already following
- `404` — Artist not found or not an artist account

---

#### `DELETE /api/follow/follow/:artistId`
Unfollow an artist.

**Response `200`:**
```json
{ "message": "Unfollowed successfully" }
```

---

#### `GET /api/follow/following`
Get the full list of artists the current user follows.

**Response `200`:**
```json
{
  "following": [
    {
      "_id": "...",
      "fullname": { "firstName": "Artist", "lastName": "Name" },
      "email": "artist@example.com"
    }
  ]
}
```

Cached for 60 seconds per user.

---

#### `GET /api/follow/following-ids`
Get only the IDs of followed artists. Lighter than `/following` — used by the frontend to check follow status without fetching full objects.

**Response `200`:**
```json
{ "followingIds": ["<artistId1>", "<artistId2>"] }
```

---

#### `GET /api/follow/artist/:artistId`
Get public profile info for an artist: follower count and whether the current user follows them.

**Response `200`:**
```json
{
  "artist": {
    "_id": "...",
    "fullname": { "firstName": "Artist", "lastName": "Name" },
    "email": "artist@example.com"
  },
  "followerCount": 142,
  "isFollowing": true
}
```

Cached for 30 seconds per (viewer, artist) pair.

---

## RabbitMQ Event Published

### `user_created`

Published whenever a new user registers (email or Google OAuth).

**Queue:** `user_created`

**Payload:**
```json
{
  "email": "user@example.com",
  "role": "user",
  "fullname": { "firstName": "Dhruv", "lastName": "Shah" }
}
```

The notification service consumes this to send a welcome email.

**Reconnect logic:** The RabbitMQ client uses exponential backoff (1s → 2s → 4s → … → 30s max) to reconnect automatically if the connection drops — important for free-tier services that go idle.

---

## JWT Details

- **Algorithm:** HS256
- **Expiry:** 30 days
- **Delivery:** HTTP-only cookie + JSON response body
- **Auto-refresh:** If the token expires within 7 days, `/me` issues a new one
- **Cookie flags:** `httpOnly: true`, `sameSite: "none"`, `secure: true` in production

---

## Data Model

### User
```
_id         ObjectId
email       String (unique, indexed)
password    String (bcrypt hash, omitted on queries)
fullname    { firstName, lastName }
role        "user" | "artist"
createdAt   Date
updatedAt   Date
```

### Follow
```
_id         ObjectId
follower    ObjectId → User
following   ObjectId → User (must be artist)
createdAt   Date
```

---

## Running Locally

```bash
cd auth
npm install
cp .env.example .env   # fill in your values
npm run dev            # starts on port 3000 with nodemon
```

---

## Common Issues

| Symptom | Cause | Fix |
|---------|-------|-----|
| Google OAuth redirect fails | Callback URL not in Google Console whitelist | Add `http://localhost:3000/api/auth/google/callback` to authorized URIs |
| Cookie not sent to music service | `withCredentials` missing on Axios | Add `{ withCredentials: true }` to every Axios call in the frontend |
| `user_created` messages never reach notification service | RabbitMQ connection dropped silently | The reconnect logic handles this — check `RABBITMQ_URI` is set correctly on Render |
| Login returns 401 on valid credentials | `JWT_SECRET` mismatch between auth and music service | Both services must use the same `JWT_SECRET` |
