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
  getAuthCookie,
} from "./helpers/setup.js";

beforeAll(setupDB);
afterAll(teardownDB);
afterEach(async () => {
  await clearDB();
  jest.clearAllMocks();
});

describe("POST /api/auth/logout", () => {
  test("returns 200 and signals cookie removal", async () => {
    const cookie = await getAuthCookie();
    const res = await request(app)
      .post("/api/auth/logout")
      .set("Cookie", cookie);
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/logged out/i);
  });
});
