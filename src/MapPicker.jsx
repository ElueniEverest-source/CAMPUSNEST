import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import 'leaflet/dist/leaflet.css'

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow
})

const AREA_CENTERS = {
  abraka: [5.7743, 6.1074],
  ozoro: [5.5925, 6.2762],
  fupre: [5.5314, 5.7930],
  pti: [5.5425, 5.7931]
}

function ClickHandler({ onPick }) {
  useMapEvents({ click(e) { onPick([e.latlng.lat, e.latlng.lng]) } })
  return null
}

export default function MapPicker({ area, position, onChange, readOnly = false }) {
  const center = position || AREA_CENTERS[area] || AREA_CENTERS.abraka

  return (
    <div style={{ height: 220, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)' }}>
      <MapContainer center={center} zoom={14} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' maxZoom={19} />
        {!readOnly && <ClickHandler onPick={onChange} />}
        {position && <Marker position={position} />}
      </MapContainer>
    </div>
  )
}
