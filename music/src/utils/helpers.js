import { cacheDel, cacheDelByPrefix } from "./cache.js";

export function getArtistName(user) {
  return `${user.fullname.firstName} ${user.fullname.lastName}`;
}

export function invalidateMusicCaches(userId) {
  cacheDelByPrefix("musics:all:");
  cacheDel(`artist-musics:${userId}`);
  cacheDelByPrefix("playlist:");
  cacheDelByPrefix("user-playlist:");
  cacheDelByPrefix("artist-playlists:");
  cacheDelByPrefix("artist-albums:");
}
