import { Printer, X, ShieldCheck } from 'lucide-react'

export default function ReceiptModal({ booking, onClose }) {
  if (!booking) return null

  const transactionDate = new Date(booking.updated_at || booking.created_at).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric'
  })

  const fallbackNo = booking.id ? booking.id.toString().slice(-4).toUpperCase() : '0001'
  const receiptNo = booking.receipt_number || `BCG/KW-BOOKING/2026/${fallbackNo}`

  const marketingName = booking.marketing?.name || 'In-House'
  let agencyName = 'PT BERKAH CAHAYA GEMILANG' 
  const agencyData = booking.marketing?.agencies
  
  if (agencyData) {
    if (Array.isArray(agencyData) && agencyData.length > 0) {
      agencyName = agencyData[0].name
    } else if (agencyData.name) {
      agencyName = agencyData.name
    }
  }

  // URL Verifikasi Publik (Otomatis mendeteksi domain lokal atau online Anda)
  const verifyLink = `${window.location.origin}/verify?code=${receiptNo}`

  // Data Barcode Administrasi sekarang berisi link verifikasi web
  const adminDataQR = encodeURIComponent(verifyLink)
  const mktDataQR = encodeURIComponent(`MARKET_BCG:${marketingName}|AGENCY:${agencyName}`)

  const adminBarcodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${adminDataQR}`
  const mktBarcodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${mktDataQR}`
  const handlePrint = () => {
    window.print()
  }

  return (
    <>
      <style>
        {`
          @media print {
            @page {
              /* Memaksa ukuran 21.5x16 cm dan orientasi Landscape */
              size: 21.5cm 16cm landscape;
              margin: 0; 
            }
            body {
              -webkit-print-color-adjust: exact;
              background-color: white !important;
            }
            body * {
              visibility: hidden;
            }
            .print-container, .print-container * {
              visibility: visible;
            }
            .print-container {
              position: absolute;
              left: 0;
              top: 0;
              width: 21.5cm;
              height: 16cm;
              margin: 0;
              padding: 1.5cm;
              box-shadow: none !important;
              border-radius: 0 !important;
              background: white;
            }
            .no-print {
              display: none !important;
            }
          }
        `}
      </style>

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
        <div className="bg-white w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden relative my-8 print-container">
          
          <div className="bg-slate-900 text-white p-4 flex justify-between items-center no-print">
            <div className="flex items-center gap-2">
              <ShieldCheck className="text-green-400" size={22} />
              <span className="font-bold text-sm">Kwitansi Digital Resmi</span>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={handlePrint} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm">
                <Printer size={16} /> Cetak Kwitansi
              </button>
              <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white">
                <X size={24} />
              </button>
            </div>
          </div>

          <div className="p-8 sm:p-10 bg-white text-slate-800 font-sans h-full flex flex-col">
            
            <div className="border-b-2 border-slate-900 pb-4 mb-5 flex justify-between items-end shrink-0">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-blue-900">PT. BERKAH CAHAYA GEMILANG</h1>
                <p className="text-xs sm:text-sm text-slate-600 font-semibold mt-1">Pengembang Perumahan Mutiara Citra Residence 2 & 3</p>
              </div>
              <div className="text-right">
                <h2 className="text-lg sm:text-xl font-black uppercase tracking-widest text-slate-800">KWITANSI BOOKING FEE</h2>
                <p className="text-xs sm:text-sm font-bold text-red-600 mt-1">No : {receiptNo}</p>
              </div>
            </div>

            <div className="bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-200 mb-6 flex justify-between gap-4 shrink-0">
              <div>
                <span className="font-bold text-slate-800 block mb-1 text-xs sm:text-sm">Pembayaran uang muka dan biaya proses langsung transfer ke rekening:</span>
                <p className="text-slate-700 font-medium text-xs sm:text-sm mt-1">• <b className="text-black">Bank BCA</b> : 5221434464</p>
                <p className="text-slate-700 font-medium text-xs sm:text-sm mt-1">• <b className="text-black">Bank BTN KC Bekasi</b> : 00016-01-30-002804-4</p>
              </div>
              <div className="text-right sm:border-l sm:border-slate-300 sm:pl-6 flex flex-col justify-center">
                <span className="text-[10px] sm:text-xs font-semibold text-slate-500 block mb-0.5">Tanggal Transaksi</span>
                <span className="font-black text-slate-900 text-sm sm:text-base">{transactionDate}</span>
              </div>
            </div>

            <div className="space-y-4 text-sm sm:text-base mb-auto px-2">
              <div className="flex border-b border-dotted border-slate-400 pb-1.5">
                <span className="w-40 sm:w-48 font-semibold text-slate-500">Sudah terima dari</span>
                <span className="flex-1 font-black text-slate-900 uppercase">: {booking.customer_name}</span>
              </div>

              <div className="flex border-b border-dotted border-slate-400 pb-1.5">
                <span className="w-40 sm:w-48 font-semibold text-slate-500">Banyaknya Uang</span>
                <span className="flex-1 font-black text-blue-800 italic uppercase tracking-wide">
                  : # {Number(booking.booking_fee || 1000000).toLocaleString('id-ID')} RUPIAH #
                </span>
              </div>

              <div className="flex border-b border-dotted border-slate-400 pb-1.5 items-start">
                <span className="w-40 sm:w-48 font-semibold text-slate-500">Untuk Pembayaran</span>
                <span className="flex-1 font-semibold text-slate-800">
                  : Booking Fee Perumahan <b className="font-black uppercase">{booking.units?.projects?.project_name || 'Mutiara Citra Residence'}</b>
                </span>
              </div>

              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex justify-around text-center mt-4 shrink-0">
                <div>
                  <span className="text-xs sm:text-sm font-semibold text-slate-500 block mb-0.5">Unit / Blok:</span> 
                  <p className="text-blue-900 text-lg sm:text-xl font-black">{booking.units?.unit_code || '-'}</p>
                </div>
                <div className="border-l-2 border-blue-200"></div>
                <div>
                  <span className="text-xs sm:text-sm font-semibold text-slate-500 block mb-0.5">Nominal Pembayaran:</span> 
                  <p className="text-emerald-700 text-lg sm:text-xl font-black">Rp {Number(booking.booking_fee || 0).toLocaleString('id-ID')},-</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center mt-6 pt-4 shrink-0">
              
              {/* KOLOM AGENSI & MARKETING YANG DIPERBAIKI */}
              <div className="flex flex-col items-center justify-between">
                <div className="h-10 flex flex-col justify-center items-center">
                  <p className="font-bold text-[10px] sm:text-xs text-slate-800">AGENSI / MARKETING</p>
                  <p className="font-bold text-xs sm:text-sm text-blue-800 uppercase tracking-widest mt-0.5">{agencyName}</p>
                </div>
                
                <div className="my-2 p-1.5 bg-white border-2 border-slate-100 rounded-lg shadow-sm inline-block">
                  <img src={mktBarcodeUrl} alt="Barcode Marketing" className="w-16 h-16 sm:w-20 sm:h-20 object-contain mx-auto" />
                </div>
                
                <div className="w-full px-2 sm:px-6">
                  <p className="font-black text-slate-900 border-b-2 border-slate-800 pb-1 truncate uppercase text-xs sm:text-sm">( {marketingName} )</p>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center text-slate-300 opacity-50">
                <ShieldCheck size={32} className="mb-1"/>
                <span className="text-[10px] sm:text-xs font-bold">Dokumen Sah</span>
                <span className="text-[8px] sm:text-[10px] font-semibold">PT Berkah Cahaya Gemilang</span>
              </div>

              <div className="flex flex-col items-center justify-between">
                <div className="h-10 flex flex-col justify-center">
                  <p className="font-bold text-xs sm:text-sm text-slate-800">ADMINISTRASI</p>
                  <p className="text-[10px] font-bold text-slate-600 uppercase mt-0.5">Keuangan PT BCG</p>
                </div>
                <div className="my-2 p-1.5 bg-white border-2 border-slate-100 rounded-lg shadow-sm inline-block">
                  <img src={adminBarcodeUrl} alt="Barcode Administrasi" className="w-16 h-16 sm:w-20 sm:h-20 object-contain mx-auto" />
                </div>
                <div className="w-full px-2 sm:px-6">
                  <p className="font-black text-slate-900 border-b-2 border-slate-800 pb-1 uppercase text-xs sm:text-sm">( Validated System )</p>
                  <p className="text-[10px] text-emerald-600 font-black mt-1 tracking-wider">✓ TERVERIFIKASI</p>
                </div>
              </div>

            </div>

          </div>
        </div>
      </div>
    </>
  )
}