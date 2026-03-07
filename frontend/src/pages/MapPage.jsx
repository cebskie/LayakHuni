import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { Link } from 'react-router-dom'
import { MapPin, Filter, X } from 'lucide-react'
import api from '../utils/api'
import { formatRupiah } from '../utils/format'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

const createColoredIcon = (status) => {
  const colors = { Available: '#1a3a6b', Reserved: '#c49a35', Sold: '#9ca3af' }
  const color = colors[status] || '#1a3a6b'
  return L.divIcon({
    html: `<div style="
      background:${color};width:12px;height:12px;border-radius:50%;
      border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);
    "></div>`,
    className: '',
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  })
}

export default function MapPage() {
  const [pins, setPins] = useState([])
  const [loading, setLoading] = useState(true)
  const [kota, setKota] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const params = kota ? { kabupatenkota: kota } : {}
        const res = await api.get('/properties/map-pins', { params })
        setPins(res.data || [])
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [kota])

  const center = [-6.2088, 106.8456] // Jakarta

  return (
    <div className="flex flex-col h-[calc(100vh-130px)]">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between gap-4 z-10">
        <div className="flex items-center gap-2">
          <MapPin size={18} className="text-[#1a3a6b]" />
          <h1 className="font-display font-bold text-[#1a3a6b]">Peta Properti Indonesia</h1>
          {!loading && (
            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
              {pins.length} listing
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-3 text-xs text-gray-600">
            {[
              { color: '#1a3a6b', label: 'Tersedia' },
              { color: '#c49a35', label: 'Dipesan' },
              { color: '#9ca3af', label: 'Terjual' },
            ].map(({ color, label }) => (
              <span key={label} className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full border-2 border-white shadow" style={{ background: color }} />
                {label}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <select
              value={kota}
              onChange={e => setKota(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#1a3a6b]"
            >
              <option value="">Semua Kota</option>
              {['Jakarta Selatan', 'Jakarta Pusat', 'Kota Bandung', 'Kota Surabaya',
                'Kabupaten Sleman', 'Kota Medan', 'Kabupaten Gianyar', 'Kota Makassar',
                'Kota Semarang', 'Kota Malang', 'Kota Denpasar'].map(k => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
            {kota && (
              <button onClick={() => setKota('')} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        {loading && (
          <div className="absolute inset-0 bg-white/60 z-20 flex items-center justify-center">
            <div className="w-10 h-10 border-3 border-[#1a3a6b]/20 border-t-[#1a3a6b] rounded-full animate-spin" />
          </div>
        )}
        <MapContainer
          center={center}
          zoom={5}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
          />
          {pins.map(pin => (
            pin.lat && pin.lng && (
              <Marker
                key={pin.prop_id}
                position={[pin.lat, pin.lng]}
                icon={createColoredIcon(pin.sales_status)}
              >
                <Popup>
                  <div className="w-52">
                    <img
                      src={pin.cover_photo || `https://picsum.photos/seed/${pin.prop_id}/200/120`}
                      alt=""
                      className="w-full h-24 object-cover rounded-lg mb-2"
                      onError={e => { e.target.src = `https://picsum.photos/seed/${pin.prop_id}/200/120` }}
                    />
                    <h4 className="font-semibold text-[#1a3a6b] text-sm mb-1 line-clamp-2">{pin.property_name}</h4>
                    <p className="text-[#c49a35] font-bold text-base mb-1">{formatRupiah(pin.price)}</p>
                    {pin.kabupatenkota && (
                      <p className="text-xs text-gray-500 flex items-center gap-1 mb-2">
                        <MapPin size={10} /> {pin.kabupatenkota}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                        ${pin.sales_status === 'Available' ? 'bg-blue-100 text-blue-700'
                        : pin.sales_status === 'Reserved' ? 'bg-amber-100 text-amber-700'
                        : 'bg-gray-100 text-gray-600'}`}>
                        {pin.sales_status}
                      </span>
                      <Link
                        to={`/properties/${pin.prop_id}`}
                        className="text-xs text-[#1a3a6b] font-semibold hover:underline"
                      >
                        Lihat Detail →
                      </Link>
                    </div>
                  </div>
                </Popup>
              </Marker>
            )
          ))}
        </MapContainer>
      </div>
    </div>
  )
}
