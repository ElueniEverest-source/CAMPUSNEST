import { useState, useEffect } from 'react'
import { supabase } from './lib/supabaseClient'
import PropertyCard from './PropertyCard'

export function FavoriteButton({ propertyId }) {
  const [favorited, setFavorited] = useState(false)

  async function toggle(e) {
    e.stopPropagation()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    if (favorited) {
      await supabase.from('favorites').delete().eq('user_id', user.id).eq('property_id', propertyId)
      setFavorited(false)
    } else {
      await supabase.from('favorites').insert({ user_id: user.id, property_id: propertyId })
      setFavorited(true)
    }
  }

  return (
    <button
      onClick={toggle}
      style={{
        background: '#fff', border: 'none', borderRadius: '50%', width: 32, height: 32,
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: favorited ? '#dc2626' : '#94a3b8',
        boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
      }}
    >
      ♥
    </button>
  )
}

export function FavoritesList() {
  const [favorites, setFavorites] = useState([])
  const [status, setStatus] = useState('Loading...')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setStatus('Not logged in'); return }

      const { data, error } = await supabase
        .from('favorites')
        .select('property_id, properties(*, property_images(storage_path, is_cover))')
        .eq('user_id', user.id)

      if (error) { setStatus(error.message); return }
      setFavorites(data)
      setStatus(data.length === 0 ? '' : '')
    }
    load()
  }, [])

  return (
    <div className="page-wrap" style={{ maxWidth: 900 }}>
      <h2 style={{ fontSize: 22, margin: '0 0 4px' }}>My Favorites</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: '0 0 20px' }}>Properties you've saved</p>

      {favorites.length === 0 ? (
        <div className="empty-state">No favorites yet. Browse properties and tap the heart to save them.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 18 }}>
          {favorites.map(f => f.properties && <PropertyCard key={f.property_id} property={f.properties} />)}
        </div>
      )}
    </div>
  )
}
