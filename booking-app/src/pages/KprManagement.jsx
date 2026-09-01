import { useState, useEffect } from 'react'
import { getKprBookings, updateKprStatusTransaction, rejectKprTransaction } from '../services/bookingService'
import { FileSpreadsheet, CheckCircle2, ChevronRight, Building, AlertTriangle, XCircle, Edit3, Download, FileText } from 'lucide-react'

// Komponen Download Saja (Tanpa Upload)
const ReadOnlyDocumentRow = ({ title, docKey, item }) => {
  const fileUrl = item[docKey]
  return (
    <div className="flex justify-between items-center py-3 border-b border-gray-100">
      <p className="text-sm font-semibold text-gray-700">{title}</p>
      {fileUrl ? (
        <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 bg-green-50 text-green-700 px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-green-100 border border-green-200 transition-colors">
          <Download size={14} /> Buka File / Unduh
        </a>
      ) : (
        <span className="text-xs text-red-500 font-semibold bg-red-50 px-2 py-1 rounded">Berkas Hilang</span>
      )}
    </div>
  )
}

const KprCard = ({ item, kprSteps, onReload }) => {
  const [bankName, setBankName] = useState(item.kpr_bank_name || '')
  const [bankBranch, setBankBranch] = useState(item.kpr_bank_branch || '')
  const [customerName, setCustomerName] = useState(item.customer_name || '')
  const [isEditingName, setIsEditingName] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [showDocs, setShowDocs] = useState(false)

  const currentStatus = item.kpr_status || 'Pemberkasan'
  const currentIndex = kprSteps.indexOf(currentStatus)
  const rejectionCount = item.kpr_rejection_count || 0

  // Hitung status deadline 14 hari
  const deadline = item.deadline_date ? new Date(item.deadline_date) : null;
  const isExpired = deadline && deadline < new Date();
  const extensionCount = item.extension_count || 0;

  const handleUpdate = async (newStatus) => {
    if (newStatus !== 'Pemberkasan' && !bankName) return alert("Mohon isi Nama Bank tujuan KPR!")

    // FITUR PENGUNCI 30% KEUANGAN
    if (newStatus === 'Verifikasi Bank') {
      const totalFee = Number(item.processing_fee_total) || 0
      const paidFee = Number(item.processing_fee_paid) || 0
      
      if (totalFee === 0) {
        alert("🛑 STOP!\nAdmin Keuangan BELUM menetapkan nominal Total Biaya Proses. Silakan hubungi tim Keuangan.")
        return
      }

      const minimalBayar = totalFee * 0.3
      if (paidFee < minimalBayar) {
        alert(`🛑 AKSES DITOLAK!\n\nKonsumen belum memenuhi syarat minimal 30% pembayaran Biaya Proses.\n\n- Total Biaya: Rp ${totalFee.toLocaleString('id-ID')}\n- Minimal Masuk (30%): Rp ${minimalBayar.toLocaleString('id-ID')}\n- Saat ini masuk: Rp ${paidFee.toLocaleString('id-ID')}\n\nSilakan arahkan Agensi untuk menagih konsumen dan serahkan bukti transfer ke Admin Keuangan.`)
        return
      }
    }

    if (window.confirm(`Lanjut ke tahap: ${newStatus}?`)) {
      setProcessing(true)
      try {
        await updateKprStatusTransaction(item.id, newStatus, bankName, bankBranch, customerName)
        if (newStatus === 'Akad Kredit') alert('Akad Kredit Selesai. Status Unit = SOLD.')
        onReload()
      } catch (error) { alert("Gagal update: " + error.message) } finally { setProcessing(false) }
    }
  }

  const handleReject = async () => {
    if (window.confirm(`Yakin menolak/kembalikan berkas ke Agensi? Penolakan: ${rejectionCount}/3.`)) {
      setProcessing(true)
      try {
        const result = await rejectKprTransaction(item.id)
        alert(result.message)
        onReload()
      } catch (error) { alert(error.message) } finally { setProcessing(false) }
    }
  }

  return (
    <div className={`p-6 rounded-xl shadow-sm border flex flex-col gap-5 relative overflow-hidden transition-all ${rejectionCount > 0 ? 'bg-red-50/30 border-red-200' : 'bg-white border-gray-100'}`}>
      
      {currentStatus === 'Akad Kredit' && <div className="absolute top-0 right-0 bg-green-500 text-white text-xs font-bold px-8 py-1 rotate-45 translate-x-6 translate-y-3 shadow-md z-20">DONE!</div>}

      <div className="flex justify-between items-start border-b border-gray-100 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {isEditingName ? <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="border rounded px-2 py-1 text-sm font-bold text-gray-800" /> : <h3 className="text-lg font-bold text-gray-800">{customerName}</h3>}
            <button onClick={() => setIsEditingName(!isEditingName)} className="text-gray-400 hover:text-blue-600"><Edit3 size={14} /></button>
            <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-md">NIK: {item.customer_nik}</span>
          </div>
          <p className="text-sm text-gray-500">Marketing: <span className="font-semibold">{item.marketing?.name}</span></p>
        </div>
        <div className="text-right">
          <p className="font-bold text-blue-700 text-lg">{item.units?.unit_code}</p>
          <p className="text-xs text-gray-500">{item.units?.projects?.project_name}</p>
        </div>
      </div>

      {/* PEMBERITAHUAN BATAS WAKTU 14 HARI KPR */}
      {item.deadline_date && currentStatus !== 'Akad Kredit' && (
        <div className={`p-3 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs font-bold border ${isExpired ? 'bg-red-50 border-red-200 text-red-700' : 'bg-blue-50 border-blue-200 text-blue-800'} gap-2`}>
          <span className="flex flex-col sm:flex-row sm:items-center gap-1">
            <span>⏳ Batas Waktu Pemberkasan KPR (14 Hari):</span>
            <span className="font-normal italic">
              (Perpanjangan ke-{extensionCount} dari maksimal 2 kali)
            </span>
          </span>
          <span className="bg-white px-2.5 py-1 rounded border shadow-sm whitespace-nowrap">
            {deadline.toLocaleString('id-ID')} {isExpired && '⚠️ (TERLEWAT)'}
          </span>
        </div>
      )}

      <div className="flex items-center justify-between w-full mt-2">
        {kprSteps.map((step, index) => {
          const isCompleted = index <= currentIndex; const isActive = index === currentIndex
          return (
            <div key={step} className="flex flex-col items-center relative z-10 w-1/5">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all ${isCompleted ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-300 text-gray-400'} ${isActive ? 'ring-4 ring-blue-100' : ''}`}>
                {isCompleted ? <CheckCircle2 size={16} /> : index + 1}
              </div>
              <p className={`text-xs mt-2 text-center font-medium ${isCompleted ? 'text-blue-700' : 'text-gray-400'}`}>{step}</p>
            </div>
          )
        })}
        <div className="absolute left-10 right-10 h-1 bg-gray-200 z-0 top-1/2 -translate-y-2 rounded-full">
          <div className="h-full bg-blue-600 transition-all duration-500 rounded-full" style={{ width: `${(currentIndex / (kprSteps.length - 1)) * 100}%` }} />
        </div>
      </div>

      {/* DOKUMEN DIGITAL (HANYA DOWNLOAD) */}
      <div className="mt-2 border border-blue-200 rounded-lg overflow-hidden bg-blue-50/50">
        <button onClick={() => setShowDocs(!showDocs)} className="w-full hover:bg-blue-100 p-3 text-sm font-bold text-blue-800 flex justify-between items-center transition-colors">
          <span className="flex items-center gap-2"><FileText size={16} className="text-blue-600"/> Berkas Persyaratan KPR Agensi</span>
          <span className="text-xs font-normal text-blue-600 bg-white px-2 py-1 rounded-full border border-blue-200">
            {showDocs ? 'Sembunyikan' : 'Buka Berkas'}
          </span>
        </button>
        
        {showDocs && (
          <div className="p-4 bg-white border-t border-blue-200">
            <ReadOnlyDocumentRow title="1. Identitas Pemohon & Pasangan" docKey="doc_identitas" item={item} />
            <ReadOnlyDocumentRow title="2. Dokumen Pernikahan / Cerai" docKey="doc_pernikahan" item={item} />
            <ReadOnlyDocumentRow title="3. Kartu Keluarga" docKey="doc_kk" item={item} />
          </div>
        )}
      </div>

      {currentStatus !== 'Akad Kredit' && (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex flex-col md:flex-row gap-4 items-end justify-between">
          <div className="flex gap-4 w-full md:w-auto">
            <div className="w-full md:w-48"><label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1"><Building size={12}/> Bank Tujuan</label><input type="text" value={bankName} onChange={(e) => setBankName(e.target.value.toUpperCase())} className="w-full p-2 border rounded-md text-sm focus:ring-1 focus:ring-blue-500" /></div>
            <div className="w-full md:w-48"><label className="block text-xs font-semibold text-gray-600 mb-1">Kantor Cabang</label><input type="text" value={bankBranch} onChange={(e) => setBankBranch(e.target.value)} className="w-full p-2 border rounded-md text-sm focus:ring-1 focus:ring-blue-500" /></div>
          </div>
          
          <div className="flex gap-2 w-full md:w-auto mt-4 md:mt-0">
            <button disabled={processing} onClick={handleReject} className="flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 hover:bg-red-600 hover:text-white px-3 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50">
              <XCircle size={16} /> Tolak ({rejectionCount}/3)
            </button>
            <button disabled={processing} onClick={() => handleUpdate(kprSteps[currentIndex + 1])} className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50">
              Lanjut {kprSteps[currentIndex + 1]} <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
      
      {rejectionCount > 0 && currentStatus !== 'Akad Kredit' && <p className="text-xs text-red-600 font-medium flex items-center gap-1 mt-[-10px] ml-1"><AlertTriangle size={12}/> Konsumen ini pernah ditolak bank {rejectionCount} kali.</p>}
    </div>
  )
}

export default function KprManagement() {
  const [bookings, setBookings] = useState([]); const [loading, setLoading] = useState(true)
  const kprSteps = ['Pemberkasan', 'Berkas Lengkap', 'Verifikasi Bank', 'SP3K', 'Akad Kredit']

  const loadData = async () => {
    try { const data = await getKprBookings(); setBookings(data || []) } catch (error) { console.error(error) } finally { setLoading(false) }
  }

  useEffect(() => { loadData() }, [])
  if (loading) return <div className="p-8">Memuat Data Pemberkasan KPR...</div>

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="mb-6"><h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><FileSpreadsheet className="text-blue-600" /> Validasi & Pemberkasan KPR</h1><p className="text-gray-500">Unduh berkas dari Agensi dan proses tahapan ke Bank.</p></div>
      <div className="grid grid-cols-1 gap-6">
        {bookings.length === 0 ? ( <div className="bg-white p-8 rounded-xl text-center text-gray-500 shadow-sm border">Tidak ada antrean berkas siap proses.</div> ) : ( bookings.map(item => <KprCard key={item.id} item={item} kprSteps={kprSteps} onReload={loadData} />) )}
      </div>
    </div>
  )
}