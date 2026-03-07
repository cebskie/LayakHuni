import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../utils/api'
import PropertyCard from '../components/property/PropertyCard'
import { Heart, ArrowLeft } from 'lucide-react'

export default function BookingPage() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // In a real app, this would fetch user's bookmarks/bookings
    // For now showing reserved/popular properties as demo
    async function load() {
      try {
        const res = await api.get('/properties?sales_status=Reserved&limit=8')
        setBookings(res.data.items || [])
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-[#1a3a6b] text-white px-8 py-8">
        <div className="max-w-7xl mx-auto">
          <Link to="/" className="flex items-center gap-1 text-white/70 text-sm mb-4 hover:text-white">
            <ArrowLeft size={14} /> Kembali
          </Link>
          <h1 className="font-display text-3xl font-bold flex items-center gap-2">
            <Heart size={24} className="text-[#c49a35]" /> Booking Saya
          </h1>
          <p className="text-gray-400 text-sm mt-1">Properti yang sedang dalam proses pemesanan</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden bg-white">
                <div className="skeleton h-48" />
                <div className="p-4 space-y-2">
                  <div className="skeleton h-4 w-3/4 rounded" />
                  <div className="skeleton h-6 w-1/2 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-20">
            <Heart size={40} className="mx-auto text-gray-300 mb-4" />
            <h3 className="font-display text-xl font-semibold text-gray-600 mb-2">Belum ada booking</h3>
            <p className="text-gray-400 text-sm mb-6">Temukan properti impian Anda dan mulai proses pemesanan</p>
            <Link to="/properties" className="btn-primary">Jelajahi Properti</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {bookings.map(p => <PropertyCard key={p.prop_id} property={p} />)}
          </div>
        )}
      </div>
    </div>
  )
}
