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
import playlistModel from "../src/models/playlist.model.js";

let artistId, artistToken, artist2Token, userToken;

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
  userToken = makeUserToken();
});

afterAll(teardownDB);
afterEach(async () => {
  await clearDB();
  jest.clearAllMocks();
});

async function createPlaylist(title = "My Playlist", cookie = artistToken) {
  return request(app)
    .post("/api/music/playlist")
    .set("Cookie", cookieFor(cookie))
    .send({ title });
}

describe("POST /playlist — create", () => {
  it("returns 401 with no cookie", async () => {
    const res = await request(app)
      .post("/api/music/playlist")
      .send({ title: "Test" });
    expect(res.status).toBe(401);
  });

  it("returns 403 for user (not artist)", async () => {
    const res = await request(app)
      .post("/api/music/playlist")
      .set("Cookie", cookieFor(userToken))
      .send({ title: "Test" });
    expect(res.status).toBe(403);
  });

  it("returns 400 when title is missing", async () => {
    const res = await createPlaylist("");
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/title/i);
  });

  it("returns 201 and playlist on success", async () => {
    const res = await createPlaylist("My Playlist");
    expect(res.status).toBe(201);
    expect(res.body.playlist.title).toBe("My Playlist");
  });
});

describe("GET /playlists — public list", () => {
  it("returns 401 with no cookie", async () => {
    const res = await request(app).get("/api/music/playlists");
    expect(res.status).toBe(401);
  });

  it("returns 200 with list of playlists", async () => {
    await createPlaylist("Public Playlist");
    const res = await request(app)
      .get("/api/music/playlists")
      .set("Cookie", cookieFor(userToken));
    expect(res.status).toBe(200);
    expect(res.body.playlists.length).toBeGreaterThanOrEqual(1);
  });
});

describe("GET /playlist/:id — by id", () => {
  it("returns 400 for invalid id", async () => {
    const res = await request(app)
      .get("/api/music/playlist/bad-id")
      .set("Cookie", cookieFor(userToken));
    expect(res.status).toBe(400);
  });

  it("returns 404 when not found", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .get(`/api/music/playlist/${fakeId}`)
      .set("Cookie", cookieFor(userToken));
    expect(res.status).toBe(404);
  });

  it("returns 200 with playlist shape on success", async () => {
    const created = await createPlaylist("Detail Playlist");
    const id = created.body.playlist._id;
    const res = await request(app)
      .get(`/api/music/playlist/${id}`)
      .set("Cookie", cookieFor(userToken));
    expect(res.status).toBe(200);
    expect(res.body.playlist).toMatchObject({
      title: "Detail Playlist",
      musics: [],
    });
  });
});

describe("GET /playlist/artist — artist playlists", () => {
  it("returns 200 with artist's playlists", async () => {
    await createPlaylist("Artist Playlist");
    const res = await request(app)
      .get("/api/music/playlist/artist")
      .set("Cookie", cookieFor(artistToken));
    expect(res.status).toBe(200);
    expect(res.body.playlists.length).toBeGreaterThanOrEqual(1);
  });
});

describe("PATCH /playlist/:id/add/:musicId — add music", () => {
  it("returns 404 when playlist belongs to another artist", async () => {
    const created = await createPlaylist("Other Artist PL");
    const playlistId = created.body.playlist._id;
    const music = await seedMusic({ artistId });
    const res = await request(app)
      .patch(`/api/music/playlist/${playlistId}/add/${music._id}`)
      .set("Cookie", cookieFor(artist2Token));
    expect(res.status).toBe(404);
  });

  it("returns 200 on successful add", async () => {
    const created = await createPlaylist("My Songs");
    const playlistId = created.body.playlist._id;
    const music = await seedMusic({ artistId });
    const res = await request(app)
      .patch(`/api/music/playlist/${playlistId}/add/${music._id}`)
      .set("Cookie", cookieFor(artistToken));
    expect(res.status).toBe(200);
  });

  it("returns 409 on duplicate add", async () => {
    const created = await createPlaylist("Dup Test");
    const playlistId = created.body.playlist._id;
    const music = await seedMusic({ artistId });
    await request(app)
      .patch(`/api/music/playlist/${playlistId}/add/${music._id}`)
      .set("Cookie", cookieFor(artistToken));
    const res = await request(app)
      .patch(`/api/music/playlist/${playlistId}/add/${music._id}`)
      .set("Cookie", cookieFor(artistToken));
    expect(res.status).toBe(409);
  });
});

describe("PATCH /playlist/:id/remove/:musicId — remove music", () => {
  it("returns 200 on successful remove", async () => {
    const created = await createPlaylist("Remove Test");
    const playlistId = created.body.playlist._id;
    const music = await seedMusic({ artistId });
    await request(app)
      .patch(`/api/music/playlist/${playlistId}/add/${music._id}`)
      .set("Cookie", cookieFor(artistToken));
    const res = await request(app)
      .patch(`/api/music/playlist/${playlistId}/remove/${music._id}`)
      .set("Cookie", cookieFor(artistToken));
    expect(res.status).toBe(200);
    const pl = await playlistModel.findById(playlistId);
    expect(pl.musics).toHaveLength(0);
  });
});

describe("PATCH /playlist/:id — rename", () => {
  it("returns 400 when title is blank", async () => {
    const created = await createPlaylist("Old Name");
    const res = await request(app)
      .patch(`/api/music/playlist/${created.body.playlist._id}`)
      .set("Cookie", cookieFor(artistToken))
      .send({ title: "" });
    expect(res.status).toBe(400);
  });

  it("returns 200 on successful rename", async () => {
    const created = await createPlaylist("Old Name");
    const res = await request(app)
      .patch(`/api/music/playlist/${created.body.playlist._id}`)
      .set("Cookie", cookieFor(artistToken))
      .send({ title: "New Name" });
    expect(res.status).toBe(200);
    expect(res.body.playlist.title).toBe("New Name");
  });
});

describe("DELETE /playlist/:id — delete", () => {
  it("returns 404 when playlist belongs to another artist", async () => {
    const created = await createPlaylist("Will Not Delete");
    const res = await request(app)
      .delete(`/api/music/playlist/${created.body.playlist._id}`)
      .set("Cookie", cookieFor(artist2Token));
    expect(res.status).toBe(404);
  });

  it("returns 200 on successful delete", async () => {
    const created = await createPlaylist("To Delete");
    const res = await request(app)
      .delete(`/api/music/playlist/${created.body.playlist._id}`)
      .set("Cookie", cookieFor(artistToken));
    expect(res.status).toBe(200);
    const pl = await playlistModel.findById(created.body.playlist._id);
    expect(pl).toBeNull();
  });
});
