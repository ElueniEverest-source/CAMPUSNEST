import { useState } from 'react'
import { supabase } from './lib/supabaseClient'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (password.length < 6) { setMessage('Use at least 6 characters'); setIsError(true); return }
    const { error } = await supabase.auth.updateUser({ password })
    if (error) { setMessage(error.message); setIsError(true) }
    else { setDone(true); setMessage('Password updated. You can now log in.') }
  }

  return (
    <div className="page-wrap" style={{ paddingTop: 60 }}>
      <div className="form-card">
        <h2>Set a new password</h2>
        {!done ? (
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>New password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <button type="submit" style={{ width: '100%' }}>Update password</button>
          </form>
        ) : null}
        {message && <p className={`status-msg ${isError ? 'error' : ''}`}>{message}</p>}
      </div>
    </div>
  )
}
