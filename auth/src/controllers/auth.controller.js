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

export async function register(req, res) {
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
    fullname: {
      firstName,
      lastName,
    },
    role,
  });

  const token = jwt.sign(
    {
      id: user._id,
      role: user.role,
      fullname: user.fullname,
    },
    config.JWT_SECRET,
    { expiresIn: TOKEN_TTL },
  );

  await publishToQueue("user_created", {
    userId: user._id,
    email: user.email,
    fullname: user.fullname,
    role: user.role,
  });

  res.cookie("token", token, COOKIE_OPTIONS);
  res.status(201).json({
    message: "User created successfully",
    user: {
      id: user._id,
      email: user.email,
      fullname: user.fullname,
      role: user.role,
    },
  });
}

export async function googleAuthCallback(req, res) {
  const user = req.user;

  const isUserAlreadyExists = await userModel.findOne({
    $or: [{ email: user.emails[0].value }, { googleId: user.id }],
  });

  if (isUserAlreadyExists) {
    const token = jwt.sign(
      {
        id: isUserAlreadyExists._id,
        role: isUserAlreadyExists.role,
        fullname: isUserAlreadyExists.fullname,
      },
      config.JWT_SECRET,
      { expiresIn: TOKEN_TTL },
    );

    res.cookie("token", token, COOKIE_OPTIONS);

    const base = process.env.FRONTEND_URL || "http://localhost:5173";
    if (isUserAlreadyExists.role === "artist") {
      return res.redirect(`${base}/artist/dashboard`);
    }

    return res.redirect(base);
  }

  const newUser = await userModel.create({
    googleId: user.id,
    email: user.emails[0].value,
    fullname: {
      firstName: user.name.givenName,
      lastName: user.name.familyName,
    },
  });

  await publishToQueue("user_created", {
    userId: newUser._id,
    email: newUser.email,
    fullname: newUser.fullname,
    role: newUser.role,
  });

  const token = jwt.sign(
    {
      id: newUser._id,
      role: newUser.role,
      fullname: newUser.fullname,
    },
    config.JWT_SECRET,
    { expiresIn: TOKEN_TTL },
  );

  // await publishToQueue("user_created", {
  //   userId: newUser._id,
  //   email: newUser.email,
  //   fullname: newUser.fullname,
  //   role: newUser.role,
  // });

  res.cookie("token", token, COOKIE_OPTIONS);

  const base = process.env.FRONTEND_URL || "http://localhost:5173";
  return res.redirect(base);
}

export async function me(req, res) {
  try {
    const token = req.cookies?.token;
    if (!token) return res.status(401).json({ message: "Not authenticated" });

    const decoded = jwt.verify(token, config.JWT_SECRET);
    const user = await userModel.findById(decoded.id).select("-password");

    if (!user) return res.status(401).json({ message: "User not found" });

    // Silently renew if token expires within the threshold
    const expiresAt = decoded.exp * 1000;
    if (expiresAt - Date.now() < RENEW_THRESHOLD_MS) {
      const newToken = jwt.sign(
        { id: user._id, role: user.role, fullname: user.fullname },
        config.JWT_SECRET,
        { expiresIn: TOKEN_TTL },
      );
      res.cookie("token", newToken, COOKIE_OPTIONS);
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

export async function login(req, res) {
  const { email, password } = req.body;

  const user = await userModel.findOne({ email });

  if (!user) {
    return res.status(400).json({ message: "Invalid email or password" });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    return res.status(400).json({ message: "Invalid email or password" });
  }

  const token = jwt.sign(
    {
      id: user._id,
      role: user.role,
      fullname: user.fullname,
    },
    config.JWT_SECRET,
    { expiresIn: TOKEN_TTL },
  );

  res.cookie("token", token, COOKIE_OPTIONS);

  return res.status(200).json({
    message: "Login successful",
    user: {
      id: user._id,
      email: user.email,
      fullname: user.fullname,
      role: user.role,
    },
  });
}
