import { Router } from "express";

const router = Router();

router.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "notification",
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

export default router;
