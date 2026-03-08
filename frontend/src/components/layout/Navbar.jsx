import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { MapPin, Heart, User, ShoppingCart, Menu, X, Search, ChevronDown, LogOut, Settings, PlusCircle, BarChart3, Users, Building2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const isActive = (path) => location.pathname === path

  return (
    <>
      {/* Top bar */}
      <div className="bg-[#1a3a6b] text-white text-xs py-1.5 px-4 hidden md:flex items-center justify-between">
        <div className="flex items-center gap-1 opacity-80">
          <MapPin size={11} />
          <span>Yogyakarta, Indonesia</span>
        </div>
        <div className="flex items-center gap-4 opacity-80">
          {isAuthenticated && (
            <Link to="/booking" className="hover:opacity-100 transition-opacity flex items-center gap-1">
              <Heart size={11} /> Booking
            </Link>
          )}
          <div ref={userMenuRef} className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-1 hover:opacity-100 transition-opacity"
            >
              <User size={11} />
              {isAuthenticated ? user?.user_name : 'My Account'}
              <ChevronDown size={10} />
            </button>
            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-white text-gray-800 rounded-xl shadow-2xl border border-gray-100 py-2 z-50">
                {isAuthenticated ? (
                  <>
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="font-semibold text-sm text-[#1a3a6b]">{user?.user_name}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                      <span className="inline-block mt-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{user?.user_role}</span>
                    </div>
                    <Link to="/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50">
                      <Settings size={14} /> Profil Saya
                    </Link>
                    {user?.user_role === 'Developer' && (
                      <Link to="/add-property" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50">
                        <PlusCircle size={14} /> Tambah Properti
                      </Link>
                    )}
                    {user?.user_role === 'Developer' && (
                      <Link to="/my-listings" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50">
                        <Building2 size={14} /> Properti Saya
                      </Link>
                    )}
                    {user?.user_role === 'Admin' && (
                      <>
                        <Link to="/data-explorer" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50">
                          <BarChart3 size={14} /> Data Explorer
                        </Link>
                        <Link to="/admin/users" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50">
                          <Users size={14} /> Manajemen Pengguna
                        </Link>
                      </>
                    )}
                    <button
                      onClick={() => { logout(); setUserMenuOpen(false); navigate('/') }}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut size={14} /> Keluar
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setUserMenuOpen(false)} className="block px-4 py-2 text-sm hover:bg-gray-50">Masuk</Link>
                    <Link to="/register" onClick={() => setUserMenuOpen(false)} className="block px-4 py-2 text-sm hover:bg-gray-50">Daftar</Link>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main navbar */}
      <nav className="bg-white shadow-sm sticky top-0 z-40 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#1a3a6b] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm font-display">LH</span>
              </div>
              <span className="font-display font-bold text-[#1a3a6b] text-xl hidden sm:block">LayakHuni</span>
            </Link>

            {/* Search bar (desktop) */}
            <div className="hidden lg:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari properti, lokasi..."
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1a3a6b] focus:ring-2 focus:ring-[#1a3a6b]/10"
                  onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/properties?search=${e.target.value}`) }}
                />
              </div>
            </div>

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-1">
              {[
                { to: '/properties', label: 'Temukan Properti' },
                { to: '/map', label: 'Peta' },
              ].map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors
                    ${isActive(to) ? 'text-[#1a3a6b] bg-blue-50' : 'text-gray-600 hover:text-[#1a3a6b] hover:bg-gray-50'}`}
                >
                  {label}
                </Link>
              ))}
              {!isAuthenticated ? (
                <>
                  <Link to="/login" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-[#1a3a6b]">Masuk</Link>
                  <Link to="/register" className="btn-primary text-sm py-2 px-4">Daftar</Link>
                </>
              ) : (
                <Link to="/profile" className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="w-8 h-8 bg-[#1a3a6b] rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">{user?.user_name?.[0]?.toUpperCase()}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-700 hidden lg:block">{user?.user_name}</span>
                </Link>
              )}
            </div>

            {/* Mobile menu button */}
            <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 rounded-lg hover:bg-gray-100">
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-2">
            <Link to="/properties" className="block px-4 py-2 text-sm rounded-lg hover:bg-gray-50" onClick={() => setMenuOpen(false)}>Temukan Properti</Link>
            <Link to="/map" className="block px-4 py-2 text-sm rounded-lg hover:bg-gray-50" onClick={() => setMenuOpen(false)}>Peta Properti</Link>
            {isAuthenticated ? (
              <>
                <Link to="/booking" className="block px-4 py-2 text-sm rounded-lg hover:bg-gray-50" onClick={() => setMenuOpen(false)}>Booking</Link>
                <Link to="/profile" className="block px-4 py-2 text-sm rounded-lg hover:bg-gray-50" onClick={() => setMenuOpen(false)}>Profil</Link>
                {user?.user_role === 'Developer' && (
                  <Link to="/add-property" className="block px-4 py-2 text-sm rounded-lg hover:bg-gray-50" onClick={() => setMenuOpen(false)}>Tambah Properti</Link>
                )}
                {user?.user_role === 'Developer' && (
                  <Link to="/my-listings" className="block px-4 py-2 text-sm rounded-lg hover:bg-gray-50" onClick={() => setMenuOpen(false)}>Properti Saya</Link>
                )}
                {user?.user_role === 'Admin' && (
                  <>
                    <Link to="/data-explorer" className="block px-4 py-2 text-sm rounded-lg hover:bg-gray-50" onClick={() => setMenuOpen(false)}>Data Explorer</Link>
                    <Link to="/admin/users" className="block px-4 py-2 text-sm rounded-lg hover:bg-gray-50" onClick={() => setMenuOpen(false)}>Manajemen Pengguna</Link>
                  </>
                )}
                <button onClick={() => { logout(); setMenuOpen(false); navigate('/') }} className="block w-full text-left px-4 py-2 text-sm text-red-600 rounded-lg hover:bg-red-50">Keluar</button>
              </>
            ) : (
              <>
                <Link to="/login" className="block px-4 py-2 text-sm rounded-lg hover:bg-gray-50" onClick={() => setMenuOpen(false)}>Masuk</Link>
                <Link to="/register" className="block px-4 py-2 text-sm font-medium text-white bg-[#1a3a6b] rounded-lg text-center" onClick={() => setMenuOpen(false)}>Daftar</Link>
              </>
            )}
          </div>
        )}
      </nav>
    </>
  )
}
