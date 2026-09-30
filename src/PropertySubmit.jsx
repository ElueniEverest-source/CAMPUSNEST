import { useState } from 'react'
import { supabase } from './lib/supabaseClient'
import MapPicker from './MapPicker'

const AREAS = [
  { value: 'abraka', label: 'Abraka' },
  { value: 'ozoro', label: 'Ozoro' },
  { value: 'fupre', label: 'FUPRE' },
  { value: 'pti', label: 'PTI' }
]

const PROPERTY_TYPES = [
  { value: 'one_room', label: 'One Room' },
  { value: 'two_bedroom', label: 'Two Bedroom' },
  { value: 'self_contain', label: 'Self Contain' },
  { value: 'room_and_parlour', label: 'Room and Parlour' },
  { value: 'bedsitter', label: 'Bedsitter' },
  { value: 'shared', label: 'Shared Room' },
  { value: 'shop', label: 'Shop' },
  { value: 'other', label: 'Other' }
]

const AMENITIES = [
  { value: 'wifi', label: 'WiFi' },
  { value: 'electricity', label: 'Electricity' },
  { value: 'parking', label: 'Parking' },
  { value: 'security', label: 'Security' },
  { value: 'water', label: 'Water' },
  { value: 'ac', label: 'AC' }
]

export default function PropertySubmit() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [propertyType, setPropertyType] = useState('one_room')
  const [area, setArea] = useState('abraka')
  const [price, setPrice] = useState('')
  const [address, setAddress] = useState('')
  const [amenities, setAmenities] = useState([])
  const [position, setPosition] = useState(null)
  const [photoFile, setPhotoFile] = useState(null)
  const [videoFile, setVideoFile] = useState(null)
  const [status, setStatus] = useState('')
  const [isError, setIsError] = useState(false)

  function toggleAmenity(value) {
    setAmenities(prev => prev.includes(value) ? prev.filter(a => a !== value) : [...prev, value])
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setIsError(false)
    setStatus('Getting current user...')

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) { setStatus('Not logged in'); setIsError(true); return }

    setStatus('Submitting property...')
    const { data: property, error: insertError } = await supabase
      .from('properties')
      .insert({
        owner_id: user.id, title, description, property_type: propertyType, area,
        price: parseFloat(price), address, amenities,
        latitude: position ? position[0] : null,
        longitude: position ? position[1] : null
      })
      .select().single()

    if (insertError) { setStatus(insertError.message); setIsError(true); return }
    const propertyId = property.id

    if (photoFile) {
      if (photoFile.size > 10 * 1024 * 1024) { setStatus('Photo must be under 10MB'); setIsError(true); return }
      const photoPath = `${user.id}/${propertyId}/${photoFile.name}`
      const { error: e1 } = await supabase.storage.from('photos').upload(photoPath, photoFile)
      if (e1) { setStatus(e1.message); setIsError(true); return }
      const { error: e2 } = await supabase.from('property_images').insert({ property_id: propertyId, storage_path: photoPath, is_cover: true })
      if (e2) { setStatus(e2.message); setIsError(true); return }
    }

    if (videoFile) {
      if (videoFile.size > 100 * 1024 * 1024) { setStatus('Video must be under 100MB'); setIsError(true); return }
      const videoPath = `${user.id}/${propertyId}/${videoFile.name}`
      const { error: e3 } = await supabase.storage.from('videos').upload(videoPath, videoFile)
      if (e3) { setStatus(e3.message); setIsError(true); return }
      const { error: e4 } = await supabase.from('property_videos').insert({ property_id: propertyId, storage_path: videoPath })
      if (e4) { setStatus(e4.message); setIsError(true); return }
    }

    setStatus('Submitted. Pending admin review.')
    setTitle(''); setDescription(''); setPrice(''); setAddress(''); setPhotoFile(null); setVideoFile(null); setPosition(null); setAmenities([])
  }

  return (
    <div className="page-wrap">
      <div className="form-card">
        <h2>Submit a property</h2>
        <p className="sub">List a room, shop or space for verification.</p>
        <form onSubmit={handleSubmit}>
          <div className="field"><label>Title</label><input value={title} onChange={e => setTitle(e.target.value)} placeholder="Self-contain near DELSU gate" /></div>
          <div className="field"><label>Description</label><textarea rows={4} value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the property" /></div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div className="field" style={{ flex: 1 }}><label>Type</label>
              <select value={propertyType} onChange={e => setPropertyType(e.target.value)}>
                {PROPERTY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="field" style={{ flex: 1 }}><label>Location</label>
              <select value={area} onChange={e => { setArea(e.target.value); setPosition(null) }}>
                {AREAS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div className="field" style={{ flex: 1 }}><label>Price (₦/year)</label><input type="number" value={price} onChange={e => setPrice(e.target.value)} /></div>
            <div className="field" style={{ flex: 1 }}><label>Address</label><input value={address} onChange={e => setAddress(e.target.value)} /></div>
          </div>
          <div className="field">
            <label>Amenities</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {AMENITIES.map(a => (
                <button
                  type="button"
                  key={a.value}
                  className={`pill ${amenities.includes(a.value) ? 'active' : ''}`}
                  onClick={() => toggleAmenity(a.value)}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>
          <div className="field">
            <label>Pin exact location on map (optional)</label>
            <MapPicker area={area} position={position} onChange={setPosition} />
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
              Tap on the map to drop a pin at the property's exact location.
            </p>
          </div>
          <div className="field"><label>Photo</label><input type="file" accept="image/*" onChange={e => setPhotoFile(e.target.files[0])} /></div>
          <div className="field"><label>Video (optional)</label><input type="file" accept="video/*" onChange={e => setVideoFile(e.target.files[0])} /></div>
          <button type="submit" style={{ width: '100%' }}>Submit Property</button>
        </form>
        {status && <p className={`status-msg ${isError ? 'error' : ''}`}>{status}</p>}
      </div>
    </div>
  )
}
