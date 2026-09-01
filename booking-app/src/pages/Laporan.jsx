import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { FileText, Download, Calendar, TrendingUp, Users, DollarSign, CheckCircle2, Clock, XCircle, AlertTriangle, Building2 } from 'lucide-react'

export default function Laporan() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)) // Format: YYYY-MM

  // State untuk Ringkasan Utama
  const [summary, setSummary] = useState({
    totalBooking: 0,
    totalRevenue: 0,
    pemberkasan: 0,
    sp3k: 0,
    akad: 0,
    rejected: 0,
    expired: 0
  })

  // State untuk Rekap Performa Agency
  const [agencySummary, setAgencySummary] = useState([])

  useEffect(() => {
    fetchReportData()
  }, [selectedMonth])

  const fetchReportData = async () => {
    setLoading(true)
    try {
      const [year, month] = selectedMonth.split('-')
      const startDate = new Date(year, month - 1, 1).toISOString()
      const endDate = new Date(year, month, 0, 23, 59, 59).toISOString()

      // Ambil data lengkap untuk kebutuhan rekap direksi
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id, 
          created_at, 
          customer_name, 
          booking_fee, 
          payment_method,
          status,
          kpr_status,
          units (unit_code, unit_type),
          marketing (name, agencies (name))
        `)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false })

      if (error) throw error

      const fetchedData = data || []
      setBookings(fetchedData)

      // Hitung Metrik Ringkasan
      let rev = 0
      let countPemberkasan = 0
      let countSp3k = 0
      let countAkad = 0
      let countRejected = 0
      let countExpired = 0

      const agencyMap = {}

      fetchedData.forEach(item => {
        rev += Number(item.booking_fee) || 0
        const kprStat = item.kpr_status || ''
        const mainStat = item.status || ''

        if (mainStat === 'EXPIRED') {
          countExpired++
        } else if (kprStat === 'SP3K') {
          countSp3k++
        } else if (kprStat === 'Akad Kredit') {
          countAkad++
        } else if (kprStat === 'REJECTED' || mainStat === 'REJECTED') {
          countRejected++
        } else {
          // Masuk kategori proses (Pemberkasan, Berkas Lengkap, Verifikasi Bank, Menunggu Dokumen)
          countPemberkasan++
        }

        // Rekap Per Agency
        const agencyName = item.marketing?.agencies?.name || 'Tanpa Agency'
        if (!agencyMap[agencyName]) {
          agencyMap[agencyName] = { name: agencyName, total: 0, akad: 0 }
        }
        agencyMap[agencyName].total += 1
        if (kprStat === 'Akad Kredit') {
          agencyMap[agencyName].akad += 1
        }
      })

      setSummary({
        totalBooking: fetchedData.length,
        totalRevenue: rev,
        pemberkasan: countPemberkasan,
        sp3k: countSp3k,
        akad: countAkad,
        rejected: countRejected,
        expired: countExpired
      })

      setAgencySummary(Object.values(agencyMap))

    } catch (err) {
      console.error("Gagal mengambil data laporan:", err)
    } finally {
      setLoading(false)
    }
  }

  // ==========================================
  // FUNGSI GENERATE PDF DIREKTUR LENGKAP
  // ==========================================
  const exportPDF = () => {
    const doc = new jsPDF()
    
    // Kop Laporan
    doc.setFillColor(15, 23, 42) // Slate 900
    doc.rect(0, 0, 210, 40, 'F')
    
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(20)
    doc.setFont("helvetica", "bold")
    doc.text("PT. BERKAH CAHAYA GEMILANG", 105, 17, { align: 'center' })
    
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text("Laporan Eksekutif Performa Penjualan & Pemberkasan KPR", 105, 25, { align: 'center' })
    
    // Periode & Ringkasan Atas
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(11)
    doc.setFont("helvetica", "bold")
    doc.text(`Periode Laporan: ${selectedMonth}`, 14, 50)

    doc.setFontSize(9)
    doc.setFont("helvetica", "normal")
    doc.text(`- Total Unit Booking: ${summary.totalBooking} Unit`, 14, 58)
    doc.text(`- Total Pendapatan Booking Fee: Rp ${summary.totalRevenue.toLocaleString('id-ID')}`, 14, 64)
    doc.text(`- Berkas Proses: ${summary.pemberkasan} | SP3K: ${summary.sp3k} | Akad (Selesai): ${summary.akad}`, 14, 70)
    doc.text(`- Berkas Reject: ${summary.rejected} | Expired / Mundur: ${summary.expired}`, 14, 76)

    let currentY = 85

    // Tabel 1: Rekap Performa Agency
    doc.setFont("helvetica", "bold")
    doc.text("Rekapitulasi Penjualan Per Agency", 14, currentY)
    currentY += 4

    const agencyColumns = ["No", "Nama Agency", "Total Unit Booking", "Realisasi Akad"]
    const agencyRows = agencySummary.map((ag, idx) => [idx + 1, ag.name, ag.total, ag.akad])

    doc.autoTable({
      head: [agencyColumns],
      body: agencyRows,
      startY: currentY,
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255] },
      styles: { fontSize: 8, cellPadding: 2 }
    })

    currentY = doc.lastAutoTable.finalY + 10

    // Tabel 2: Detail Transaksi Keseluruhan
    doc.setFont("helvetica", "bold")
    doc.text("Detail Rincian Transaksi Booking", 14, currentY)
    currentY += 4

    const tableColumn = ["No", "Tanggal", "Konsumen", "Unit", "Marketing", "Agency", "Status KPR", "Nominal"]
    const tableRows = bookings.map((b, index) => [
      index + 1,
      new Date(b.created_at).toLocaleDateString('id-ID'),
      b.customer_name,
      b.units ? b.units.unit_code : '-',
      b.marketing ? b.marketing.name : '-',
      b.marketing?.agencies?.name || '-',
      b.kpr_status || b.status,
      Number(b.booking_fee).toLocaleString('id-ID')
    ])

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: currentY,
      theme: 'grid',
      headStyles: { fillColor: [22, 163, 74], textColor: [255, 255, 255] }, // Emerald
      styles: { fontSize: 8, cellPadding: 2 },
      alternateRowStyles: { fillColor: [248, 250, 252] }
    })

    // Footer
    const today = new Date().toLocaleDateString('id-ID')
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text(`Dicetak otomatis oleh sistem pada: ${today}`, 14, doc.lastAutoTable.finalY + 12)

    doc.save(`Laporan_Eksekutif_Direksi_${selectedMonth}.pdf`)
  }

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
              <FileText className="text-blue-600" size={32}/> Laporan Eksekutif Direksi
            </h1>
            <p className="text-slate-500 mt-1">Rekapitulasi lengkap performa penjualan, tahapan KPR, dan agensi.</p>
          </div>

          <div className="flex items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-slate-200">
            <Calendar className="text-slate-400 ml-2" size={20}/>
            <input 
              type="month" 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="p-2 outline-none text-slate-700 font-semibold bg-transparent cursor-pointer"
            />
          </div>
        </div>

        {/* Grid Kartu Statistik Utama */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl"><TrendingUp size={24}/></div>
            <div>
              <p className="text-slate-500 font-medium text-xs">Total Unit Booking</p>
              <h3 className="text-2xl font-black text-slate-800">{summary.totalBooking} <span className="text-xs font-normal text-slate-500">Unit</span></h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-xl"><DollarSign size={24}/></div>
            <div>
              <p className="text-slate-500 font-medium text-xs">Total Pendapatan Fee</p>
              <h3 className="text-xl font-black text-slate-800">Rp {summary.totalRevenue.toLocaleString('id-ID')}</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-amber-100 text-amber-600 rounded-xl"><Clock size={24}/></div>
            <div>
              <p className="text-slate-500 font-medium text-xs">Berkas Proses KPR</p>
              <h3 className="text-2xl font-black text-slate-800">{summary.pemberkasan} <span className="text-xs font-normal text-slate-500">Unit</span></h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-green-100 text-green-600 rounded-xl"><CheckCircle2 size={24}/></div>
            <div>
              <p className="text-slate-500 font-medium text-xs">Realisasi Akad Kredit</p>
              <h3 className="text-2xl font-black text-slate-800">{summary.akad} <span className="text-xs font-normal text-slate-500">Unit</span></h3>
            </div>
          </div>
        </div>

        {/* Grid Kartu Statistik Sekunder (SP3K, Reject, Expired) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-xs font-semibold">SP3K Terbit</p>
              <p className="text-xl font-bold text-blue-600">{summary.sp3k} Unit</p>
            </div>
            <FileText className="text-blue-400" size={20}/>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-xs font-semibold">Berkas Reject Bank</p>
              <p className="text-xl font-bold text-red-600">{summary.rejected} Unit</p>
            </div>
            <XCircle className="text-red-400" size={20}/>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-xs font-semibold">Expired / Mundur (Available)</p>
              <p className="text-xl font-bold text-amber-600">{summary.expired} Unit</p>
            </div>
            <AlertTriangle className="text-amber-400" size={20}/>
          </div>
        </div>

        {/* Tabel Rekapitulasi Penjualan Per Agency */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
          <div className="p-5 border-b border-slate-100 bg-slate-100 flex items-center gap-2">
            <Building2 size={18} className="text-slate-700"/>
            <h3 className="font-bold text-slate-800">Total Penjualan Setiap Agency ({selectedMonth})</h3>
          </div>
          <div className="overflow-x-auto p-4">
            {agencySummary.length === 0 ? (
              <p className="text-center text-slate-500 py-6">Belum ada data agensi pada bulan ini.</p>
            ) : (
              <table className="w-full text-sm text-left text-slate-600">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Nama Agency</th>
                    <th className="px-4 py-3 text-center">Total Unit Booking</th>
                    <th className="px-4 py-3 text-center">Realisasi Akad</th>
                  </tr>
                </thead>
                <tbody>
                  {agencySummary.map((ag, idx) => (
                    <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 font-semibold text-slate-700">{ag.name}</td>
                      <td className="px-4 py-3 text-center font-bold text-blue-600">{ag.total} Unit</td>
                      <td className="px-4 py-3 text-center font-bold text-emerald-600">{ag.akad} Unit</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Tabel Preview Rincian Transaksi */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-800">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Users size={18}/> Detail Transaksi Bulanan ({selectedMonth})
            </h3>
            
            {/* TOMBOL UNDUH PDF */}
            <button 
              onClick={exportPDF}
              disabled={loading || bookings.length === 0}
              className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition disabled:opacity-50"
            >
              <Download size={18} /> Ekspor PDF Direksi
            </button>
          </div>

          <div className="overflow-x-auto p-4">
            {loading ? (
              <p className="text-center text-slate-500 py-10">Memuat data laporan...</p>
            ) : bookings.length === 0 ? (
              <p className="text-center text-slate-500 py-10">Tidak ada data transaksi pada bulan ini.</p>
            ) : (
              <table className="w-full text-sm text-left text-slate-600">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Tanggal</th>
                    <th className="px-4 py-3">Konsumen</th>
                    <th className="px-4 py-3">Unit</th>
                    <th className="px-4 py-3">Marketing / Agency</th>
                    <th className="px-4 py-3">Status KPR</th>
                    <th className="px-4 py-3">Nominal (Rp)</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(b => (
                    <tr key={b.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3">{new Date(b.created_at).toLocaleDateString('id-ID')}</td>
                      <td className="px-4 py-3 font-semibold text-slate-700">{b.customer_name}</td>
                      <td className="px-4 py-3">{b.units?.unit_code || '-'}</td>
                      <td className="px-4 py-3">
                        {b.marketing?.name || '-'}<br/>
                        <span className="text-xs text-slate-400">{b.marketing?.agencies?.name}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded">
                          {b.kpr_status || b.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold text-emerald-600">
                        {Number(b.booking_fee).toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}