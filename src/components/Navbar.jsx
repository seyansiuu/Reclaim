import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { collection, deleteDoc, doc, onSnapshot, query, updateDoc, where } from 'firebase/firestore'
import { auth, db } from '../firebase/config'

function Navbar() {
  const navigate = useNavigate()
  const user = auth.currentUser
  const [menuOpen, setMenuOpen] = useState(false)
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    if (!user) {
      return undefined
    }

    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('toUid', '==', user.uid)
    )

    return onSnapshot(notificationsQuery, (snapshot) => {
      const nextNotifications = snapshot.docs
        .map((notificationDoc) => ({ id: notificationDoc.id, ...notificationDoc.data() }))
        .sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() || 0
          const bTime = b.createdAt?.toMillis?.() || 0
          return bTime - aTime
        })

      setNotifications(nextNotifications)
    }, (err) => {
      console.error(err)
    })
  }, [user])

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications]
  )

  const handleLogout = async () => {
    await signOut(auth)
    setMenuOpen(false)
    setNotificationOpen(false)
    navigate('/login')
  }

  const handleNotificationClick = async (notification) => {
    try {
      if (!notification.read) {
        await updateDoc(doc(db, 'notifications', notification.id), { read: true })
      }
    } catch (err) {
      console.error(err)
    }

    setNotificationOpen(false)
    setMenuOpen(false)
    navigate(`/item/${notification.itemId}`)
  }

  const handleDeleteNotification = async (notificationId) => {
    try {
      await deleteDoc(doc(db, 'notifications', notificationId))
      setNotifications(prev => prev.filter(notification => notification.id !== notificationId))
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <nav className="navbar">
      <Link to="/" className="fw-600" style={{ fontSize: '1.2rem', textDecoration: 'none', color: 'var(--primary)' }}>
        Reclaim
      </Link>

      <div className="desktop-nav flex align-center gap-lg">
        <Link to="/browse" className="nav-link">Browse</Link>
        <Link to="/post" className="nav-link">Post Item</Link>
        {user ? (
          <>
            <NotificationBell
              notifications={notifications}
              open={notificationOpen}
              unreadCount={unreadCount}
              onToggle={() => setNotificationOpen((open) => !open)}
              onClose={() => setNotificationOpen(false)}
              onNotificationClick={handleNotificationClick}
              onDeleteNotification={handleDeleteNotification}
            />
            <Link to="/profile" className="nav-link">Profile</Link>
            <button onClick={handleLogout} className="btn-action neutral">Logout</button>
          </>
        ) : (
          <Link to="/login" className="btn btn-primary" style={{ padding: '0.4rem 1.2rem' }}>Login</Link>
        )}
      </div>

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

      {menuOpen && (
        <div className="mobile-menu flex flex-col gap-md">
          <Link to="/browse" onClick={() => setMenuOpen(false)} className="nav-link">Browse</Link>
          <Link to="/post" onClick={() => setMenuOpen(false)} className="nav-link">Post Item</Link>
          {user ? (
            <>
              <NotificationBell
                notifications={notifications}
                open={notificationOpen}
                unreadCount={unreadCount}
                align="left"
                onToggle={() => setNotificationOpen((open) => !open)}
                onClose={() => setNotificationOpen(false)}
                onNotificationClick={handleNotificationClick}
                onDeleteNotification={handleDeleteNotification}
              />
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

function NotificationBell({ notifications, open, unreadCount, onToggle, onClose, onNotificationClick, onDeleteNotification, align = 'right' }) {
  const containerRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined

    const handleOutsidePointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleOutsidePointerDown)
    document.addEventListener('touchstart', handleOutsidePointerDown)

    return () => {
      document.removeEventListener('mousedown', handleOutsidePointerDown)
      document.removeEventListener('touchstart', handleOutsidePointerDown)
    }
  }, [onClose, open])

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={onToggle}
        aria-label="Notifications"
        style={bellBtn}
      >
        <span style={{ fontSize: '1.05rem', lineHeight: 1 }}>🔔</span>
        {unreadCount > 0 && (
          <span style={badge}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          ...dropdown,
          right: align === 'right' ? 0 : 'auto',
          left: align === 'left' ? 0 : 'auto',
        }}>
          <div style={dropdownHeader}>
            Notifications
          </div>

          {notifications.length === 0 ? (
            <p style={{ padding: '1rem', color: '#888', fontSize: '0.86rem', margin: 0 }}>
              No notifications yet.
            </p>
          ) : (
            <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  style={{
                    ...notificationItem,
                    background: notification.read ? '#fafafa' : '#fff',
                    color: notification.read ? '#999' : '#222',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => onNotificationClick(notification)}
                    style={notificationContentBtn}
                  >
                    <span style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      background: notification.read ? '#d6d6d6' : '#2f80ed',
                      flex: '0 0 auto',
                      marginTop: '0.35rem',
                    }} />
                    <span style={{ minWidth: 0 }}>
                      <span style={{
                        display: 'block',
                        fontSize: '0.86rem',
                        fontWeight: notification.read ? '500' : '650',
                        lineHeight: '1.35',
                      }}>
                        {notification.message || `${notification.fromEmail} claimed your item "${notification.itemTitle}"`}
                      </span>
                      <span style={{
                        display: 'block',
                        fontSize: '0.74rem',
                        color: notification.read ? '#aaa' : '#777',
                        marginTop: '0.25rem',
                      }}>
                        {notification.itemTitle}
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    aria-label="Delete notification"
                    onClick={() => onDeleteNotification(notification.id)}
                    style={deleteNotificationBtn}
                  >
                    x
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const bellBtn = {
  position: 'relative',
  width: '36px',
  height: '36px',
  borderRadius: '50%',
  border: '1px solid #e8e8e8',
  background: '#fff',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const badge = {
  position: 'absolute',
  top: '-5px',
  right: '-5px',
  minWidth: '18px',
  height: '18px',
  padding: '0 5px',
  borderRadius: '999px',
  background: '#e02424',
  color: '#fff',
  fontSize: '0.68rem',
  fontWeight: '700',
  lineHeight: '18px',
  textAlign: 'center',
}

const dropdown = {
  position: 'absolute',
  top: '44px',
  width: '320px',
  maxWidth: 'calc(100vw - 2rem)',
  background: '#fff',
  border: '1px solid #eee',
  borderRadius: '10px',
  boxShadow: '0 12px 32px rgba(0, 0, 0, 0.12)',
  overflow: 'hidden',
  zIndex: 120,
}

const dropdownHeader = {
  padding: '0.85rem 1rem',
  borderBottom: '1px solid #eee',
  fontSize: '0.82rem',
  fontWeight: '700',
  color: '#222',
}

const notificationItem = {
  width: '100%',
  borderBottom: '1px solid #f0f0f0',
  display: 'flex',
  alignItems: 'stretch',
}

const notificationContentBtn = {
  flex: 1,
  minWidth: 0,
  border: 'none',
  background: 'transparent',
  padding: '0.85rem 0.4rem 0.85rem 1rem',
  textAlign: 'left',
  cursor: 'pointer',
  display: 'flex',
  gap: '0.65rem',
  color: 'inherit',
  fontFamily: 'inherit',
}

const deleteNotificationBtn = {
  width: '38px',
  border: 'none',
  background: 'transparent',
  color: '#aaa',
  cursor: 'pointer',
  fontSize: '1rem',
  fontWeight: '700',
  lineHeight: 1,
}

export default Navbar
