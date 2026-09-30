import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BadgeCheck, MapPin, Wifi, Zap, ParkingCircle, ShieldCheck, Droplet, Snowflake, MessageCircle, X } from 'lucide-react'
import { FavoriteButton } from './Favorites'
import { startConversation } from './Messaging'
import { supabase } from './lib/supabaseClient'

const AMENITY_ICONS = { wifi: Wifi, electricity: Zap, parking: ParkingCircle, security: ShieldCheck, water: Droplet, ac: Snowflake }
const AREA_LABELS = { abraka: 'Abraka', ozoro: 'Ozoro', fupre: 'FUPRE', pti: 'PTI' }
const TYPE_LABELS = { one_room: 'One Room', two_bedroom: 'Two Bedroom', self_contain: 'Self Contain', room_and_parlour: 'Room and Parlour', bedsitter: 'Bedsitter', shared: 'Shared Room', shop: 'Shop', other: 'Other' }

export default function PropertyCard({ property }) {
  const [imageUrl, setImageUrl] = useState(null)
  const [videoUrl, setVideoUrl] = useState(null)
  const [currentUserId, setCurrentUserId] = useState(null)
  const [messaging, setMessaging] = useState(false)
  const [showFull, setShowFull] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    async function loadMedia() {
      const cover = property.property_images?.find(i => i.is_cover) || property.property_images?.[0]
      if (cover) {
        const { data, error } = await supabase.storage.from('photos').createSignedUrl(cover.storage_path, 3600)
        if (!error) setImageUrl(data.signedUrl)
      }

      const video = property.property_videos?.[0]
      if (video) {
        const { data, error } = await supabase.storage.from('videos').createSignedUrl(video.storage_path, 3600)
        if (!error) setVideoUrl(data.signedUrl)
      }
    }
    loadMedia()

    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id || null))
  }, [property])

  async function handleMessage() {
    setMessaging(true)
    try {
      const conversationId = await startConversation(property.id, property.owner_id)
      navigate('/messages', { state: { conversationId } })
    } catch (err) {
      alert(err.message)
    }
    setMessaging(false)
  }

  const canMessage = property.status === 'approved' && currentUserId && currentUserId !== property.owner_id

  return (
    <div className="card">
      <div style={{ position: 'relative', height: 160, background: 'var(--bg-elevated)' }}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={property.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'zoom-in' }}
            onClick={() => setShowFull(true)}
          />
        ) : videoUrl ? (
          <video src={videoUrl} controls style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
            No photo yet
          </div>
        )}
        <div style={{ position: 'absolute', top: 10, right: 10 }}>
          <FavoriteButton propertyId={property.id} />
        </div>
        {property.status === 'approved' && (
          <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', alignItems: 'center', gap: 4, background: '#fff', padding: '3px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600, color: 'var(--success)' }}>
            <BadgeCheck size={13} /> Verified
          </div>
        )}
      </div>

      {imageUrl && videoUrl && (
        <video src={videoUrl} controls style={{ width: '100%', display: 'block' }} />
      )}

      <div style={{ padding: 14 }}>
        <strong style={{ fontSize: 16 }}>{property.title}</strong>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', fontSize: 13, margin: '4px 0' }}>
          <MapPin size={13} /> {AREA_LABELS[property.area] || property.area}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '8px 0' }}>
          <span style={{ fontWeight: 700, color: 'var(--accent)' }}>₦{Number(property.price).toLocaleString()}</span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{TYPE_LABELS[property.property_type] || property.property_type}</span>
        </div>
        {property.amenities?.length > 0 && (
          <div style={{ display: 'flex', gap: 10, marginTop: 8, borderTop: '1px solid var(--border)', paddingTop: 8 }}>
            {property.amenities.slice(0, 5).map(a => {
              const Icon = AMENITY_ICONS[a.toLowerCase()]
              return Icon ? <Icon key={a} size={16} color="var(--text-muted)" /> : null
            })}
          </div>
        )}
        {canMessage && (
          <button
            className="btn-outline"
            style={{ width: '100%', marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13 }}
            onClick={handleMessage}
            disabled={messaging}
          >
            <MessageCircle size={14} /> {messaging ? 'Starting...' : 'Message Agent'}
          </button>
        )}
      </div>

      {showFull && imageUrl && (
        <div
          onClick={() => setShowFull(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
          }}
        >
          <button
            onClick={() => setShowFull(false)}
            style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={20} color="#fff" />
          </button>
          <img src={imageUrl} alt={property.title} style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: 8 }} />
        </div>
      )}
    </div>
  )
}
