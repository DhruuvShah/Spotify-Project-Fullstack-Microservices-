import dns from "dns";
import mongoose from "mongoose";
import config from "../config/config.js";

dns.setServers(["8.8.8.8", "8.8.4.4"]);

async function connectDB() {
  try {
    await mongoose.connect(config.MONGO_URI, { family: 4 });
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
}

export default connectDB;