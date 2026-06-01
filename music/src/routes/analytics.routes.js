import express from "express";
import * as analyticsController from "../controllers/analytics.controller.js";
import { authArtistMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/analytics", authArtistMiddleware, analyticsController.getMusicAnalytics);

export default router;
