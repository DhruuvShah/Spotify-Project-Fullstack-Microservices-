import authApi from "./authApi.js";
import { AUTH_URL } from "../config.js";

export const authService = {
  /** Fetch the currently authenticated user. */
  getMe() {
    return authApi.get("/api/auth/me").then((r) => r.data.user);
  },

  /** Log in with email + password. Returns the user object. */
  login(email, password) {
    return authApi
      .post("/api/auth/login", { email, password })
      .then((r) => r.data.user);
  },

  /** Register a new account. Returns the user object. */
  register({ email, password, firstName, lastName, role }) {
    return authApi
      .post("/api/auth/register", {
        email,
        password,
        fullname: { firstName, lastName },
        role,
      })
      .then((r) => r.data.user);
  },

  /** Destroy the server-side session. */
  logout() {
    return authApi.post("/api/auth/logout", {}).catch(() => {});
  },

  /** Returns the URL to redirect to for Google OAuth. */
  googleAuthUrl() {
    return `${AUTH_URL}/api/auth/google`;
  },

  /** Get a public artist profile (name, followerCount, isFollowing). */
  getArtist(artistId) {
    return authApi
      .get(`/api/auth/artist/${artistId}`)
      .then((r) => r.data.artist);
  },

  /** Get all artists the current user follows. */
  getFollowing() {
    return authApi.get("/api/auth/following").then((r) => r.data.artists);
  },

  /** Follow an artist. */
  follow(artistId) {
    return authApi.post(`/api/auth/follow/${artistId}`, {});
  },

  /** Unfollow an artist. */
  unfollow(artistId) {
    return authApi.delete(`/api/auth/follow/${artistId}`);
  },
};
