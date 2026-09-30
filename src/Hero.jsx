import { useState } from 'react'
import { Search, ShieldCheck, Users, MessageCircle, Lock } from 'lucide-react'

const AREAS = [
  { value: '', label: 'All campuses' },
  { value: 'abraka', label: 'Abraka' },
  { value: 'ozoro', label: 'Ozoro' },
  { value: 'fupre', label: 'FUPRE' },
  { value: 'pti', label: 'PTI' }
]

const PROPERTY_TYPES = [
  { value: '', label: 'Any' },
  { value: 'one_room', label: 'One Room' },
  { value: 'two_bedroom', label: 'Two Bedroom' },
  { value: 'self_contain', label: 'Self Contain' },
  { value: 'room_and_parlour', label: 'Room and Parlour' },
  { value: 'bedsitter', label: 'Bedsitter' },
  { value: 'shared', label: 'Shared Room' },
  { value: 'shop', label: 'Shop' },
  { value: 'other', label: 'Other' }
]

export default function Hero({ onSearch }) {
  const [area, setArea] = useState('')
  const [propertyType, setPropertyType] = useState('')
  const [maxPrice, setMaxPrice] = useState('')

  function handleSearch() {
    onSearch({ area, propertyType, maxPrice })
  }

  return (
    <div>
      <div style={{
        position: 'relative',
        padding: '56px 24px 90px',
        color: '#fff',
        backgroundImage: 'linear-gradient(135deg, rgba(15,42,86,0.85) 0%, rgba(37,99,235,0.75) 100%), url(/hero-campus.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}>
        <h1 style={{ fontSize: 'clamp(28px, 6vw, 42px)', margin: '0 0 10px', lineHeight: 1.15 }}>
          Your Campus.<br />
          <span style={{ color: '#a9c6ff' }}>Your Home.</span>
        </h1>
        <p style={{ opacity: 0.9, maxWidth: 46 + 'ch', margin: '0 0 28px', fontSize: 15 }}>
          Trusted, verified and affordable student accommodation across Delta State.
        </p>
      </div>

      <div style={{
        margin: '-56px 16px 0',
        background: '#fff',
        borderRadius: 14,
        padding: 16,
        boxShadow: '0 12px 30px rgba(15,42,86,0.15)',
        display: 'flex',
        flexWrap: 'wrap',
        gap: 10,
        position: 'relative'
      }}>
        <select value={area} onChange={e => setArea(e.target.value)} style={{ flex: '1 1 140px' }}>
          {AREAS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
        </select>
        <select value={propertyType} onChange={e => setPropertyType(e.target.value)} style={{ flex: '1 1 140px' }}>
          {PROPERTY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <input placeholder="Max price" type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} style={{ flex: '1 1 120px' }} />
        <button onClick={handleSearch} style={{ display: 'flex', alignItems: 'center', gap: 6, flex: '1 1 120px', justifyContent: 'center' }}>
          <Search size={16} /> Search
        </button>
      </div>

      <div className="trust-row" style={{ marginTop: 24 }}>
        <div className="trust-item"><ShieldCheck size={18} color="var(--success)" /><div><strong>Verified Listings</strong>No scams, no fake posts</div></div>
        <div className="trust-item"><Users size={18} color="var(--accent)" /><div><strong>Trusted by Students</strong>Growing across Delta State</div></div>
        <div className="trust-item"><MessageCircle size={18} color="var(--accent)" /><div><strong>Direct Contact</strong>Message or call landlords</div></div>
        <div className="trust-item"><Lock size={18} color="var(--accent)" /><div><strong>Secure Platform</strong>Your safety matters</div></div>
      </div>
    </div>
  )
}
