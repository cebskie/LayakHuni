import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  PlusCircle, Building2, CheckCircle, XCircle, MapPin,
  ArrowRight, Clock, ArrowLeft, TrendingUp, Package, BadgeCheck, CircleDollarSign
} from 'lucide-react'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { formatRupiah, formatDate } from '../utils/format'

function StatCard({ icon: Icon, label, value, colorBg, colorIcon }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${colorBg}`}>
        <Icon size={22} className={colorIcon} />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  )
}

const FILTERS = [
  { key: 'all',        label: 'Semua' },
  { key: 'Available',  label: 'Tersedia' },
  { key: 'Reserved',   label: 'Dipesan' },
  { key: 'Sold',       label: 'Terjual' },
  { key: 'Valid',      label: '✓ Terverifikasi' },
  { key: 'Non Valid',  label: '○ Belum Verifikasi' },
]

const SALES_BADGE = {
  Available: 'bg-blue-100 text-blue-700',
  Reserved:  'bg-amber-100 text-amber-700',
  Sold:      'bg-gray-100 text-gray-500',
}

const SALES_LABEL = {
  Available: 'Tersedia',
  Reserved:  'Dipesan',
  Sold:      'Terjual',
}

export default function DeveloperListingsPage() {
  const { user } = useAuth()
  const [properties, setProperties] = useState([])
  const [loading, setLoading]       = useState(true)
  const [devId, setDevId]           = useState(null)
  const [filter, setFilter]         = useState('all')

  useEffect(() => {
    api.get('/properties/me/dev-id')
      .then(res => setDevId(res.data.dev_id))
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!devId) return
    setLoading(true)
    api.get(`/properties?dev_id=${devId}&limit=100`)
      .then(res => setProperties(res.data.items || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [devId])

  const stats = {
    total:     properties.length,
    verified:  properties.filter(p => p.property_status === 'Valid').length,
    available: properties.filter(p => p.sales_status === 'Available').length,
    sold:      properties.filter(p => p.sales_status === 'Sold').length,
  }

  const filtered = (() => {
    if (filter === 'all')       return properties
    if (filter === 'Valid')     return properties.filter(p => p.property_status === 'Valid')
    if (filter === 'Non Valid') return properties.filter(p => p.property_status === 'Non Valid')
    return properties.filter(p => p.sales_status === filter)
  })()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#1a3a6b] text-white px-6 py-10">
        <div className="max-w-6xl mx-auto">
          <Link to="/" className="flex items-center gap-1 text-white/60 text-sm mb-4 hover:text-white transition-colors w-fit">
            <ArrowLeft size={15} /> Kembali ke Beranda
          </Link>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="font-display text-3xl font-bold mb-1">Properti Saya</h1>
              <p className="text-white/60 text-sm">Kelola semua listing properti Anda, {user?.user_name}</p>
            </div>
            <Link
              to="/add-property"
              className="flex items-center gap-2 bg-[#c49a35] hover:bg-[#b08a28] text-white px-5 py-3 rounded-xl font-semibold text-sm transition-colors shadow-lg shrink-0"
            >
              <PlusCircle size={17} /> Tambah Properti
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Package}        label="Total Listing"  value={stats.total}     colorBg="bg-[#1a3a6b]/10" colorIcon="text-[#1a3a6b]" />
          <StatCard icon={BadgeCheck}     label="Terverifikasi"  value={stats.verified}  colorBg="bg-emerald-100"  colorIcon="text-emerald-600" />
          <StatCard icon={TrendingUp}     label="Tersedia"       value={stats.available} colorBg="bg-blue-100"     colorIcon="text-blue-600" />
          <StatCard icon={CircleDollarSign} label="Terjual"      value={stats.sold}      colorBg="bg-amber-100"    colorIcon="text-amber-600" />
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border
                ${filter === key
                  ? 'bg-[#1a3a6b] text-white border-[#1a3a6b]'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-[#1a3a6b]'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {!loading && (
          <p className="text-sm text-gray-500 mb-4">
            Menampilkan <span className="font-semibold text-gray-800">{filtered.length}</span> properti
          </p>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm">
                <div className="skeleton h-44 w-full" />
                <div className="p-4 space-y-2">
                  <div className="skeleton h-4 w-3/4 rounded" />
                  <div className="skeleton h-6 w-1/2 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Building2 size={28} className="text-gray-300" />
            </div>
            <h3 className="font-display text-xl font-semibold text-gray-600 mb-2">
              {filter === 'all' ? 'Belum ada properti' : 'Tidak ada properti di kategori ini'}
            </h3>
            <p className="text-gray-400 text-sm mb-6">
              {filter === 'all' ? 'Mulai tambahkan listing properti pertama Anda' : 'Coba pilih filter yang berbeda'}
            </p>
            {filter === 'all' && (
              <Link to="/add-property" className="btn-primary inline-flex items-center gap-2 text-sm">
                <PlusCircle size={16} /> Tambah Properti Pertama
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map(p => (
              <div key={p.prop_id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
                <div className="relative h-44 overflow-hidden bg-gray-100">
                  <img
                    src={p.cover_photo || `https://picsum.photos/seed/${p.prop_id}/400/300`}
                    alt={p.property_name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={e => { e.target.src = `https://picsum.photos/seed/${p.prop_id}/400/300` }}
                  />
                  <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${SALES_BADGE[p.sales_status] || 'bg-gray-100 text-gray-500'}`}>
                      {SALES_LABEL[p.sales_status] || p.sales_status}
                    </span>
                    {p.property_status === 'Valid' ? (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-1">
                        <CheckCircle size={10} /> Valid
                      </span>
                    ) : (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-600 flex items-center gap-1">
                        <XCircle size={10} /> Belum Valid
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-display font-semibold text-[#1a3a6b] text-base leading-tight line-clamp-1 mb-1">
                    {p.property_name}
                  </h3>
                  <p className="text-xl font-bold text-[#1a3a6b] mb-2">{formatRupiah(p.price)}</p>

                  {p.kabupatenkota && (
                    <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
                      <MapPin size={11} className="text-[#c49a35]" />
                      <span>{p.kabupatenkota}</span>
                    </div>
                  )}

                  <div className="flex gap-1.5 mb-3 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.has_certificate ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                      {p.has_certificate ? '✓ Sertifikat' : '○ Sertifikat'}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.has_pbg ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                      {p.has_pbg ? '✓ PBG' : '○ PBG'}
                    </span>
                    {p.hak && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">
                        {p.hak.replace('Hak ', '')}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock size={11} />
                      <span>{formatDate(p.created_at)}</span>
                    </div>
                    <Link
                      to={`/properties/${p.prop_id}`}
                      className="text-xs text-[#c49a35] font-semibold flex items-center gap-1 hover:gap-2 transition-all"
                    >
                      Lihat Detail <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && properties.length > 0 && (
          <div className="mt-8 text-center">
            <Link
              to="/add-property"
              className="inline-flex items-center gap-2 bg-white border-2 border-[#1a3a6b] text-[#1a3a6b] px-6 py-3 rounded-xl font-semibold text-sm hover:bg-[#1a3a6b] hover:text-white transition-all"
            >
              <PlusCircle size={16} /> Tambah Properti Baru
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
