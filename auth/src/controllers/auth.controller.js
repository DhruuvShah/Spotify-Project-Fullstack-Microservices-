import userModel from "../models/user.model.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import config from "../config/config.js";
import { publishToQueue } from "../broker/rabbit.js";

export async function register(req, res) {
  const {
    email,
    password,
    fullname: { firstName, lastName },
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
  });

  const token = jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    config.JWT_SECRET,
    { expiresIn: "2d" },
  );

  await publishToQueue("user_created", {
    userId: user._id,
    email: user.email,
    fullname: user.fullname,
    role: user.role,
  });

  res.cookie("token", token);
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
      },
      config.JWT_SECRET,
      { expiresIn: "2d" },
    );

    res.cookie("token", token);

    return res.status(200).json({
      message: "User logged in successfully",
      user: {
        id: isUserAlreadyExists._id,
        email: isUserAlreadyExists.email,
        fullname: isUserAlreadyExists.fullname,
        role: isUserAlreadyExists.role,
      },
    });
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
    },
    config.JWT_SECRET,
    { expiresIn: "2d" },
  );

  // await publishToQueue("user_created", {
  //   userId: newUser._id,
  //   email: newUser.email,
  //   fullname: newUser.fullname,
  //   role: newUser.role,
  // });

  res.cookie("token", token);

  res.status(201).json({
    message: "User created successfully",
    user: {
      id: newUser._id,
      email: newUser.email,
      fullname: newUser.fullname,
      role: newUser.role,
    },
  });
}
