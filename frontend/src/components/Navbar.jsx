import { Link, useLocation } from 'react-router-dom'
import './Navbar.css'

function Navbar() {
  const { pathname } = useLocation()

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">Spotify</Link>
      <div className="navbar-links">
        <Link to="/" className={pathname === '/' ? 'active' : ''}>Home</Link>
        <Link to="/login" className={pathname === '/login' ? 'active' : ''}>Login</Link>
        <Link to="/register" className={pathname === '/register' ? 'active' : ''}>Register</Link>
      </div>
    </nav>
  )
}

export default Navbar
