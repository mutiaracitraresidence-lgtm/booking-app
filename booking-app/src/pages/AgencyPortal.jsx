import { useState, useEffect } from 'react'
import { getAgencyBookings, uploadKprDocument, submitBerkasKpr } from '../services/bookingService'
import { useAuth } from '../contexts/AuthContext'
import { FolderOpen, UploadCloud, CheckCircle, Clock, AlertOctagon } from 'lucide-react'

const DocumentUploadRow = ({ title, description, docKey, item, onUploadSuccess }) => {
  const [uploading, setUploading] = useState(false)
  const fileUrl = item[docKey]

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validasi Ukuran File (Maksimal 5MB agar tidak terlalu berat, tapi cukup untuk HD)
    if (file.size > 5 * 1024 * 1024) {
      alert("Ukuran file terlalu besar! Maksimal 5MB per dokumen.")
      return
    }

    setUploading(true)
    try {
      await uploadKprDocument(item.id, file, docKey)
      alert(`${title} berhasil diunggah!`)
      onUploadSuccess()
    } catch (error) {
      alert("Gagal mengunggah dokumen: " + error.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center py-4 border-b border-gray-100 gap-3">
      <div>
        <p className="text-sm font-bold text-gray-800 flex items-center gap-2">
          {fileUrl ? <CheckCircle size={16} className="text-green-500"/> : <Clock size={16} className="text-yellow-500"/>} {title}
        </p>
        <p className="text-xs text-gray-500 max-w-md leading-relaxed mt-1">{description}</p>
      </div>
      <label className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold cursor-pointer border shadow-sm transition-colors ${uploading ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:shadow'}`}>
        <UploadCloud size={18} /> {uploading ? 'Proses...' : (fileUrl ? 'Ganti File' : 'Pilih File')}
        <input type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg" onChange={handleFileChange} disabled={uploading} />
      </label>
    </div>
  )
}

// Sub-Komponen Kartu agar setiap transaksi punya Checkbox masing-masing
const AgencyCard = ({ item, onReload }) => {
  const [isAgreed, setIsAgreed] = useState(false)
  const isWaitingDocs = item.status === 'APPROVED' && item.kpr_status === 'Menunggu Dokumen'
  const isComplete = item.doc_identitas && item.doc_pernikahan && item.doc_kk

  const handleSubmit = async () => {
    if (window.confirm(`Kirim berkas ${item.customer_name} ke Admin KPR?\nPastikan dokumen benar-benar rapi dan terang.`)) {
      try {
        await submitBerkasKpr(item.id)
        alert("Berhasil! Berkas telah masuk ke meja Admin KPR.")
        onReload()
      } catch (error) { alert("Gagal mengirim: " + error.message) }
    }
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="flex justify-between items-start border-b border-gray-100 pb-4 mb-4">
        <div>
          <h3 className="text-xl font-black text-gray-800">{item.customer_name}</h3>
          <p className="text-sm text-gray-500">Marketing: <span className="font-semibold">{item.marketing?.name}</span></p>
        </div>
        <div className="text-right">
          <p className="font-bold text-blue-700 text-lg">{item.units?.unit_code}</p>
          <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${item.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
            {item.kpr_status || item.status}
          </span>
        </div>
      </div>

      {isWaitingDocs ? (
        <div className="bg-yellow-50/50 p-5 rounded-xl border border-yellow-200">
          <div className="flex items-center gap-2 mb-4 bg-yellow-100 text-yellow-800 p-3 rounded-lg border border-yellow-300">
            <AlertOctagon size={20} className="text-yellow-600 shrink-0"/>
            <p className="text-xs font-semibold">
              <span className="font-bold uppercase">Instruksi Penting:</span> Wajib menggunakan mesin Scanner / Aplikasi Scan di HP (CamScanner). File harus terang, tidak terpotong, dan tulisan terbaca jelas. Format disarankan: PDF.
            </p>
          </div>
          
          <div className="bg-white rounded-xl p-2 border border-gray-100 shadow-sm">
            <DocumentUploadRow 
              title="1. Identitas Pemohon" 
              description="Gabungkan KTP Pemohon, KTP Pasangan (Bila Menikah), & NPWP Pemohon dalam 1 File Halaman." 
              docKey="doc_identitas" item={item} onUploadSuccess={onReload} 
            />
            <DocumentUploadRow 
              title="2. Status Pernikahan" 
              description="Buku Nikah (Buka halaman yang ada Foto & Data Suami Istri) / Akta Cerai / Akta Kematian dalam 1 File Halaman." 
              docKey="doc_pernikahan" item={item} onUploadSuccess={onReload} 
            />
            <DocumentUploadRow 
              title="3. Kartu Keluarga" 
              description="Kartu Keluarga terbaru yang masih berlaku (Pastikan jelas terbaca)." 
              docKey="doc_kk" item={item} onUploadSuccess={onReload} 
            />
          </div>

          <div className="mt-6 border-t border-yellow-200 pt-5">
            <label className={`flex items-start gap-3 p-4 rounded-lg cursor-pointer transition-colors border ${isAgreed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
              <input 
                type="checkbox" 
                checked={isAgreed} 
                onChange={(e) => setIsAgreed(e.target.checked)} 
                className="mt-1 w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                disabled={!isComplete}
              />
              <span className={`text-sm font-medium ${isAgreed ? 'text-green-800' : 'text-gray-700'}`}>
                <strong>Pakta Integritas:</strong> Saya menjamin bahwa seluruh dokumen di atas telah di-scan dengan sangat rapi, lurus, tidak terpotong, dan seluruh data terbaca jelas oleh mata. <br/>
                <span className="text-xs font-normal text-red-500">*Admin KPR berhak menolak dan mengembalikan berkas jika foto dokumen buram atau menggunakan flash kamera asal-asalan.</span>
              </span>
            </label>

            <div className="mt-4 flex justify-end">
              <button 
                onClick={handleSubmit} 
                disabled={!isComplete || !isAgreed} 
                className="bg-green-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg flex items-center gap-2"
              >
                <CheckCircle size={18} /> Ajukan Pemberkasan KPR
              </button>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-xs text-gray-400 italic bg-gray-50 p-4 rounded-lg border border-gray-100 text-center">
          Dokumen sedang diproses / sudah terkunci oleh tim Admin KPR.
        </p>
      )}
    </div>
  )
}

export default function AgencyPortal() {
  const { userProfile } = useAuth()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    if (userProfile) {
      try {
        const isAgency = userProfile?.roles?.name?.toLowerCase() === 'agency'
        const agencyId = userProfile?.agency_id || userProfile?.id
        const data = await getAgencyBookings(agencyId, isAgency)
        setBookings(data || [])
      } catch (error) { console.error(error) } finally { setLoading(false) }
    }
  }

  useEffect(() => { loadData() }, [userProfile])

  if (loading) return <div className="p-8">Memuat Portal Agensi...</div>

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><FolderOpen className="text-blue-600" /> Portal Upload Berkas KPR</h1>
        <p className="text-gray-500">Unggah persyaratan KPR konsumen Anda dalam format PDF atau Gambar kualitas tinggi.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {bookings.length === 0 ? (
          <div className="bg-white p-8 rounded-xl text-center text-gray-500 shadow-sm border border-gray-100">
            Belum ada data konsumen yang siap di-upload dokumennya.
          </div>
        ) : (
          bookings.map(item => (
            <AgencyCard key={item.id} item={item} onReload={loadData} />
          ))
        )}
      </div>
    </div>
  )
}