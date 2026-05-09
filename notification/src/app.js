import express from "express";
import sendEmail from "./utils/email.js";

const app = express();

sendEmail(
  "dhruv27Shah@gmail.com",
  "Welcome to Spotify Premium!",
  "Hello! We are excited to announce the launch of Spotify Premium, our new subscription service that offers ad-free music, offline listening, and exclusive content. Sign up now to enjoy the ultimate music experience!",
  "<h1>Welcome to Spotify Premium! </h1>",
);

export default app;
