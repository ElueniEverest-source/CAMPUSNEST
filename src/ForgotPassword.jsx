import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from './lib/supabaseClient'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })
    if (error) { setMessage(error.message); setIsError(true) }
    else { setMessage('Check your email for a password reset link.'); setIsError(false) }
    setLoading(false)
  }

  return (
    <div className="page-wrap" style={{ paddingTop: 60 }}>
      <div className="form-card">
        <h2>Reset your password</h2>
        <p className="sub">Enter your email and we'll send you a reset link.</p>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <button type="submit" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Sending...' : 'Send reset link'}
          </button>
        </form>
        {message && <p className={`status-msg ${isError ? 'error' : ''}`}>{message}</p>}
        <p style={{ marginTop: 16, fontSize: 13 }}><Link to="/">Back to login</Link></p>
      </div>
    </div>
  )
}
