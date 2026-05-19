import express from "express";
import * as musicController from "../controllers/music.controller.js";
import * as authMiddleware from "../middlewares/auth.middleware.js";
import { uploadMusicFiles } from "../middlewares/upload.middleware.js";

const router = express.Router();

/* ── upload ── */
router.post("/upload", authMiddleware.authArtistMiddleware, uploadMusicFiles, musicController.uploadMusic);

/* ── browse ── */
router.get("/", authMiddleware.authUserMiddleware, musicController.getAllMusics);
router.get("/search", authMiddleware.authUserMiddleware, musicController.searchMusics);
router.get("/get-details/:id", authMiddleware.authUserMiddleware, musicController.getMusicById);

/* ── artist tracks ── */
router.get("/artist-musics", authMiddleware.authArtistMiddleware, musicController.getArtistMusics);
router.patch("/:id", authMiddleware.authArtistMiddleware, musicController.editMusic);
router.delete("/:id", authMiddleware.authArtistMiddleware, musicController.deleteMusic);

/* ── artist playlists ── */
router.post("/playlist", authMiddleware.authArtistMiddleware, musicController.createPlaylist);
router.get("/playlist/artist", authMiddleware.authArtistMiddleware, musicController.getArtistPlaylists);
router.patch("/playlist/:id/add/:musicId", authMiddleware.authArtistMiddleware, musicController.addMusicToArtistPlaylist);
router.patch("/playlist/:id/remove/:musicId", authMiddleware.authArtistMiddleware, musicController.removeMusicFromArtistPlaylist);
router.patch("/playlist/:id", authMiddleware.authArtistMiddleware, musicController.renameArtistPlaylist);
router.delete("/playlist/:id", authMiddleware.authArtistMiddleware, musicController.deleteArtistPlaylist);

/* ── artist albums ── */
router.post("/album", authMiddleware.authArtistMiddleware, musicController.createAlbum);
router.get("/album/artist", authMiddleware.authArtistMiddleware, musicController.getArtistAlbums);
router.patch("/album/:id/add/:musicId", authMiddleware.authArtistMiddleware, musicController.addMusicToAlbum);
router.patch("/album/:id/remove/:musicId", authMiddleware.authArtistMiddleware, musicController.removeMusicFromAlbum);
router.patch("/album/:id", authMiddleware.authArtistMiddleware, musicController.renameArtistAlbum);
router.delete("/album/:id", authMiddleware.authArtistMiddleware, musicController.deleteArtistAlbum);

/* ── analytics ── */
router.get("/analytics", authMiddleware.authArtistMiddleware, musicController.getMusicAnalytics);

/* ── user playlists ── */
router.get("/playlists", authMiddleware.authUserMiddleware, musicController.getPlaylists);
router.get("/playlist/:id", authMiddleware.authUserMiddleware, musicController.getPlaylistById);
router.post("/user-playlist", authMiddleware.authUserMiddleware, musicController.createUserPlaylist);
router.get("/user-playlists", authMiddleware.authUserMiddleware, musicController.getUserPlaylists);
router.get("/user-playlist/:id", authMiddleware.authUserMiddleware, musicController.getUserPlaylistById);
router.patch("/user-playlist/:id/add/:musicId", authMiddleware.authUserMiddleware, musicController.addMusicToUserPlaylist);
router.patch("/user-playlist/:id/remove/:musicId", authMiddleware.authUserMiddleware, musicController.removeMusicFromUserPlaylist);
router.patch("/user-playlist/:id", authMiddleware.authUserMiddleware, musicController.renameUserPlaylist);
router.delete("/user-playlist/:id", authMiddleware.authUserMiddleware, musicController.deleteUserPlaylist);

/* ── likes ── */
router.get("/likes", authMiddleware.authUserMiddleware, musicController.getLikedMusicIds);
router.post("/like/:id", authMiddleware.authUserMiddleware, musicController.likeMusic);
router.delete("/like/:id", authMiddleware.authUserMiddleware, musicController.unlikeMusic);

/* ── history ── */
router.post("/history/:id", authMiddleware.authUserMiddleware, musicController.recordPlay);
router.get("/history", authMiddleware.authUserMiddleware, musicController.getHistory);

/* ── public artist page ── */
router.get("/by-artist/:artistId", authMiddleware.authUserMiddleware, musicController.getPublicArtistMusics);

export default router;
