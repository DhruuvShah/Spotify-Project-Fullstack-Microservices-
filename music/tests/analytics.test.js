jest.mock("../src/utils/cache.js", () => ({
  cacheGet: jest.fn().mockReturnValue(undefined),
  cacheSet: jest.fn(),
  cacheDel: jest.fn(),
  cacheDelByPrefix: jest.fn(),
}));

import request from "supertest";
import mongoose from "mongoose";
import {
  app,
  setupDB,
  teardownDB,
  clearDB,
  makeArtistToken,
  makeUserToken,
  cookieFor,
  seedMusic,
} from "./helpers/setup.js";
import historyModel from "../src/models/history.model.js";
import likeModel from "../src/models/like.model.js";

let artistId, artistToken, userToken;

beforeAll(async () => {
  await setupDB();
  artistId = new mongoose.Types.ObjectId().toString();
  artistToken = makeArtistToken({ id: artistId });
  userToken = makeUserToken();
});

afterAll(teardownDB);
afterEach(async () => {
  await clearDB();
  jest.clearAllMocks();
});

describe("GET /analytics", () => {
  it("returns 401 with no cookie", async () => {
    const res = await request(app).get("/api/music/analytics");
    expect(res.status).toBe(401);
  });

  it("returns 403 for user (not artist)", async () => {
    const res = await request(app)
      .get("/api/music/analytics")
      .set("Cookie", cookieFor(userToken));
    expect(res.status).toBe(403);
  });

  it("returns empty analytics when artist has no music", async () => {
    const res = await request(app)
      .get("/api/music/analytics")
      .set("Cookie", cookieFor(artistToken));
    expect(res.status).toBe(200);
    expect(res.body.analytics).toEqual([]);
    expect(res.body.totals).toEqual({ totalPlays: 0, totalLikes: 0 });
    expect(res.body.trackCount).toBe(0);
  });

  it("returns correct per-track and total analytics", async () => {
    const m1 = await seedMusic({ artistId, title: "Hit Song" });
    const m2 = await seedMusic({ artistId, title: "B-Side" });
    const listenerId = new mongoose.Types.ObjectId().toString();

    await historyModel.insertMany([
      { userId: listenerId, musicId: m1._id, playedAt: new Date() },
      { userId: listenerId, musicId: m1._id, playedAt: new Date() },
      { userId: "another-user", musicId: m1._id, playedAt: new Date() },
      { userId: listenerId, musicId: m2._id, playedAt: new Date() },
    ]);
    await likeModel.insertMany([
      { userId: listenerId, musicId: m1._id },
      { userId: "another-user", musicId: m1._id },
    ]);

    const res = await request(app)
      .get("/api/music/analytics")
      .set("Cookie", cookieFor(artistToken));
    expect(res.status).toBe(200);

    const hit = res.body.analytics.find((a) => a.title === "Hit Song");
    const bside = res.body.analytics.find((a) => a.title === "B-Side");

    expect(hit.totalPlays).toBe(3);
    expect(hit.uniqueListeners).toBe(2);
    expect(hit.totalLikes).toBe(2);
    expect(bside.totalPlays).toBe(1);
    expect(bside.totalLikes).toBe(0);

    expect(res.body.totals.totalPlays).toBe(4);
    expect(res.body.totals.totalLikes).toBe(2);
    expect(res.body.trackCount).toBe(2);
  });

  it("returns zero counts for tracks with no plays or likes", async () => {
    await seedMusic({ artistId, title: "Unheard Song" });
    const res = await request(app)
      .get("/api/music/analytics")
      .set("Cookie", cookieFor(artistToken));
    expect(res.status).toBe(200);
    const track = res.body.analytics[0];
    expect(track.totalPlays).toBe(0);
    expect(track.totalLikes).toBe(0);
    expect(track.uniqueListeners).toBe(0);
  });
});
