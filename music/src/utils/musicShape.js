export function musicShape(m) {
  return {
    id: m._id,
    title: m.title,
    artist: m.artist,
    artistId: m.artistId,
    musicUrl: m.musicUrl,
    coverImageUrl: m.coverImageUrl,
  };
}
