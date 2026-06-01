jest.mock("../src/services/storage.service.js", () => ({
  uploadFile: jest
    .fn()
    .mockResolvedValue({ url: "http://cdn/file.mp3", fileId: "test-fid" }),
  deleteFile: jest.fn().mockResolvedValue(undefined),
}));

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
import musicModel from "../src/models/music.Model.js";

let artistId, artistToken, artist2Token, userToken;

beforeAll(async () => {
  await setupDB();
  artistId = new mongoose.Types.ObjectId().toString();
  artistToken = makeArtistToken({ id: artistId });
  artist2Token = makeArtistToken({
    id: new mongoose.Types.ObjectId().toString(),
  });
  userToken = makeUserToken();
});

afterAll(teardownDB);
afterEach(async () => {
  await clearDB();
  jest.clearAllMocks();
});

describe("PATCH /:id — editMusic", () => {
  it("returns 401 with no cookie", async () => {
    const id = new mongoose.Types.ObjectId();
    const res = await request(app)
      .patch(`/api/music/${id}`)
      .send({ title: "New Title" });
    expect(res.status).toBe(401);
  });

  it("returns 403 for user (not artist)", async () => {
    const music = await seedMusic({ artistId });
    const res = await request(app)
      .patch(`/api/music/${music._id}`)
      .set("Cookie", cookieFor(userToken))
      .send({ title: "New Title" });
    expect(res.status).toBe(403);
  });

  it("returns 400 for invalid ObjectId", async () => {
    const res = await request(app)
      .patch("/api/music/not-an-id")
      .set("Cookie", cookieFor(artistToken))
      .send({ title: "New Title" });
    expect(res.status).toBe(400);
  });

  it("returns 404 when music not found", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .patch(`/api/music/${fakeId}`)
      .set("Cookie", cookieFor(artistToken))
      .send({ title: "New Title" });
    expect(res.status).toBe(404);
  });

  it("returns 403 when editing music owned by another artist", async () => {
    const music = await seedMusic({ artistId });
    const res = await request(app)
      .patch(`/api/music/${music._id}`)
      .set("Cookie", cookieFor(artist2Token))
      .send({ title: "Stolen Title" });
    expect(res.status).toBe(403);
  });

  it("returns 400 when title is blank", async () => {
    const music = await seedMusic({ artistId });
    const res = await request(app)
      .patch(`/api/music/${music._id}`)
      .set("Cookie", cookieFor(artistToken))
      .send({ title: "   " });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/title/i);
  });

  it("returns 200 and updated music on success", async () => {
    const music = await seedMusic({ artistId });
    const res = await request(app)
      .patch(`/api/music/${music._id}`)
      .set("Cookie", cookieFor(artistToken))
      .send({ title: "Updated Title" });
    expect(res.status).toBe(200);
    expect(res.body.music.title).toBe("Updated Title");
  });
});

describe("DELETE /:id — deleteMusic", () => {
  it("returns 401 with no cookie", async () => {
    const id = new mongoose.Types.ObjectId();
    const res = await request(app).delete(`/api/music/${id}`);
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid ObjectId", async () => {
    const res = await request(app)
      .delete("/api/music/not-an-id")
      .set("Cookie", cookieFor(artistToken));
    expect(res.status).toBe(400);
  });

  it("returns 404 when music not found", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .delete(`/api/music/${fakeId}`)
      .set("Cookie", cookieFor(artistToken));
    expect(res.status).toBe(404);
  });

  it("returns 403 when deleting music owned by another artist", async () => {
    const music = await seedMusic({ artistId });
    const res = await request(app)
      .delete(`/api/music/${music._id}`)
      .set("Cookie", cookieFor(artist2Token));
    expect(res.status).toBe(403);
  });

  it("returns 200 and removes music from DB on success", async () => {
    const music = await seedMusic({ artistId });
    const res = await request(app)
      .delete(`/api/music/${music._id}`)
      .set("Cookie", cookieFor(artistToken));
    expect(res.status).toBe(200);
    const remaining = await musicModel.findById(music._id);
    expect(remaining).toBeNull();
  });

  it("attempts CDN cleanup on delete", async () => {
    const { deleteFile } = require("../src/services/storage.service.js");
    const music = await seedMusic({ artistId });
    await request(app)
      .delete(`/api/music/${music._id}`)
      .set("Cookie", cookieFor(artistToken));
    expect(deleteFile).toHaveBeenCalledWith("music-file-id-123");
    expect(deleteFile).toHaveBeenCalledWith("cover-file-id-123");
  });
});
