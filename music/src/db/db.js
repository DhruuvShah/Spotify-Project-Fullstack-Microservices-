import dns from "dns";
import mongoose from "mongoose";
import config from "../config/config.js";
import logger from "../utils/logger.js";

dns.setServers(["8.8.8.8", "8.8.4.4"]);

async function connectDB() {
  try {
    await mongoose.connect(config.MONGO_URI, { family: 4 });
    logger.info("Connected to MongoDB");
  } catch (error) {
    logger.error({ err: error }, "Error connecting to MongoDB");
    process.exit(1);
  }
}

export default connectDB;

export async function closeDB() {
  await mongoose.connection.close();
}