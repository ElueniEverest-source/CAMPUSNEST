import { MapContainer, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

const DELTA_STATE_CENTER = [5.65, 5.95]

export default function MapView() {
  return (
    <div className="page-wrap" style={{ maxWidth: 900 }}>
      <h2 style={{ fontSize: 22, margin: '0 0 4px' }}>Map</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: '0 0 16px' }}>Explore Delta State</p>

      <div style={{ height: 500, borderRadius: 14, overflow: 'hidden', border: '1px solid var(--border)' }}>
        <MapContainer center={DELTA_STATE_CENTER} zoom={10} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
        </MapContainer>
      </div>
    </div>
  )
}
