import axios from "axios";
import { MUSIC_URL } from "../config.js";
import { tokenStore } from "./tokenStore.js";

const musicApi = axios.create({
  baseURL: MUSIC_URL,
  withCredentials: true,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

musicApi.interceptors.request.use((config) => {
  const t = tokenStore.get();
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

// Bare axios calls to MUSIC_URL (used directly in components) also need the token
axios.interceptors.request.use((config) => {
  const t = tokenStore.get();
  if (t && typeof config.url === "string" && config.url.startsWith(MUSIC_URL)) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${t}`;
  }
  return config;
});

export default musicApi;
