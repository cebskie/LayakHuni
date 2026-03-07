import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusCircle, Upload, MapPin } from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'

export default function AddPropertyPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    property_name: '', description: '', price: '', full_address: '', sales_status: 'Available',
  })
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.post('/properties', { ...form, price: parseFloat(form.price) })
      toast.success('Properti berhasil ditambahkan!')
      navigate(`/properties/${res.data.prop_id}`)
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Gagal menambahkan properti')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="font-display text-2xl font-bold text-[#1a3a6b] mb-7 flex items-center gap-2">
          <PlusCircle size={24} className="text-[#c49a35]" /> Tambah Properti Baru
        </h1>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Photo upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Foto Properti</label>
              <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:border-[#1a3a6b] transition-colors cursor-pointer">
                <Upload size={24} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-400">Seret & lepas foto, atau klik untuk memilih</p>
                <p className="text-xs text-gray-300 mt-1">JPG, PNG (max 10MB per file)</p>
              </div>
            </div>

            {/* Certificate upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sertifikat / E-Sertipikat</label>
              <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center hover:border-[#1a3a6b] transition-colors cursor-pointer">
                <Upload size={20} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-400">Upload dokumen Sertifikat Tanah Elektronik</p>
                <p className="text-xs text-gray-300 mt-1">PDF, JPG, PNG (max 20MB)</p>
              </div>
            </div>

            {/* PBG upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">PBG (Persetujuan Bangunan Gedung)</label>
              <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center hover:border-[#1a3a6b] transition-colors cursor-pointer">
                <Upload size={20} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-400">Upload dokumen PBG</p>
                <p className="text-xs text-gray-300 mt-1">PDF, JPG, PNG (max 20MB)</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Properti *</label>
              <input
                type="text" required value={form.property_name}
                onChange={e => set('property_name', e.target.value)}
                placeholder="Contoh: Rumah Minimalis 3BR Pondok Indah"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1a3a6b] focus:ring-2 focus:ring-[#1a3a6b]/10"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Harga (Rp) *</label>
              <input
                type="number" required value={form.price}
                onChange={e => set('price', e.target.value)}
                placeholder="Contoh: 2500000000"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1a3a6b] focus:ring-2 focus:ring-[#1a3a6b]/10"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Deskripsi</label>
              <textarea
                value={form.description}
                onChange={e => set('description', e.target.value)}
                placeholder="Deskripsikan properti Anda..."
                rows={4}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1a3a6b] focus:ring-2 focus:ring-[#1a3a6b]/10 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                <MapPin size={14} /> Alamat Lengkap *
              </label>
              <input
                type="text" required value={form.full_address}
                onChange={e => set('full_address', e.target.value)}
                placeholder="Jl. Contoh No. 1, Kecamatan, Kota"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1a3a6b] focus:ring-2 focus:ring-[#1a3a6b]/10"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status Penjualan</label>
              <div className="flex gap-3">
                {[{ val: 'Available', label: 'Tersedia' }, { val: 'Reserved', label: 'Dipesan' }].map(({ val, label }) => (
                  <button key={val} type="button" onClick={() => set('sales_status', val)}
                    className={`flex-1 py-3 rounded-xl text-sm font-medium border-2 transition-all
                      ${form.sales_status === val
                        ? 'bg-[#1a3a6b] text-white border-[#1a3a6b]'
                        : 'border-gray-200 text-gray-600 hover:border-[#1a3a6b]'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <button type="submit" disabled={loading}
                className="w-full btn-primary flex items-center justify-center gap-2">
                {loading
                  ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <><PlusCircle size={18} /> Posting Properti</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
