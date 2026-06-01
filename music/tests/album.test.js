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
  cookieFor,
  seedMusic,
} from "./helpers/setup.js";
import albumModel from "../src/models/album.model.js";

let artistId, artistToken, artist2Token;

beforeAll(async () => {
  await setupDB();
  artistId = new mongoose.Types.ObjectId().toString();
  artistToken = makeArtistToken({
    id: artistId,
    fullname: { firstName: "Test", lastName: "Artist" },
  });
  artist2Token = makeArtistToken({
    id: new mongoose.Types.ObjectId().toString(),
  });
});

afterAll(teardownDB);
afterEach(async () => {
  await clearDB();
  jest.clearAllMocks();
});

async function createAlbum(title = "My Album", cookie = artistToken) {
  return request(app)
    .post("/api/music/album")
    .set("Cookie", cookieFor(cookie))
    .send({ title });
}

describe("POST /album — create", () => {
  it("returns 401 with no cookie", async () => {
    const res = await request(app)
      .post("/api/music/album")
      .send({ title: "Test" });
    expect(res.status).toBe(401);
  });

  it("returns 400 when title is missing", async () => {
    const res = await createAlbum("");
    expect(res.status).toBe(400);
  });

  it("returns 201 on success", async () => {
    const res = await createAlbum("Test Album");
    expect(res.status).toBe(201);
    expect(res.body.album.title).toBe("Test Album");
  });
});

describe("GET /album/artist — get albums", () => {
  it("returns 200 with empty list when no albums", async () => {
    const res = await request(app)
      .get("/api/music/album/artist")
      .set("Cookie", cookieFor(artistToken));
    expect(res.status).toBe(200);
    expect(res.body.albums).toEqual([]);
  });

  it("returns albums with populated musics", async () => {
    const created = await createAlbum("Album With Songs");
    const albumId = created.body.album._id;
    const music = await seedMusic({ artistId });
    await request(app)
      .patch(`/api/music/album/${albumId}/add/${music._id}`)
      .set("Cookie", cookieFor(artistToken));

    const res = await request(app)
      .get("/api/music/album/artist")
      .set("Cookie", cookieFor(artistToken));
    expect(res.status).toBe(200);
    expect(res.body.albums[0].musics).toHaveLength(1);
  });
});

describe("PATCH /album/:id/add/:musicId — add music", () => {
  it("returns 404 when album belongs to another artist", async () => {
    const created = await createAlbum("Other Album");
    const music = await seedMusic({ artistId });
    const res = await request(app)
      .patch(`/api/music/album/${created.body.album._id}/add/${music._id}`)
      .set("Cookie", cookieFor(artist2Token));
    expect(res.status).toBe(404);
  });

  it("returns 200 on successful add", async () => {
    const created = await createAlbum("My Album");
    const music = await seedMusic({ artistId });
    const res = await request(app)
      .patch(`/api/music/album/${created.body.album._id}/add/${music._id}`)
      .set("Cookie", cookieFor(artistToken));
    expect(res.status).toBe(200);
  });

  it("returns 409 on duplicate add", async () => {
    const created = await createAlbum("Dup Album");
    const music = await seedMusic({ artistId });
    await request(app)
      .patch(`/api/music/album/${created.body.album._id}/add/${music._id}`)
      .set("Cookie", cookieFor(artistToken));
    const res = await request(app)
      .patch(`/api/music/album/${created.body.album._id}/add/${music._id}`)
      .set("Cookie", cookieFor(artistToken));
    expect(res.status).toBe(409);
  });
});

describe("PATCH /album/:id/remove/:musicId — remove music", () => {
  it("returns 200 on successful remove", async () => {
    const created = await createAlbum("Remove Album");
    const music = await seedMusic({ artistId });
    const albumId = created.body.album._id;
    await request(app)
      .patch(`/api/music/album/${albumId}/add/${music._id}`)
      .set("Cookie", cookieFor(artistToken));
    const res = await request(app)
      .patch(`/api/music/album/${albumId}/remove/${music._id}`)
      .set("Cookie", cookieFor(artistToken));
    expect(res.status).toBe(200);
    const album = await albumModel.findById(albumId);
    expect(album.musics).toHaveLength(0);
  });
});

describe("PATCH /album/:id — rename", () => {
  it("returns 200 on successful rename", async () => {
    const created = await createAlbum("Old Album");
    const res = await request(app)
      .patch(`/api/music/album/${created.body.album._id}`)
      .set("Cookie", cookieFor(artistToken))
      .send({ title: "New Album Name" });
    expect(res.status).toBe(200);
    expect(res.body.album.title).toBe("New Album Name");
  });

  it("returns 400 when title is blank", async () => {
    const created = await createAlbum("Has Name");
    const res = await request(app)
      .patch(`/api/music/album/${created.body.album._id}`)
      .set("Cookie", cookieFor(artistToken))
      .send({ title: "" });
    expect(res.status).toBe(400);
  });
});

describe("DELETE /album/:id — delete", () => {
  it("returns 404 when album belongs to another artist", async () => {
    const created = await createAlbum("Protected Album");
    const res = await request(app)
      .delete(`/api/music/album/${created.body.album._id}`)
      .set("Cookie", cookieFor(artist2Token));
    expect(res.status).toBe(404);
  });

  it("returns 200 and removes album on success", async () => {
    const created = await createAlbum("Deletable Album");
    const albumId = created.body.album._id;
    const res = await request(app)
      .delete(`/api/music/album/${albumId}`)
      .set("Cookie", cookieFor(artistToken));
    expect(res.status).toBe(200);
    const album = await albumModel.findById(albumId);
    expect(album).toBeNull();
  });
});
