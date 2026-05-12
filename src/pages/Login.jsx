import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  isSignInWithEmailLink,
  sendSignInLinkToEmail,
  signInWithEmailLink,
} from 'firebase/auth'

import { auth } from '../firebase/config'

const UNIVERSITIES = [
  {
    name: 'Rishihood University',
    value: 'rishihood',
    domains: [
      '.rishihood.edu.in',
    ],
    hint: 'Use your Rishihood University email address',
  },
]


function Login() {
  const navigate = useNavigate()

  const [university, setUniversity] = useState('')
  const [email, setEmail] = useState('')
  const [step, setStep] = useState('form') // 'form' | 'sent' | 'completing'
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)

  const selectedUniversity = useMemo(
    () => UNIVERSITIES.find((u) => u.value === university) || null,
    [university]
  )


  const domainHint = selectedUniversity?.hint || ''

  const completeSignIn = async (emailToUse) => {
    setError('')
    setLoading(true)
    try {

      await signInWithEmailLink(auth, emailToUse, window.location.href)
      localStorage.removeItem('emailForSignIn')
      navigate('/')
    } catch (err) {
      setError(err?.message || 'Failed to sign in')
      setStep('form')
      setLoading(false)
    }
  }

  useEffect(() => {
    const href = window.location.href

    if (isSignInWithEmailLink(auth, href)) {
      setStep('completing')
      const savedEmail = localStorage.getItem('emailForSignIn')

      if (savedEmail) {
        completeSignIn(savedEmail)
      }
      // if no saved email, user must manually enter it
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (step !== 'sent') return

    if (resendTimer <= 0) return

    const interval = setInterval(() => {
      setResendTimer((t) => {
        if (t <= 1) {
          clearInterval(interval)
          return 0
        }
        return t - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [resendTimer, step])

  const actionCodeSettings = useMemo(() => {
    return {
      url: window.location.origin + '/login',
      handleCodeInApp: true,
    }
  }, [])

  const handleSendMagicLink = async (e) => {
    e.preventDefault()
    setError('')

    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setError('Please enter your email')
      return
    }

    if (!university) {
      setError('Please select your university')
      return
    }

    const selectedUni = UNIVERSITIES.find((u) => u.value === university)
    const validDomain = selectedUni?.domains?.some(
      (domain) => trimmedEmail.endsWith(domain)
    )

    // Multi-domain support for Rishihood (and future universities)
    if (!validDomain) {
      setError('Please use your Rishihood University email address.')
      return
    }



    try {
      setLoading(true)
      localStorage.setItem('emailForSignIn', trimmedEmail)
      await sendSignInLinkToEmail(auth, trimmedEmail, actionCodeSettings)
      setStep('sent')
      setResendTimer(30)
    } catch (err) {
      setError(err?.message || 'Failed to send magic link')
      setLoading(false)
      setStep('form')
    }
  }

  const handleResend = async () => {
    setError('')
    const href = window.location.href
    const trimmedEmail = (email || '').trim()

    if (!trimmedEmail) {
      setError('Please enter your email')
      return
    }

    try {
      setLoading(true)
      localStorage.setItem('emailForSignIn', trimmedEmail)
      await sendSignInLinkToEmail(auth, trimmedEmail, actionCodeSettings)
      setResendTimer(30)
      setStep('sent')
    } catch (err) {
      setError(err?.message || 'Failed to resend magic link')
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      {step === 'form' && (
        <>
          <h2 className="auth-title">Sign in to your campus</h2>
          <p className="auth-subtitle">Use magic links—no password needed.</p>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSendMagicLink} className="auth-form">
            <select
              value={university}
              onChange={(e) => {
                setUniversity(e.target.value)
                setError('')
              }}
              className="input-field"
              style={{
                width: '100%',
                border: '1.5px solid #e0e0e0',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
              }}
              required
            >
              <option value="" disabled>
                Select your university
              </option>
              {UNIVERSITIES.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.name}
                </option>
              ))}
            </select>

            {selectedUniversity && (
              <div style={{ fontSize: '0.85rem', color: '#777', marginTop: '0.4rem' }}>
                Use your {domainHint} email address
              </div>
            )}

            <input
              type="email"
              placeholder="e.g. yourname@rishihood.edu.in"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setError('')
              }}
              required
              className="input-field"
              style={{ width: '100%' }}
            />

            <button
              type="submit"
              className="btn btn-primary auth-btn"
              style={{ width: '100%', background: '#1a1a1a' }}
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Magic Link'}
            </button>
          </form>
        </>
      )}

      {step === 'sent' && (
        <div className="auth-form" style={{ textAlign: 'left' }}>
          <div style={{ fontSize: '2rem', lineHeight: 1 }}>
            📧
          </div>
          <h2 className="auth-title" style={{ marginTop: '0.5rem' }}>
            Check your inbox!
          </h2>
          <p className="auth-subtitle">
            We sent a magic link to <b>{email}</b>.
          </p>
          <p style={{ color: '#666', fontSize: '0.92rem', marginTop: '0.75rem' }}>
            Click the link in your email to sign in — it expires in 10 minutes.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '1.1rem' }}>
            <button
              type="button"
              onClick={() => {
                setStep('form')
                setError('')
                setResendTimer(0)
              }}
              className="btn-action neutral"
              style={{ textAlign: 'left' }}
            >
              Change email
            </button>

            <button
              type="button"
              onClick={handleResend}
              disabled={loading || resendTimer > 0}
              style={{
                width: '100%',
                background: '#1a1a1a',
                color: '#fff',
                opacity: loading || resendTimer > 0 ? 0.65 : 1,
                cursor: loading || resendTimer > 0 ? 'not-allowed' : 'pointer',
              }}
            >
              {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend link'}
            </button>
          </div>
        </div>
      )}

      {step === 'completing' && (
        <div className="auth-form">
          <div style={{ fontSize: '1.75rem' }}>⏳</div>
          <h2 className="auth-title">Signing you in...</h2>

          {error && (
            <>
              <div className="auth-error">{error}</div>
              <button
                type="button"
                onClick={() => {
                  setError('')
                  setStep('form')
                }}
                className="btn btn-primary auth-btn"
              >
                Back to form
              </button>
            </>
          )}

          {!localStorage.getItem('emailForSignIn') && (
            <>
              <p className="auth-subtitle">Please enter your email to confirm</p>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="input-field"
              />
              <button
                type="button"
                onClick={() => completeSignIn(email.trim())}
                disabled={loading || !email.trim()}
                className="btn btn-primary auth-btn"
              >
                Confirm & Sign in
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default Login

