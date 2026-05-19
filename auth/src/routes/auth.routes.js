import express from "express";
import rateLimit from "express-rate-limit";
import * as autController from "../controllers/auth.controller.js";
import * as followController from "../controllers/follow.controller.js";
import * as validationRules from "../middlewares/validation.middleware.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import passport from "passport";

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts, please try again in 15 minutes." },
});

router.post(
  "/register",
  authLimiter,
  validationRules.registerUserValidationRules,
  autController.register,
);

router.post(
  "/login",
  authLimiter,
  validationRules.loginUserValidationRules,
  autController.login,
);

router.get("/me", autController.me);
router.post("/logout", autController.logout);

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  autController.googleAuthCallback,
);

/* ── follow / artist profile ── */
router.post("/follow/:artistId", authMiddleware, followController.followArtist);
router.delete("/follow/:artistId", authMiddleware, followController.unfollowArtist);
router.get("/following", authMiddleware, followController.getFollowedArtists);
router.get("/following-ids", authMiddleware, followController.getFollowedArtistIds);
router.get("/artist/:artistId", authMiddleware, followController.getArtistProfile);

export default router;
