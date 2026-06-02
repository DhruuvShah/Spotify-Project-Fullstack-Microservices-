import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/theme.css'
import './styles/primitives.css'
import './index.css'
import App from './App.jsx'

// Fire-and-forget pings to wake Render.com free-tier services before React
// even mounts. Cold-start takes 30-90s — this gives the servers a head-start
// while the user reads the login page. A 404 or CORS error still wakes them.
const authUrl = import.meta.env.VITE_AUTH_URL
const musicUrl = import.meta.env.VITE_MUSIC_URL
if (authUrl)  fetch(`${authUrl}/api/health`,  { method: 'GET', credentials: 'include' }).catch(() => {})
if (musicUrl) fetch(`${musicUrl}/api/health`, { method: 'GET', credentials: 'include' }).catch(() => {})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
