import { config as dotenvConfig } from "dotenv";
import { validateEnv } from "../utils/validateEnv.js";

dotenvConfig();

const REQUIRED = ["CLIENT_ID", "CLIENT_SECRET", "REFRESH_TOKEN", "EMAIL_USER", "RABBITMQ_URI", "MONGO_URI"];

validateEnv(process.env, REQUIRED);

const _config = {
  CLIENT_ID: process.env.CLIENT_ID,
  CLIENT_SECRET: process.env.CLIENT_SECRET,
  REFRESH_TOKEN: process.env.REFRESH_TOKEN,
  EMAIL_USER: process.env.EMAIL_USER,
  RABBITMQ_URI: process.env.RABBITMQ_URI,
  MONGO_URI: process.env.MONGO_URI,
  PORT: process.env.PORT || 3001,
};

export default Object.freeze(_config);
