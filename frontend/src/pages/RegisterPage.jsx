import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, UserPlus } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const [form, setForm] = useState({ user_name: '', email: '', phone: '', password: '', role: 'Customer' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.post('/auth/register', form)
      const { access_token, ...user } = res.data
      login(user, access_token)
      toast.success('Akun berhasil dibuat!')
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Pendaftaran gagal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-130px)] flex">
      {/* Left image */}
      <div className="hidden lg:block flex-1 relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=900&q=80"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1a3a6b]/60 to-transparent" />
        <div className="absolute bottom-12 left-10 text-white">
          <h2 className="font-display text-4xl font-bold mb-3">Bergabung<br />Bersama Kami</h2>
          <p className="text-gray-200 text-sm">Ribuan properti terverifikasi menanti Anda</p>
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center px-8 bg-[#f8f5f0] py-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-xl p-10">
            <div className="text-center mb-7">
              <div className="w-14 h-14 bg-[#1a3a6b] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-xl font-display">LH</span>
              </div>
              <h1 className="font-display text-3xl font-bold text-[#1a3a6b]">Daftar</h1>
              <p className="text-gray-500 text-sm mt-1">Buat akun LayakHuni Anda</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Lengkap</label>
                  <input
                    type="text" required value={form.user_name}
                    onChange={e => set('user_name', e.target.value)}
                    placeholder="Nama Anda"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1a3a6b] focus:ring-2 focus:ring-[#1a3a6b]/10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nomor Telepon</label>
                <input
                  type="tel" required value={form.phone}
                  onChange={e => set('phone', e.target.value)}
                  placeholder="08xx-xxxx-xxxx"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1a3a6b] focus:ring-2 focus:ring-[#1a3a6b]/10"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input
                  type="email" required value={form.email}
                  onChange={e => set('email', e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1a3a6b] focus:ring-2 focus:ring-[#1a3a6b]/10"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Peran</label>
                <div className="grid grid-cols-2 gap-2">
                  {[{ val: 'Customer', label: 'Pembeli' }, { val: 'Developer', label: 'Developer' }].map(({ val, label }) => (
                    <button
                      key={val} type="button"
                      onClick={() => set('role', val)}
                      className={`py-3 rounded-xl text-sm font-medium border-2 transition-all
                        ${form.role === val
                          ? 'bg-[#1a3a6b] text-white border-[#1a3a6b]'
                          : 'border-gray-200 text-gray-600 hover:border-[#1a3a6b]'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'} required value={form.password}
                    onChange={e => set('password', e.target.value)}
                    placeholder="Minimal 8 karakter"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:border-[#1a3a6b] focus:ring-2 focus:ring-[#1a3a6b]/10"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full bg-[#1a3a6b] text-white py-3.5 rounded-xl font-semibold hover:bg-[#0f2444] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                {loading
                  ? <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <><UserPlus size={17} /> Buat Akun</>
                }
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
              Sudah punya akun?{' '}
              <Link to="/login" className="text-[#1a3a6b] font-semibold hover:underline">Masuk</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
