import { Link } from 'react-router-dom'
import { MapPin, Phone, Mail, Youtube, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-[#0f2444] text-white">
      <div className="max-w-7xl mx-auto px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-[#c49a35] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold font-display">LH</span>
              </div>
              <span className="font-display font-bold text-2xl">LayakHuni</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
              Platform properti terpercaya berbasis AI — memastikan setiap transaksi real estate Indonesia
              dilakukan dengan dokumen terverifikasi, lokasi akurat, dan data yang transparan.
            </p>
            <div className="flex gap-3 mt-5">
              {[Youtube, Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
                <a key={i} href="#" className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-[#c49a35] transition-colors">
                  <Icon size={14} />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-display font-semibold mb-4 text-[#c49a35]">Platform</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              {[
                { to: '/properties', label: 'Temukan Properti' },
                { to: '/map', label: 'Peta Properti' },
                { to: '/register', label: 'Daftar Sekarang' },
                { to: '/login', label: 'Masuk' },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="hover:text-white transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display font-semibold mb-4 text-[#c49a35]">Kontak</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex items-start gap-2">
                <MapPin size={14} className="mt-0.5 shrink-0 text-[#c49a35]" />
                <span>Jl. Malioboro No. 1, Yogyakarta 55271</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone size={14} className="text-[#c49a35]" />
                <span>+62 274 000 0000</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail size={14} className="text-[#c49a35]" />
                <span>hello@layakhuni.id</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} LayakHuni. All rights reserved.
      </div>
    </footer>
  )
}
