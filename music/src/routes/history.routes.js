import express from "express";
import * as historyController from "../controllers/history.controller.js";
import { authUserMiddleware } from "../middlewares/auth.middleware.js";
import { validateObjectId } from "../middlewares/validate.middleware.js";

const router = express.Router();

router.post("/history/:id", authUserMiddleware, validateObjectId("id"), historyController.recordPlay);
router.get("/history", authUserMiddleware, historyController.getHistory);

export default router;
