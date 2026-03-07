import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { Save, User, Mail, Phone, Lock, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function ProfilePage() {
  const { user, login, token } = useAuth()
  const [form, setForm] = useState({ user_name: user?.user_name || '', phone: user?.phone || '', password: '' })
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    try {
      const payload = { user_name: form.user_name, phone: form.phone }
      if (form.password) payload.password = form.password
      const res = await api.put('/auth/me', payload)
      login({ ...user, ...res.data }, token)
      toast.success('Profil berhasil diperbarui!')
    } catch (e) {
      toast.error('Gagal memperbarui profil')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-6">
      <div className="max-w-xl mx-auto">
        <Link to="/" className="flex items-center gap-1 text-gray-500 text-sm mb-6 hover:text-[#1a3a6b]">
          <ArrowLeft size={16} /> Kembali
        </Link>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-[#1a3a6b] px-8 py-8 text-center">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-white text-3xl font-bold font-display">{user?.user_name?.[0]?.toUpperCase()}</span>
            </div>
            <h2 className="font-display text-xl font-bold text-white">{user?.user_name}</h2>
            <span className="inline-block mt-1 text-xs bg-[#c49a35] text-white px-3 py-1 rounded-full">{user?.user_role}</span>
          </div>

          <div className="p-8">
            <h3 className="font-display font-bold text-[#1a3a6b] mb-5">Edit Profil</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <User size={14} /> Nama Lengkap
                </label>
                <input
                  type="text" value={form.user_name}
                  onChange={e => setForm(p => ({ ...p, user_name: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1a3a6b] focus:ring-2 focus:ring-[#1a3a6b]/10"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <Mail size={14} /> Email
                </label>
                <input
                  type="email" value={user?.email} disabled
                  className="w-full border border-gray-100 bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <Phone size={14} /> Nomor Telepon
                </label>
                <input
                  type="tel" value={form.phone}
                  onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1a3a6b] focus:ring-2 focus:ring-[#1a3a6b]/10"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <Lock size={14} /> Password Baru (opsional)
                </label>
                <input
                  type="password" value={form.password} placeholder="Biarkan kosong jika tidak berubah"
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1a3a6b] focus:ring-2 focus:ring-[#1a3a6b]/10"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex-1 btn-primary flex items-center justify-center gap-2"
                >
                  {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
                  Simpan Perubahan
                </button>
                <Link to="/" className="px-6 py-3 border-2 border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:border-gray-300 transition-colors">
                  Batal
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
