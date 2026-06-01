import express from "express";
import * as playlistController from "../controllers/playlist.controller.js";
import { authUserMiddleware, authArtistMiddleware } from "../middlewares/auth.middleware.js";
import { validateObjectId } from "../middlewares/validate.middleware.js";

const router = express.Router();

/* ── artist playlists ── */
router.post("/playlist", authArtistMiddleware, playlistController.createPlaylist);
router.get("/playlist/artist", authArtistMiddleware, playlistController.getArtistPlaylists);
router.patch("/playlist/:id/add/:musicId", authArtistMiddleware, validateObjectId("id", "musicId"), playlistController.addMusicToArtistPlaylist);
router.patch("/playlist/:id/remove/:musicId", authArtistMiddleware, validateObjectId("id", "musicId"), playlistController.removeMusicFromArtistPlaylist);
router.patch("/playlist/:id", authArtistMiddleware, validateObjectId("id"), playlistController.renameArtistPlaylist);
router.delete("/playlist/:id", authArtistMiddleware, validateObjectId("id"), playlistController.deleteArtistPlaylist);

/* ── public playlist browsing ── */
router.get("/playlists", authUserMiddleware, playlistController.getPlaylists);
router.get("/playlist/:id", authUserMiddleware, validateObjectId("id"), playlistController.getPlaylistById);

export default router;
