import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  PlusCircle, Upload, MapPin, CheckCircle, AlertCircle,
  FileText, Loader, Camera, Info, Cpu
} from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'

const STEPS = ['Info Dasar', 'Foto', 'Sertifikat', 'PBG']

function DropZone({ accept, label, hint, icon: Icon = Upload, onFile, file, uploading, result, error }) {
  const inputRef = useRef()
  const handleDrop = (e) => {
    e.preventDefault()
    const f = e.dataTransfer.files?.[0]
    if (f) onFile(f)
  }
  return (
    <div
      onDrop={handleDrop}
      onDragOver={e => e.preventDefault()}
      onClick={() => inputRef.current?.click()}
      className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all
        ${uploading ? 'border-blue-300 bg-blue-50'
          : result ? 'border-emerald-300 bg-emerald-50'
          : error ? 'border-red-300 bg-red-50'
          : 'border-gray-200 hover:border-[#1a3a6b] hover:bg-[#1a3a6b]/5'}`}
    >
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={e => onFile(e.target.files?.[0])} />
      {uploading ? (
        <div className="flex flex-col items-center gap-2">
          <Loader size={24} className="animate-spin text-blue-500" />
          <p className="text-sm text-blue-600 font-medium">Mengupload ke MinIO...</p>
        </div>
      ) : result ? (
        <div className="flex flex-col items-center gap-2">
          <CheckCircle size={24} className="text-emerald-500" />
          <p className="text-sm text-emerald-700 font-medium">Berhasil diupload</p>
          <p className="text-xs text-gray-400 truncate max-w-xs">{file?.name}</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-2">
          <AlertCircle size={24} className="text-red-400" />
          <p className="text-sm text-red-600">{error}</p>
          <p className="text-xs text-gray-400">Klik untuk coba lagi</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <Icon size={24} className="text-gray-300" />
          <p className="text-sm text-gray-500 font-medium">{label}</p>
          <p className="text-xs text-gray-300">{hint}</p>
        </div>
      )}
    </div>
  )
}

function ExifResult({ result }) {
  if (!result) return null
  const { exif, geocoding } = result
  return (
    <div className="mt-3 bg-gray-50 rounded-xl p-4 text-xs space-y-2 border border-gray-100">
      <p className="font-semibold text-gray-600 flex items-center gap-1.5">
        <Info size={12} /> Metadata EXIF Terdeteksi
      </p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        <div className="flex items-center gap-1.5">
          {exif.has_gps
            ? <CheckCircle size={11} className="text-emerald-500 shrink-0" />
            : <AlertCircle size={11} className="text-amber-400 shrink-0" />}
          <span className={exif.has_gps ? 'text-emerald-700' : 'text-amber-600'}>
            {exif.has_gps ? `GPS: ${exif.lat?.toFixed(5)}, ${exif.lng?.toFixed(5)}` : 'Tidak ada data GPS'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {exif.has_datetime
            ? <CheckCircle size={11} className="text-emerald-500 shrink-0" />
            : <AlertCircle size={11} className="text-amber-400 shrink-0" />}
          <span className={exif.has_datetime ? 'text-emerald-700' : 'text-amber-600'}>
            {exif.has_datetime
              ? `Waktu: ${new Date(exif.time_taken).toLocaleDateString('id-ID')}`
              : 'Tidak ada timestamp'}
          </span>
        </div>
      </div>
      {exif.has_gps && geocoding && (
        <div className="pt-1 border-t border-gray-200">
          <p className="font-semibold text-gray-600 mb-1 flex items-center gap-1">
            <MapPin size={11} /> Reverse Geocoding
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-gray-500">
            {geocoding.kabupatenkota && <span>🏙 {geocoding.kabupatenkota}</span>}
            {geocoding.kecamatan && <span>📍 {geocoding.kecamatan}</span>}
            {geocoding.desa && <span>🏘 {geocoding.desa}</span>}
          </div>
        </div>
      )}
      {!exif.has_gps && (
        <p className="text-amber-600 text-xs">
          ⚠️ Foto ini tidak memiliki GPS. Gunakan foto asli dari kamera untuk geotagging otomatis.
        </p>
      )}
    </div>
  )
}

function OcrNotice({ docType }) {
  return (
    <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
      <Cpu size={18} className="shrink-0 mt-0.5 text-blue-500" />
      <div>
        <p className="font-semibold mb-0.5">Diproses otomatis oleh AI OCR</p>
        <p className="text-blue-600 text-xs">
          Data {docType} (nomor, nama pemilik, alamat, luas) akan diekstrak otomatis dari dokumen yang Anda upload.
          Tidak perlu mengisi manual.
        </p>
      </div>
    </div>
  )
}

export default function AddPropertyPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [propId, setPropId] = useState(null)

  const [form, setForm] = useState({ property_name: '', description: '', price: '', full_address: '', sales_status: 'Available' })
  const [basicLoading, setBasicLoading] = useState(false)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const [photoFile, setPhotoFile] = useState(null)
  const [photoUploading, setPhotoUploading] = useState(false)
  const [photoResult, setPhotoResult] = useState(null)
  const [photoError, setPhotoError] = useState(null)

  const [certFile, setCertFile] = useState(null)
  const [certUploading, setCertUploading] = useState(false)
  const [certResult, setCertResult] = useState(null)
  const [certError, setCertError] = useState(null)

  const [pbgFile, setPbgFile] = useState(null)
  const [pbgUploading, setPbgUploading] = useState(false)
  const [pbgResult, setPbgResult] = useState(null)
  const [pbgError, setPbgError] = useState(null)

  const handleCreateProperty = async (e) => {
    e.preventDefault()
    setBasicLoading(true)
    try {
      const res = await api.post('/properties', { ...form, price: parseFloat(form.price) })
      setPropId(res.data.prop_id)
      toast.success('Properti dibuat! Sekarang upload foto.')
      setStep(1)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Gagal membuat properti')
    } finally {
      setBasicLoading(false)
    }
  }

  const handlePhotoUpload = async (file) => {
    if (!file) return
    setPhotoFile(file)
    setPhotoError(null)
    setPhotoResult(null)
    setPhotoUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await api.post(`/upload/photo/${propId}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setPhotoResult(res.data)
      toast.success(res.data.message)
    } catch (err) {
      const msg = err.response?.data?.detail || 'Gagal mengupload foto'
      setPhotoError(msg)
      toast.error(msg)
    } finally {
      setPhotoUploading(false)
    }
  }

  const handleDocUpload = async (file, type, setFile, setUploading, setResult, setError) => {
    if (!file) return
    setFile(file)
    setError(null)
    setResult(null)
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      // Pass placeholder values — OCR will overwrite these later
      if (type === 'certificate') {
        fd.append('nib', 'PENDING_OCR')
        fd.append('hak', 'Hak Milik')
        fd.append('owner_name', 'PENDING_OCR')
        fd.append('written_address', 'PENDING_OCR')
      } else {
        fd.append('pbg_number', 'PENDING_OCR')
        fd.append('owner_name', 'PENDING_OCR')
        fd.append('written_address', 'PENDING_OCR')
      }
      const res = await api.post(`/upload/${type}/${propId}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setResult(res.data)
      toast.success('Dokumen berhasil diupload! AI OCR akan memproses data.')
    } catch (err) {
      const msg = err.response?.data?.detail || 'Gagal mengupload dokumen'
      setError(msg)
      toast.error(msg)
    } finally {
      setUploading(false)
    }
  }

  const inputCls = "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1a3a6b] focus:ring-2 focus:ring-[#1a3a6b]/10"

  return (
    <div className="min-h-screen bg-[#f8f5f0] py-10 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="font-display text-2xl font-bold text-[#1a3a6b] flex items-center gap-2">
            <PlusCircle size={24} className="text-[#c49a35]" /> Tambah Properti Baru
          </h1>
          <p className="text-gray-500 text-sm mt-1">Lengkapi semua langkah untuk memposting properti Anda</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((label, i) => (
            <div key={i} className="flex items-center gap-2 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all
                ${i < step ? 'bg-emerald-500 text-white' : i === step ? 'bg-[#1a3a6b] text-white' : 'bg-gray-200 text-gray-400'}`}>
                {i < step ? <CheckCircle size={14} /> : i + 1}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${i === step ? 'text-[#1a3a6b]' : i < step ? 'text-emerald-600' : 'text-gray-400'}`}>
                {label}
              </span>
              {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 rounded ${i < step ? 'bg-emerald-400' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">

          {/* STEP 0 — Basic info */}
          {step === 0 && (
            <form onSubmit={handleCreateProperty} className="space-y-5">
              <h2 className="font-display font-semibold text-lg text-[#1a3a6b]">Informasi Dasar</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Properti *</label>
                <input type="text" required value={form.property_name} onChange={e => set('property_name', e.target.value)}
                  placeholder="Contoh: Rumah Minimalis 3BR Pondok Indah" className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Harga (Rp) *</label>
                <input type="number" required value={form.price} onChange={e => set('price', e.target.value)}
                  placeholder="Contoh: 2500000000" className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Deskripsi</label>
                <textarea value={form.description} onChange={e => set('description', e.target.value)}
                  placeholder="Deskripsikan properti Anda..." rows={3} className={inputCls + ' resize-none'} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Alamat Lengkap *</label>
                <input type="text" required value={form.full_address} onChange={e => set('full_address', e.target.value)}
                  placeholder="Jl. Contoh No. 1, Kecamatan, Kota" className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status Penjualan</label>
                <div className="flex gap-3">
                  {[{ val: 'Available', label: 'Tersedia' }, { val: 'Reserved', label: 'Dipesan' }].map(({ val, label }) => (
                    <button key={val} type="button" onClick={() => set('sales_status', val)}
                      className={`flex-1 py-3 rounded-xl text-sm font-medium border-2 transition-all
                        ${form.sales_status === val ? 'bg-[#1a3a6b] text-white border-[#1a3a6b]' : 'border-gray-200 text-gray-600 hover:border-[#1a3a6b]'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <button type="submit" disabled={basicLoading}
                className="w-full bg-[#1a3a6b] text-white py-3.5 rounded-xl font-semibold hover:bg-[#0f2444] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                {basicLoading ? <><Loader size={16} className="animate-spin" /> Menyimpan...</> : 'Lanjut ke Upload Foto →'}
              </button>
            </form>
          )}

          {/* STEP 1 — Photo */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="font-display font-semibold text-lg text-[#1a3a6b]">Upload Foto Properti</h2>
              <p className="text-sm text-gray-500 bg-blue-50 rounded-xl p-3 border border-blue-100">
                📸 Foto asli dari kamera (dengan GPS aktif) akan otomatis diekstrak koordinatnya dan di-reverse geocode ke nama kota/kecamatan.
              </p>
              <DropZone
                accept="image/jpeg,image/png,image/webp"
                label="Seret & lepas foto, atau klik untuk memilih"
                hint="JPG, PNG, WebP (max 20MB) — Gunakan foto asli kamera untuk GPS otomatis"
                icon={Camera}
                onFile={handlePhotoUpload}
                file={photoFile}
                uploading={photoUploading}
                result={photoResult}
                error={photoError}
              />
              <ExifResult result={photoResult} />
              {photoFile && !photoUploading && (
                <img src={URL.createObjectURL(photoFile)} alt="Preview"
                  className="h-40 w-auto rounded-xl object-cover border border-gray-200" />
              )}
              <button onClick={() => setStep(2)}
                className="w-full bg-[#1a3a6b] text-white py-3 rounded-xl font-semibold hover:bg-[#0f2444] transition-colors">
                {photoResult ? 'Lanjut ke Sertifikat →' : 'Lewati, Lanjut →'}
              </button>
            </div>
          )}

          {/* STEP 2 — Certificate */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="font-display font-semibold text-lg text-[#1a3a6b]">Sertifikat / E-Sertipikat</h2>
              <OcrNotice docType="sertifikat (NIB, jenis hak, nama pemilik, luas tanah)" />
              <DropZone
                accept=".pdf,image/jpeg,image/png"
                label="Upload Sertifikat Tanah Elektronik"
                hint="PDF, JPG, PNG (max 20MB)"
                icon={FileText}
                onFile={f => handleDocUpload(f, 'certificate', setCertFile, setCertUploading, setCertResult, setCertError)}
                file={certFile}
                uploading={certUploading}
                result={certResult}
                error={certError}
              />
              {certResult && (
                <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                  <Cpu size={13} /> File disimpan di MinIO. AI OCR akan mengekstrak data sertifikat secara otomatis.
                </div>
              )}
              <div className="flex gap-3">
                {certResult && (
                  <button onClick={() => setStep(3)}
                    className="flex-1 bg-emerald-500 text-white py-3 rounded-xl font-semibold hover:bg-emerald-600 transition-colors">
                    Lanjut ke PBG →
                  </button>
                )}
                {!certResult && (
                  <button onClick={() => setStep(3)}
                    className="flex-1 bg-[#1a3a6b] text-white py-3 rounded-xl font-semibold hover:bg-[#0f2444] transition-colors">
                    {certUploading ? 'Mengupload...' : 'Lewati →'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* STEP 3 — PBG */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="font-display font-semibold text-lg text-[#1a3a6b]">PBG (Persetujuan Bangunan Gedung)</h2>
              <OcrNotice docType="PBG (nomor PBG, nama pemilik, luas bangunan)" />
              <DropZone
                accept=".pdf,image/jpeg,image/png"
                label="Upload dokumen PBG"
                hint="PDF, JPG, PNG (max 20MB)"
                icon={FileText}
                onFile={f => handleDocUpload(f, 'pbg', setPbgFile, setPbgUploading, setPbgResult, setPbgError)}
                file={pbgFile}
                uploading={pbgUploading}
                result={pbgResult}
                error={pbgError}
              />
              {pbgResult && (
                <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                  <Cpu size={13} /> File disimpan di MinIO. AI OCR akan mengekstrak data PBG secara otomatis.
                </div>
              )}
              <div className="pt-2 border-t border-gray-100">
                <button onClick={() => navigate(`/properties/${propId}`)}
                  className="w-full bg-emerald-500 text-white py-3.5 rounded-xl font-semibold hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2">
                  <CheckCircle size={18} />
                  {pbgResult ? 'Selesai — Lihat Properti' : 'Selesai Tanpa PBG'}
                </button>
                <p className="text-xs text-center text-gray-400 mt-2">Dokumen bisa dilengkapi nanti dari halaman detail</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
