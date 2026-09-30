import { useState, useEffect } from 'react'
import { supabase } from './lib/supabaseClient'
import Hero from './Hero'
import PropertyCard from './PropertyCard'

export default function Browse() {
  const [properties, setProperties] = useState([])
  const [status, setStatus] = useState('Loading...')

  async function fetchProperties({ area = '', propertyType = '', maxPrice = '' } = {}) {
    setStatus('Loading...')
    let query = supabase
      .from('properties')
      .select('*, property_images(storage_path, is_cover), property_videos(storage_path)')
      .eq('status', 'approved').eq('is_rented', false)

    if (area) query = query.eq('area', area)
    if (propertyType) query = query.eq('property_type', propertyType)
    if (maxPrice) query = query.lte('price', parseFloat(maxPrice))

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      setStatus('Error: ' + error.message)
      setProperties([])
      return
    }

    setProperties(data)
    setStatus(data.length === 0 ? 'No properties found.' : '')
  }

  useEffect(() => { fetchProperties() }, [])

  return (
    <div>
      <Hero onSearch={fetchProperties} />

      <div style={{ padding: '32px 24px 40px' }}>
        <h2 style={{ fontSize: 22, margin: '0 0 4px' }}>Featured Properties</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: '0 0 20px' }}>Top picks from across Delta State</p>

        <p style={{ color: 'var(--text-muted)' }}>{status}</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 18 }}>
          {properties.map(p => <PropertyCard key={p.id} property={p} />)}
        </div>
      </div>
    </div>
  )
}
