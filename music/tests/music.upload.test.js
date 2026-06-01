jest.mock("../src/services/storage.service.js", () => ({
  uploadFile: jest
    .fn()
    .mockResolvedValue({ url: "http://cdn/file.mp3", fileId: "test-file-id" }),
  deleteFile: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../src/utils/cache.js", () => ({
  cacheGet: jest.fn().mockReturnValue(undefined),
  cacheSet: jest.fn(),
  cacheDel: jest.fn(),
  cacheDelByPrefix: jest.fn(),
}));

import request from "supertest";
import {
  app,
  setupDB,
  teardownDB,
  clearDB,
  makeArtistToken,
  makeUserToken,
  cookieFor,
} from "./helpers/setup.js";

let artistToken, userToken;

beforeAll(async () => {
  await setupDB();
  artistToken = makeArtistToken();
  userToken = makeUserToken();
});

afterAll(teardownDB);
afterEach(async () => {
  await clearDB();
  jest.clearAllMocks();
});

const UPLOAD_URL = "/api/music/upload";

describe("POST /upload — auth", () => {
  it("returns 401 with no cookie", async () => {
    const res = await request(app).post(UPLOAD_URL);
    expect(res.status).toBe(401);
  });

  it("returns 403 when user (not artist) calls upload", async () => {
    const res = await request(app)
      .post(UPLOAD_URL)
      .set("Cookie", cookieFor(userToken))
      .field("title", "Test Song");
    expect(res.status).toBe(403);
  });
});

describe("POST /upload — validation", () => {
  it("returns 400 when no files attached", async () => {
    const res = await request(app)
      .post(UPLOAD_URL)
      .set("Cookie", cookieFor(artistToken))
      .field("title", "Test Song");
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/required/i);
  });

  it("returns 400 when title is missing", async () => {
    const res = await request(app)
      .post(UPLOAD_URL)
      .set("Cookie", cookieFor(artistToken))
      .attach("musicFile", Buffer.alloc(100), {
        filename: "song.mp3",
        contentType: "audio/mpeg",
      })
      .attach("coverImage", Buffer.alloc(100), {
        filename: "cover.jpg",
        contentType: "image/jpeg",
      });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/title/i);
  });

  it("returns 400 for unsupported audio mime type", async () => {
    const res = await request(app)
      .post(UPLOAD_URL)
      .set("Cookie", cookieFor(artistToken))
      .field("title", "Test Song")
      .attach("musicFile", Buffer.alloc(100), {
        filename: "song.xyz",
        contentType: "audio/x-unsupported",
      })
      .attach("coverImage", Buffer.alloc(100), {
        filename: "cover.jpg",
        contentType: "image/jpeg",
      });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/unsupported audio/i);
  });

  it("returns 400 for unsupported image mime type", async () => {
    const res = await request(app)
      .post(UPLOAD_URL)
      .set("Cookie", cookieFor(artistToken))
      .field("title", "Test Song")
      .attach("musicFile", Buffer.alloc(100), {
        filename: "song.mp3",
        contentType: "audio/mpeg",
      })
      .attach("coverImage", Buffer.alloc(100), {
        filename: "doc.pdf",
        contentType: "image/x-bad",
      });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/unsupported image/i);
  });
});

describe("POST /upload — success", () => {
  it("returns 201 and music doc on valid upload", async () => {
    const { uploadFile } = require("../src/services/storage.service.js");
    uploadFile
      .mockResolvedValueOnce({
        url: "http://cdn/song.mp3",
        fileId: "music-fid",
      })
      .mockResolvedValueOnce({
        url: "http://cdn/cover.jpg",
        fileId: "cover-fid",
      });

    const res = await request(app)
      .post(UPLOAD_URL)
      .set("Cookie", cookieFor(artistToken))
      .field("title", "My New Track")
      .attach("musicFile", Buffer.alloc(100), {
        filename: "song.mp3",
        contentType: "audio/mpeg",
      })
      .attach("coverImage", Buffer.alloc(100), {
        filename: "cover.jpg",
        contentType: "image/jpeg",
      });

    expect(res.status).toBe(201);
    expect(res.body.music).toMatchObject({
      title: "My New Track",
      musicUrl: "http://cdn/song.mp3",
      coverImageUrl: "http://cdn/cover.jpg",
    });
    expect(uploadFile).toHaveBeenCalledTimes(2);
  });
});
