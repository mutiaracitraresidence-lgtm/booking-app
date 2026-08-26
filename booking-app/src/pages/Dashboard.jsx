import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getDashboardStats } from '../services/dashboardService'
import { LayoutDashboard, FileText, FileSpreadsheet, FileCheck, Key, BarChart3, Trophy, XCircle } from 'lucide-react'

export default function Dashboard() {
  const { user, userProfile } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      if (userProfile) {
        try {
          const data = await getDashboardStats(userProfile)
          setStats(data)
        } catch (error) {
          console.error("Gagal memuat dashboard:", error)
        } finally {
          setLoading(false)
        }
      }
    }
    loadStats()
  }, [userProfile])

  if (loading) return <div className="p-8 font-semibold text-gray-500 animate-pulse">Memuat Analitik Penjualan...</div>

  const userRole = userProfile?.roles?.name?.toUpperCase() || 'PENGGUNA'
  
  // Mencari skala tertinggi grafik
  const maxBooking = stats ? Math.max(...stats.monthlyData.map(d => Math.max(d.booking, 1))) : 1
  const maxAkad = stats ? Math.max(...stats.monthlyData.map(d => Math.max(d.akad, 1))) : 1

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      
      {/* HEADER WELCOME */}
      <div className="mb-8 bg-gradient-to-r from-slate-900 to-slate-800 p-8 rounded-2xl text-white shadow-lg flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <BarChart3 className="text-blue-400" size={32}/> Dashboard Performa Penjualan
          </h1>
          <p className="text-slate-300">Selamat datang, {user?.email?.split('@')[0]}! Anda login sebagai <span className="font-bold text-yellow-400">{userRole}</span>.</p>
        </div>
        <div className="hidden md:flex h-16 w-16 bg-white/10 rounded-full items-center justify-center backdrop-blur-sm">
          <LayoutDashboard size={32} className="text-blue-300" />
        </div>
      </div>

      {/* 5 KARTU METRIK UTAMA */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-blue-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-bold text-gray-500 mb-1 uppercase">Total Booking</p>
              <h3 className="text-2xl font-black text-gray-800">{stats?.jumlahBooking}</h3>
            </div>
            <div className="p-2 bg-blue-50 rounded-lg"><FileText className="text-blue-600" size={20}/></div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-yellow-400">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-bold text-gray-500 mb-1 uppercase">Berkas Proses</p>
              <h3 className="text-2xl font-black text-gray-800">{stats?.berkasProses}</h3>
            </div>
            <div className="p-2 bg-yellow-50 rounded-lg"><FileSpreadsheet className="text-yellow-600" size={20}/></div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-purple-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-bold text-gray-500 mb-1 uppercase">Tembus SP3K</p>
              <h3 className="text-2xl font-black text-gray-800">{stats?.sp3k}</h3>
            </div>
            <div className="p-2 bg-purple-50 rounded-lg"><FileCheck className="text-purple-600" size={20}/></div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-emerald-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-bold text-gray-500 mb-1 uppercase">Realisasi Akad</p>
              <h3 className="text-2xl font-black text-gray-800">{stats?.akadKredit}</h3>
            </div>
            <div className="p-2 bg-emerald-50 rounded-lg"><Key className="text-emerald-500" size={20}/></div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-red-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-bold text-gray-500 mb-1 uppercase">Ditolak / Mundur</p>
              <h3 className="text-2xl font-black text-red-600">{stats?.berkasBatal}</h3>
            </div>
            <div className="p-2 bg-red-50 rounded-lg"><XCircle className="text-red-500" size={20}/></div>
          </div>
        </div>
      </div>

      {/* GRAFIK TERPISAH (2 Kolom) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        
        {/* GRAFIK 1: BOOKING MASUK */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-base font-bold text-gray-800 mb-6 flex items-center justify-between">
            <span className="flex items-center gap-2"><BarChart3 size={18} className="text-blue-500"/> Tren Booking Masuk ({stats?.currentYear})</span>
            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">Total: {stats?.jumlahBooking}</span>
          </h3>
          <div className="h-48 flex items-end gap-2 border-b border-gray-200 pb-2 relative">
            <div className="absolute w-full top-0 border-t border-dashed border-gray-100 z-0"></div>
            <div className="absolute w-full top-1/2 border-t border-dashed border-gray-100 z-0"></div>
            {stats?.monthlyData.map((data, idx) => {
              const bookHeight = (data.booking / maxBooking) * 100
              return (
                <div key={`book-${idx}`} className="flex-1 flex flex-col items-center gap-1 z-10 h-full justify-end group relative">
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-gray-800 text-white text-[10px] py-1 px-2 rounded transition-opacity">{data.booking} Booking</div>
                  <div className="w-full max-w-[20px] bg-blue-400 rounded-t-sm transition-all duration-700 hover:brightness-110" style={{height: `${bookHeight}%`}}></div>
                  <span className="text-[10px] text-gray-400">{data.month}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* GRAFIK 2: REALISASI AKAD */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-base font-bold text-gray-800 mb-6 flex items-center justify-between">
            <span className="flex items-center gap-2"><BarChart3 size={18} className="text-emerald-500"/> Tren Realisasi Akad ({stats?.currentYear})</span>
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded">Total: {stats?.akadKredit}</span>
          </h3>
          <div className="h-48 flex items-end gap-2 border-b border-gray-200 pb-2 relative">
            <div className="absolute w-full top-0 border-t border-dashed border-gray-100 z-0"></div>
            <div className="absolute w-full top-1/2 border-t border-dashed border-gray-100 z-0"></div>
            {stats?.monthlyData.map((data, idx) => {
              const akadHeight = (data.akad / maxAkad) * 100
              return (
                <div key={`akad-${idx}`} className="flex-1 flex flex-col items-center gap-1 z-10 h-full justify-end group relative">
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-gray-800 text-white text-[10px] py-1 px-2 rounded transition-opacity">{data.akad} Akad</div>
                  <div className="w-full max-w-[20px] bg-emerald-500 rounded-t-sm transition-all duration-700 hover:brightness-110" style={{height: `${akadHeight}%`}}></div>
                  <span className="text-[10px] text-gray-400">{data.month}</span>
                </div>
              )
            })}
          </div>
        </div>

      </div>

      {/* TABEL LEADERBOARD FULL WIDTH */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
          <Trophy size={20} className="text-yellow-500"/> Leaderboard Penjualan Marketing
        </h3>
        <p className="text-xs text-gray-500 mb-4">Peringkat berdasarkan keberhasilan mencetak Akad Kredit terbanyak.</p>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3 px-4 font-semibold text-xs text-gray-500 rounded-tl-lg">Rank</th>
                <th className="py-3 px-4 font-semibold text-xs text-gray-500">Tim Marketing / Agensi</th>
                <th className="py-3 px-4 font-semibold text-xs text-gray-500 text-center">Total Booking</th>
                <th className="py-3 px-4 font-semibold text-xs text-emerald-600 text-center rounded-tr-lg">Realisasi Akad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stats?.performanceRank.length === 0 ? (
                <tr><td colSpan="4" className="py-8 text-center text-gray-400 italic text-sm">Belum ada data penjualan tercatat.</td></tr>
              ) : (
                stats?.performanceRank.map((perf, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      {index === 0 ? <Trophy size={20} className="text-yellow-500 mx-auto"/> : 
                       index === 1 ? <Trophy size={20} className="text-gray-400 mx-auto"/> : 
                       index === 2 ? <Trophy size={20} className="text-amber-700 mx-auto"/> : 
                       <span className="text-gray-500 font-bold text-sm text-center block">{index + 1}</span>}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-sm text-gray-800">{perf.marketing}</p>
                      <p className="text-xs font-medium text-gray-500">{perf.agency}</p>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-gray-700">{perf.total_booking}</td>
                    <td className="py-3 px-4 text-center font-black text-emerald-600">{perf.total_akad}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}