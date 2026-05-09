import mongoose from "mongoose";
import config from "../config/config.js";

async function connectDB() {
  try {
    await mongoose.connect(config.MONGO_URI);
    console.log("Connected to database");
  } catch (err) {
    console.log("Error connect to the database", err);
  }
}


export default connectDB;