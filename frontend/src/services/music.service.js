import musicApi from "./musicApi.js";

export const musicService = {
  // ── Browse ──────────────────────────────────────────────────

  /** All published tracks. */
  getAllMusic() {
    return musicApi.get("/api/music/").then((r) => r.data.musics);
  },

  /** Full-text search across title + artist. */
  search(q) {
    return musicApi
      .get(`/api/music/search?q=${encodeURIComponent(q)}`)
      .then((r) => r.data.musics);
  },

  /** All public/artist-curated playlists. */
  getPlaylists() {
    return musicApi.get("/api/music/playlists").then((r) => r.data.playlists);
  },

  /** One public playlist with its tracks. */
  getPlaylist(id) {
    return musicApi
      .get(`/api/music/playlist/${id}`)
      .then((r) => r.data.playlist);
  },

  /** All tracks uploaded by a specific artist. */
  getMusicByArtist(artistId) {
    return musicApi
      .get(`/api/music/by-artist/${artistId}`)
      .then((r) => r.data.musics);
  },

  // ── User playlists ───────────────────────────────────────────

  /** All playlists owned by the logged-in user. */
  getUserPlaylists() {
    return musicApi
      .get("/api/music/user-playlists")
      .then((r) => r.data.playlists);
  },

  /** One user-owned playlist with its tracks. */
  getUserPlaylist(id) {
    return musicApi
      .get(`/api/music/user-playlist/${id}`)
      .then((r) => r.data.playlist);
  },

  /** Create a new user playlist. Returns the created playlist. */
  createUserPlaylist(title) {
    return musicApi
      .post("/api/music/user-playlist", { title })
      .then((r) => r.data.playlist);
  },

  /** Rename a user playlist. */
  renameUserPlaylist(id, title) {
    return musicApi.patch(`/api/music/user-playlist/${id}`, { title });
  },

  /** Delete a user playlist. */
  deleteUserPlaylist(id) {
    return musicApi.delete(`/api/music/user-playlist/${id}`);
  },

  /** Add a track to a user playlist. */
  addToUserPlaylist(playlistId, musicId) {
    return musicApi.patch(
      `/api/music/user-playlist/${playlistId}/add/${musicId}`,
      {}
    );
  },

  // ── Likes ────────────────────────────────────────────────────

  /** All liked track IDs for the current user. */
  getLikes() {
    return musicApi.get("/api/music/likes").then((r) => r.data.likedIds);
  },

  /** Like a track. */
  like(musicId) {
    return musicApi.post(`/api/music/like/${musicId}`, {});
  },

  /** Unlike a track. */
  unlike(musicId) {
    return musicApi.delete(`/api/music/like/${musicId}`);
  },

  // ── History ──────────────────────────────────────────────────

  /** Recently played tracks for the current user. */
  getHistory() {
    return musicApi.get("/api/music/history").then((r) => r.data.musics);
  },

  /** Record a play event (fire-and-forget). */
  recordPlay(musicId) {
    return musicApi.post(`/api/music/history/${musicId}`, {}).catch(() => {});
  },

  // ── Artist tools ─────────────────────────────────────────────

  /** All tracks uploaded by the logged-in artist. */
  getArtistMusics() {
    return musicApi
      .get("/api/music/artist-musics")
      .then((r) => r.data.musics);
  },

  /** All playlists owned by the logged-in artist. */
  getArtistPlaylists() {
    return musicApi
      .get("/api/music/playlist/artist")
      .then((r) => r.data.playlists);
  },

  /** Create an artist-curated playlist. */
  createPlaylist(title) {
    return musicApi
      .post("/api/music/playlist", { title })
      .then((r) => r.data.playlist);
  },

  /** Rename an artist playlist. */
  renamePlaylist(id, title) {
    return musicApi.patch(`/api/music/playlist/${id}`, { title });
  },

  /** Delete an artist playlist. */
  deletePlaylist(id) {
    return musicApi.delete(`/api/music/playlist/${id}`);
  },

  /** Add a track to an artist playlist. */
  addToPlaylist(playlistId, musicId) {
    return musicApi.patch(`/api/music/playlist/${playlistId}/add/${musicId}`, {});
  },

  /** Remove a track from an artist playlist. */
  removeFromPlaylist(playlistId, musicId) {
    return musicApi.patch(
      `/api/music/playlist/${playlistId}/remove/${musicId}`,
      {}
    );
  },

  /** Upload a new track (multipart). Returns the created music object. */
  uploadMusic(formData) {
    return musicApi
      .post("/api/music/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data.music);
  },

  /** Delete a track (artist only). */
  deleteMusic(musicId) {
    return musicApi.delete(`/api/music/${musicId}`);
  },
};
