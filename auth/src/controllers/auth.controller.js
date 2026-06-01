import userModel from "../models/user.model.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import config from "../config/config.js";
import { publishToQueue } from "../broker/rabbit.js";

const IS_PROD = process.env.NODE_ENV === "production";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: IS_PROD,
  sameSite: IS_PROD ? "none" : "lax",
  maxAge: 30 * 24 * 60 * 60 * 1000,
  path: "/",
};

const TOKEN_TTL = "30d";
const RENEW_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000;

function generateToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role, fullname: user.fullname },
    config.JWT_SECRET,
    { expiresIn: TOKEN_TTL },
  );
}

export async function register(req, res, next) {
  try {
    const {
      email,
      password,
      fullname: { firstName, lastName },
      role = "user",
    } = req.body;

    const isUserAlreadyExists = await userModel.findOne({ email });

    if (isUserAlreadyExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hash = await bcrypt.hash(password, 10);

    const user = await userModel.create({
      email,
      password: hash,
      fullname: { firstName, lastName },
      role,
    });

    await publishToQueue("user_created", {
      userId: user._id,
      email: user.email,
      fullname: user.fullname,
      role: user.role,
    });

    res.cookie("token", generateToken(user), COOKIE_OPTIONS);
    return res.status(201).json({
      message: "User created successfully",
      user: {
        id: user._id,
        email: user.email,
        fullname: user.fullname,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function googleAuthCallback(req, res, next) {
  try {
    const profile = req.user;

    const existingUser = await userModel.findOne({
      $or: [{ email: profile.emails[0].value }, { googleId: profile.id }],
    });

    const base = process.env.FRONTEND_URL || "http://localhost:5173";

    if (existingUser) {
      res.cookie("token", generateToken(existingUser), COOKIE_OPTIONS);
      return res.redirect(
        existingUser.role === "artist" ? `${base}/artist/dashboard` : base,
      );
    }

    const newUser = await userModel.create({
      googleId: profile.id,
      email: profile.emails[0].value,
      fullname: {
        firstName: profile.name.givenName,
        lastName: profile.name.familyName,
      },
    });

    await publishToQueue("user_created", {
      userId: newUser._id,
      email: newUser.email,
      fullname: newUser.fullname,
      role: newUser.role,
    });

    res.cookie("token", generateToken(newUser), COOKIE_OPTIONS);
    return res.redirect(base);
  } catch (err) {
    next(err);
  }
}

export async function me(req, res) {
  try {
    const token = req.cookies?.token;
    if (!token) return res.status(401).json({ message: "Not authenticated" });

    const decoded = jwt.verify(token, config.JWT_SECRET);
    const user = await userModel.findById(decoded.id).select("-password");

    if (!user) return res.status(401).json({ message: "User not found" });

    const expiresAt = decoded.exp * 1000;
    if (expiresAt - Date.now() < RENEW_THRESHOLD_MS) {
      res.cookie("token", generateToken(user), COOKIE_OPTIONS);
    }

    return res.status(200).json({
      user: {
        id: user._id,
        email: user.email,
        fullname: user.fullname,
        role: user.role,
      },
    });
  } catch {
    return res.status(401).json({ message: "Not authenticated" });
  }
}

export function logout(req, res) {
  res.clearCookie("token", COOKIE_OPTIONS);
  return res.status(200).json({ message: "Logged out successfully" });
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    if (!user.password) {
      return res
        .status(400)
        .json({
          message:
            "This account uses Google Sign-In. Please log in with Google.",
        });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    res.cookie("token", generateToken(user), COOKIE_OPTIONS);
    return res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        email: user.email,
        fullname: user.fullname,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
}
