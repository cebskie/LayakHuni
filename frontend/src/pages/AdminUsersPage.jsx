import { useState, useEffect } from 'react'
import { Users, CheckCircle, XCircle, ShieldCheck, ShieldOff, Search, RefreshCw } from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'

const ROLE_COLORS = {
  Admin: 'bg-purple-100 text-purple-700',
  Developer: 'bg-blue-100 text-blue-700',
  Customer: 'bg-gray-100 text-gray-600',
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('All')
  const [verifying, setVerifying] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get('/admin/users')
      setUsers(res.data)
    } catch (e) {
      toast.error('Gagal memuat data pengguna')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleVerify = async (devId, currentStatus) => {
    setVerifying(devId)
    try {
      const endpoint = currentStatus === 'Verified'
        ? `/admin/developers/${devId}/unverify`
        : `/admin/developers/${devId}/verify`
      await api.patch(endpoint)
      toast.success(currentStatus === 'Verified' ? 'Verifikasi dicabut' : 'Developer berhasil diverifikasi!')
      await load()
    } catch (e) {
      toast.error('Gagal mengubah status verifikasi')
    } finally {
      setVerifying(null)
    }
  }

  const filtered = users.filter(u => {
    const matchRole = roleFilter === 'All' || u.user_role === roleFilter
    const matchSearch = !search ||
      u.user_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.phone?.includes(search)
    return matchRole && matchSearch
  })

  const counts = {
    All: users.length,
    Admin: users.filter(u => u.user_role === 'Admin').length,
    Developer: users.filter(u => u.user_role === 'Developer').length,
    Customer: users.filter(u => u.user_role === 'Customer').length,
  }

  const pendingCount = users.filter(u => u.verif_status === 'Not Verified').length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#0f2444] text-white px-8 py-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold flex items-center gap-2">
              <Users size={28} className="text-[#c49a35]" /> Manajemen Pengguna
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              {users.length} pengguna terdaftar
              {pendingCount > 0 && (
                <span className="ml-2 bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                  {pendingCount} developer menunggu verifikasi
                </span>
              )}
            </p>
          </div>
          <button onClick={load} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-medium transition-colors">
            <RefreshCw size={15} /> Refresh
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama, email, telepon..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1a3a6b] focus:ring-2 focus:ring-[#1a3a6b]/10"
            />
          </div>

          {/* Role tabs */}
          <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1">
            {['All', 'Admin', 'Developer', 'Customer'].map(role => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all
                  ${roleFilter === role
                    ? 'bg-[#1a3a6b] text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'}`}
              >
                {role} <span className="text-xs opacity-70">({counts[role]})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-10 h-10 border-3 border-[#1a3a6b]/20 border-t-[#1a3a6b] rounded-full animate-spin mx-auto" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <Users size={36} className="mx-auto mb-3 opacity-30" />
              <p>Tidak ada pengguna ditemukan</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Nama', 'Email', 'Telepon', 'Peran', 'Status Verifikasi', 'Aksi'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(u => (
                  <tr key={u.user_id} className="hover:bg-gray-50/60 transition-colors">
                    {/* Name + avatar */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#1a3a6b] flex items-center justify-center shrink-0">
                          <span className="text-white text-sm font-bold">
                            {u.user_name?.[0]?.toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{u.user_name}</p>
                          {u.dev_code && (
                            <p className="text-xs text-gray-400">{u.dev_code}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-5 py-4 text-sm text-gray-600">{u.email}</td>

                    {/* Phone */}
                    <td className="px-5 py-4 text-sm text-gray-600">{u.phone || '-'}</td>

                    {/* Role */}
                    <td className="px-5 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ROLE_COLORS[u.user_role]}`}>
                        {u.user_role}
                      </span>
                    </td>

                    {/* Verif status */}
                    <td className="px-5 py-4">
                      {u.user_role === 'Developer' ? (
                        <span className={`flex items-center gap-1.5 text-xs font-semibold w-fit px-2.5 py-1 rounded-full
                          ${u.verif_status === 'Verified'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'}`}
                        >
                          {u.verif_status === 'Verified'
                            ? <><CheckCircle size={12} /> Terverifikasi</>
                            : <><XCircle size={12} /> Menunggu</>
                          }
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="px-5 py-4">
                      {u.user_role === 'Developer' && u.dev_id && (
                        <button
                          onClick={() => handleVerify(u.dev_id, u.verif_status)}
                          disabled={verifying === u.dev_id}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50
                            ${u.verif_status === 'Verified'
                              ? 'bg-red-50 text-red-600 hover:bg-red-100'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
                        >
                          {verifying === u.dev_id ? (
                            <span className="w-3 h-3 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                          ) : u.verif_status === 'Verified' ? (
                            <><ShieldOff size={13} /> Cabut Verifikasi</>
                          ) : (
                            <><ShieldCheck size={13} /> Verifikasi</>
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          {[
            { label: 'Total Pengguna', value: counts.All, color: 'bg-[#1a3a6b] text-white' },
            { label: 'Admin', value: counts.Admin, color: 'bg-purple-600 text-white' },
            { label: 'Developer', value: counts.Developer, color: 'bg-blue-600 text-white' },
            { label: 'Customer', value: counts.Customer, color: 'bg-gray-600 text-white' },
          ].map(({ label, value, color }) => (
            <div key={label} className={`${color} rounded-2xl p-5 text-center`}>
              <p className="text-3xl font-bold">{value}</p>
              <p className="text-sm opacity-80 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
