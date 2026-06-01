import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import jwt from "jsonwebtoken";
import musicModel from "../../src/models/music.Model.js";
import app from "../../src/app.js";

export { app };

let mongoServer;

export async function setupDB() {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  await mongoose.connection.syncIndexes();
}

export async function teardownDB() {
  try {
    await mongoose.disconnect();
  } catch {
    // ignore interrupt errors during connection close
  }
  await mongoServer.stop();
}

export async function clearDB() {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}

export function makeArtistToken(overrides = {}) {
  const payload = {
    id: new mongoose.Types.ObjectId().toString(),
    role: "artist",
    fullname: { firstName: "Test", lastName: "Artist" },
    ...overrides,
  };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });
}

export function makeUserToken(overrides = {}) {
  const payload = {
    id: new mongoose.Types.ObjectId().toString(),
    role: "user",
    fullname: { firstName: "Test", lastName: "User" },
    ...overrides,
  };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });
}

export function cookieFor(token) {
  return `token=${token}`;
}

export async function seedMusic(overrides = {}) {
  return musicModel.create({
    title: "Test Song",
    artist: "Test Artist",
    artistId: new mongoose.Types.ObjectId(),
    musicUrl: "http://cdn/test.mp3",
    coverImageUrl: "http://cdn/test.jpg",
    musicFileId: "music-file-id-123",
    coverFileId: "cover-file-id-123",
    ...overrides,
  });
}
