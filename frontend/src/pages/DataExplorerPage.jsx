import { useState, useEffect } from 'react'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { BarChart3, Download, RefreshCw, TrendingUp, Home, FileCheck, DollarSign } from 'lucide-react'
import api from '../utils/api'
import { formatRupiah } from '../utils/format'

const COLORS = ['#1a3a6b', '#c49a35', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4']

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
        <Icon size={20} />
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

export default function DataExplorerPage() {
  const [stats, setStats] = useState(null)
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, propsRes] = await Promise.all([
          api.get('/properties/stats'),
          api.get('/properties?limit=100'),
        ])
        setStats(statsRes.data)
        setProperties(propsRes.data.items || [])
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-3 border-[#1a3a6b]/20 border-t-[#1a3a6b] rounded-full animate-spin" />
    </div>
  )

  const exportCSV = () => {
    const headers = ['Nama Properti', 'Harga', 'Status Penjualan', 'Status Verifikasi', 'Kota', 'Hak']
    const rows = properties.map(p => [p.property_name, p.price, p.sales_status, p.property_status, p.kabupatenkota || '', p.hak || ''])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'layakhuni_properties.csv'; a.click()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#0f2444] text-white px-8 py-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold flex items-center gap-2">
              <BarChart3 size={28} className="text-[#c49a35]" /> Data Explorer
            </h1>
            <p className="text-gray-400 text-sm mt-1">Analitik properti platform LayakHuni</p>
          </div>
          <div className="flex gap-3">
            <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-medium transition-colors">
              <Download size={16} /> Export CSV
            </button>
            <button onClick={() => window.location.reload()} className="flex items-center gap-2 px-4 py-2 bg-[#c49a35] hover:bg-[#b08a28] rounded-xl text-sm font-medium transition-colors">
              <RefreshCw size={16} /> Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <StatCard icon={Home} label="Total Properti" value={stats?.total_properties || 0} color="bg-blue-50 text-[#1a3a6b]" />
          <StatCard icon={FileCheck} label="Tersertifikasi" value={stats?.total_certificates || 0} color="bg-emerald-50 text-emerald-600" />
          <StatCard icon={DollarSign} label="Rata-rata Harga" value={formatRupiah(stats?.avg_price || 0)} color="bg-amber-50 text-amber-600" />
          <StatCard icon={TrendingUp} label="Total Kota" value={stats?.by_kota?.length || 0} sub="kota dengan listing aktif" color="bg-purple-50 text-purple-600" />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'location', label: 'Analitik Lokasi' },
            { id: 'documents', label: 'Dokumen & Hak' },
            { id: 'table', label: 'Tabel Data' },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors
                ${activeTab === id
                  ? 'border-[#1a3a6b] text-[#1a3a6b]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sales Status */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-display font-semibold text-[#1a3a6b] mb-4">Status Penjualan</h3>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={stats?.by_sales_status || []} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={90} label={({ status, percent }) => `${status} ${(percent * 100).toFixed(0)}%`}>
                    {(stats?.by_sales_status || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => [v, 'Jumlah']} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Price by Kota */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-display font-semibold text-[#1a3a6b] mb-4">Rata-rata Harga per Kota</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={(stats?.price_by_kota || []).slice(0, 6)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickFormatter={v => `${(v/1e9).toFixed(1)}M`} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="kota" tick={{ fontSize: 10 }} width={80} />
                  <Tooltip formatter={v => formatRupiah(v)} />
                  <Bar dataKey="avg_price" fill="#1a3a6b" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'location' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Properties by Kota */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-display font-semibold text-[#1a3a6b] mb-4">Jumlah Properti per Kota</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats?.by_kota || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="kota" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#c49a35" radius={[4, 4, 0, 0]} name="Jumlah Properti" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-display font-semibold text-[#1a3a6b] mb-4">Top 10 Kota</h3>
              <div className="space-y-3">
                {(stats?.by_kota || []).slice(0, 10).map(({ kota, count }, i) => (
                  <div key={kota} className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-[#1a3a6b] text-white text-xs flex items-center justify-center font-bold shrink-0">
                      {i + 1}
                    </span>
                    <span className="flex-1 text-sm text-gray-700 truncate">{kota}</span>
                    <div className="flex items-center gap-2">
                      <div className="h-2 rounded-full bg-[#1a3a6b]/20 overflow-hidden w-20">
                        <div
                          className="h-full bg-[#1a3a6b] rounded-full"
                          style={{ width: `${(count / (stats?.by_kota[0]?.count || 1)) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-gray-600 w-4">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* By Hak */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-display font-semibold text-[#1a3a6b] mb-4">Distribusi Jenis Hak</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={stats?.by_hak || []} dataKey="count" nameKey="hak" cx="50%" cy="50%" outerRadius={110} label={({ hak, percent }) => `${(percent * 100).toFixed(0)}%`}>
                    {(stats?.by_hak || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v, _, { payload }) => [v, payload?.hak]} />
                  <Legend formatter={(value, { payload }) => payload?.hak || value} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-display font-semibold text-[#1a3a6b] mb-4">Detail Jenis Hak</h3>
              <div className="space-y-3">
                {(stats?.by_hak || []).map(({ hak, count }, i) => (
                  <div key={hak} className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="flex-1 text-sm text-gray-700 truncate">{hak}</span>
                    <span className="text-sm font-bold text-gray-800">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'table' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="font-display font-semibold text-[#1a3a6b]">Data Properti ({properties.length} records)</h3>
              <button onClick={exportCSV} className="flex items-center gap-2 text-sm text-[#1a3a6b] font-medium hover:underline">
                <Download size={14} /> Export CSV
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {['Nama Properti', 'Harga', 'Status', 'Verifikasi', 'Kota', 'Hak', 'Developer'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {properties.map(p => (
                    <tr key={p.prop_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-[#1a3a6b] max-w-xs truncate">{p.property_name}</td>
                      <td className="px-4 py-3 text-gray-800 font-semibold whitespace-nowrap">{formatRupiah(p.price)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                          ${p.sales_status === 'Available' ? 'bg-blue-100 text-blue-700'
                          : p.sales_status === 'Reserved' ? 'bg-amber-100 text-amber-700'
                          : 'bg-gray-100 text-gray-600'}`}>
                          {p.sales_status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.property_status === 'Valid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {p.property_status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 max-w-[120px] truncate">{p.kabupatenkota || '-'}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{p.hak?.replace('Hak ', '') || '-'}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs max-w-[120px] truncate">{p.developer_name || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
