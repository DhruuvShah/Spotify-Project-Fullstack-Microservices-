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

let userId, userToken;

beforeAll(async () => {
  await setupDB();
  userId = new mongoose.Types.ObjectId().toString();
  userToken = makeUserToken({ id: userId });
});

afterAll(teardownDB);
afterEach(clearDB);

describe("POST /like/:id", () => {
  it("returns 401 with no cookie", async () => {
    const id = new mongoose.Types.ObjectId();
    const res = await request(app).post(`/api/music/like/${id}`);
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid ObjectId", async () => {
    const res = await request(app)
      .post("/api/music/like/not-an-id")
      .set("Cookie", cookieFor(userToken));
    expect(res.status).toBe(400);
  });

  it("returns 201 on successful like", async () => {
    const music = await seedMusic({});
    const res = await request(app)
      .post(`/api/music/like/${music._id}`)
      .set("Cookie", cookieFor(userToken));
    expect(res.status).toBe(201);
    expect(res.body.message).toMatch(/liked/i);
  });

  it("returns 409 when already liked", async () => {
    const music = await seedMusic({});
    await request(app)
      .post(`/api/music/like/${music._id}`)
      .set("Cookie", cookieFor(userToken));
    const res = await request(app)
      .post(`/api/music/like/${music._id}`)
      .set("Cookie", cookieFor(userToken));
    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/already liked/i);
  });
});

describe("DELETE /like/:id", () => {
  it("returns 400 for invalid ObjectId", async () => {
    const res = await request(app)
      .delete("/api/music/like/bad-id")
      .set("Cookie", cookieFor(userToken));
    expect(res.status).toBe(400);
  });

  it("returns 200 on successful unlike", async () => {
    const music = await seedMusic({});
    await request(app)
      .post(`/api/music/like/${music._id}`)
      .set("Cookie", cookieFor(userToken));
    const res = await request(app)
      .delete(`/api/music/like/${music._id}`)
      .set("Cookie", cookieFor(userToken));
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/unliked/i);
  });
});

describe("GET /likes", () => {
  it("returns 401 with no cookie", async () => {
    const res = await request(app).get("/api/music/likes");
    expect(res.status).toBe(401);
  });

  it("returns empty array when no likes", async () => {
    const res = await request(app)
      .get("/api/music/likes")
      .set("Cookie", cookieFor(userToken));
    expect(res.status).toBe(200);
    expect(res.body.likedIds).toEqual([]);
  });

  it("returns array of liked music IDs", async () => {
    const m1 = await seedMusic({});
    const m2 = await seedMusic({ title: "Song B" });
    await request(app)
      .post(`/api/music/like/${m1._id}`)
      .set("Cookie", cookieFor(userToken));
    await request(app)
      .post(`/api/music/like/${m2._id}`)
      .set("Cookie", cookieFor(userToken));

    const res = await request(app)
      .get("/api/music/likes")
      .set("Cookie", cookieFor(userToken));
    expect(res.status).toBe(200);
    expect(res.body.likedIds).toHaveLength(2);
    expect(res.body.likedIds).toContain(m1._id.toString());
    expect(res.body.likedIds).toContain(m2._id.toString());
  });
});
