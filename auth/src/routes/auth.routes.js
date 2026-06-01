import express from "express";
import rateLimit from "express-rate-limit";
import * as authController from "../controllers/auth.controller.js";
import * as validationRules from "../middlewares/validation.middleware.js";
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
  authController.register,
);

router.post(
  "/login",
  authLimiter,
  validationRules.loginUserValidationRules,
  authController.login,
);

router.get("/me", authController.me);
router.post("/logout", authController.logout);

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/login?error=google_failed",
  }),
  authController.googleAuthCallback,
);

export default router;
