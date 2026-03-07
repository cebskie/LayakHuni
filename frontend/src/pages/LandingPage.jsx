import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, Shield, MapPin, BarChart3, ArrowRight, CheckCircle, Home, Users, Building2, Award } from 'lucide-react'
import api from '../utils/api'
import PropertyCard from '../components/property/PropertyCard'
import { formatRupiah } from '../utils/format'

export default function LandingPage() {
  const [search, setSearch] = useState('')
  const [popular, setPopular] = useState([])
  const [newest, setNewest] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    async function load() {
      try {
        const [popRes, newRes, statsRes] = await Promise.all([
          api.get('/properties?limit=4&property_status=Valid&sales_status=Available'),
          api.get('/properties?limit=4'),
          api.get('/properties/stats'),
        ])
        setPopular(popRes.data.items || [])
        setNewest(newRes.data.items || [])
        setStats(statsRes.data)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    navigate(`/properties?search=${search}`)
  }

  return (
    <div>
      {/* Hero */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden bg-[#0f2444]">
        {/* Background image with overlay */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1600&q=80"
            alt=""
            className="w-full h-full object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0f2444] via-[#0f2444]/80 to-transparent" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-in-up">
            <span className="inline-block text-xs font-semibold bg-[#c49a35]/20 text-[#c49a35] px-3 py-1.5 rounded-full mb-6 border border-[#c49a35]/30">
              Platform Properti AI #1 Indonesia
            </span>
            <h1 className="font-display text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              Temukan<br />
              <span className="text-[#c49a35]">Hunian Impian</span><br />
              Anda
            </h1>
            <p className="text-gray-300 text-lg mb-10 leading-relaxed max-w-lg">
              Platform properti terpercaya dengan verifikasi dokumen AI, geotagging cerdas,
              dan analitik data yang transparan untuk pengalaman transaksi bebas risiko.
            </p>

            {/* Search bar */}
            <form onSubmit={handleSearch} className="flex gap-2 max-w-lg mb-8">
              <div className="flex-1 relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari properti, kota, atau kawasan..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-xl bg-white text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#c49a35]/40 shadow-lg"
                />
              </div>
              <button type="submit" className="px-6 py-4 bg-[#c49a35] text-white rounded-xl font-semibold hover:bg-[#b08a28] transition-colors shadow-lg">
                Cari
              </button>
            </form>

            <div className="flex gap-4">
              <Link to="/properties" className="btn-gold text-sm">
                Jelajahi Properti
              </Link>
              <Link to="/register" className="btn-outline border-white text-white text-sm hover:bg-white hover:text-[#1a3a6b]">
                Daftar Gratis
              </Link>
            </div>
          </div>

          {/* Feature cards */}
          <div className="hidden lg:grid grid-cols-1 gap-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            {[
              { icon: Shield, title: 'AI Document Processing', desc: 'Verifikasi dokumen legal properti secara instan dengan OCR dan NLP canggih', color: 'bg-blue-500/20 text-blue-300' },
              { icon: MapPin, title: 'Intelligent Geotagging', desc: 'Validasi lokasi akurat menggunakan GPS dan metadata EXIF foto properti', color: 'bg-green-500/20 text-green-300' },
              { icon: BarChart3, title: 'Data Explorer Dashboard', desc: 'Analitik properti setara Power BI dengan visualisasi geospasial real-time', color: 'bg-purple-500/20 text-purple-300' },
            ].map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-5 flex gap-4 items-start hover:bg-white/15 transition-colors">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                  <Icon size={20} />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1 text-sm">{title}</h3>
                  <p className="text-gray-400 text-xs leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Search bar below hero (mobile) */}
      <section className="bg-white shadow-md py-5 px-6 lg:hidden">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari properti..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1a3a6b]"
            />
          </div>
          <button type="submit" className="px-5 py-3 bg-[#1a3a6b] text-white rounded-xl text-sm font-semibold">Cari</button>
        </form>
      </section>

      {/* Stats */}
      <section className="bg-white py-12 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { icon: Home, value: '250+', label: 'Properti Tersedia', color: 'text-[#1a3a6b]' },
              { icon: Building2, value: '600+', label: 'Properti Terjual', color: 'text-[#c49a35]' },
              { icon: Users, value: '1.8K+', label: 'Developer Terpercaya', color: 'text-emerald-600' },
              { icon: Award, value: '11K+', label: 'Pengguna Aktif', color: 'text-purple-600' },
            ].map(({ icon: Icon, value, label, color }) => (
              <div key={label} className="group">
                <Icon size={28} className={`${color} mx-auto mb-2 group-hover:scale-110 transition-transform`} />
                <p className="font-display text-3xl font-bold text-gray-900">{value}</p>
                <p className="text-sm text-gray-500 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 bg-[#f8f5f0]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold text-[#1a3a6b] mb-4">Mengapa Memilih LayakHuni?</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Kami hadir sebagai solusi atas krisis kepercayaan di pasar properti Indonesia —
              memastikan setiap transaksi dilindungi oleh teknologi AI terdepan.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Shield, title: 'Verifikasi Dokumen Instan', desc: 'AI kami mengekstrak dan memvalidasi dokumen PBG & Sertifikat Tanah dalam hitungan detik, bukan hari.', highlight: '>90% akurasi ekstraksi' },
              { icon: MapPin, title: 'Lokasi Tervalidasi', desc: 'Setiap listing properti dilengkapi koordinat GPS terverifikasi. Tidak ada lagi ghost listing atau manipulasi lokasi.', highlight: '100% tergeotag' },
              { icon: BarChart3, title: 'Data Transparan', desc: 'Dashboard analitik lengkap memberikan insight pasar yang akurat untuk keputusan investasi properti terbaik.', highlight: 'Real-time analytics' },
            ].map(({ icon: Icon, title, desc, highlight }) => (
              <div key={title} className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-lg transition-shadow border border-gray-100">
                <div className="w-12 h-12 bg-[#1a3a6b] rounded-xl flex items-center justify-center mb-5">
                  <Icon size={22} className="text-white" />
                </div>
                <h3 className="font-display font-semibold text-xl text-[#1a3a6b] mb-3">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-4">{desc}</p>
                <span className="inline-block text-xs font-semibold text-[#c49a35] bg-[#c49a35]/10 px-3 py-1 rounded-full">
                  {highlight}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Properties */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-[#c49a35] text-sm font-semibold mb-1">PILIHAN TERBAIK</p>
              <h2 className="font-display text-3xl font-bold text-[#1a3a6b]">Properti Populer</h2>
            </div>
            <Link to="/properties?property_status=Valid" className="text-sm font-semibold text-[#1a3a6b] flex items-center gap-1 hover:gap-2 transition-all">
              Lihat Semua <ArrowRight size={16} />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="rounded-2xl overflow-hidden">
                  <div className="skeleton h-48 w-full" />
                  <div className="p-4 space-y-2">
                    <div className="skeleton h-4 w-3/4 rounded" />
                    <div className="skeleton h-6 w-1/2 rounded" />
                    <div className="skeleton h-3 w-full rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {popular.map(p => <PropertyCard key={p.prop_id} property={p} />)}
            </div>
          )}

          <div className="text-center mt-8">
            <Link to="/properties" className="btn-primary inline-flex items-center gap-2">
              Lihat Semua Properti <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Newest Properties */}
      <section className="py-16 bg-[#f8f5f0]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-[#c49a35] text-sm font-semibold mb-1">BARU DITAMBAHKAN</p>
              <h2 className="font-display text-3xl font-bold text-[#1a3a6b]">Properti Terbaru</h2>
            </div>
            <Link to="/properties" className="text-sm font-semibold text-[#1a3a6b] flex items-center gap-1 hover:gap-2 transition-all">
              Lihat Semua <ArrowRight size={16} />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="rounded-2xl overflow-hidden">
                  <div className="skeleton h-48 w-full" />
                  <div className="p-4 space-y-2">
                    <div className="skeleton h-4 w-3/4 rounded" />
                    <div className="skeleton h-3 w-full rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {newest.map(p => <PropertyCard key={p.prop_id} property={p} />)}
            </div>
          )}

          <div className="text-center mt-8">
            <Link to="/properties" className="btn-outline inline-flex items-center gap-2">
              Lihat Lebih Banyak <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
