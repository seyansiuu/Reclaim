import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './firebase/config'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Browse from './pages/Browse'
import PostItem from './pages/PostItem'
import ItemDetails from './pages/ItemDetails'
import Profile from './pages/Profile'
import Chat from './pages/Chat'
import Login from './pages/Login'
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
        <Route path="/chat/:chatRoomId" element={user ? <Chat /> : <Navigate to="/login" />} />
        <Route path="/post" element={user ? <PostItem /> : <Navigate to="/login" />} />
        <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />


      </Routes>
    </BrowserRouter>
  )
}

export default App
