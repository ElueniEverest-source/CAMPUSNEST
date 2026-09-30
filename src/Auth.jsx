import { useState } from 'react'
import { supabase } from './lib/supabaseClient'

export default function Auth() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('student')
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [loading, setLoading] = useState(false)

  function validate() {
    const errors = {}
    if (!email.trim()) errors.email = 'Enter your email'
    else if (!/^\S+@\S+\.\S+$/.test(email)) errors.email = 'Enter a valid email'
    if (!password) errors.password = 'Enter a password'
    else if (mode === 'signup' && password.length < 6) errors.password = 'Use at least 6 characters'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setMessage('')
    setIsError(false)
    if (!validate()) return

    setLoading(true)
    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: email.split('@')[0], role } }
      })
      if (error) { setMessage(error.message); setIsError(true) }
      else { setMessage('Account created. You can log in now.'); setMode('login') }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setMessage(error.message); setIsError(true) }
    }
    setLoading(false)
  }

  return (
    <div className="page-wrap" style={{ paddingTop: 50 }}>
      <div className="form-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <img src="/icons/icon-512.png" alt="CampusNest" style={{ width: 40, height: 40 }} />
          <strong style={{ fontSize: 20 }}>CampusNest</strong>
        </div>

        <div className="auth-tabs">
          <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setMessage(''); setFieldErrors({}) }}>Log In</button>
          <button type="button" className={mode === 'signup' ? 'active' : ''} onClick={() => { setMode('signup'); setMessage(''); setFieldErrors({}) }}>Sign Up</button>
        </div>

        <h2>{mode === 'signup' ? 'Create your account' : 'Welcome back'}</h2>
        <p className="sub">{mode === 'signup' ? 'Find verified student housing across Delta State.' : 'Log in to browse and manage your listings.'}</p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label>Email</label>
            <input type="email" placeholder="you@example.com" value={email}
              onChange={e => { setEmail(e.target.value); if (fieldErrors.email) setFieldErrors(f => ({ ...f, email: null })) }} />
            {fieldErrors.email && <div className="field-error">{fieldErrors.email}</div>}
          </div>

          <div className="field">
            <label>Password</label>
            <div className="password-wrap">
              <input type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password}
                onChange={e => { setPassword(e.target.value); if (fieldErrors.password) setFieldErrors(f => ({ ...f, password: null })) }} />
              <button type="button" className="toggle-visibility" onClick={() => setShowPassword(s => !s)}>
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {fieldErrors.password && <div className="field-error">{fieldErrors.password}</div>}
          </div>

          {mode === 'signup' && (
            <div className="field">
              <label>I am a</label>
              <select value={role} onChange={e => setRole(e.target.value)}>
                <option value="student">Student</option>
                <option value="agent">Agent / Landlord</option>
              </select>
            </div>
          )}

          <button type="submit" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Please wait...' : mode === 'signup' ? 'Create account' : 'Log In'}
          </button>
        </form>
        {mode === 'login' && (
          <p style={{ marginTop: 12, fontSize: 13, textAlign: 'center' }}>
            <a href='/forgot-password'>Forgot password?</a>
          </p>
        )}
        {mode === 'login' && (
          <p style={{ marginTop: 12, fontSize: 13, textAlign: 'center' }}>
          </p>
        )}

        {message && <p className={`status-msg ${isError ? 'error' : ''}`}>{message}</p>}
      </div>
    </div>
  )
}
