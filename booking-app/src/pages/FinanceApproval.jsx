import { useState, useEffect } from 'react'
import { getBookings, processApproval, updateProcessingFee } from '../services/bookingService'
import { Wallet, CheckCircle, XCircle, CreditCard, Lock, Printer, FileText } from 'lucide-react'
import ReceiptModal from '../components/ReceiptModal'

// Sub-Komponen Kartu Biaya Proses
const FeeManagementCard = ({ item, onReload }) => {
  const [total, setTotal] = useState(item.processing_fee_total ? item.processing_fee_total : '')
  const [paid, setPaid] = useState(item.processing_fee_paid ? item.processing_fee_paid : '')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setTotal(item.processing_fee_total ? item.processing_fee_total : '')
    setPaid(item.processing_fee_paid ? item.processing_fee_paid : '')
  }, [item.processing_fee_total, item.processing_fee_paid])

  const handleUpdate = async () => {
    const numTotal = Number(total) || 0
    const numPaid = Number(paid) || 0

    if (numPaid > numTotal && numTotal > 0) {
      return alert("Uang masuk tidak boleh lebih besar dari Total Biaya!")
    }
    
    setLoading(true)
    try {
      await updateProcessingFee(item.id, numTotal, numPaid)
      alert("Catatan Biaya Proses berhasil diperbarui!")
      onReload()
    } catch (error) {
      alert("Gagal menyimpan data: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  const numTotal = Number(total) || 0
  const numPaid = Number(paid) || 0
  const sisa = numTotal - numPaid
  const persentase = numTotal > 0 ? ((numPaid / numTotal) * 100).toFixed(1) : 0
  const is30Percent = persentase >= 30

  const savedTotal = Number(item.processing_fee_total) || 0
  const savedPaid = Number(item.processing_fee_paid) || 0
  const isTotalLocked = savedTotal > 0 && (savedPaid / savedTotal) >= 0.3
  const isLunas = savedTotal > 0 && savedPaid >= savedTotal

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-4 relative overflow-hidden">
      {isLunas && (
        <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-black px-8 py-1 rotate-45 translate-x-6 translate-y-3 shadow-md z-10 uppercase tracking-widest">
          LUNAS
        </div>
      )}

      <div className="flex justify-between items-start border-b border-gray-100 pb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-800">{item.customer_name}</h3>
          <p className="text-sm text-gray-500">Marketing: <span className="font-semibold">{item.marketing?.name}</span></p>
        </div>
        <div className="text-right">
          <p className="font-bold text-blue-700 text-lg">{item.units?.unit_code}</p>
          <span className="text-[10px] font-bold px-2 py-1 rounded bg-blue-100 text-blue-700">Tahap: {item.kpr_status || 'KPR'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1 flex items-center gap-1">
            Total Biaya Proses (Rp) 
            {isTotalLocked && <span className="text-red-500 flex items-center gap-1 bg-red-50 px-1.5 py-0.5 rounded"><Lock size={10}/> Terkunci</span>}
          </label>
          <input 
            type="number" value={total} onChange={(e) => setTotal(e.target.value === '' ? '' : Number(e.target.value).toString())} placeholder="0" disabled={isTotalLocked}
            className={`w-full p-2 border rounded-md text-sm font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 ${isTotalLocked ? 'bg-gray-200 text-gray-500 border-gray-300 cursor-not-allowed' : 'bg-gray-50 focus:bg-white'}`} 
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-emerald-600 mb-1 flex items-center gap-1">
            Uang Masuk / Cicilan (Rp)
            {isLunas && <span className="text-emerald-600 flex items-center gap-1 bg-emerald-100 px-1.5 py-0.5 rounded"><CheckCircle size={10}/> Lengkap</span>}
          </label>
          <input 
            type="number" value={paid} onChange={(e) => setPaid(e.target.value === '' ? '' : Number(e.target.value).toString())} placeholder="0" disabled={isLunas}
            className={`w-full p-2 border rounded-md text-sm font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500 ${isLunas ? 'bg-emerald-100 border-emerald-300 text-emerald-700 cursor-not-allowed' : 'border-emerald-300 bg-emerald-50 focus:bg-white'}`} 
          />
        </div>
      </div>

      <div className="flex items-center justify-between mt-2 pt-4 border-t border-gray-100">
        <div>
          <p className="text-xs text-gray-500">Sisa Tagihan: <span className="font-bold text-red-500">Rp {sisa.toLocaleString('id-ID')}</span></p>
          <p className="text-[11px] font-semibold mt-1 flex items-center gap-1">
            Status 30%: 
            {is30Percent ? <span className="text-emerald-600 flex items-center gap-1"><CheckCircle size={12}/> AMAN ({persentase}%)</span> : <span className="text-red-500 flex items-center gap-1"><XCircle size={12}/> BELUM LUNAS ({persentase}%)</span>}
          </p>
        </div>
        <button onClick={handleUpdate} disabled={loading || isLunas} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-50">
          {loading ? 'Menyimpan...' : (isLunas ? 'Transaksi Selesai' : 'Update Pembayaran')}
        </button>
      </div>
    </div>
  )
}

export default function FinanceApproval() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('BOOKING')
  const [selectedReceipt, setSelectedReceipt] = useState(null) // State untuk Modal Kwitansi

  const loadData = async () => {
    try {
      const data = await getBookings()
      setBookings(data || [])
    } catch (error) { console.error(error) } finally { setLoading(false) }
  }
  useEffect(() => { loadData() }, [])

  const handleApproval = async (id, status, customerName) => {
    if (window.confirm(`Apakah Anda yakin ingin ubah status ${customerName} menjadi ${status}?`)) {
      try {
        await processApproval(id, status)
        alert(`Status berhasil diubah menjadi ${status}! Nomor Kwitansi otomatis diterbitkan.`)
        loadData()
      } catch (error) { alert("Gagal memproses: " + error.message) }
    }
  }

  const pendingBookings = bookings.filter(b => b.status === 'PENDING')
  // Menampilkan juga data yang sudah APPROVED untuk opsi cetak kwitansi
  const approvedBookingsList = bookings.filter(b => b.status === 'APPROVED')
  const managementBookings = bookings.filter(b => b.status === 'APPROVED' && b.kpr_status !== 'Akad Kredit')

  if (loading) return <div className="p-8">Memuat Data Keuangan...</div>

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><Wallet className="text-green-600" /> Validasi Keuangan</h1>
        <p className="text-gray-500">Validasi uang Booking, cetak kwitansi digital, dan pantau pelunasan Biaya Proses.</p>
      </div>

      {/* NAVIGASI TAB */}
      <div className="flex gap-4 border-b border-gray-200 mb-6 overflow-x-auto">
        <button onClick={() => setActiveTab('BOOKING')} className={`pb-3 font-bold text-sm border-b-2 whitespace-nowrap transition-colors ${activeTab === 'BOOKING' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
          1. Validasi Booking Masuk ({pendingBookings.length})
        </button>
        <button onClick={() => setActiveTab('KWITANSI')} className={`pb-3 font-bold text-sm border-b-2 whitespace-nowrap transition-colors ${activeTab === 'KWITANSI' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
          📦 Cetak Kwitansi Booking ({approvedBookingsList.length})
        </button>
        <button onClick={() => setActiveTab('BIAYA_PROSES')} className={`pb-3 font-bold text-sm border-b-2 whitespace-nowrap transition-colors ${activeTab === 'BIAYA_PROSES' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
          2. Manajemen Biaya Proses ({managementBookings.length})
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* TAB 1: VALIDASI BOOKING PENDING */}
        {activeTab === 'BOOKING' && (
          pendingBookings.length === 0 ? <div className="bg-white p-8 rounded-xl text-center text-gray-500 shadow-sm border">Tidak ada antrean Booking baru.</div> :
          pendingBookings.map(item => (
            <div key={item.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-lg font-bold text-gray-800">{item.customer_name} <span className="text-sm font-normal text-gray-500">(NIK: {item.customer_nik})</span></h3>
                <p className="text-sm text-gray-500 mt-1">Marketing: <span className="font-semibold">{item.marketing?.name}</span> • Unit: <span className="font-bold text-blue-600">{item.units?.unit_code}</span></p>
                <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-lg inline-block">
                  <p className="text-xs text-blue-800 font-semibold mb-1">Nominal Booking Fee:</p>
                  <p className="text-xl font-black text-blue-700 flex items-center gap-2"><CreditCard size={20}/> Rp {Number(item.booking_fee).toLocaleString('id-ID')}</p>
                </div>
              </div>
              <div className="flex flex-col gap-2 w-full sm:w-auto">
                <button onClick={() => handleApproval(item.id, 'APPROVED', item.customer_name)} className="flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700"><CheckCircle size={18}/> Validasi & Terbitkan Kwitansi</button>
                <button onClick={() => handleApproval(item.id, 'REJECTED', item.customer_name)} className="flex items-center justify-center gap-2 bg-red-100 text-red-700 px-4 py-2 rounded-lg font-bold hover:bg-red-200"><XCircle size={18}/> Tolak Transaksi</button>
              </div>
            </div>
          ))
        )}

        {/* TAB BARU: CETAK KWITANSI BOOKING */}
        {activeTab === 'KWITANSI' && (
          approvedBookingsList.length === 0 ? <div className="bg-white p-8 rounded-xl text-center text-gray-500 shadow-sm border">Belum ada data booking yang divalidasi.</div> :
          approvedBookingsList.map(item => (
            <div key={item.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="text-xs font-mono font-bold bg-green-100 text-green-800 px-2 py-0.5 rounded">{item.receipt_number || 'No. Kwitansi Menunggu'}</span>
                <h3 className="text-lg font-bold text-gray-800 mt-1">{item.customer_name}</h3>
                <p className="text-sm text-gray-500">Marketing: <span className="font-semibold">{item.marketing?.name}</span> • Unit: <span className="font-bold text-blue-600">{item.units?.unit_code}</span></p>
                <p className="text-xs text-gray-400 mt-1">Nominal: Rp {Number(item.booking_fee).toLocaleString('id-ID')}</p>
              </div>
              <button 
                onClick={() => setSelectedReceipt(item)}
                className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-sm w-full sm:w-auto justify-center"
              >
                <Printer size={18} className="text-blue-400" /> Buka & Cetak Kwitansi
              </button>
            </div>
          ))
        )}

        {/* TAB 2: BIAYA PROSES */}
        {activeTab === 'BIAYA_PROSES' && (
          managementBookings.length === 0 ? <div className="bg-white p-8 rounded-xl text-center text-gray-500 shadow-sm border">Tidak ada konsumen yang sedang diproses.</div> :
          managementBookings.map(item => <FeeManagementCard key={item.id} item={item} onReload={loadData} />)
        )}
      </div>

      {/* POP-UP MODAL PREVIEW KWITANSI */}
      {selectedReceipt && (
        <ReceiptModal booking={selectedReceipt} onClose={() => setSelectedReceipt(null)} />
      )}
    </div>
  )
}