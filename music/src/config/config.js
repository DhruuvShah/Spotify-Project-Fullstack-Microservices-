import { config as dotenvConfig } from "dotenv";

dotenvConfig();

const _config = {
  MONGO_URI: process.env.MONGO_URI || "mongodb://localhost:27017/Spotify-Music",
  JWT_SECRET: process.env.JWT_SECRET,
  IMAGEKIT_PUBLIC_KEY: process.env.IMAGEKIT_PUBLIC_KEY,
  IMAGEKIT_PRIVATE_KEY: process.env.IMAGEKIT_PRIVATE_KEY,
  IMAGEKIT_URL_ENDPOINT: process.env.IMAGEKIT_URL_ENDPOINT,
};

export default Object.freeze(_config);
