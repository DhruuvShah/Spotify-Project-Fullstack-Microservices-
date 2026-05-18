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
  "/playlist/artist",
  authMiddleware.authArtistMiddleware,
  musicController.getArtistPlaylists,
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

router.get(
  "/search",
  authMiddleware.authUserMiddleware,
  musicController.searchMusics,
);

router.get(
  "/likes",
  authMiddleware.authUserMiddleware,
  musicController.getLikedMusicIds,
);

router.post(
  "/like/:id",
  authMiddleware.authUserMiddleware,
  musicController.likeMusic,
);

router.delete(
  "/like/:id",
  authMiddleware.authUserMiddleware,
  musicController.unlikeMusic,
);

export default router;
