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
import { publishToQueue } from "../src/broker/rabbit.js";
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

describe("POST /api/auth/register", () => {
  test("creates a user with valid data → 201", async () => {
    const res = await registerUser();
    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe(validUser.email);
    expect(res.body.user.fullname.firstName).toBe("John");
    expect(res.body.user.role).toBe("user");
    expect(res.body.user.password).toBeUndefined();
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  test("publishes user_created event on successful register", async () => {
    await registerUser();
    expect(publishToQueue).toHaveBeenCalledWith(
      "user_created",
      expect.objectContaining({ email: validUser.email }),
    );
  });

  test("returns 400 when email is already taken", async () => {
    await registerUser();
    const res = await registerUser();
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already exists/i);
  });

  test("returns 400 for an invalid email format", async () => {
    const res = await registerUser({ email: "not-an-email" });
    expect(res.status).toBe(400);
  });

  test("returns 400 when password is shorter than 8 characters", async () => {
    const res = await registerUser({ password: "Ab1" });
    expect(res.status).toBe(400);
  });

  test("returns 400 when password has no numbers", async () => {
    const res = await registerUser({ password: "PasswordOnly" });
    expect(res.status).toBe(400);
  });

  test("returns 400 when password has no letters", async () => {
    const res = await registerUser({ password: "12345678" });
    expect(res.status).toBe(400);
  });

  test("returns 400 when firstName is missing", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ ...validUser, fullname: { lastName: "Doe" } });
    expect(res.status).toBe(400);
  });

  test("returns 400 when lastName is missing", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ ...validUser, fullname: { firstName: "John" } });
    expect(res.status).toBe(400);
  });
});
