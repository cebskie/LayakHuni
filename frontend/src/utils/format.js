export function formatRupiah(amount) {
  if (!amount && amount !== 0) return '-'
  const num = Number(amount)
  if (num >= 1_000_000_000) return `Rp ${(num / 1_000_000_000).toFixed(1).replace('.0', '')} M`
  if (num >= 1_000_000) return `Rp ${(num / 1_000_000).toFixed(0)} Jt`
  return `Rp ${num.toLocaleString('id-ID')}`
}

export function formatDate(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('id-ID', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

export function truncate(str, len = 120) {
  if (!str) return ''
  return str.length > len ? str.slice(0, len) + '...' : str
}

export const SALES_STATUS_LABELS = {
  Available: 'Tersedia',
  Reserved: 'Dipesan',
  Sold: 'Terjual',
}

export const HAK_OPTIONS = [
  'Hak Milik',
  'Hak Guna Usaha',
  'Hak Guna Bangunan',
  'Hak Pakai',
  'Hak Pengelolaan',
  'Hak Tanggungan',
]

export const KOTA_OPTIONS = [
  'Kota Bandung',
  'Jakarta Selatan',
  'Jakarta Pusat',
  'Kota Surabaya',
  'Kabupaten Sleman',
  'Kota Medan',
  'Kabupaten Gianyar',
  'Kota Makassar',
  'Kota Semarang',
  'Kota Palembang',
  'Kota Malang',
  'Kota Denpasar',
  'Kota Manado',
  'Kota Balikpapan',
  'Kota Batam',
]
