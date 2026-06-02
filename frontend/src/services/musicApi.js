import axios from "axios";
import { MUSIC_URL } from "../config.js";

const musicApi = axios.create({
  baseURL: MUSIC_URL,
  withCredentials: true,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

export default musicApi;
