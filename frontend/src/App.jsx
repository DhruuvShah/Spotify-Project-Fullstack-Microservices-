import { BrowserRouter, Routes, Route, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { PlayerProvider, usePlayer } from "./context/PlayerContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import ArtistLayout from "./components/ArtistLayout";
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

// Syncs body padding-bottom so content never hides under the player bar
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

function WithNavbar() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const socketRef = useRef(null);

  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const socket = io("http://localhost:3002", { withCredentials: true });
    socketRef.current = socket;

    socket.on("play", ({ musicId }) => {
      navigate(`/music/${musicId}`);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user?.id, navigate]);

  return (
    <>
      <Navbar />
      <Outlet context={{ socketRef }} />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PlayerProvider>
          <BodyPaddingSync />
          <Routes>
            {/* Public + standard layout */}
            <Route element={<WithNavbar />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
              <Route path="/music/:id" element={<ProtectedRoute><MusicPlayer /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/playlist/:id" element={<ProtectedRoute><PlaylistDetail /></ProtectedRoute>} />
              <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
            </Route>

            {/* Artist layout (sidebar) */}
            <Route
              element={
                <ProtectedRoute requiredRole="artist">
                  <ArtistLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/artist/dashboard" element={<ArtistDashboard />} />
              <Route path="/artist/dashboard/upload-music" element={<UploadMusic />} />
            </Route>
          </Routes>
          <BottomPlayer />
        </PlayerProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
