import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { FileText, Download, Calendar, TrendingUp, Users, DollarSign } from 'lucide-react'

export default function Laporan() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)) // Format: YYYY-MM

  // State untuk Ringkasan
  const [totalBooking, setTotalBooking] = useState(0)
  const [totalRevenue, setTotalRevenue] = useState(0)

  useEffect(() => {
    fetchReportData()
  }, [selectedMonth])

  const fetchReportData = async () => {
    setLoading(true)
    try {
      // Mengambil bulan dan tahun yang dipilih
      const [year, month] = selectedMonth.split('-')
      
      // Rentang tanggal awal dan akhir bulan
      const startDate = new Date(year, month - 1, 1).toISOString()
      const endDate = new Date(year, month, 0, 23, 59, 59).toISOString()

      // Ambil data booking beserta relasi unit dan marketing (sesuaikan nama tabel Anda jika berbeda)
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id, 
          created_at, 
          customer_name, 
          booking_fee, 
          payment_method,
          units (unit_code, unit_type),
          marketing (name)
        `)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false })

      if (error) throw error

      const fetchedData = data || []
      setBookings(fetchedData)

      // Hitung ringkasan
      setTotalBooking(fetchedData.length)
      const revenue = fetchedData.reduce((sum, item) => sum + Number(item.booking_fee), 0)
      setTotalRevenue(revenue)

    } catch (err) {
      console.error("Gagal mengambil data laporan:", err)
    } finally {
      setLoading(false)
    }
  }

  // ==========================================
  // FUNGSI GENERATE PDF UNTUK DIREKTUR
  // ==========================================
  const exportPDF = () => {
    const doc = new jsPDF()
    
    // Warna & Styling Kop Laporan
    doc.setFillColor(15, 23, 42) // Warna Header (Slate 900)
    doc.rect(0, 0, 210, 40, 'F')
    
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(22)
    doc.setFont("helvetica", "bold")
    doc.text("PT. BERKAH CAHAYA GEMILANG", 105, 18, { align: 'center' })
    
    doc.setFontSize(11)
    doc.setFont("helvetica", "normal")
    doc.text("Laporan Performa Penjualan & Booking Unit", 105, 26, { align: 'center' })
    
    // Info Bulan Cetak
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text(`Periode Laporan: ${selectedMonth}`, 14, 55)

    // Kotak Ringkasan Eksekutif
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text(`Total Unit Terbooking: ${totalBooking} Unit`, 14, 63)
    doc.text(`Total Pendapatan Booking Fee: Rp ${totalRevenue.toLocaleString('id-ID')}`, 14, 69)

    // Mempersiapkan Data Tabel
    const tableColumn = ["No", "Tanggal", "Nama Konsumen", "Unit & Tipe", "Marketing", "Metode", "Nominal (Rp)"]
    const tableRows = []

    bookings.forEach((b, index) => {
      const date = new Date(b.created_at).toLocaleDateString('id-ID')
      const unitInfo = b.units ? `${b.units.unit_code} (${b.units.unit_type})` : '-'
      const marketingName = b.marketing ? b.marketing.name : '-'
      const fee = Number(b.booking_fee).toLocaleString('id-ID')

      tableRows.push([
        index + 1,
        date,
        b.customer_name,
        unitInfo,
        marketingName,
        b.payment_method,
        fee
      ])
    })

    // Render Tabel ke PDF
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 80,
      theme: 'grid',
      headStyles: { fillColor: [22, 163, 74], textColor: [255, 255, 255] }, // Warna Hijau Emerald
      styles: { fontSize: 9, cellPadding: 3 },
      alternateRowStyles: { fillColor: [248, 250, 252] }
    })

    // Footer Tanggal Cetak
    const today = new Date().toLocaleDateString('id-ID')
    doc.setFontSize(9)
    doc.setTextColor(150, 150, 150)
    doc.text(`Dicetak secara otomatis oleh sistem pada: ${today}`, 14, doc.lastAutoTable.finalY + 15)

    // Download file
    doc.save(`Laporan_Penjualan_BCG_${selectedMonth}.pdf`)
  }

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
              <FileText className="text-blue-600" size={32}/> Laporan Eksekutif
            </h1>
            <p className="text-slate-500 mt-1">Unduh rekapitulasi data penjualan bulanan untuk Direktur.</p>
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

        {/* Statistik Cepat */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5">
            <div className="p-4 bg-emerald-100 text-emerald-600 rounded-2xl">
              <TrendingUp size={32}/>
            </div>
            <div>
              <p className="text-slate-500 font-semibold text-sm mb-1">Total Unit Ter-Booking</p>
              <h3 className="text-3xl font-black text-slate-800">{totalBooking} <span className="text-sm font-medium text-slate-500">Unit</span></h3>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5">
            <div className="p-4 bg-blue-100 text-blue-600 rounded-2xl">
              <DollarSign size={32}/>
            </div>
            <div>
              <p className="text-slate-500 font-semibold text-sm mb-1">Total Pendapatan (Booking Fee)</p>
              <h3 className="text-3xl font-black text-slate-800">Rp {totalRevenue.toLocaleString('id-ID')}</h3>
            </div>
          </div>
        </div>

        {/* Tabel Preview */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-800">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Users size={18}/> Preview Data {selectedMonth}
            </h3>
            
            {/* TOMBOL UNDUH PDF */}
            <button 
              onClick={exportPDF}
              disabled={loading || bookings.length === 0}
              className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition disabled:opacity-50"
            >
              <Download size={18} /> Ekspor PDF
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
                    <th className="px-4 py-3">Marketing</th>
                    <th className="px-4 py-3">Nominal (Rp)</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(b => (
                    <tr key={b.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3">{new Date(b.created_at).toLocaleDateString('id-ID')}</td>
                      <td className="px-4 py-3 font-semibold text-slate-700">{b.customer_name}</td>
                      <td className="px-4 py-3">{b.units?.unit_code || '-'}</td>
                      <td className="px-4 py-3">{b.marketing?.name || '-'}</td>
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