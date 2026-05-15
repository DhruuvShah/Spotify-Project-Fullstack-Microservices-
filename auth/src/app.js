import express from "express";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.js";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import config from "./config/config.js";
import cors from "cors";

const app = express();
app.use(cors({
  origin: "http://localhost:5173", // Adjust this to your frontend URL
  credentials: true, // Allow cookies to be sent with requests
}));
app.use(passport.initialize());

passport.use(
  new GoogleStrategy(
    {
      clientID: config.CLIENT_ID,
      clientSecret: config.CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback",
    },
    (accessToken, refreshToken, profile, done) => {
      // Here, you would typically find or create a user in your database
      // For this example, we'll just return the profile
      return done(null, profile);
    },
  ),
);

app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extends: true }));
app.use(cookieParser());

app.use("/api/auth", authRoutes);

export default app;
