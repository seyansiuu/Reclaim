import { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { Link, useNavigate } from 'react-router-dom'

import { auth } from '../firebase/config'

function Login() {

  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function handleLogin(e) {

    e.preventDefault()

    setError('')

    try {

      await signInWithEmailAndPassword(
        auth,
        email,
        password
      )

      navigate('/')

    } catch (err) {

      setError(err.message)

    }
  }

  return (
    <div className="auth-container">

      <h2 className="auth-title">
        Welcome back
      </h2>

      <p className="auth-subtitle">
        Log in to Reclaim to see items.
      </p>

      {error && (
        <div className="auth-error">
          {error}
        </div>
      )}

      <form
        onSubmit={handleLogin}
        className="auth-form"
      >

        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="input-field"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          className="input-field"
        />

        <button
          type="submit"
          className="btn btn-primary auth-btn"
        >
          Log In
        </button>

      </form>

      <p className="auth-footer">

        No account yet?

        <Link
          to="/signup"
          className="auth-link"
        >
          Sign up
        </Link>

      </p>

    </div>
  )
}

export default Login