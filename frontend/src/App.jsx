import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { useEffect } from "react";
import { AuthProvider } from "./context/AuthContext";
import { PlayerProvider, usePlayer } from "./context/PlayerContext";
import { SocketProvider } from "./context/SocketContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import MobileNav from "./components/MobileNav";
import BottomPlayer from "./components/BottomPlayer";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import MusicPlayer from "./pages/MusicPlayer";
import Profile from "./pages/Profile";
import PlaylistDetail from "./pages/PlaylistDetail";
import Search from "./pages/Search";
import ArtistDashboard from "./pages/artist/ArtistDashboard";
import UploadMusic from "./pages/artist/UploadMusic";
import ArtistProfile from "./pages/ArtistProfile";
import UserPlaylistDetail from "./pages/UserPlaylistDetail";

function BodyPaddingSync() {
  const { currentTrack } = usePlayer();
  useEffect(() => {
    const cls = "has-player";
    if (currentTrack) {
      document.body.classList.add(cls);
    } else {
      document.body.classList.remove(cls);
    }
    return () => document.body.classList.remove(cls);
  }, [!!currentTrack]);
  return null;
}

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

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PlayerProvider>
          <SocketProvider>
            <BodyPaddingSync />
            <Routes>
              {/* Auth pages — no sidebar/topbar */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* App pages — sidebar + topbar layout */}
              <Route element={<AppLayout />}>
                <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
                <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/playlist/:id" element={<ProtectedRoute><PlaylistDetail /></ProtectedRoute>} />
                <Route path="/user-playlist/:id" element={<ProtectedRoute><UserPlaylistDetail /></ProtectedRoute>} />
                <Route path="/artist/:artistId" element={<ProtectedRoute><ArtistProfile /></ProtectedRoute>} />
                <Route path="/music/:id" element={<ProtectedRoute><MusicPlayer /></ProtectedRoute>} />
                <Route path="/artist/dashboard" element={<ProtectedRoute requiredRole="artist"><ArtistDashboard /></ProtectedRoute>} />
                <Route path="/artist/dashboard/upload-music" element={<ProtectedRoute requiredRole="artist"><UploadMusic /></ProtectedRoute>} />
              </Route>
            </Routes>
            <BottomPlayer />
          </SocketProvider>
        </PlayerProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
