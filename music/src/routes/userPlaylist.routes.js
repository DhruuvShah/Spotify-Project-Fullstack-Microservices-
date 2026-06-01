import express from "express";
import * as userPlaylistController from "../controllers/userPlaylist.controller.js";
import { authUserMiddleware } from "../middlewares/auth.middleware.js";
import { validateObjectId } from "../middlewares/validate.middleware.js";

const router = express.Router();

router.post("/user-playlist", authUserMiddleware, userPlaylistController.createUserPlaylist);
router.get("/user-playlists", authUserMiddleware, userPlaylistController.getUserPlaylists);
router.get("/user-playlist/:id", authUserMiddleware, validateObjectId("id"), userPlaylistController.getUserPlaylistById);
router.patch("/user-playlist/:id/add/:musicId", authUserMiddleware, validateObjectId("id", "musicId"), userPlaylistController.addMusicToUserPlaylist);
router.patch("/user-playlist/:id/remove/:musicId", authUserMiddleware, validateObjectId("id", "musicId"), userPlaylistController.removeMusicFromUserPlaylist);
router.patch("/user-playlist/:id", authUserMiddleware, validateObjectId("id"), userPlaylistController.renameUserPlaylist);
router.delete("/user-playlist/:id", authUserMiddleware, validateObjectId("id"), userPlaylistController.deleteUserPlaylist);

export default router;
