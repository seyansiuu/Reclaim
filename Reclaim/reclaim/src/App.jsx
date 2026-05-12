import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './firebase/config'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Browse from './pages/Browse'
import PostItem from './pages/PostItem'
import ItemDetails from './pages/ItemDetails'
import Profile from './pages/Profile'
import Login from './pages/Login'
import Signup from './pages/Signup'
import './App.css'

function App() {
  const [authReady, setAuthReady] = useState(false)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setAuthReady(true)
    })
    return () => unsub()
  }, [])

  if (!authReady) {
    return (
      <div className="empty-state" style={{ border: 'none' }}>
        Loading...
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={user ? <Home /> : <Navigate to="/login" />} />
        <Route path="/browse" element={user ? <Browse /> : <Navigate to="/login" />} />
        <Route path="/item/:id" element={user ? <ItemDetails /> : <Navigate to="/login" />} />

        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
        <Route path="/signup" element={!user ? <Signup /> : <Navigate to="/" />} />

        <Route path="/post" element={user ? <PostItem /> : <Navigate to="/login" />} />
        <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App