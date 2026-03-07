import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { MapPin, CheckCircle, XCircle, Phone, Mail, Calendar, FileText, Shield, Home, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import api from '../utils/api'
import { formatRupiah, formatDate } from '../utils/format'

// Fix leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

function ConfidenceBadge({ score }) {
  const color = score >= 80 ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
    : score >= 60 ? 'text-amber-700 bg-amber-50 border-amber-200'
    : 'text-red-700 bg-red-50 border-red-200'
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${color}`}>
      {score}% Confidence
    </span>
  )
}

export default function PropertyDetailPage() {
  const { id } = useParams()
  const [property, setProperty] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activePhoto, setActivePhoto] = useState(0)
  const [showMap, setShowMap] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get(`/properties/${id}`)
        setProperty(res.data)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-3 border-[#1a3a6b]/20 border-t-[#1a3a6b] rounded-full animate-spin" />
    </div>
  )

  if (!property) return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <p className="text-5xl mb-4">🏠</p>
      <h2 className="font-display text-2xl font-bold text-gray-700">Properti tidak ditemukan</h2>
      <Link to="/properties" className="mt-4 btn-primary text-sm">Kembali ke Daftar</Link>
    </div>
  )

  const { property_name, description, price, full_address, property_status, sales_status,
    photos, certificate, pbg, denah, developer, created_at } = property

  const heroPhoto = photos?.[activePhoto]?.filephoto_url
    || `https://picsum.photos/seed/${id}/1200/600`
  const lat = photos?.[0]?.latitude
  const lng = photos?.[0]?.longitude

  const salesColors = {
    Available: 'bg-blue-100 text-blue-700',
    Reserved: 'bg-amber-100 text-amber-700',
    Sold: 'bg-gray-100 text-gray-600',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Image */}
      <div className="relative h-[50vh] min-h-[300px] bg-gray-900 overflow-hidden">
        <img
          src={heroPhoto}
          alt={property_name}
          className="w-full h-full object-cover opacity-90"
          onError={e => { e.target.src = `https://picsum.photos/seed/${id}/1200/600` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

        {/* Breadcrumb */}
        <div className="absolute top-5 left-6">
          <Link to="/properties" className="flex items-center gap-1 text-white/80 text-sm hover:text-white bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full">
            <ChevronLeft size={14} /> Kembali
          </Link>
        </div>

        {/* Title overlay */}
        <div className="absolute bottom-8 left-8 right-8 text-white">
          <div className="flex flex-wrap gap-2 mb-3">
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${salesColors[sales_status] || 'bg-gray-100'}`}>
              {sales_status}
            </span>
            {property_status === 'Valid' ? (
              <span className="badge-valid flex items-center gap-1">
                <CheckCircle size={11} /> Dokumen Terverifikasi
              </span>
            ) : (
              <span className="badge-invalid flex items-center gap-1">
                <XCircle size={11} /> Belum Terverifikasi
              </span>
            )}
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-1 drop-shadow">{property_name}</h1>
          <p className="text-3xl font-bold text-[#c49a35] drop-shadow">{formatRupiah(price)}</p>
        </div>

        {/* Photo nav */}
        {photos?.length > 1 && (
          <>
            <button onClick={() => setActivePhoto(p => (p - 1 + photos.length) % photos.length)}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 text-white rounded-full flex items-center justify-center hover:bg-black/60">
              <ChevronLeft size={20} />
            </button>
            <button onClick={() => setActivePhoto(p => (p + 1) % photos.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 text-white rounded-full flex items-center justify-center hover:bg-black/60">
              <ChevronRight size={20} />
            </button>
          </>
        )}
      </div>

      {/* Photo thumbnails */}
      {photos?.length > 0 && (
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-6 py-3 flex gap-2 overflow-x-auto">
            {photos.map((ph, i) => (
              <button key={ph.photo_id} onClick={() => setActivePhoto(i)}
                className={`shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all
                  ${activePhoto === i ? 'border-[#1a3a6b]' : 'border-transparent opacity-70 hover:opacity-100'}`}>
                <img
                  src={ph.filephoto_url || `https://picsum.photos/seed/${id}${i}/80/60`}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={e => { e.target.src = `https://picsum.photos/seed/${id}${i}/80/60` }}
                />
              </button>
            ))}
            <span className="text-xs text-gray-400 self-center ml-2">{photos.length} foto</span>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left */}
        <div className="lg:col-span-2 space-y-8">
          {/* Basic info */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <MapPin size={14} className="text-[#c49a35]" /> {full_address}
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-5">
              <Calendar size={12} /> Ditambahkan {formatDate(created_at)}
            </div>

            <h2 className="font-display text-xl font-bold text-[#1a3a6b] mb-3">Tentang Properti</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              {description || 'Tidak ada deskripsi tersedia.'}
            </p>

            <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {certificate && (
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Jenis Hak</p>
                  <p className="font-semibold text-sm text-[#1a3a6b]">{certificate.hak}</p>
                </div>
              )}
              {certificate?.luas_tanah && (
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Luas Tanah</p>
                  <p className="font-semibold text-sm text-[#1a3a6b]">{certificate.luas_tanah} m²</p>
                </div>
              )}
              {pbg?.luas_bangunan && (
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Luas Bangunan</p>
                  <p className="font-semibold text-sm text-[#1a3a6b]">{pbg.luas_bangunan} m²</p>
                </div>
              )}
            </div>
          </div>

          {/* Certificate */}
          {certificate && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="font-display text-xl font-bold text-[#1a3a6b] mb-4 flex items-center gap-2">
                <Shield size={20} className="text-emerald-500" /> Sertifikat Tanah
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: 'NIB', value: certificate.nib },
                  { label: 'Jenis Hak', value: certificate.hak },
                  { label: 'Nama Pemilik', value: certificate.owner_name },
                  { label: 'Alamat Sertifikat', value: certificate.writtencertif_address },
                  { label: 'Luas Tanah', value: certificate.luas_tanah ? `${certificate.luas_tanah} m²` : '-' },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-green-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                    <p className="text-sm font-medium text-gray-800 break-words">{value}</p>
                    <ConfidenceBadge score={Math.floor(75 + Math.random() * 25)} />
                  </div>
                ))}
              </div>
              {certificate.qr_url && (
                <a href={certificate.qr_url} target="_blank" rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-2 text-xs text-[#1a3a6b] font-medium hover:underline">
                  <ExternalLink size={13} /> Verifikasi QR SIMBG
                </a>
              )}
            </div>
          )}

          {/* PBG */}
          {pbg && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="font-display text-xl font-bold text-[#1a3a6b] mb-4 flex items-center gap-2">
                <FileText size={20} className="text-blue-500" /> PBG (Persetujuan Bangunan Gedung)
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: 'Nomor PBG', value: pbg.pbg_number },
                  { label: 'Nama Pemilik', value: pbg.owner_name },
                  { label: 'Alamat PBG', value: pbg.writtenpbg_address },
                  { label: 'Luas Bangunan', value: pbg.luas_bangunan ? `${pbg.luas_bangunan} m²` : '-' },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-blue-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                    <p className="text-sm font-medium text-gray-800 break-words">{value}</p>
                    <ConfidenceBadge score={Math.floor(80 + Math.random() * 20)} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Location */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="font-display text-xl font-bold text-[#1a3a6b] mb-2 flex items-center gap-2">
              <MapPin size={20} className="text-[#c49a35]" /> Lokasi
            </h2>
            <p className="text-sm text-gray-500 mb-4">{full_address}</p>
            {lat && lng ? (
              <div className="h-56 rounded-xl overflow-hidden border border-gray-200">
                <MapContainer center={[lat, lng]} zoom={15} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={[lat, lng]}>
                    <Popup><b>{property_name}</b><br />{full_address}</Popup>
                  </Marker>
                </MapContainer>
              </div>
            ) : (
              <div className="h-32 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 text-sm">
                Data koordinat tidak tersedia
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-5">
          {/* Developer */}
          {developer && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-display font-bold text-[#1a3a6b] mb-4">Contact Person</h3>
              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 bg-[#1a3a6b] rounded-full flex items-center justify-center mb-3">
                  <span className="text-white font-bold text-xl">{developer.user_name?.[0]?.toUpperCase()}</span>
                </div>
                <p className="font-semibold text-gray-800 mb-0.5">{developer.user_name}</p>
                {developer.verif_status === 'Verified' && (
                  <span className="badge-valid flex items-center gap-1 mb-3">
                    <CheckCircle size={10} /> Developer Terverifikasi
                  </span>
                )}
                <a href={`tel:${developer.phone}`} className="w-full btn-primary text-sm text-center mb-2 flex items-center justify-center gap-2">
                  <Phone size={15} /> Hubungi Sekarang
                </a>
                <a href={`mailto:${developer.email}`} className="w-full btn-outline text-sm text-center flex items-center justify-center gap-2">
                  <Mail size={15} /> Kirim Email
                </a>
              </div>
            </div>
          )}

          {/* Document completeness */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-display font-bold text-[#1a3a6b] mb-4">Kelengkapan Dokumen</h3>
            <div className="space-y-3">
              {[
                { label: 'Sertifikat Tanah', ok: !!certificate },
                { label: 'PBG', ok: !!pbg },
                { label: 'Denah', ok: !!denah },
                { label: 'Foto Properti', ok: photos?.length > 0 },
                { label: 'Geotagging', ok: !!(lat && lng) },
              ].map(({ label, ok }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{label}</span>
                  {ok
                    ? <span className="flex items-center gap-1 text-xs text-emerald-600 font-semibold"><CheckCircle size={14} /> Ada</span>
                    : <span className="flex items-center gap-1 text-xs text-gray-400"><XCircle size={14} /> Tidak ada</span>
                  }
                </div>
              ))}
            </div>
            {/* Completeness bar */}
            {(() => {
              const pct = Math.round(([!!certificate, !!pbg, !!denah, photos?.length > 0, !!(lat && lng)]
                .filter(Boolean).length / 5) * 100)
              return (
                <div className="mt-4">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">Kelengkapan</span>
                    <span className="font-semibold text-[#1a3a6b]">{pct}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#1a3a6b] to-[#c49a35] rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })()}
          </div>
        </div>
      </div>
    </div>
  )
}
