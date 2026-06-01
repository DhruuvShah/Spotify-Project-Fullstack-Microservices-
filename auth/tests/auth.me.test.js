jest.mock("express-rate-limit", () =>
  jest.fn(() => (req, res, next) => next()),
);
jest.mock("../src/broker/rabbit.js", () => ({
  publishToQueue: jest.fn().mockResolvedValue(undefined),
  connect: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("../src/config/config.js", () => ({
  __esModule: true,
  default: {
    JWT_SECRET: "test-jwt-secret-must-be-at-least-32-chars!!",
    MONGO_URI: "mongodb://overridden-by-memory-server",
    CLIENT_ID: "test-google-client-id",
    CLIENT_SECRET: "test-google-client-secret",
    RABBITMQ_URI: "amqp://localhost",
  },
}));
jest.mock("../src/utils/cache.js", () => ({
  cacheGet: jest.fn().mockReturnValue(undefined),
  cacheSet: jest.fn(),
  cacheDel: jest.fn(),
  cacheDelByPrefix: jest.fn(),
}));

import request from "supertest";
import app from "../src/app.js";
import {
  setupDB,
  teardownDB,
  clearDB,
  validUser,
  getAuthCookie,
} from "./helpers/setup.js";

beforeAll(setupDB);
afterAll(teardownDB);
afterEach(async () => {
  await clearDB();
  jest.clearAllMocks();
});

describe("GET /api/auth/me", () => {
  test("returns user data with a valid cookie", async () => {
    const cookie = await getAuthCookie();
    const res = await request(app).get("/api/auth/me").set("Cookie", cookie);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(validUser.email);
    expect(res.body.user.password).toBeUndefined();
  });

  test("returns 401 with no cookie", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  test("returns 401 with a tampered / invalid token", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Cookie", "token=this.is.not.a.real.jwt");
    expect(res.status).toBe(401);
  });
});
