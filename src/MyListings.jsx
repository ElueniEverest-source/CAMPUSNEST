import { useState, useEffect } from 'react'
import { supabase } from './lib/supabaseClient'

const STATUS_STYLES = {
  pending: { bg: '#fef3c7', color: '#92400e', label: 'Pending Review' },
  approved: { bg: '#d1fae5', color: '#065f46', label: 'Approved' },
  rejected: { bg: '#fee2e2', color: '#991b1b', label: 'Rejected' }
}

function EditForm({ listing, onCancel, onSaved }) {
  const [title, setTitle] = useState(listing.title)
  const [description, setDescription] = useState(listing.description)
  const [price, setPrice] = useState(listing.price)
  const [address, setAddress] = useState(listing.address || '')
  const [status, setStatus] = useState('')

  async function save(e) {
    e.preventDefault()
    const { error } = await supabase.from('properties')
      .update({ title, description, price: parseFloat(price), address })
      .eq('id', listing.id)
    if (error) { setStatus(error.message); return }
    onSaved()
  }

  return (
    <form onSubmit={save} style={{ marginTop: 10 }}>
      <div className="field"><label>Title</label><input value={title} onChange={e => setTitle(e.target.value)} /></div>
      <div className="field"><label>Description</label><textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} /></div>
      <div className="field"><label>Price (₦/year)</label><input type="number" value={price} onChange={e => setPrice(e.target.value)} /></div>
      <div className="field"><label>Address</label><input value={address} onChange={e => setAddress(e.target.value)} /></div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button type="submit" style={{ flex: 1 }}>Save Changes</button>
        <button type="button" className="btn-outline" style={{ flex: 1 }} onClick={onCancel}>Cancel</button>
      </div>
      {status && <p className="status-msg error">{status}</p>}
    </form>
  )
}

export default function MyListings() {
  const [listings, setListings] = useState([])
  const [status, setStatus] = useState('Loading...')
  const [editingId, setEditingId] = useState(null)

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setStatus('Not logged in'); return }
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })
    if (error) { setStatus(error.message); return }
    setListings(data)
    setStatus('')
  }

  useEffect(() => { load() }, [])

  async function toggleRented(id, current) {
    await supabase.from('properties').update({ is_rented: !current }).eq('id', id)
    load()
  }

  async function deleteListing(id) {
    if (!confirm('Delete this listing permanently? This cannot be undone.')) return
    await supabase.from('properties').delete().eq('id', id)
    load()
  }

  if (listings.length === 0) return <div className="page-wrap"><div className="empty-state">{status || "You haven't submitted any properties yet."}</div></div>

  return (
    <div className="page-wrap" style={{ maxWidth: 640 }}>
      <h2 style={{ fontSize: 22, margin: '0 0 4px' }}>My Listings</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: '0 0 20px' }}>Manage what you've submitted</p>

      {listings.map(p => {
        const s = STATUS_STYLES[p.status]
        return (
          <div key={p.id} className="listing-review-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <strong style={{ fontSize: 16 }}>{p.title}</strong>
              <div style={{ display: 'flex', gap: 6 }}>
                {p.is_rented && <span style={{ background: '#e5e7eb', color: '#374151', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999 }}>Rented</span>}
                <span style={{ background: s.bg, color: s.color, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999 }}>{s.label}</span>
              </div>
            </div>
            <p className="meta">{p.area} · {p.property_type.replace(/_/g, ' ')} · ₦{Number(p.price).toLocaleString()}</p>
            {p.status === 'rejected' && p.rejection_reason && (
              <p style={{ fontSize: 13, color: '#991b1b', marginTop: 8, background: '#fef2f2', padding: 10, borderRadius: 8 }}>
                <strong>Reason:</strong> {p.rejection_reason}
              </p>
            )}

            {editingId === p.id ? (
              <EditForm listing={p} onCancel={() => setEditingId(null)} onSaved={() => { setEditingId(null); load() }} />
            ) : (
              <div className="actions">
                <button onClick={() => setEditingId(p.id)} className="btn-outline">Edit</button>
                {p.status === 'approved' && (
                  <button onClick={() => toggleRented(p.id, p.is_rented)} className="btn-outline">
                    {p.is_rented ? 'Mark Available' : 'Mark as Rented'}
                  </button>
                )}
                <button onClick={() => deleteListing(p.id)} className="btn-outline" style={{ borderColor: '#dc2626', color: '#dc2626' }}>Delete</button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
