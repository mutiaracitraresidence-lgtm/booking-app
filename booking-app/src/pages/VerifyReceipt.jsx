import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ShieldCheck, CheckCircle2, Building2, User, Home, Calendar, CreditCard, AlertCircle } from 'lucide-react'

export default function VerifyReceipt() {
  const [searchParams] = useSearchParams()
  const code = searchParams.get('code') // Contoh link nanti: /verify?code=BCG/KW-BOOKING/2026/EA9D
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetchReceiptData = async () => {
      if (!code) {
        setError(true)
        setLoading(false)
        return
      }

      try {
        // Cari data booking berdasarkan nomor kwitansi
        const { data: bookingData, error: dbError } = await supabase
          .from('bookings')
          .select(`
            *,
            units(unit_code, price, projects(project_name)),
            marketing(name, agencies(name))
          `)
          .eq('receipt_number', code)
          .single()

        if (dbError || !bookingData) {
          setError(true)
        } else {
          setData(bookingData)
        }
      } catch (err) {
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchReceiptData()
  }, [code])

  if (loading) {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white font-medium animate-pulse">Memverifikasi Keaslian Dokumen...</div>
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white max-w-md w-full p-8 rounded-2xl text-center shadow-2xl">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={32} />
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-2">Dokumen Tidak Valid</h1>
          <p className="text-sm text-slate-500 mb-6">Nomor kwitansi tidak ditemukan atau dokumen ini tidak terdaftar di database resmi PT Berkah Cahaya Gemilang.</p>
          <div className="bg-slate-50 p-3 rounded-lg text-xs text-slate-400 font-mono">Kode: {code || 'KOSONG'}</div>
        </div>
      </div>
    )
  }

  const transactionDate = new Date(data.updated_at || data.created_at).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric'
  })

  let agencyName = 'PT Berkah Cahaya Gemilang'
  if (data.marketing?.agencies) {
    if (Array.isArray(data.marketing.agencies) && data.marketing.agencies.length > 0) {
      agencyName = data.marketing.agencies[0].name
    } else if (data.marketing.agencies.name) {
      agencyName = data.marketing.agencies.name
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
        
        {/* Header Sukses Terverifikasi */}
        <div className="bg-emerald-600 text-white p-8 text-center relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
          <div className="w-20 h-20 bg-white text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg animate-bounce duration-1000">
            <ShieldCheck size={44} />
          </div>
          <span className="bg-emerald-700/60 text-emerald-100 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-emerald-500 inline-block mb-1">
            Resmi & Terverifikasi Sistem
          </span>
          <h1 className="text-2xl font-black">KWITANSI SAH & ASLI</h1>
          <p className="text-emerald-100 text-xs mt-1">PT Berkah Cahaya Gemilang • Sistem Keuangan Terpadu</p>
        </div>

        {/* Detail Informasi */}
        <div className="p-8 space-y-6">
          
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex justify-between items-center">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Nomor Kwitansi</span>
              <span className="text-sm sm:text-base font-black text-blue-900 font-mono">{data.receipt_number}</span>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Tanggal</span>
              <span className="text-xs sm:text-sm font-bold text-slate-700">{transactionDate}</span>
            </div>
          </div>

          <div className="space-y-4 text-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0"><User size={18}/></div>
              <div>
                <span className="text-xs text-slate-400 font-semibold block">Nama Pemesan / Konsumen</span>
                <span className="font-bold text-slate-800 uppercase">{data.customer_name}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0"><Home size={18}/></div>
              <div>
                <span className="text-xs text-slate-400 font-semibold block">Proyek & Unit Kavling</span>
                <span className="font-bold text-blue-900">{data.units?.projects?.project_name} • Unit <span className="underline">{data.units?.unit_code}</span></span>
              </div>
            </div>

            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0"><CreditCard size={18}/></div>
              <div>
                <span className="text-xs text-slate-400 font-semibold block">Nominal Booking Fee</span>
                <span className="font-black text-emerald-700 text-lg">Rp {Number(data.booking_fee).toLocaleString('id-ID')}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pb-1">
              <div className="w-9 h-9 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center shrink-0"><Building2 size={18}/></div>
              <div>
                <span className="text-xs text-slate-400 font-semibold block">Tim Penjual / Marketing</span>
                <span className="font-bold text-slate-800">{data.marketing?.name || 'In-House'}</span>
                <span className="text-xs text-purple-700 font-semibold block">{agencyName}</span>
              </div>
            </div>
          </div>

          {/* Footer Card */}
          <div className="pt-4 border-t border-slate-100 text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 py-2.5 rounded-xl border border-emerald-100">
              <CheckCircle2 size={16} /> Status Transaksi: LUNAS & DISETUJUI KEUANGAN
            </div>
            <p className="text-[10px] text-slate-400 mt-4">Dokumen digital ini diterbitkan secara otomatis oleh server PT Berkah Cahaya Gemilang.</p>
          </div>

        </div>

      </div>
    </div>
  )
}