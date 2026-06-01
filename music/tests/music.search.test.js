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

let userToken;

beforeAll(async () => {
  await setupDB();
  userToken = makeUserToken();
});

afterAll(teardownDB);
afterEach(async () => {
  await clearDB();
  jest.clearAllMocks();
});

const SEARCH_URL = "/api/music/search";

describe("GET /search — auth", () => {
  it("returns 401 with no cookie", async () => {
    const res = await request(app).get(`${SEARCH_URL}?q=test`);
    expect(res.status).toBe(401);
  });
});

describe("GET /search — edge cases", () => {
  it("returns empty array for blank query", async () => {
    const res = await request(app)
      .get(`${SEARCH_URL}?q=`)
      .set("Cookie", cookieFor(userToken));
    expect(res.status).toBe(200);
    expect(res.body.musics).toEqual([]);
  });

  it("returns empty array when query is missing", async () => {
    const res = await request(app)
      .get(SEARCH_URL)
      .set("Cookie", cookieFor(userToken));
    expect(res.status).toBe(200);
    expect(res.body.musics).toEqual([]);
  });

  it("returns empty array when query exceeds 200 chars", async () => {
    const longQuery = "a".repeat(201);
    const res = await request(app)
      .get(`${SEARCH_URL}?q=${longQuery}`)
      .set("Cookie", cookieFor(userToken));
    expect(res.status).toBe(200);
    expect(res.body.musics).toEqual([]);
  });

  it("returns empty array when no match found", async () => {
    await seedMusic({ title: "Jazz Night", artist: "Miles Davis" });
    const res = await request(app)
      .get(`${SEARCH_URL}?q=xxxxunmatchedxxxx`)
      .set("Cookie", cookieFor(userToken));
    expect(res.status).toBe(200);
    expect(res.body.musics).toEqual([]);
  });
});

describe("GET /search — results shape", () => {
  it("returns matched music with correct fields", async () => {
    await seedMusic({ title: "Bohemian Rhapsody", artist: "Queen" });

    const res = await request(app)
      .get(`${SEARCH_URL}?q=Bohemian`)
      .set("Cookie", cookieFor(userToken));
    expect(res.status).toBe(200);
    expect(res.body.musics.length).toBeGreaterThanOrEqual(1);
    const m = res.body.musics[0];
    expect(m).toHaveProperty("id");
    expect(m).toHaveProperty("title");
    expect(m).toHaveProperty("artist");
    expect(m).toHaveProperty("musicUrl");
    expect(m).toHaveProperty("coverImageUrl");
  });

  it("handles query with special characters gracefully", async () => {
    const res = await request(app)
      .get(`${SEARCH_URL}?q=hello%20world`)
      .set("Cookie", cookieFor(userToken));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.musics)).toBe(true);
  });
});
