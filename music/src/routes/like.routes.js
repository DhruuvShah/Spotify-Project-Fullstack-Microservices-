import express from "express";
import * as likeController from "../controllers/like.controller.js";
import { authUserMiddleware } from "../middlewares/auth.middleware.js";
import { validateObjectId } from "../middlewares/validate.middleware.js";

const router = express.Router();

router.get("/likes", authUserMiddleware, likeController.getLikedMusicIds);
router.post("/like/:id", authUserMiddleware, validateObjectId("id"), likeController.likeMusic);
router.delete("/like/:id", authUserMiddleware, validateObjectId("id"), likeController.unlikeMusic);

export default router;
