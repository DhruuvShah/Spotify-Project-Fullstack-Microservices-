import express from "express";
import * as autController from "../controllers/auth.controller.js";
import * as validationRules from "../middlewares/validation.middleware.js";
import passport from "passport";

const router = express.Router();

router.post(
  "/register",
  validationRules.registerUserValidationRules,
  autController.register,
);

router.post(
  "/login",
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

export default router;
