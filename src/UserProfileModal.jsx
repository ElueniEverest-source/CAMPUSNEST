import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { supabase } from './lib/supabaseClient'

export default function UserProfileModal({ userId, onClose }) {
  const [profile, setProfile] = useState(null)
  const [avatarUrl, setAvatarUrl] = useState(null)
  const [status, setStatus] = useState('Loading...')

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()
      if (error) { setStatus(error.message); return }
      setProfile(data)
      setStatus('')

      if (data.avatar_url) {
        const { data: signed, error: signError } = await supabase.storage
          .from('avatars')
          .createSignedUrl(data.avatar_url, 3600)
        if (!signError) setAvatarUrl(signed.signedUrl)
      }
    }
    load()
  }, [userId])

  const initials = (profile?.full_name || profile?.email || '?').slice(0, 2).toUpperCase()

  return (
    <div className="profile-modal-overlay" onClick={onClose}>
      <div className="profile-modal" onClick={e => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}><X size={16} /></button>

        {status && <p className="status-msg">{status}</p>}

        {profile && (
          <>
            {avatarUrl ? (
              <img src={avatarUrl} alt={profile.full_name} className="profile-modal-avatar" />
            ) : (
              <div className="profile-modal-avatar">{initials}</div>
            )}
            <h3 style={{ textAlign: 'center', margin: '0 0 4px' }}>{profile.full_name || 'Unnamed'}</h3>
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, textTransform: 'capitalize', margin: '0 0 16px' }}>
              {profile.role}
            </p>

            <div className="profile-modal-row">
              <span className="label">Email</span>
              <span>{profile.email}</span>
            </div>
            <div className="profile-modal-row">
              <span className="label">Phone</span>
              <span>{profile.phone || 'Not provided'}</span>
            </div>
            <div className="profile-modal-row">
              <span className="label">Member since</span>
              <span>{new Date(profile.created_at).toLocaleDateString()}</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
