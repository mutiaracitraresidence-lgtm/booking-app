import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { createBookingTransaction } from '../services/bookingService'
import { useAuth } from '../contexts/AuthContext'
import { FileText, CreditCard, User, Building, Upload, CheckCircle2 } from 'lucide-react'

export default function CreateBooking() {
  const { userProfile } = useAuth()
  const [projects, setProjects] = useState([])
  const [units, setUnits] = useState([])
  const [marketings, setMarketings] = useState([])
  
  const [selectedProject, setSelectedProject] = useState('')
  const [selectedUnit, setSelectedUnit] = useState('')
  const [selectedMarketing, setSelectedMarketing] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerNik, setCustomerNik] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [bookingFee, setBookingFee] = useState('')
  
  // State Metode Pembayaran & Bukti Transfer
  const [paymentMethod, setPaymentMethod] = useState('TRANSFER')
  const [proofFile, setProofFile] = useState(null)

  const [loading, setLoading] = useState(false)

  const userRole = userProfile?.roles?.name?.toLowerCase() || ''
  const isAgencyOrMarketing = userRole === 'agency' || userRole === 'marketing'

  useEffect(() => {
    fetchInitialData()
  }, [userProfile])

  const fetchInitialData = async () => {
    try {
      const { data: projData } = await supabase.from('projects').select('*')
      setProjects(projData || [])

      const { data: unitData } = await supabase.from('units').select('*, projects(project_name)').eq('status', 'AVAILABLE')
      setUnits(unitData || [])

      if (isAgencyOrMarketing) {
        const myId = userProfile?.id
        const { data: mktData } = await supabase.from('marketing').select('*').or(`id.eq.${myId},agency_id.eq.${myId}`)
        setMarketings(mktData || [])
        if (mktData && mktData.length > 0) setSelectedMarketing(mktData[0].id)
      } else {
        const { data: mktData } = await supabase.from('marketing').select('*')
        setMarketings(mktData || [])
      }
    } catch (err) {
      console.error(err)
    }
  }

  const filteredUnits = selectedProject ? units.filter(u => u.project_id === Number(selectedProject)) : units

  const handleBooking = async (e) => {
    e.preventDefault()

    if (paymentMethod === 'TRANSFER' && !proofFile) {
      alert("Metode pembayaran Transfer wajib mengunggah Bukti Transfer!")
      return
    }

    setLoading(true)
    try {
      const bookingData = {
        unit_id: selectedUnit,
        marketing_id: selectedMarketing,
        customer_name: customerName,
        customer_nik: customerNik,
        customer_phone: customerPhone,
        booking_fee: Number(bookingFee),
        payment_method: paymentMethod
      }

      await createBookingTransaction(bookingData, proofFile)
      alert("Booking Unit Berhasil Dibuat dan Menunggu Validasi Keuangan!")
      
      // Reset Form
      setSelectedProject('')
      setSelectedUnit('')
      setCustomerName('')
      setCustomerNik('')
      setCustomerPhone('')
      setBookingFee('')
      setProofFile(null)
    } catch (error) {
      alert("Gagal melakukan booking: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        
        <div className="flex items-center gap-3 border-b border-gray-100 pb-5 mb-6">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><FileText size={24}/></div>
          <div>
            <h1 className="text-2xl font-black text-gray-800">Formulir Booking Unit</h1>
            <p className="text-sm text-gray-500">Pilih unit, tentukan marketing, dan lengkapi pembayaran.</p>
          </div>
        </div>

        <form onSubmit={handleBooking} className="space-y-6">
          
          {/* SECTION 1: PROYEK & UNIT */}
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200/60 space-y-4">
            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2"><Building size={16} className="text-blue-600"/> 1. Pemilihan Project & Unit</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Pilih Project</label>
                <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)} required className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-sm">
                  <option value="">-- Pilih Project --</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.project_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Unit (Hanya yang Available)</label>
                <select value={selectedUnit} onChange={(e) => setSelectedUnit(e.target.value)} required className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-sm">
                  <option value="">-- Pilih Unit --</option>
                  {filteredUnits.map(u => <option key={u.id} value={u.id}>{u.unit_code} (Rp {Number(u.price).toLocaleString('id-ID')})</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 2: MARKETING */}
          <div className="bg-yellow-50/50 p-5 rounded-xl border border-yellow-200/60">
            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-2"><User size={16} className="text-yellow-600"/> 2. Alokasi Marketing Penjual</h3>
            <select value={selectedMarketing} onChange={(e) => setSelectedMarketing(e.target.value)} required className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-sm" disabled={isAgencyOrMarketing && marketings.length === 1}>
              <option value="">-- Pilih Tim Marketing --</option>
              {marketings.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>

          {/* SECTION 3: DATA KONSUMEN & PEMBAYARAN */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2"><CreditCard size={16} className="text-emerald-600"/> 3. Data Diri & Pembayaran Booking</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Nama Lengkap (Sesuai KTP)</label>
                <input type="text" required value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Contoh: Budi Santoso" className="w-full p-2.5 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Nomor Induk Kependudukan (NIK)</label>
                <input type="text" required value={customerNik} onChange={(e) => setCustomerNik(e.target.value)} placeholder="16 Digit NIK KTP" className="w-full p-2.5 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Nomor WhatsApp Aktif</label>
                <input type="text" required value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="Contoh: 08123456789" className="w-full p-2.5 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Nominal Booking Fee (Rp)</label>
                <input type="number" required value={bookingFee} onChange={(e) => setBookingFee(e.target.value)} placeholder="1000000" className="w-full p-2.5 border border-gray-300 rounded-lg text-sm font-bold text-emerald-700" />
              </div>
            </div>

            {/* OPSI METODE PEMBAYARAN */}
            <div className="pt-4 border-t border-gray-100">
              <label className="block text-xs font-semibold text-gray-600 mb-2">Metode Pembayaran Booking Fee</label>
              <div className="flex gap-4">
                <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer font-bold text-sm transition-all ${paymentMethod === 'TRANSFER' ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm' : 'border-gray-200 text-gray-600'}`}>
                  <input type="radio" name="payment" value="TRANSFER" checked={paymentMethod === 'TRANSFER'} onChange={() => setPaymentMethod('TRANSFER')} className="hidden" />
                  Transfer Bank
                </label>
                <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer font-bold text-sm transition-all ${paymentMethod === 'CASH' ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm' : 'border-gray-200 text-gray-600'}`}>
                  <input type="radio" name="payment" value="CASH" checked={paymentMethod === 'CASH'} onChange={() => setPaymentMethod('CASH')} className="hidden" />
                  Cash / Tunai Kantor
                </label>
              </div>
            </div>

            {/* UPLOAD BUKTI TRANSFER (Hanya muncul jika metode TRANSFER) */}
            {paymentMethod === 'TRANSFER' && (
              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-200 mt-4 animate-in fade-in duration-300">
                <label className="block text-xs font-bold text-blue-900 mb-1 flex items-center gap-1">
                  <Upload size={14}/> Unggah Bukti Transfer Bank (Wajib)
                </label>
                <p className="text-[11px] text-slate-500 mb-3">Format file gambar (JPG/PNG) atau PDF bukti transfer dari m-banking/ATM.</p>
                <input 
                  type="file" 
                  accept=".jpg,.jpeg,.png,.pdf" 
                  required={paymentMethod === 'TRANSFER'}
                  onChange={(e) => setProofFile(e.target.files[0])} 
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                />
                {proofFile && (
                  <p className="text-xs text-emerald-600 font-semibold mt-2 flex items-center gap-1">
                    <CheckCircle2 size={14}/> File terpilih: {proofFile.name}
                  </p>
                )}
              </div>
            )}

          </div>

          <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg transition-colors disabled:opacity-50">
            {loading ? 'Mengirim Data Booking...' : 'Konfirmasi & Kirim Booking Unit'}
          </button>

        </form>

      </div>
    </div>
  )
}