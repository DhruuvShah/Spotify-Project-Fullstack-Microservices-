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
  registerUser,
} from "./helpers/setup.js";

beforeAll(setupDB);
afterAll(teardownDB);
afterEach(async () => {
  await clearDB();
  jest.clearAllMocks();
});

describe("POST /api/auth/login", () => {
  beforeEach(async () => {
    await registerUser();
  });

  test("returns 200 and sets a cookie with valid credentials", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: validUser.email, password: validUser.password });
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(validUser.email);
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  test("returns 400 with wrong password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: validUser.email, password: "WrongPass999" });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid/i);
  });

  test("returns 400 when email does not exist", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "nobody@example.com", password: "Password123" });
    expect(res.status).toBe(400);
  });

  test("returns 400 when email field is missing", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ password: validUser.password });
    expect(res.status).toBe(400);
  });

  test("returns 400 when password field is missing", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: validUser.email });
    expect(res.status).toBe(400);
  });
});
