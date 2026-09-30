import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, X } from 'lucide-react'
import { supabase } from './lib/supabaseClient'
import Profile from './Profile'
import AdminUsers from './AdminUsers'

function PendingListings() {
  const [pending, setPending] = useState([])
  const [status, setStatus] = useState('Loading...')
  const [fullImage, setFullImage] = useState(null)

  async function load() {
    const { data, error } = await supabase
      .from('properties')
      .select('*, profiles!properties_owner_id_fkey(full_name, email), property_images(storage_path, is_cover), property_videos(storage_path)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })

    if (error) { setStatus(error.message); return }

    const withMedia = await Promise.all(data.map(async (p) => {
      const cover = p.property_images?.find(i => i.is_cover) || p.property_images?.[0]
      let imageUrl = null
      if (cover) {
        const { data: signed, error: signError } = await supabase.storage.from('photos').createSignedUrl(cover.storage_path, 3600)
        if (!signError) imageUrl = signed.signedUrl
      }

      const video = p.property_videos?.[0]
      let videoUrl = null
      if (video) {
        const { data: signedV, error: signErrorV } = await supabase.storage.from('videos').createSignedUrl(video.storage_path, 3600)
        if (!signErrorV) videoUrl = signedV.signedUrl
      }

      return { ...p, imageUrl, videoUrl }
    }))

    setPending(withMedia)
    setStatus('')
  }

  useEffect(() => { load() }, [])

  async function approve(id) {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('properties').update({ status: 'approved', reviewed_by: user.id, reviewed_at: new Date().toISOString() }).eq('id', id)
    load()
  }

  async function reject(id) {
    const reason = prompt('Rejection reason:')
    if (reason === null) return
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('properties').update({ status: 'rejected', rejection_reason: reason, reviewed_by: user.id, reviewed_at: new Date().toISOString() }).eq('id', id)
    load()
  }

  if (pending.length === 0) return <div className="empty-state">{status || 'No pending listings. All caught up.'}</div>

  return (
    <div>
      {pending.map(p => (
        <div key={p.id} className="listing-review-card">
          {p.imageUrl && (
            <img
              src={p.imageUrl}
              alt={p.title}
              style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 10, marginBottom: 10, cursor: 'zoom-in' }}
              onClick={() => setFullImage(p.imageUrl)}
            />
          )}
          {p.videoUrl && (
            <video src={p.videoUrl} controls style={{ width: '100%', borderRadius: 10, marginBottom: 10 }} />
          )}
          <strong style={{ fontSize: 16 }}>{p.title}</strong>
          <p className="meta">{p.area} · {p.property_type.replace('_', ' ')} · ₦{Number(p.price).toLocaleString()}</p>
          <p style={{ fontSize: 14 }}>{p.description}</p>
          <p className="meta">Submitted by {p.profiles?.full_name} ({p.profiles?.email})</p>
          <div className="actions">
            <button onClick={() => approve(p.id)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><CheckCircle size={16} /> Approve</button>
            <button onClick={() => reject(p.id)} className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: 6, borderColor: '#dc2626', color: '#dc2626' }}><XCircle size={16} /> Reject</button>
          </div>
        </div>
      ))}

      {fullImage && (
        <div
          onClick={() => setFullImage(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
          }}
        >
          <button
            onClick={() => setFullImage(null)}
            style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={20} color="#fff" />
          </button>
          <img src={fullImage} alt="Full view" style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: 8 }} />
        </div>
      )}
    </div>
  )
}

export default function AdminDashboard() {
  const [tab, setTab] = useState('pending')
  const [isAdmin, setIsAdmin] = useState(null)

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setIsAdmin(false); return }
      const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      setIsAdmin(data?.role === 'admin')
    }
    check()
  }, [])

  if (isAdmin === null) return <div className="page-wrap">Checking access...</div>
  if (isAdmin === false) return <div className="page-wrap"><div className="empty-state">Not authorized. Admin access only.</div></div>

  return (
    <div className="page-wrap" style={{ maxWidth: 640 }}>
      <h2 style={{ fontSize: 22, margin: '0 0 20px' }}>Admin Dashboard</h2>
      <div className="admin-tabs">
        <button className={tab === 'pending' ? 'active' : ''} onClick={() => setTab('pending')}>Pending Listings</button>
        <button className={tab === 'users' ? 'active' : ''} onClick={() => setTab('users')}>Users</button>
        <button className={tab === 'profile' ? 'active' : ''} onClick={() => setTab('profile')}>My Profile</button>
      </div>
      {tab === 'pending' && <PendingListings />}
      {tab === 'users' && <AdminUsers />}
      {tab === 'profile' && <Profile />}
    </div>
  )
}
