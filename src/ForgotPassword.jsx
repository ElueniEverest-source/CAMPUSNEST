import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from './lib/supabaseClient'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)

  function show(text, error) {
    setMessage(text)
    setIsError(!!error)
  }

  async function sendCode(e) {
    e.preventDefault()
    setLoading(true)
    show('', false)
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim())
    setLoading(false)
    if (error) {
      show(error.message, true)
      return
    }
    setStep(2)
    show('We sent a code to ' + email.trim() + '. Enter it below.', false)
  }

  async function resetNow(e) {
    e.preventDefault()
    if (password.length < 6) {
      show('Password must be at least 6 characters.', true)
      return
    }
    setLoading(true)
    show('', false)
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: 'recovery',
    })
    if (verifyError) {
      setLoading(false)
      show('That code is wrong or has expired. Request a new one.', true)
      return
    }
    const { error: updateError } = await supabase.auth.updateUser({ password })
    if (updateError) {
      setLoading(false)
      show(updateError.message, true)
      return
    }
    await supabase.auth.signOut()
    setLoading(false)
    show('Password updated. Taking you to log in...', false)
    setTimeout(() => navigate('/'), 1500)
  }

  return (
    <div className="page-wrap" style={{ paddingTop: 50 }}>
      <div className="form-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <img src="/icons/icon-512.png" alt="CampusNest" style={{ width: 40, height: 40 }} />
          <strong style={{ fontSize: 20 }}>CampusNest</strong>
        </div>
        <h2>Reset your password</h2>

        {step === 1 && (
          <form onSubmit={sendCode}>
            <div>
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <button type="submit" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Sending...' : 'Send code'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={resetNow}>
            <div>
              <label>Code from your email</label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter the code"
                maxLength={10}
                required
              />
            </div>
            <div>
              <label>New password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
              />
            </div>
            <button type="submit" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Updating...' : 'Reset password'}
            </button>
            <p style={{ marginTop: 12, fontSize: 13 }}>
              <a href="#" onClick={(e) => { e.preventDefault(); setStep(1); setCode(''); show('', false) }}>
                Use a different email or send a new code
              </a>
            </p>
          </form>
        )}

        {message && <p className={`status-msg ${isError ? 'error' : ''}`}>{message}</p>}
        <p style={{ marginTop: 16, fontSize: 13 }}><Link to="/">Back to login</Link></p>
      </div>
    </div>
  )
}
