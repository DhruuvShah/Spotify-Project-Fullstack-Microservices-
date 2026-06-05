import ImageKit from "@imagekit/nodejs";
import fs from "fs";
import config from "../config/config.js";

const imagekit = new ImageKit({
  publicKey: config.IMAGEKIT_PUBLIC_KEY,
  privateKey: config.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: config.IMAGEKIT_URL_ENDPOINT,
});

/**
 * Upload a file to ImageKit by streaming from disk (equivalent to S3 putObject)
 * @param {string} filePath    - temp file path from multer disk storage (file.path)
 * @param {string} originalName - file.originalname from multer
 * @param {string} folder       - "musics" | "covers"
 * @returns {{ url: string, fileId: string }}
 */
export const uploadFile = async (filePath, originalName, folder) => {
  const ext = originalName.split(".").pop();
  const base = originalName
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 80);
  const uniqueFileName = `${base}_${Date.now()}.${ext}`;

  try {
    const response = await imagekit.files.upload({
      file: fs.createReadStream(filePath),
      fileName: uniqueFileName,
      folder: `/spotify/${folder}`,
      useUniqueFileName: false,
    });

    return {
      url: response.url,
      fileId: response.fileId,
    };
  } finally {
    // Always delete the temp file whether upload succeeded or failed
    await fs.promises.unlink(filePath).catch(() => {});
  }
};

/**
 * Delete a file from ImageKit by its fileId (equivalent to S3 deleteObject)
 * @param {string} fileId
 */
export const deleteFile = async (fileId) => {
  await imagekit.files.delete(fileId);
};

export default imagekit;
