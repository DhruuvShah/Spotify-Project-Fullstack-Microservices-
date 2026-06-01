import musicModel from "../models/music.Model.js";
import { musicShape } from "./musicShape.js";

/**
 * Bulk-fetch music docs for an array of ids in a single DB query.
 * Returns shaped objects in the same order as the input ids array.
 * Missing / deleted docs are silently omitted.
 */
export async function populateMusics(ids) {
  if (!ids || ids.length === 0) return [];
  const docs = await musicModel.find({ _id: { $in: ids } });
  const map = new Map(docs.map((d) => [d._id.toString(), d]));
  return ids.map((id) => map.get(id.toString())).filter(Boolean).map(musicShape);
}
