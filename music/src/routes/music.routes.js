import express from "express";
import * as musicController from "../controllers/music.controller.js";
import * as authMiddleware from "../middlewares/auth.middleware.js";
import { uploadMusicFiles } from "../middlewares/upload.middleware.js";

const router = express.Router();

router.post(
  "/upload",
  authMiddleware.authArtistMiddleware,
  uploadMusicFiles,
  musicController.uploadMusic,
);

router.get(
  "/",
  authMiddleware.authUserMiddleware,
  musicController.getAllMusics,
);

router.get(
  "/get-details/:id",
  authMiddleware.authUserMiddleware,
  musicController.getMusicById,
);

router.get(
  "/artist-musics",
  authMiddleware.authArtistMiddleware,
  musicController.getArtistMusics,
);

router.post(
  "/playlist",
  authMiddleware.authArtistMiddleware,
  musicController.createPlaylist,
);

router.get(
  "/playlists",
  authMiddleware.authUserMiddleware,
  musicController.getPlaylists,
);

router.get(
  "/playlist/:id",
  authMiddleware.authUserMiddleware,
  musicController.getPlaylistById,
);

export default router;
