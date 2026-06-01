import dns from "dns";
import mongoose from "mongoose";
import config from "../config/config.js";

dns.setServers(["8.8.8.8", "8.8.4.4"]);

async function connectDB() {
  try {
    await mongoose.connect(config.MONGO_URI, { family: 4 });
    console.log("Connected to database");
  } catch (err) {
    console.error("Failed to connect to the database:", err);
    process.exit(1);
  }
}

export default connectDB;
