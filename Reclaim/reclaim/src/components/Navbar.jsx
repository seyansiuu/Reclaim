import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { auth } from '../firebase/config'
import { signOut } from 'firebase/auth'

function Navbar() {
  const navigate = useNavigate()
  const user = auth.currentUser
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = async () => {
    await signOut(auth)
    navigate('/login')
    setMenuOpen(false)
  }

  return (
    <nav className="navbar">
      <Link to="/" className="fw-600" style={{ fontSize: '1.2rem', textDecoration: 'none', color: 'var(--primary)' }}>
        Reclaim
      </Link>

      {/* Desktop links */}
      <div className="desktop-nav flex align-center gap-lg">
        <Link to="/browse" className="nav-link">Browse</Link>
        <Link to="/post" className="nav-link">Post Item</Link>
        {user ? (
          <>
            <Link to="/profile" className="nav-link">Profile</Link>
            <button onClick={handleLogout} className="btn-action neutral">Logout</button>
          </>
        ) : (
          <Link to="/login" className="btn btn-primary" style={{ padding: '0.4rem 1.2rem' }}>Login</Link>
        )}
      </div>

      {/* Hamburger button — mobile only */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="hamburger"
        style={{
          display: 'none', flexDirection: 'column', gap: '5px',
          background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
        }}
      >
        <span style={{ width: '22px', height: '2px', background: '#1a1a1a', display: 'block', borderRadius: '2px' }} />
        <span style={{ width: '22px', height: '2px', background: '#1a1a1a', display: 'block', borderRadius: '2px' }} />
        <span style={{ width: '22px', height: '2px', background: '#1a1a1a', display: 'block', borderRadius: '2px' }} />
      </button>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="mobile-menu flex flex-col gap-md">
          <Link to="/browse" onClick={() => setMenuOpen(false)} className="nav-link">Browse</Link>
          <Link to="/post" onClick={() => setMenuOpen(false)} className="nav-link">Post Item</Link>
          {user ? (
            <>
              <Link to="/profile" onClick={() => setMenuOpen(false)} className="nav-link">Profile</Link>
              <button onClick={handleLogout} className="btn-action neutral" style={{ textAlign: 'left' }}>Logout</button>
            </>
          ) : (
            <Link to="/login" onClick={() => setMenuOpen(false)} className="btn btn-primary">Login</Link>
          )}
        </div>
      )}
    </nav>
  )
}

export default Navbar