import { useState } from 'react'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { Link, useNavigate } from 'react-router-dom'

import { auth } from '../firebase/config'

function Signup() {

  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function handleSignup(e) {

    e.preventDefault()

    setError('')

    try {

      await createUserWithEmailAndPassword(
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
        Create account
      </h2>

      <p className="auth-subtitle">
        Join Reclaim to find your lost items.
      </p>

      {error && (
        <div className="auth-error">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSignup}
        className="auth-form"
      >

        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={e =>
            setEmail(e.target.value)
          }
          required
          className="input-field"
        />

        <input
          type="password"
          placeholder="Create password"
          value={password}
          onChange={e =>
            setPassword(e.target.value)
          }
          required
          className="input-field"
        />

        <button
          type="submit"
          className="btn btn-primary auth-btn"
        >
          Sign Up
        </button>

      </form>

      <p className="auth-footer">

        Already have an account?

        <Link
          to="/login"
          className="auth-link"
        >
          Log in
        </Link>

      </p>

    </div>
  )
}

export default Signup