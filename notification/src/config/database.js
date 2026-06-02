import dns from "dns";
import mongoose from "mongoose";
import config from "./config.js";

dns.setServers(["8.8.8.8", "8.8.4.4"]);

export async function connectDB() {
  try {
    await mongoose.connect(config.MONGO_URI, { family: 4 });
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("Failed to connect to MongoDB:", err);
    process.exit(1);
  }
}

export async function disconnectDB() {
  try {
    await mongoose.disconnect();
    console.log("MongoDB connection closed gracefully");
  } catch (err) {
    console.error("Error during MongoDB shutdown:", err.message);
  }
}
