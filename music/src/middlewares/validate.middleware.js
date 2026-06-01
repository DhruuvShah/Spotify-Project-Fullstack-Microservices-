import mongoose from "mongoose";

export function validateObjectId(...params) {
  return (req, res, next) => {
    for (const param of params) {
      const val = req.params[param];
      if (val !== undefined && !mongoose.Types.ObjectId.isValid(val)) {
        return res.status(400).json({ message: `Invalid ${param}` });
      }
    }
    next();
  };
}
