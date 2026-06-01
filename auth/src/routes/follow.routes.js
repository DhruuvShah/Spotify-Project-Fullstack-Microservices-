import express from "express";
import * as followController from "../controllers/follow.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/follow/:artistId", authMiddleware, followController.followArtist);
router.delete(
  "/follow/:artistId",
  authMiddleware,
  followController.unfollowArtist,
);
router.get("/following", authMiddleware, followController.getFollowedArtists);
router.get(
  "/following-ids",
  authMiddleware,
  followController.getFollowedArtistIds,
);
router.get(
  "/artist/:artistId",
  authMiddleware,
  followController.getArtistProfile,
);

export default router;
