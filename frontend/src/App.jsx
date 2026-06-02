import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import "./App.css";

import { AuthProvider }   from "./context/AuthContext";
import { PlayerProvider, usePlayer } from "./context/PlayerContext";
import { SocketProvider }  from "./context/SocketContext";
import { ToastProvider }   from "./context/ToastContext";
import ErrorBoundary       from "./components/ErrorBoundary";
import ProtectedRoute      from "./components/ProtectedRoute";

// Always-visible chrome — keep eager so layout never flickers
import Sidebar      from "./components/Sidebar";
import TopBar       from "./components/TopBar";
import MobileNav    from "./components/MobileNav";
import BottomPlayer from "./components/BottomPlayer";

// ── Lazy pages ────────────────────────────────────────────────────────────────
// Each page is downloaded only when its route is first visited.
// Vite splits these into separate chunks (see vite.config.js manualChunks).
const Home               = lazy(() => import("./pages/Home"));
const Login              = lazy(() => import("./pages/Login"));
const Register           = lazy(() => import("./pages/Register"));
const Search             = lazy(() => import("./pages/Search"));
const Profile            = lazy(() => import("./pages/Profile"));
const PlaylistDetail     = lazy(() => import("./pages/PlaylistDetail"));
const UserPlaylistDetail = lazy(() => import("./pages/UserPlaylistDetail"));
const ArtistProfile      = lazy(() => import("./pages/ArtistProfile"));
const MusicPlayer        = lazy(() => import("./pages/MusicPlayer"));
const ArtistDashboard    = lazy(() => import("./pages/artist/ArtistDashboard"));
const UploadMusic        = lazy(() => import("./pages/artist/UploadMusic"));
const NotFound           = lazy(() => import("./pages/NotFound"));

// ── Page-level loading fallback ───────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="page-loader" aria-label="Loading page">
      <div className="page-loader-ring" />
    </div>
  );
}

// ── Body class sync (keeps bottom-player padding in sync) ─────────────────────
function BodyPaddingSync() {
  const { currentTrack } = usePlayer();
  useEffect(() => {
    if (currentTrack) {
      document.body.classList.add("has-player");
    } else {
      document.body.classList.remove("has-player");
    }
    return () => document.body.classList.remove("has-player");
  }, [!!currentTrack]);
  return null;
}

// ── App shell layout (sidebar + topbar + scrollable content) ──────────────────
function AppLayout() {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-main">
        <TopBar />
        <div className="app-scroll">
          <Outlet />
        </div>
      </div>
      <MobileNav />
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <PlayerProvider>
              <SocketProvider>
                <BodyPaddingSync />

                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    {/* ── Auth pages — no chrome ── */}
                    <Route path="/login"    element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    {/* ── App pages — sidebar + topbar layout ── */}
                    <Route element={<AppLayout />}>
                      <Route path="/" element={
                        <ProtectedRoute><Home /></ProtectedRoute>
                      } />
                      <Route path="/search" element={
                        <ProtectedRoute><Search /></ProtectedRoute>
                      } />
                      <Route path="/profile" element={
                        <ProtectedRoute><Profile /></ProtectedRoute>
                      } />
                      <Route path="/playlist/:id" element={
                        <ProtectedRoute><PlaylistDetail /></ProtectedRoute>
                      } />
                      <Route path="/user-playlist/:id" element={
                        <ProtectedRoute><UserPlaylistDetail /></ProtectedRoute>
                      } />
                      <Route path="/artist/:artistId" element={
                        <ProtectedRoute><ArtistProfile /></ProtectedRoute>
                      } />
                      <Route path="/music/:id" element={
                        <ProtectedRoute><MusicPlayer /></ProtectedRoute>
                      } />
                      <Route path="/artist/dashboard" element={
                        <ProtectedRoute requiredRole="artist"><ArtistDashboard /></ProtectedRoute>
                      } />
                      <Route path="/artist/dashboard/upload-music" element={
                        <ProtectedRoute requiredRole="artist"><UploadMusic /></ProtectedRoute>
                      } />
                    </Route>

                    {/* ── 404 — full-page, no chrome ── */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>

                {/* Persistent player — outside Routes so it survives navigation */}
                <BottomPlayer />
              </SocketProvider>
            </PlayerProvider>
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
