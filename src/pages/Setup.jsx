import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { updateProfile } from 'firebase/auth'
import { auth } from '../firebase/config'

function Setup() {
  const navigate = useNavigate()

  const [firstName, setFirstName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()

    const name = firstName.trim()
    if (!name) {
      setError('Please enter your first name')
      return
    }

    setError('')
    setLoading(true)

    try {
      if (!auth.currentUser) throw new Error('No user')
      await updateProfile(auth.currentUser, { displayName: name })
      navigate('/')
    } catch (err) {
      setError(err?.message || 'Failed to save your name')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container" style={{ marginTop: '4.5rem' }}>
      <h2 className="auth-title" style={{ fontSize: '1.6rem' }}>Welcome</h2>
      <p className="auth-subtitle" style={{ marginBottom: '1.5rem' }}>
        What should we call you?
      </p>

      <form onSubmit={handleSubmit} className="auth-form" style={{ textAlign: 'left' }}>
        {error && <div className="auth-error">{error}</div>}

        <label className="form-label" htmlFor="firstName">
          What’s your first name?
        </label>

        <input
          id="firstName"
          type="text"
          className="input-field"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="e.g. Aisha"
          disabled={loading}
          required
        />

        <button
          type="submit"
          className="btn btn-primary auth-btn"
          style={{ width: '100%', background: '#7C3AED' }}
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Continue'}
        </button>
      </form>
    </div>
  )
}

export default Setup

