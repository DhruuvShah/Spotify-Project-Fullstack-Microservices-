import express from "express";
import healthRouter from "./routes/health.routes.js";
import notificationsRouter from "./routes/notifications.routes.js";

const app = express();

app.use(express.json());
app.use(healthRouter);
app.use(notificationsRouter);

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use((err, _req, res, _next) => {
  console.error("Unhandled route error:", err.message);
  res.status(500).json({ error: "Internal server error" });
});

export default app;
