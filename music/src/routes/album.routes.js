import express from "express";
import * as albumController from "../controllers/album.controller.js";
import { authArtistMiddleware } from "../middlewares/auth.middleware.js";
import { validateObjectId } from "../middlewares/validate.middleware.js";

const router = express.Router();

router.post("/album", authArtistMiddleware, albumController.createAlbum);
router.get("/album/artist", authArtistMiddleware, albumController.getArtistAlbums);
router.get("/album/by-artist/:artistId", albumController.getAlbumsByArtist);
router.patch("/album/:id/add/:musicId", authArtistMiddleware, validateObjectId("id", "musicId"), albumController.addMusicToAlbum);
router.patch("/album/:id/remove/:musicId", authArtistMiddleware, validateObjectId("id", "musicId"), albumController.removeMusicFromAlbum);
router.patch("/album/:id", authArtistMiddleware, validateObjectId("id"), albumController.renameArtistAlbum);
router.delete("/album/:id", authArtistMiddleware, validateObjectId("id"), albumController.deleteArtistAlbum);

export default router;
