import express from "express";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.js";
import followRoutes from "./routes/follow.routes.js";
import passport from "passport";
import { configurePassport } from "./config/passport.js";
import cors from "cors";

const app = express();
app.set("trust proxy", 1);
app.use(
  cors({
    origin: (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, ""),
    credentials: true,
  }),
);

configurePassport();
app.use(passport.initialize());

app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/health", (req, res) => res.status(200).json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/auth", followRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status ?? err.statusCode ?? 500;
  res.status(status).json({ message: err.message || "Internal server error" });
});

export default app;
