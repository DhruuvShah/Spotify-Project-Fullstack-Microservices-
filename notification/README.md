# Notification Service

Event-driven email notification service. Listens to a RabbitMQ queue and sends transactional emails via the Gmail REST API. All notification records (sent or failed) are persisted to MongoDB.

**Port:** `3001`

---

## Tech Stack

| Package | Version | Purpose |
|---------|---------|---------|
| express | 5.2.1 | HTTP framework (health check + query API) |
| mongoose | 9.6.1 | MongoDB ODM |
| googleapis | 173.0.0 | Gmail REST API client |
| amqplib | 1.0.7 | RabbitMQ consumer |
| dotenv | 17.4.2 | Environment variable loading |

---

## Why Gmail REST API (not SMTP)?

Cloud providers like Render **block outbound SMTP ports (25, 465, 587)** at the firewall level to prevent spam abuse. Any attempt to use nodemailer SMTP will time out regardless of IPv4/IPv6 settings.

The Gmail REST API communicates over **HTTPS (port 443)**, which is never blocked. This service uses `googleapis` to call `gmail.users.messages.send`, which:
- Reuses the same Google OAuth2 credentials as the OAuth login flow
- Requires no new accounts or API keys beyond what you already have
- Works reliably on Render, Railway, Fly.io, and similar platforms

---

## Environment Variables

Create `notification/.env`:

```env
PORT=3001
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/notification-db

# RabbitMQ
RABBITMQ_URI=amqps://user:pass@host/vhost

# Google OAuth2 — same credentials as the auth service
CLIENT_ID=your_google_client_id
CLIENT_SECRET=your_google_client_secret

# Gmail API refresh token — see setup below
REFRESH_TOKEN=your_refresh_token

# The Gmail address that sends the emails
EMAIL_USER=your.email@gmail.com
```

### Generating the Gmail API Refresh Token

The refresh token lets this service send email on behalf of your Gmail account without storing a password.

1. Go to [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → **Enable APIs** → enable **Gmail API**
2. Go to [OAuth 2.0 Playground](https://developers.google.com/oauthplayground)
3. Click the gear icon (top right) → check **"Use your own OAuth credentials"**
4. Enter your `CLIENT_ID` and `CLIENT_SECRET`
5. In Step 1, find **Gmail API v1** and select `https://mail.google.com/`
6. Click **Authorize APIs** → sign in with your Gmail account → allow access
7. In Step 2, click **Exchange authorization code for tokens**
8. Copy the `refresh_token` value → paste into `REFRESH_TOKEN` in your `.env`

**Important:** The refresh token does not expire unless you explicitly revoke it in Google Account settings. Keep it secret.

---

## RabbitMQ Events Consumed

### `user_created`

**Published by:** Auth service on every new user registration (email or Google OAuth).

**Payload:**
```json
{
  "email": "user@example.com",
  "role": "user",
  "fullname": {
    "firstName": "Dhruv",
    "lastName": "Shah"
  }
}
```

**Handler:** `src/handlers/userCreated.js`

**What it does:**
1. Validates the payload (email, role, fullname.firstName required)
2. Renders the welcome email HTML using `src/templates/welcome.js`
3. Calls `sendEmail()` via the Gmail REST API
4. On success: saves a `Notification` record with `status: "sent"`
5. On failure: saves a `Notification` record with `status: "failed"` and `errorMessage`

**Reconnect logic:** If the RabbitMQ connection drops (common on free-tier idle), the service reconnects automatically using exponential backoff: 1s → 2s → 4s → … → 30s max.

---

## API Reference

### Health Check

#### `GET /health`
Returns service status. Used by Render and load balancers.

**Response `200`:**
```json
{ "status": "ok" }
```

---

### Notifications Query

#### `GET /notifications/:email`
Retrieve notification records for a given email address. Useful for debugging delivery failures.

**Query parameters:**

| Param | Default | Max | Description |
|-------|---------|-----|-------------|
| `page` | 1 | — | Page number |
| `limit` | 20 | 100 | Records per page |
| `type` | — | — | Filter by notification type (e.g. `"welcome"`) |
| `status` | — | — | Filter by `"sent"` or `"failed"` |

**Response `200`:**
```json
{
  "total": 3,
  "page": 1,
  "limit": 20,
  "data": [
    {
      "_id": "...",
      "recipientEmail": "user@example.com",
      "type": "welcome",
      "status": "sent",
      "messageId": "<gmail_message_id>",
      "createdAt": "2026-06-05T10:33:00.000Z"
    }
  ]
}
```

**Example — check why a welcome email failed:**
```
GET /notifications/user@example.com?type=welcome&status=failed
```

---

## Data Model

### Notification
```
_id             ObjectId
recipientEmail  String (indexed)
type            String  — "welcome" (extensible for future types)
status          String  — "sent" | "failed"
messageId       String  — Gmail message ID (on success)
errorMessage    String  — Error detail (on failure)
createdAt       Date
updatedAt       Date
```

---

## Email Templates

Templates live in `src/templates/`. Each template is a function that receives data and returns an HTML string.

### `welcome.js`

**Exported function:** `welcomeTemplate({ firstName, role })`

Renders a branded welcome email with the user's first name and a different message depending on whether they registered as a `"user"` or `"artist"`.

---

## Architecture

```
Auth Service
    │
    │  publishes "user_created" to RabbitMQ queue
    ▼
RabbitMQ (CloudAMQP)
    │
    │  consumed by notification service
    ▼
userCreatedHandler
    │
    ├── sendEmail() ──► Gmail REST API (HTTPS port 443)
    │                        │
    │                        ▼
    │                   Email delivered
    │
    └── Notification.create() ──► MongoDB
                                   { status: "sent" | "failed" }
```

---

## Running Locally

```bash
cd notification
npm install
cp .env.example .env   # fill in your values
npm run dev            # starts on port 3001 with nodemon
```

To test email sending locally, you can temporarily call `sendEmail()` directly from a test script. Make sure your `REFRESH_TOKEN` has the `https://mail.google.com/` scope.

---

## Common Issues

| Symptom | Cause | Fix |
|---------|-------|-----|
| `status: "failed"`, error: `Connection timeout` | Render blocks SMTP ports | This service uses Gmail REST API — do **not** switch back to nodemailer SMTP |
| `status: "failed"`, error: `invalid_grant` | Refresh token revoked or wrong scope | Re-generate the refresh token with `https://mail.google.com/` scope at OAuth Playground |
| `status: "failed"`, error: `invalid_client` | Wrong `CLIENT_ID` or `CLIENT_SECRET` | Double-check both values in Render environment variables |
| Messages never arrive (no DB records) | Auth service not publishing — `RABBITMQ_URI` missing | Verify `RABBITMQ_URI` is set in the auth service's Render env vars |
| Notification service crashes on startup | Missing required env var | Check all 7 environment variables are set |
