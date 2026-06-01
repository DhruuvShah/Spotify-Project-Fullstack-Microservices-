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
  makeUserToken,
  cookieFor,
  seedMusic,
} from "./helpers/setup.js";
import userPlaylistModel from "../src/models/userPlaylist.model.js";

let userId, userToken, user2Token;

beforeAll(async () => {
  await setupDB();
  userId = new mongoose.Types.ObjectId().toString();
  userToken = makeUserToken({ id: userId });
  user2Token = makeUserToken({ id: new mongoose.Types.ObjectId().toString() });
});

afterAll(teardownDB);
afterEach(async () => {
  await clearDB();
  jest.clearAllMocks();
});

async function createUserPlaylist(title = "My Playlist", cookie = userToken) {
  return request(app)
    .post("/api/music/user-playlist")
    .set("Cookie", cookieFor(cookie))
    .send({ title });
}

describe("POST /user-playlist — create", () => {
  it("returns 401 with no cookie", async () => {
    const res = await request(app)
      .post("/api/music/user-playlist")
      .send({ title: "Test" });
    expect(res.status).toBe(401);
  });

  it("returns 400 when title is missing", async () => {
    const res = await createUserPlaylist("");
    expect(res.status).toBe(400);
  });

  it("returns 400 when title exceeds 100 chars", async () => {
    const res = await createUserPlaylist("a".repeat(101));
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/100/);
  });

  it("returns 201 on success", async () => {
    const res = await createUserPlaylist("Good Playlist");
    expect(res.status).toBe(201);
    expect(res.body.playlist.title).toBe("Good Playlist");
  });
});

describe("GET /user-playlists — list", () => {
  it("returns 200 with user's playlists only", async () => {
    await createUserPlaylist("User1 Playlist", userToken);
    await createUserPlaylist("User2 Playlist", user2Token);
    const res = await request(app)
      .get("/api/music/user-playlists")
      .set("Cookie", cookieFor(userToken));
    expect(res.status).toBe(200);
    expect(res.body.playlists).toHaveLength(1);
    expect(res.body.playlists[0].title).toBe("User1 Playlist");
  });
});

describe("GET /user-playlist/:id — by id", () => {
  it("returns 404 when owned by another user", async () => {
    const created = await createUserPlaylist("Private PL", user2Token);
    const id = created.body.playlist._id;
    const res = await request(app)
      .get(`/api/music/user-playlist/${id}`)
      .set("Cookie", cookieFor(userToken));
    expect(res.status).toBe(404);
  });

  it("returns 200 with playlist and empty musics array", async () => {
    const created = await createUserPlaylist("My PL");
    const id = created.body.playlist._id;
    const res = await request(app)
      .get(`/api/music/user-playlist/${id}`)
      .set("Cookie", cookieFor(userToken));
    expect(res.status).toBe(200);
    expect(res.body.playlist.musics).toEqual([]);
  });
});

describe("PATCH /user-playlist/:id/add/:musicId — add music", () => {
  it("returns 200 on successful add", async () => {
    const created = await createUserPlaylist("Add Test");
    const music = await seedMusic({});
    const res = await request(app)
      .patch(
        `/api/music/user-playlist/${created.body.playlist._id}/add/${music._id}`,
      )
      .set("Cookie", cookieFor(userToken));
    expect(res.status).toBe(200);
  });

  it("returns 409 on duplicate add", async () => {
    const created = await createUserPlaylist("Dup Test");
    const music = await seedMusic({});
    const id = created.body.playlist._id;
    await request(app)
      .patch(`/api/music/user-playlist/${id}/add/${music._id}`)
      .set("Cookie", cookieFor(userToken));
    const res = await request(app)
      .patch(`/api/music/user-playlist/${id}/add/${music._id}`)
      .set("Cookie", cookieFor(userToken));
    expect(res.status).toBe(409);
  });
});

describe("PATCH /user-playlist/:id/remove/:musicId — remove music", () => {
  it("returns 200 and music removed from playlist", async () => {
    const created = await createUserPlaylist("Remove Test");
    const music = await seedMusic({});
    const id = created.body.playlist._id;
    await request(app)
      .patch(`/api/music/user-playlist/${id}/add/${music._id}`)
      .set("Cookie", cookieFor(userToken));
    const res = await request(app)
      .patch(`/api/music/user-playlist/${id}/remove/${music._id}`)
      .set("Cookie", cookieFor(userToken));
    expect(res.status).toBe(200);
    const pl = await userPlaylistModel.findById(id);
    expect(pl.musics).toHaveLength(0);
  });
});

describe("PATCH /user-playlist/:id — rename", () => {
  it("returns 400 when title exceeds 100 chars", async () => {
    const created = await createUserPlaylist("Has Name");
    const res = await request(app)
      .patch(`/api/music/user-playlist/${created.body.playlist._id}`)
      .set("Cookie", cookieFor(userToken))
      .send({ title: "a".repeat(101) });
    expect(res.status).toBe(400);
  });

  it("returns 200 on successful rename", async () => {
    const created = await createUserPlaylist("Old");
    const res = await request(app)
      .patch(`/api/music/user-playlist/${created.body.playlist._id}`)
      .set("Cookie", cookieFor(userToken))
      .send({ title: "New Name" });
    expect(res.status).toBe(200);
    expect(res.body.playlist.title).toBe("New Name");
  });
});

describe("DELETE /user-playlist/:id — delete", () => {
  it("returns 404 when owned by another user", async () => {
    const created = await createUserPlaylist("Other's PL", user2Token);
    const res = await request(app)
      .delete(`/api/music/user-playlist/${created.body.playlist._id}`)
      .set("Cookie", cookieFor(userToken));
    expect(res.status).toBe(404);
  });

  it("returns 200 on successful delete", async () => {
    const created = await createUserPlaylist("To Delete");
    const id = created.body.playlist._id;
    const res = await request(app)
      .delete(`/api/music/user-playlist/${id}`)
      .set("Cookie", cookieFor(userToken));
    expect(res.status).toBe(200);
    const pl = await userPlaylistModel.findById(id);
    expect(pl).toBeNull();
  });
});
