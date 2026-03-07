import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, SlidersHorizontal, Grid3X3, List, X } from 'lucide-react'
import api from '../utils/api'
import PropertyCard from '../components/property/PropertyCard'
import FilterPanel from '../components/property/FilterPanel'

export default function PropertiesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [properties, setProperties] = useState([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [showFilter, setShowFilter] = useState(false)
  const [viewMode, setViewMode] = useState('grid')
  const [search, setSearch] = useState(searchParams.get('search') || '')

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    min_price: searchParams.get('min_price') || undefined,
    max_price: searchParams.get('max_price') || undefined,
    sales_status: searchParams.get('sales_status') || '',
    property_status: searchParams.get('property_status') || '',
    hak: searchParams.get('hak') || '',
    kabupatenkota: searchParams.get('kabupatenkota') || '',
    page: parseInt(searchParams.get('page') || '1'),
  })

  const loadProperties = useCallback(async () => {
    setLoading(true)
    try {
      const params = Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v !== '' && v !== undefined)
      )
      const res = await api.get('/properties', { params })
      setProperties(res.data.items || [])
      setTotal(res.data.total || 0)
      setPages(res.data.pages || 1)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => { loadProperties() }, [loadProperties])

  const applyFilters = (newFilters) => {
    setFilters({ ...newFilters, page: 1 })
    setShowFilter(false)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setFilters(prev => ({ ...prev, search, page: 1 }))
  }

  const handlePageChange = (p) => setFilters(prev => ({ ...prev, page: p }))

  const activeFilterCount = [
    filters.min_price, filters.max_price, filters.sales_status,
    filters.property_status, filters.hak, filters.kabupatenkota
  ].filter(Boolean).length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-[#1a3a6b] text-white py-10 px-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="font-display text-3xl font-bold mb-4">Temukan Properti</h1>
          <form onSubmit={handleSearch} className="flex gap-2 max-w-xl">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cari nama properti, alamat, kota..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-3 rounded-xl bg-white text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#c49a35]/40"
              />
            </div>
            <button type="submit" className="px-6 py-3 bg-[#c49a35] text-white rounded-xl font-semibold hover:bg-[#b08a28] text-sm">
              Cari
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-6">
          {/* Desktop Filter Sidebar */}
          <div className="hidden lg:block w-72 shrink-0">
            <FilterPanel filters={filters} onApply={applyFilters} />
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <p className="text-sm text-gray-600">
                  <span className="font-semibold text-gray-900">{total}</span> properti ditemukan
                </p>
                {activeFilterCount > 0 && (
                  <span className="text-xs bg-[#1a3a6b] text-white px-2 py-0.5 rounded-full">
                    {activeFilterCount} filter aktif
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {/* Mobile filter button */}
                <button
                  onClick={() => setShowFilter(true)}
                  className="lg:hidden flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium hover:border-[#1a3a6b] transition-colors"
                >
                  <SlidersHorizontal size={15} />
                  Filter {activeFilterCount > 0 && `(${activeFilterCount})`}
                </button>
                {/* View toggle */}
                <div className="hidden sm:flex border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 ${viewMode === 'grid' ? 'bg-[#1a3a6b] text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                  ><Grid3X3 size={16} /></button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 ${viewMode === 'list' ? 'bg-[#1a3a6b] text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                  ><List size={16} /></button>
                </div>
              </div>
            </div>

            {/* Active filters chips */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {filters.kabupatenkota && (
                  <span className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full font-medium">
                    📍 {filters.kabupatenkota}
                    <button onClick={() => setFilters(p => ({ ...p, kabupatenkota: '' }))}><X size={12} /></button>
                  </span>
                )}
                {filters.sales_status && (
                  <span className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full font-medium">
                    {filters.sales_status}
                    <button onClick={() => setFilters(p => ({ ...p, sales_status: '' }))}><X size={12} /></button>
                  </span>
                )}
                {filters.hak && (
                  <span className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full font-medium">
                    {filters.hak}
                    <button onClick={() => setFilters(p => ({ ...p, hak: '' }))}><X size={12} /></button>
                  </span>
                )}
                <button
                  onClick={() => setFilters({ page: 1 })}
                  className="text-xs text-gray-500 hover:text-red-500 underline"
                >
                  Hapus semua
                </button>
              </div>
            )}

            {/* Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="rounded-2xl overflow-hidden bg-white">
                    <div className="skeleton h-48 w-full" />
                    <div className="p-4 space-y-2">
                      <div className="skeleton h-4 w-3/4 rounded" />
                      <div className="skeleton h-6 w-1/2 rounded" />
                      <div className="skeleton h-3 w-full rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : properties.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-5xl mb-4">🏠</p>
                <h3 className="font-display text-xl font-semibold text-gray-700 mb-2">Tidak ada properti ditemukan</h3>
                <p className="text-gray-400 text-sm">Coba ubah filter atau kata kunci pencarian Anda</p>
                <button onClick={() => setFilters({ page: 1 })} className="mt-4 btn-primary text-sm">
                  Reset Filter
                </button>
              </div>
            ) : (
              <div className={viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5'
                : 'space-y-4'
              }>
                {properties.map(p => <PropertyCard key={p.prop_id} property={p} />)}
              </div>
            )}

            {/* Pagination */}
            {pages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <button
                  onClick={() => handlePageChange(filters.page - 1)}
                  disabled={filters.page <= 1}
                  className="px-4 py-2 border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50"
                >
                  ← Sebelumnya
                </button>
                {[...Array(Math.min(pages, 7))].map((_, i) => {
                  const pg = i + 1
                  return (
                    <button
                      key={pg}
                      onClick={() => handlePageChange(pg)}
                      className={`w-10 h-10 rounded-lg text-sm font-medium
                        ${filters.page === pg ? 'bg-[#1a3a6b] text-white' : 'border hover:bg-gray-50'}`}
                    >
                      {pg}
                    </button>
                  )
                })}
                <button
                  onClick={() => handlePageChange(filters.page + 1)}
                  disabled={filters.page >= pages}
                  className="px-4 py-2 border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50"
                >
                  Berikutnya →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Modal */}
      {showFilter && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowFilter(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto">
            <FilterPanel filters={filters} onApply={applyFilters} onClose={() => setShowFilter(false)} />
          </div>
        </div>
      )}
    </div>
  )
}
