import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { AUTH_URL } from "../config.js";
import { tokenStore } from "../services/tokenStore.js";

// Intercept 401s globally — clear user state so the app shows the login page
axios.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      // Let the component that owns the request handle it; if it doesn't, the
      // AuthContext useEffect will have already set user to null on startup.
    }
    return Promise.reject(err);
  },
);

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`${AUTH_URL}/api/auth/me`, { withCredentials: true })
      .then((res) => {
        // Prefer token from server; fall back to a cached (non-expired) localStorage token
        const t = res.data.token ?? tokenStore.get();
        if (res.data.token) tokenStore.set(res.data.token);
        setToken(t);
        setUser(res.data.user);
      })
      .catch(() => {
        // /me failed → session gone; purge everything
        tokenStore.clear();
        setToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  async function logout() {
    try {
      await axios.post(
        `${AUTH_URL}/api/auth/logout`,
        {},
        { withCredentials: true },
      );
    } catch {
      // ignore network errors — cookie is cleared server-side
    }
    tokenStore.clear();
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, logout, setUser, setToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
