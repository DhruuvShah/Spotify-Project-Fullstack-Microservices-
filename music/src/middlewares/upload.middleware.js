import multer from "multer";
import os from "os";
import path from "path";
import { v4 as uuidv4 } from "uuid";

// Write to OS temp dir — file is streamed to ImageKit then deleted
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, os.tmpdir()),
  filename: (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`),
});

const fileFilter = (req, file, cb) => {
  if (file.fieldname === "coverImage") {
    cb(null, file.mimetype.startsWith("image/"));
  } else if (file.fieldname === "musicFile") {
    cb(null, file.mimetype.startsWith("audio/"));
  } else {
    cb(null, false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
});

// Expects multipart fields: "musicFile" (audio) + "coverImage" (image)
export const uploadMusicFiles = upload.fields([
  { name: "musicFile", maxCount: 1 },
  { name: "coverImage", maxCount: 1 },
]);
