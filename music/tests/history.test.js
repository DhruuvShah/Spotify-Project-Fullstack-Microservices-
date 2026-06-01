import request from "supertest";
import mongoose from "mongoose";
import {
  app,
  setupDB,
  teardownDB,
  clearDB,
  makeUserToken,
  cookieFor,
  seedMusic,
} from "./helpers/setup.js";
import historyModel from "../src/models/history.model.js";

let userId, userToken;

beforeAll(async () => {
  await setupDB();
  userId = new mongoose.Types.ObjectId().toString();
  userToken = makeUserToken({ id: userId });
});

afterAll(teardownDB);
afterEach(clearDB);

describe("POST /history/:id — recordPlay", () => {
  it("returns 401 with no cookie", async () => {
    const id = new mongoose.Types.ObjectId();
    const res = await request(app).post(`/api/music/history/${id}`);
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid ObjectId", async () => {
    const res = await request(app)
      .post("/api/music/history/not-an-id")
      .set("Cookie", cookieFor(userToken));
    expect(res.status).toBe(400);
  });

  it("returns 201 on first play", async () => {
    const music = await seedMusic({});
    const res = await request(app)
      .post(`/api/music/history/${music._id}`)
      .set("Cookie", cookieFor(userToken));
    expect(res.status).toBe(201);
    expect(res.body.message).toMatch(/recorded/i);
  });

  it("is idempotent — same song twice creates only one history record", async () => {
    const music = await seedMusic({});
    await request(app)
      .post(`/api/music/history/${music._id}`)
      .set("Cookie", cookieFor(userToken));
    await request(app)
      .post(`/api/music/history/${music._id}`)
      .set("Cookie", cookieFor(userToken));

    const count = await historyModel.countDocuments({ userId });
    expect(count).toBe(1);
  });

  it("trims history to 50 entries after overflow", async () => {
    const existingDocs = Array.from({ length: 52 }, (_, i) => ({
      userId,
      musicId: new mongoose.Types.ObjectId(),
      playedAt: new Date(Date.now() - (52 - i) * 60000),
    }));
    await historyModel.insertMany(existingDocs);

    const music = await seedMusic({});
    await request(app)
      .post(`/api/music/history/${music._id}`)
      .set("Cookie", cookieFor(userToken));

    const count = await historyModel.countDocuments({ userId });
    expect(count).toBe(50);
  });
});

describe("GET /history — getHistory", () => {
  it("returns 401 with no cookie", async () => {
    const res = await request(app).get("/api/music/history");
    expect(res.status).toBe(401);
  });

  it("returns empty array when no history", async () => {
    const res = await request(app)
      .get("/api/music/history")
      .set("Cookie", cookieFor(userToken));
    expect(res.status).toBe(200);
    expect(res.body.musics).toEqual([]);
  });

  it("returns history with correct shape", async () => {
    const music = await seedMusic({});
    await request(app)
      .post(`/api/music/history/${music._id}`)
      .set("Cookie", cookieFor(userToken));

    const res = await request(app)
      .get("/api/music/history")
      .set("Cookie", cookieFor(userToken));
    expect(res.status).toBe(200);
    expect(res.body.musics).toHaveLength(1);
    const entry = res.body.musics[0];
    expect(entry).toHaveProperty("id");
    expect(entry).toHaveProperty("title");
    expect(entry).toHaveProperty("playedAt");
  });

  it("returns at most 20 entries", async () => {
    const musics = await Promise.all(
      Array.from({ length: 25 }, (_, i) => seedMusic({ title: `Song ${i}` })),
    );
    for (const m of musics) {
      await historyModel.create({
        userId,
        musicId: m._id,
        playedAt: new Date(),
      });
    }

    const res = await request(app)
      .get("/api/music/history")
      .set("Cookie", cookieFor(userToken));
    expect(res.status).toBe(200);
    expect(res.body.musics.length).toBeLessThanOrEqual(20);
  });
});
