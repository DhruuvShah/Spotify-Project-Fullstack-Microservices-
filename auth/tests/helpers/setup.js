import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import app from "../../src/app.js";

let mongoServer;

export async function setupDB() {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
}

export async function teardownDB() {
  await mongoose.disconnect();
  await mongoServer.stop();
}

export async function clearDB() {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}

export const validUser = {
  email: "test@example.com",
  password: "Password123",
  fullname: { firstName: "John", lastName: "Doe" },
};

export const artistUser = {
  email: "artist@example.com",
  password: "Password123",
  fullname: { firstName: "Artist", lastName: "One" },
  role: "artist",
};

export function registerUser(overrides = {}) {
  return request(app)
    .post("/api/auth/register")
    .send({ ...validUser, ...overrides });
}

export async function getAuthCookie(overrides = {}) {
  const res = await registerUser(overrides);
  return res.headers["set-cookie"];
}
