import { useState, useEffect } from 'react'
import { supabase } from './lib/supabaseClient'

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [status, setStatus] = useState('Loading...')

  async function load() {
    const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    if (error) { setStatus(error.message); return }
    setUsers(data)
    setStatus('')
  }

  useEffect(() => { load() }, [])

  async function changeRole(id, newRole) {
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', id)
    if (error) { alert(error.message); return }
    load()
  }

  if (users.length === 0) return <div className="empty-state">{status || 'No users found.'}</div>

  return (
    <div>
      <div className="menu-list">
        {users.map(u => (
          <div key={u.id} className="convo-row" style={{ cursor: 'default' }}>
            <div className="convo-avatar">{(u.full_name || u.email || '?').slice(0, 2).toUpperCase()}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{u.full_name || 'Unnamed'}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{u.email}</div>
            </div>
            <select value={u.role} onChange={e => changeRole(u.id, e.target.value)} style={{ fontSize: 13 }}>
              <option value="student">Student</option>
              <option value="agent">Agent</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        ))}
      </div>
    </div>
  )
}
