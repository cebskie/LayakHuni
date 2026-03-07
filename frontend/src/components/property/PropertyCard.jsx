import { Link } from 'react-router-dom'
import { MapPin, CheckCircle, XCircle, ArrowRight } from 'lucide-react'
import { formatRupiah, truncate } from '../../utils/format'

export default function PropertyCard({ property }) {
  const {
    prop_id,
    property_name,
    description,
    price,
    full_address,
    sales_status,
    property_status,
    cover_photo,
    kabupatenkota,
    has_certificate,
    has_pbg,
    hak,
    developer_name,
  } = property

  const salesBadge = {
    Available: 'badge-available',
    Reserved: 'badge-reserved',
    Sold: 'badge-sold',
  }[sales_status] || 'badge-available'

  const salesLabel = {
    Available: 'Tersedia',
    Reserved: 'Dipesan',
    Sold: 'Terjual',
  }[sales_status] || sales_status

  return (
    <Link
      to={`/properties/${prop_id}`}
      className="property-card group bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex flex-col"
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden bg-gray-100">
        {cover_photo ? (
          <img
            src={cover_photo}
            alt={property_name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => { e.target.src = `https://picsum.photos/seed/${prop_id}/400/300` }}
          />
        ) : (
          <img
            src={`https://picsum.photos/seed/${prop_id}/400/300`}
            alt={property_name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        )}

        {/* Badges overlay */}
        <div className="absolute top-3 left-3 flex gap-1.5">
          <span className={salesBadge}>{salesLabel}</span>
          {property_status === 'Valid' ? (
            <span className="badge-valid flex items-center gap-0.5">
              <CheckCircle size={10} /> Verified
            </span>
          ) : (
            <span className="badge-invalid flex items-center gap-0.5">
              <XCircle size={10} /> Unverified
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-display font-semibold text-[#1a3a6b] text-base leading-tight line-clamp-2">
            {property_name}
          </h3>
        </div>

        <p className="text-2xl font-bold text-[#1a3a6b] mt-1 mb-2">{formatRupiah(price)}</p>

        {kabupatenkota && (
          <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
            <MapPin size={11} className="text-[#c49a35]" />
            <span className="truncate">{kabupatenkota}</span>
          </div>
        )}

        {description && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-3">{truncate(description, 90)}</p>
        )}

        {/* Doc status */}
        <div className="flex gap-2 mt-auto pt-3 border-t border-gray-50">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${has_certificate ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
            {has_certificate ? '✓ Sertifikat' : '○ Sertifikat'}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${has_pbg ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
            {has_pbg ? '✓ PBG' : '○ PBG'}
          </span>
          {hak && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium truncate max-w-[80px]" title={hak}>
              {hak.replace('Hak ', '')}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
          <span className="text-xs text-gray-400 truncate">{developer_name}</span>
          <span className="text-[#c49a35] text-xs font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
            Detail <ArrowRight size={12} />
          </span>
        </div>
      </div>
    </Link>
  )
}
