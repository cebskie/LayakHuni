import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.post('/auth/login', form)
      const { access_token, ...user } = res.data
      login(user, access_token)
      toast.success(`Selamat datang, ${user.user_name}!`)
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Email atau password salah')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-130px)] flex">
      {/* Left image */}
      <div className="hidden lg:block flex-1 relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1486325212027-8081e485255e?w=900&q=80"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1a3a6b]/60 to-transparent" />
        <div className="absolute bottom-12 left-10 text-white">
          <h2 className="font-display text-4xl font-bold mb-3">Selamat Datang<br />Kembali</h2>
          <p className="text-gray-200 text-sm">Masuk untuk melanjutkan pencarian properti impian Anda</p>
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center px-8 bg-[#f8f5f0]">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-xl p-10">
            <div className="text-center mb-8">
              <div className="w-14 h-14 bg-[#1a3a6b] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-xl font-display">LH</span>
              </div>
              <h1 className="font-display text-3xl font-bold text-[#1a3a6b]">Masuk</h1>
              <p className="text-gray-500 text-sm mt-1">Masukkan kredensial akun Anda</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="nama@email.com"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1a3a6b] focus:ring-2 focus:ring-[#1a3a6b]/10 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    value={form.password}
                    onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                    placeholder="Minimal 8 karakter"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:border-[#1a3a6b] focus:ring-2 focus:ring-[#1a3a6b]/10 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">Kombinasi huruf, angka, dan simbol</p>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded" />
                  <span className="text-gray-600">Ingat saya</span>
                </label>
                <a href="#" className="text-[#1a3a6b] font-medium hover:underline">Lupa Password?</a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1a3a6b] text-white py-3.5 rounded-xl font-semibold hover:bg-[#0f2444] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <><LogIn size={17} /> Masuk</>
                )}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
              Belum punya akun?{' '}
              <Link to="/register" className="text-[#1a3a6b] font-semibold hover:underline">Daftar Sekarang</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
