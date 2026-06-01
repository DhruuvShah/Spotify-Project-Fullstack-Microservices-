jest.mock("express-rate-limit", () =>
  jest.fn(() => (req, res, next) => next()),
);
jest.mock("../src/broker/rabbit.js", () => ({
  publishToQueue: jest.fn().mockResolvedValue(undefined),
  connect: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("../src/config/config.js", () => ({
  __esModule: true,
  default: {
    JWT_SECRET: "test-jwt-secret-must-be-at-least-32-chars!!",
    MONGO_URI: "mongodb://overridden-by-memory-server",
    CLIENT_ID: "test-google-client-id",
    CLIENT_SECRET: "test-google-client-secret",
    RABBITMQ_URI: "amqp://localhost",
  },
}));
jest.mock("../src/utils/cache.js", () => ({
  cacheGet: jest.fn().mockReturnValue(undefined),
  cacheSet: jest.fn(),
  cacheDel: jest.fn(),
  cacheDelByPrefix: jest.fn(),
}));

import mongoose from "mongoose";
import request from "supertest";
import app from "../src/app.js";
import {
  setupDB,
  teardownDB,
  clearDB,
  registerUser,
  artistUser,
} from "./helpers/setup.js";

beforeAll(setupDB);
afterAll(teardownDB);
afterEach(async () => {
  await clearDB();
  jest.clearAllMocks();
});

// ─── Shared per-test state ────────────────────────────────────────────────────

let userCookie, artistCookie, userId, artistId;

beforeEach(async () => {
  const userRes = await registerUser();
  userCookie = userRes.headers["set-cookie"];
  userId = userRes.body.user.id;

  const artistRes = await request(app)
    .post("/api/auth/register")
    .send(artistUser);
  artistCookie = artistRes.headers["set-cookie"];
  artistId = artistRes.body.user.id;
});

// ─── POST /api/auth/follow/:artistId ─────────────────────────────────────────

describe("POST /api/auth/follow/:artistId", () => {
  test("follows an artist → 201", async () => {
    const res = await request(app)
      .post(`/api/auth/follow/${artistId}`)
      .set("Cookie", userCookie);
    expect(res.status).toBe(201);
    expect(res.body.message).toMatch(/followed/i);
  });

  test("returns 400 when trying to follow yourself", async () => {
    const res = await request(app)
      .post(`/api/auth/follow/${artistId}`)
      .set("Cookie", artistCookie);
    expect(res.status).toBe(400);
  });

  test("returns 404 when the target user is not an artist", async () => {
    const res = await request(app)
      .post(`/api/auth/follow/${userId}`)
      .set("Cookie", artistCookie);
    expect(res.status).toBe(404);
  });

  test("returns 409 when already following the artist", async () => {
    await request(app)
      .post(`/api/auth/follow/${artistId}`)
      .set("Cookie", userCookie);
    const res = await request(app)
      .post(`/api/auth/follow/${artistId}`)
      .set("Cookie", userCookie);
    expect(res.status).toBe(409);
  });

  test("returns 401 without auth cookie", async () => {
    const res = await request(app).post(`/api/auth/follow/${artistId}`);
    expect(res.status).toBe(401);
  });
});

// ─── DELETE /api/auth/follow/:artistId ───────────────────────────────────────

describe("DELETE /api/auth/follow/:artistId", () => {
  beforeEach(async () => {
    await request(app)
      .post(`/api/auth/follow/${artistId}`)
      .set("Cookie", userCookie);
  });

  test("unfollows an artist → 200", async () => {
    const res = await request(app)
      .delete(`/api/auth/follow/${artistId}`)
      .set("Cookie", userCookie);
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/unfollowed/i);
  });

  test("returns 401 without auth cookie", async () => {
    const res = await request(app).delete(`/api/auth/follow/${artistId}`);
    expect(res.status).toBe(401);
  });
});

// ─── GET /api/auth/following ──────────────────────────────────────────────────

describe("GET /api/auth/following", () => {
  test("returns the list of followed artists", async () => {
    await request(app)
      .post(`/api/auth/follow/${artistId}`)
      .set("Cookie", userCookie);
    const res = await request(app)
      .get("/api/auth/following")
      .set("Cookie", userCookie);
    expect(res.status).toBe(200);
    expect(res.body.artists).toHaveLength(1);
    expect(res.body.artists[0].id).toBe(artistId);
    expect(res.body.artists[0].name).toBe("Artist One");
  });

  test("returns an empty array when not following anyone", async () => {
    const res = await request(app)
      .get("/api/auth/following")
      .set("Cookie", userCookie);
    expect(res.status).toBe(200);
    expect(res.body.artists).toHaveLength(0);
  });

  test("returns 401 without auth cookie", async () => {
    const res = await request(app).get("/api/auth/following");
    expect(res.status).toBe(401);
  });
});

// ─── GET /api/auth/following-ids ─────────────────────────────────────────────

describe("GET /api/auth/following-ids", () => {
  test("returns an array containing the followed artist ID", async () => {
    await request(app)
      .post(`/api/auth/follow/${artistId}`)
      .set("Cookie", userCookie);
    const res = await request(app)
      .get("/api/auth/following-ids")
      .set("Cookie", userCookie);
    expect(res.status).toBe(200);
    expect(res.body.artistIds).toContain(artistId);
  });

  test("returns an empty array when not following anyone", async () => {
    const res = await request(app)
      .get("/api/auth/following-ids")
      .set("Cookie", userCookie);
    expect(res.status).toBe(200);
    expect(res.body.artistIds).toHaveLength(0);
  });

  test("returns 401 without auth cookie", async () => {
    const res = await request(app).get("/api/auth/following-ids");
    expect(res.status).toBe(401);
  });
});

// ─── GET /api/auth/artist/:artistId ──────────────────────────────────────────

describe("GET /api/auth/artist/:artistId", () => {
  test("returns the artist profile with followerCount and isFollowing", async () => {
    const res = await request(app)
      .get(`/api/auth/artist/${artistId}`)
      .set("Cookie", userCookie);
    expect(res.status).toBe(200);
    expect(res.body.artist.id).toBe(artistId);
    expect(res.body.artist.followerCount).toBe(0);
    expect(res.body.artist.isFollowing).toBe(false);
  });

  test("reflects isFollowing: true and followerCount: 1 after following", async () => {
    await request(app)
      .post(`/api/auth/follow/${artistId}`)
      .set("Cookie", userCookie);
    const res = await request(app)
      .get(`/api/auth/artist/${artistId}`)
      .set("Cookie", userCookie);
    expect(res.status).toBe(200);
    expect(res.body.artist.isFollowing).toBe(true);
    expect(res.body.artist.followerCount).toBe(1);
  });

  test("reflects isFollowing: false and followerCount: 0 after unfollowing", async () => {
    await request(app)
      .post(`/api/auth/follow/${artistId}`)
      .set("Cookie", userCookie);
    await request(app)
      .delete(`/api/auth/follow/${artistId}`)
      .set("Cookie", userCookie);
    const res = await request(app)
      .get(`/api/auth/artist/${artistId}`)
      .set("Cookie", userCookie);
    expect(res.status).toBe(200);
    expect(res.body.artist.isFollowing).toBe(false);
    expect(res.body.artist.followerCount).toBe(0);
  });

  test("returns 404 when the artist does not exist", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .get(`/api/auth/artist/${fakeId}`)
      .set("Cookie", userCookie);
    expect(res.status).toBe(404);
  });

  test("returns 404 when the target is a regular user, not an artist", async () => {
    const res = await request(app)
      .get(`/api/auth/artist/${userId}`)
      .set("Cookie", userCookie);
    expect(res.status).toBe(404);
  });

  test("returns 401 without auth cookie", async () => {
    const res = await request(app).get(`/api/auth/artist/${artistId}`);
    expect(res.status).toBe(401);
  });
});
