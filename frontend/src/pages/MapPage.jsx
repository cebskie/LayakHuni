import { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { Link } from 'react-router-dom'
import { MapPin, Navigation, X, Sliders, Loader } from 'lucide-react'
import api from '../utils/api'
import { formatRupiah } from '../utils/format'
import toast from 'react-hot-toast'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

const createColoredIcon = (status, isNearby = false) => {
  const colors = { Available: '#1a3a6b', Reserved: '#c49a35', Sold: '#9ca3af' }
  const color = colors[status] || '#1a3a6b'
  const size = isNearby ? 16 : 12
  return L.divIcon({
    html: `<div style="
      background:${color};width:${size}px;height:${size}px;border-radius:50%;
      border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4);
      ${isNearby ? 'outline: 2px solid ' + color + '; outline-offset: 2px;' : ''}
    "></div>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

const createUserIcon = () => L.divIcon({
  html: `<div style="
    background:#ef4444;width:16px;height:16px;border-radius:50%;
    border:3px solid white;box-shadow:0 2px 8px rgba(239,68,68,0.5);
  "></div>`,
  className: '',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
})

// Component to fly map to new center
function FlyTo({ center, zoom }) {
  const map = useMap()
  useEffect(() => {
    if (center) map.flyTo(center, zoom, { duration: 1.2 })
  }, [center, zoom, map])
  return null
}

export default function MapPage() {
  const [pins, setPins] = useState([])
  const [nearbyPins, setNearbyPins] = useState([])
  const [loading, setLoading] = useState(true)
  const [nearbyLoading, setNearbyLoading] = useState(false)
  const [kota, setKota] = useState('')
  const [mode, setMode] = useState('all')         // 'all' | 'nearby'
  const [userLocation, setUserLocation] = useState(null)
  const [radius, setRadius] = useState(5)           // km
  const [flyTarget, setFlyTarget] = useState(null)
  const defaultCenter = [-6.2088, 106.8456]

  // Load all pins
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
    if (mode === 'all') load()
  }, [kota, mode])

  // Near me
  const handleNearMe = () => {
    if (!navigator.geolocation) {
      toast.error('Browser Anda tidak mendukung geolokasi')
      return
    }
    setNearbyLoading(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        setUserLocation([lat, lng])
        setFlyTarget({ center: [lat, lng], zoom: 13 })
        setMode('nearby')
        try {
          const res = await api.get('/properties/nearby', {
            params: { lat, lng, radius_km: radius },
          })
          setNearbyPins(res.data || [])
          if (res.data.length === 0) {
            toast('Tidak ada properti dalam radius ' + radius + ' km', { icon: 'ℹ️' })
          } else {
            toast.success(`${res.data.length} properti ditemukan dalam ${radius} km`)
          }
        } catch (e) {
          toast.error('Gagal memuat properti terdekat')
        } finally {
          setNearbyLoading(false)
        }
      },
      (err) => {
        setNearbyLoading(false)
        toast.error('Gagal mendapatkan lokasi: ' + err.message)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const handleClearNearby = () => {
    setMode('all')
    setUserLocation(null)
    setNearbyPins([])
    setFlyTarget({ center: defaultCenter, zoom: 6 })
  }

  const activePins = mode === 'nearby' ? nearbyPins : pins

  return (
    <div className="flex flex-col h-[calc(100vh-130px)]">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex flex-wrap items-center justify-between gap-3 z-10">
        <div className="flex items-center gap-2">
          <MapPin size={18} className="text-[#1a3a6b]" />
          <h1 className="font-display font-bold text-[#1a3a6b]">Peta Properti</h1>
          {!loading && (
            <span className="text-xs bg-[#1a3a6b]/10 text-[#1a3a6b] px-2 py-0.5 rounded-full font-medium">
              {activePins.length} properti
            </span>
          )}
          {mode === 'nearby' && (
            <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
              <Navigation size={10} /> Terdekat · {radius} km
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Kota filter — only in all mode */}
          {mode === 'all' && (
            <div className="relative">
              <input
                type="text"
                placeholder="Filter kota..."
                value={kota}
                onChange={e => setKota(e.target.value)}
                className="pl-3 pr-7 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#1a3a6b] w-36"
              />
              {kota && (
                <button onClick={() => setKota('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X size={12} />
                </button>
              )}
            </div>
          )}

          {/* Radius selector */}
          {mode !== 'nearby' && (
            <div className="flex items-center gap-1.5">
              <Sliders size={13} className="text-gray-400" />
              <select
                value={radius}
                onChange={e => setRadius(Number(e.target.value))}
                className="border border-gray-200 rounded-lg text-xs py-1.5 px-2 focus:outline-none focus:border-[#1a3a6b]"
              >
                {[1, 2, 5, 10, 20, 50].map(r => (
                  <option key={r} value={r}>{r} km</option>
                ))}
              </select>
            </div>
          )}

          {/* Near me button */}
          {mode === 'all' ? (
            <button
              onClick={handleNearMe}
              disabled={nearbyLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a3a6b] text-white rounded-lg text-xs font-semibold hover:bg-[#0f2444] transition-colors disabled:opacity-60"
            >
              {nearbyLoading
                ? <><Loader size={12} className="animate-spin" /> Mencari...</>
                : <><Navigation size={12} /> Terdekat</>
              }
            </button>
          ) : (
            <button
              onClick={handleClearNearby}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-200 transition-colors"
            >
              <X size={12} /> Kembali ke Semua
            </button>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white border-b border-gray-100 px-6 py-2 flex items-center gap-4 text-xs text-gray-500">
        {[
          { color: '#1a3a6b', label: 'Tersedia' },
          { color: '#c49a35', label: 'Reserved' },
          { color: '#9ca3af', label: 'Terjual' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
            {label}
          </div>
        ))}
        {mode === 'nearby' && (
          <div className="flex items-center gap-1.5 ml-2 border-l border-gray-200 pl-4">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
            Lokasi Anda
          </div>
        )}
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        {(loading || nearbyLoading) && (
          <div className="absolute inset-0 bg-white/60 z-[1000] flex items-center justify-center">
            <div className="flex items-center gap-2 bg-white shadow-lg rounded-xl px-5 py-3">
              <Loader size={18} className="animate-spin text-[#1a3a6b]" />
              <span className="text-sm font-medium text-[#1a3a6b]">
                {nearbyLoading ? 'Mencari properti terdekat...' : 'Memuat peta...'}
              </span>
            </div>
          </div>
        )}

        <MapContainer
          center={defaultCenter}
          zoom={6}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {flyTarget && <FlyTo center={flyTarget.center} zoom={flyTarget.zoom} />}

          {/* User location marker + radius circle */}
          {userLocation && (
            <>
              <Marker position={userLocation} icon={createUserIcon()}>
                <Popup>
                  <div className="text-center text-xs font-semibold text-red-600">
                    📍 Lokasi Anda
                  </div>
                </Popup>
              </Marker>
              <Circle
                center={userLocation}
                radius={radius * 1000}
                pathOptions={{
                  color: '#1a3a6b',
                  fillColor: '#1a3a6b',
                  fillOpacity: 0.05,
                  weight: 1.5,
                  dashArray: '6 4',
                }}
              />
            </>
          )}

          {/* Property markers */}
          {activePins.map(pin => (
            <Marker
              key={pin.prop_id}
              position={[pin.lat, pin.lng]}
              icon={createColoredIcon(pin.sales_status, mode === 'nearby')}
            >
              <Popup maxWidth={220}>
                <div className="text-xs">
                  {pin.cover_photo && (
                    <img
                      src={pin.cover_photo}
                      alt=""
                      className="w-full h-28 object-cover rounded-md mb-2"
                      onError={e => e.target.style.display = 'none'}
                    />
                  )}
                  <p className="font-semibold text-[#1a3a6b] mb-1 leading-tight">{pin.property_name}</p>
                  <p className="font-bold text-[#c49a35] mb-1">{formatRupiah(pin.price)}</p>
                  {pin.kabupatenkota && (
                    <p className="text-gray-500 mb-1">📍 {pin.kabupatenkota}</p>
                  )}
                  {pin.distance_km != null && (
                    <p className="text-emerald-600 font-semibold mb-1">🚶 {pin.distance_km} km dari Anda</p>
                  )}
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold mb-2
                    ${pin.sales_status === 'Available' ? 'bg-emerald-100 text-emerald-700'
                      : pin.sales_status === 'Reserved' ? 'bg-amber-100 text-amber-700'
                      : 'bg-gray-100 text-gray-600'}`}>
                    {pin.sales_status}
                  </span>
                  <br />
                  <Link
                    to={`/properties/${pin.prop_id}`}
                    className="text-[#1a3a6b] font-semibold hover:underline"
                  >
                    Lihat Detail →
                  </Link>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  )
}
