import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, MessageCircle, ShieldCheck, LogOut, ChevronRight, Settings } from 'lucide-react'
import { supabase } from './lib/supabaseClient'

export default function Profile() {
  const [profile, setProfile] = useState(null)
  const [avatarUrl, setAvatarUrl] = useState(null)
  const [editing, setEditing] = useState(false)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [avatarFile, setAvatarFile] = useState(null)
  const [status, setStatus] = useState('Loading...')
  const navigate = useNavigate()

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setStatus('Not logged in'); return }
    const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (error) { setStatus(error.message); return }
    setProfile(data)
    setFullName(data.full_name || '')
    setPhone(data.phone || '')
    setStatus('')

    if (data.avatar_url) {
      const { data: signed, error: signError } = await supabase.storage
        .from('avatars')
        .createSignedUrl(data.avatar_url, 3600)
      if (!signError) setAvatarUrl(signed.signedUrl)
    }
  }

  useEffect(() => { load() }, [])

  async function handleSave(e) {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    let avatarPath = profile?.avatar_url
    if (avatarFile) {
      if (avatarFile.size > 2 * 1024 * 1024) { setStatus('Avatar must be under 2MB'); return }
      avatarPath = `${user.id}/${avatarFile.name}`
      const { error: uploadError } = await supabase.storage.from('avatars').upload(avatarPath, avatarFile, { upsert: true })
      if (uploadError) { setStatus(uploadError.message); return }
    }

    const { error } = await supabase.from('profiles').update({ full_name: fullName, phone, avatar_url: avatarPath }).eq('id', user.id)
    if (error) { setStatus(error.message); return }
    setEditing(false)
    load()
  }

  if (!profile) return <div className="page-wrap">{status}</div>

  const initials = (profile.full_name || profile.email || '?').slice(0, 2).toUpperCase()

  return (
    <div className="page-wrap" style={{ maxWidth: 480 }}>
      <div className="profile-header">
        {avatarUrl ? (
          <img src={avatarUrl} alt="Avatar" className="profile-avatar" />
        ) : (
          <div className="profile-avatar">{initials}</div>
        )}
        <div>
          <strong style={{ fontSize: 16 }}>{profile.full_name || 'Unnamed'}</strong>
          <p style={{ margin: '2px 0 0', color: 'var(--text-muted)', fontSize: 13, textTransform: 'capitalize' }}>{profile.role}</p>
        </div>
      </div>

      {!editing ? (
        <>
          <div className="menu-list" style={{ marginBottom: 16 }}>
            <div className="menu-row" onClick={() => navigate('/favorites')}>
              <div className="icon-wrap"><Heart size={17} /></div>
              <span className="label">Favorites</span>
              <ChevronRight size={16} className="chevron" />
            </div>
            <div className="menu-row" onClick={() => navigate('/messages')}>
              <div className="icon-wrap"><MessageCircle size={17} /></div>
              <span className="label">Messages</span>
              <ChevronRight size={16} className="chevron" />
            </div>
            {profile.role === 'admin' && (
              <div className="menu-row" onClick={() => navigate('/admin')}>
                <div className="icon-wrap"><ShieldCheck size={17} /></div>
                <span className="label">Admin Dashboard</span>
                <ChevronRight size={16} className="chevron" />
              </div>
            )}
            <div className="menu-row" onClick={() => setEditing(true)}>
              <div className="icon-wrap"><Settings size={17} /></div>
              <span className="label">Edit Profile</span>
              <ChevronRight size={16} className="chevron" />
            </div>
          </div>

          <div className="menu-list">
            <div className="menu-row" onClick={() => supabase.auth.signOut()} style={{ color: '#dc2626' }}>
              <div className="icon-wrap" style={{ background: '#fee2e2', color: '#dc2626' }}><LogOut size={17} /></div>
              <span className="label" style={{ color: '#dc2626' }}>Log Out</span>
            </div>
          </div>
        </>
      ) : (
        <div className="form-card">
          <h2>Edit profile</h2>
          <form onSubmit={handleSave}>
            <div className="field"><label>Full name</label><input value={fullName} onChange={e => setFullName(e.target.value)} /></div>
            <div className="field"><label>Phone</label><input value={phone} onChange={e => setPhone(e.target.value)} /></div>
            <div className="field"><label>Avatar</label><input type="file" accept="image/*" onChange={e => setAvatarFile(e.target.files[0])} /></div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" style={{ flex: 1 }}>Save</button>
              <button type="button" className="btn-outline" style={{ flex: 1 }} onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </form>
          {status && <p className="status-msg">{status}</p>}
        </div>
      )}
    </div>
  )
}
