import { useState } from 'react'
import { X, SlidersHorizontal } from 'lucide-react'
import { HAK_OPTIONS, KOTA_OPTIONS } from '../../utils/format'

export default function FilterPanel({ filters, onApply, onClose }) {
  const [local, setLocal] = useState({ ...filters })

  const set = (key, val) => setLocal(prev => ({ ...prev, [key]: val }))

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-6 w-full max-w-sm">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-display font-semibold text-[#1a3a6b] flex items-center gap-2">
          <SlidersHorizontal size={18} /> Filter
        </h3>
        {onClose && (
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={18} />
          </button>
        )}
      </div>

      <div className="space-y-5">
        {/* Location */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Lokasi</label>
          <div className="flex flex-wrap gap-1.5">
            {['Jakarta Selatan', 'Kota Bandung', 'Kota Surabaya', 'Lainnya'].map(kota => (
              <button
                key={kota}
                onClick={() => set('kabupatenkota', local.kabupatenkota === kota ? '' : kota)}
                className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors
                  ${local.kabupatenkota === kota
                    ? 'bg-[#1a3a6b] text-white border-[#1a3a6b]'
                    : 'border-gray-200 text-gray-600 hover:border-[#1a3a6b]'}`}
              >
                {kota}
              </button>
            ))}
          </div>
        </div>

        {/* Price range */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Rentang Harga</label>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Min (Rp)"
              value={local.min_price || ''}
              onChange={e => set('min_price', e.target.value ? Number(e.target.value) : undefined)}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1a3a6b]"
            />
            <input
              type="number"
              placeholder="Max (Rp)"
              value={local.max_price || ''}
              onChange={e => set('max_price', e.target.value ? Number(e.target.value) : undefined)}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1a3a6b]"
            />
          </div>
        </div>

        {/* Sales Status */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Status Penjualan</label>
          <div className="flex gap-2 flex-wrap">
            {[
              { val: '', label: 'Semua' },
              { val: 'Available', label: 'Tersedia' },
              { val: 'Reserved', label: 'Dipesan' },
              { val: 'Sold', label: 'Terjual' },
            ].map(({ val, label }) => (
              <button
                key={val}
                onClick={() => set('sales_status', val)}
                className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors
                  ${(local.sales_status || '') === val
                    ? 'bg-[#1a3a6b] text-white border-[#1a3a6b]'
                    : 'border-gray-200 text-gray-600 hover:border-[#1a3a6b]'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Hak */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Status Hak</label>
          <select
            value={local.hak || ''}
            onChange={e => set('hak', e.target.value || undefined)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1a3a6b]"
          >
            <option value="">Semua Jenis Hak</option>
            {HAK_OPTIONS.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
        </div>

        {/* Property Status */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Verifikasi Dokumen</label>
          <div className="flex gap-2">
            {[
              { val: '', label: 'Semua' },
              { val: 'Valid', label: 'Terverifikasi' },
              { val: 'Non Valid', label: 'Belum Verifikasi' },
            ].map(({ val, label }) => (
              <button
                key={val}
                onClick={() => set('property_status', val || undefined)}
                className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors flex-1
                  ${(local.property_status || '') === val
                    ? 'bg-[#1a3a6b] text-white border-[#1a3a6b]'
                    : 'border-gray-200 text-gray-600 hover:border-[#1a3a6b]'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-2 mt-6">
        <button
          onClick={() => { setLocal({}); onApply({}) }}
          className="flex-1 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:border-gray-300 transition-colors"
        >
          Reset
        </button>
        <button
          onClick={() => onApply(local)}
          className="flex-1 py-2.5 bg-[#1a3a6b] text-white rounded-xl text-sm font-semibold hover:bg-[#0f2444] transition-colors"
        >
          Terapkan
        </button>
      </div>
    </div>
  )
}
