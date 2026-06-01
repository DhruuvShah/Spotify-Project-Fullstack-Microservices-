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

describe("GET /api/music — getAllMusics", () => {
  it("returns 401 with no cookie", async () => {
    const res = await request(app).get("/api/music/");
    expect(res.status).toBe(401);
  });

  it("returns 200 with empty list when no music exists", async () => {
    const res = await request(app)
      .get("/api/music/")
      .set("Cookie", cookieFor(userToken));
    expect(res.status).toBe(200);
    expect(res.body.musics).toEqual([]);
  });

  it("returns music list with correct shape", async () => {
    await seedMusic({ artistId });
    const res = await request(app)
      .get("/api/music/")
      .set("Cookie", cookieFor(userToken));
    expect(res.status).toBe(200);
    expect(res.body.musics).toHaveLength(1);
    const m = res.body.musics[0];
    expect(m).toHaveProperty("id");
    expect(m).toHaveProperty("title");
    expect(m).toHaveProperty("artist");
    expect(m).toHaveProperty("musicUrl");
    expect(m).toHaveProperty("coverImageUrl");
    expect(m).toHaveProperty("isInPlaylist");
  });

  it("respects pagination params", async () => {
    await seedMusic({ artistId, title: "Song A" });
    await seedMusic({ artistId, title: "Song B" });
    const res = await request(app)
      .get("/api/music/?skip=0&limit=1")
      .set("Cookie", cookieFor(userToken));
    expect(res.status).toBe(200);
    expect(res.body.musics).toHaveLength(1);
  });

  it("caps limit at 50", async () => {
    const res = await request(app)
      .get("/api/music/?limit=999")
      .set("Cookie", cookieFor(userToken));
    expect(res.status).toBe(200);
  });
});

describe("GET /api/music/get-details/:id", () => {
  it("returns 400 for invalid ObjectId", async () => {
    const res = await request(app)
      .get("/api/music/get-details/not-an-id")
      .set("Cookie", cookieFor(userToken));
    expect(res.status).toBe(400);
  });

  it("returns 404 when music not found", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .get(`/api/music/get-details/${fakeId}`)
      .set("Cookie", cookieFor(userToken));
    expect(res.status).toBe(404);
  });

  it("returns 200 with music shape on success", async () => {
    const music = await seedMusic({ artistId });
    const res = await request(app)
      .get(`/api/music/get-details/${music._id}`)
      .set("Cookie", cookieFor(userToken));
    expect(res.status).toBe(200);
    expect(res.body.music).toMatchObject({
      title: "Test Song",
      artist: "Test Artist",
    });
  });
});

describe("GET /api/music/artist-musics", () => {
  it("returns 401 with no cookie", async () => {
    const res = await request(app).get("/api/music/artist-musics");
    expect(res.status).toBe(401);
  });

  it("returns 403 for user (not artist)", async () => {
    const res = await request(app)
      .get("/api/music/artist-musics")
      .set("Cookie", cookieFor(userToken));
    expect(res.status).toBe(403);
  });

  it("returns only the artist's own music", async () => {
    const otherId = new mongoose.Types.ObjectId().toString();
    await seedMusic({ artistId });
    await seedMusic({ artistId: otherId, title: "Other Artist Song" });

    const res = await request(app)
      .get("/api/music/artist-musics")
      .set("Cookie", cookieFor(artistToken));
    expect(res.status).toBe(200);
    expect(res.body.musics).toHaveLength(1);
    expect(res.body.musics[0].title).toBe("Test Song");
  });
});

describe("GET /api/music/by-artist/:artistId", () => {
  it("returns 400 for invalid artistId", async () => {
    const res = await request(app)
      .get("/api/music/by-artist/bad-id")
      .set("Cookie", cookieFor(userToken));
    expect(res.status).toBe(400);
  });

  it("returns public music for an artist", async () => {
    await seedMusic({ artistId });
    const res = await request(app)
      .get(`/api/music/by-artist/${artistId}`)
      .set("Cookie", cookieFor(userToken));
    expect(res.status).toBe(200);
    expect(res.body.musics).toHaveLength(1);
  });
});
