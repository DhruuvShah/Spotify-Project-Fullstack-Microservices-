import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import ArtistDashboard from './pages/artist/ArtistDashboard'
import UploadMusic from './pages/artist/UploadMusic'
import MusicPlayer from './pages/MusicPlayer'

function WithNavbar() {
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<WithNavbar />}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/music/:id" element={<MusicPlayer />} />
        </Route>
        <Route path="/artist/dashboard" element={<ArtistDashboard />} />
        <Route path="/artist/dashboard/upload-music" element={<UploadMusic />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
