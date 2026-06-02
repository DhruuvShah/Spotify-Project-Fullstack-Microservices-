import axios from "axios";
import { AUTH_URL } from "../config.js";

const authApi = axios.create({
  baseURL: AUTH_URL,
  withCredentials: true,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// Strip the user session on 401 — a 401 from the auth service itself means
// the cookie has expired. We dispatch a custom event so AuthContext can react
// without a direct dependency on this module.
authApi.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      window.dispatchEvent(new Event("auth:expired"));
    }
    return Promise.reject(err);
  }
);

export default authApi;
