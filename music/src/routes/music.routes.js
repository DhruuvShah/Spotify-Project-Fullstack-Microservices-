import express from "express";
import * as musicController from "../controllers/music.controller.js";
import { authUserMiddleware, authArtistMiddleware } from "../middlewares/auth.middleware.js";
import { uploadMusicFiles } from "../middlewares/upload.middleware.js";
import { validateObjectId } from "../middlewares/validate.middleware.js";

const router = express.Router();

/* ── upload ── */
router.post("/upload", authArtistMiddleware, uploadMusicFiles, musicController.uploadMusic);

/* ── browse ── */
router.get("/", authUserMiddleware, musicController.getAllMusics);
router.get("/search", authUserMiddleware, musicController.searchMusics);
router.get("/get-details/:id", authUserMiddleware, validateObjectId("id"), musicController.getMusicById);

/* ── artist tracks ── */
router.get("/artist-musics", authArtistMiddleware, musicController.getArtistMusics);
router.patch("/:id", authArtistMiddleware, validateObjectId("id"), musicController.editMusic);
router.delete("/:id", authArtistMiddleware, validateObjectId("id"), musicController.deleteMusic);

/* ── public artist page ── */
router.get("/by-artist/:artistId", authUserMiddleware, validateObjectId("artistId"), musicController.getPublicArtistMusics);

export default router;
