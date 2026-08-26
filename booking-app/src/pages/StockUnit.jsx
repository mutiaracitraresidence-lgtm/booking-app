import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Map, Home, Info, X, CheckCircle, Clock, Key, MapPin } from 'lucide-react'

export default function StockUnit() {
  const [units, setUnits] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedUnit, setSelectedUnit] = useState(null) // Untuk Pop-up Detail
  const [activeProject, setActiveProject] = useState('ALL') // Filter Tab

  useEffect(() => {
    fetchUnits()
  }, [])

  const fetchUnits = async () => {
    try {
      const { data, error } = await supabase
        .from('units')
        .select('*, projects(project_name)')
        .order('unit_code', { ascending: true })
      
      if (error) throw error
      setUnits(data || [])
    } catch (error) {
      console.error('Error fetching units:', error)
    } finally {
      setLoading(false)
    }
  }

  // Mendapatkan daftar nama proyek unik untuk Tab Filter
  const projects = ['ALL', ...new Set(units.map(u => u.projects?.project_name).filter(Boolean))]

  // Mengelompokkan Unit berdasarkan Proyek
  const filteredUnits = activeProject === 'ALL' 
    ? units 
    : units.filter(u => u.projects?.project_name === activeProject)

  // Fungsi penentu warna kaveling berdasarkan status
  const getStatusStyle = (status) => {
    switch(status) {
      case 'AVAILABLE': return 'bg-emerald-100 border-emerald-400 text-emerald-800 hover:bg-emerald-200 hover:shadow-emerald-200'
      case 'BOOKED': return 'bg-yellow-100 border-yellow-400 text-yellow-800 hover:bg-yellow-200 hover:shadow-yellow-200'
      case 'SOLD': return 'bg-red-100 border-red-400 text-red-800 hover:bg-red-200 hover:shadow-red-200'
      default: return 'bg-gray-100 border-gray-300 text-gray-500'
    }
  }

  // Menghitung statistik cepat
  const statAvailable = units.filter(u => u.status === 'AVAILABLE').length
  const statBooked = units.filter(u => u.status === 'BOOKED').length
  const statSold = units.filter(u => u.status === 'SOLD').length

  if (loading) return <div className="p-8 font-semibold text-gray-500 animate-pulse">Memuat Denah Siteplan...</div>

  return (
    <div className="p-8 bg-gray-50 min-h-screen relative">
      
      {/* HEADER & LEGEND */}
      <div className="mb-6 flex flex-col lg:flex-row lg:justify-between lg:items-end gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Map className="text-blue-600" /> Virtual Siteplan & Live Stock
          </h1>
          <p className="text-slate-500 mt-1">Pantau ketersediaan unit perumahan secara *real-time*.</p>
        </div>

        {/* Legend Status */}
        <div className="flex bg-white p-2 rounded-lg shadow-sm border border-gray-200 gap-2 sm:gap-6 text-sm font-semibold">
          <div className="flex items-center gap-2 px-2">
            <div className="w-4 h-4 bg-emerald-400 rounded-sm"></div>
            <span className="text-emerald-700">Available ({statAvailable})</span>
          </div>
          <div className="flex items-center gap-2 px-2 border-l border-gray-200">
            <div className="w-4 h-4 bg-yellow-400 rounded-sm"></div>
            <span className="text-yellow-700">Booked ({statBooked})</span>
          </div>
          <div className="flex items-center gap-2 px-2 border-l border-gray-200">
            <div className="w-4 h-4 bg-red-500 rounded-sm"></div>
            <span className="text-red-700">Sold ({statSold})</span>
          </div>
        </div>
      </div>

      {/* FILTER TABS (PROYEK) */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide">
        {projects.map(proj => (
          <button 
            key={proj}
            onClick={() => setActiveProject(proj)}
            className={`px-5 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-all ${activeProject === proj ? 'bg-slate-800 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-100'}`}
          >
            {proj === 'ALL' ? 'Semua Proyek' : proj}
          </button>
        ))}
      </div>

      {/* AREA VIRTUAL SITEPLAN (GRID) */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 min-h-[500px]">
        {filteredUnits.length === 0 ? (
          <div className="text-center text-gray-400 py-20 italic">Belum ada unit yang terdaftar.</div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-4">
            {filteredUnits.map(unit => (
              <button 
                key={unit.id}
                onClick={() => setSelectedUnit(unit)}
                className={`relative flex flex-col items-center justify-center p-3 h-20 rounded-xl border-b-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${getStatusStyle(unit.status)}`}
                title={`Lihat detail ${unit.unit_code}`}
              >
                {/* Ikon Rumah Kecil */}
                <Home size={20} className="mb-1 opacity-70" />
                <span className="font-bold text-xs tracking-wide">{unit.unit_code}</span>
                
                {/* Badge Status Kecil di pojok */}
                {unit.status === 'SOLD' && <Key size={10} className="absolute top-1.5 right-1.5 opacity-50"/>}
                {unit.status === 'BOOKED' && <Clock size={10} className="absolute top-1.5 right-1.5 opacity-50"/>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* MODAL / POP-UP DETAIL UNIT */}
      {selectedUnit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden transform transition-all animate-in fade-in zoom-in duration-200">
            
            {/* Header Modal - Warnanya berubah sesuai status */}
            <div className={`p-6 text-white flex justify-between items-start ${
              selectedUnit.status === 'AVAILABLE' ? 'bg-emerald-500' :
              selectedUnit.status === 'BOOKED' ? 'bg-yellow-500' : 'bg-red-500'
            }`}>
              <div>
                <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase mb-2 inline-block">
                  {selectedUnit.status} UNIT
                </span>
                <h2 className="text-3xl font-black">{selectedUnit.unit_code}</h2>
                <p className="flex items-center gap-1 text-sm font-medium mt-1 opacity-90"><MapPin size={14}/> {selectedUnit.projects?.project_name}</p>
              </div>
              <button onClick={() => setSelectedUnit(null)} className="p-1 bg-white/20 hover:bg-white/40 rounded-full transition-colors"><X size={20} /></button>
            </div>

            {/* Konten Modal */}
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                  <span className="text-gray-500 text-sm font-semibold">Harga Jual</span>
                  <span className="text-xl font-black text-slate-800">
                    Rp {Number(selectedUnit.price).toLocaleString('id-ID')}
                  </span>
                </div>
                
                <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                  <span className="text-gray-500 text-sm font-semibold">Tipe Unit / Bangunan</span>
                  <span className="font-bold text-slate-700">{selectedUnit.type || '-'}</span>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl flex items-start gap-3 mt-4 border border-slate-100">
                  <Info className="text-blue-500 shrink-0 mt-0.5" size={18} />
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    {selectedUnit.status === 'AVAILABLE' 
                      ? 'Unit ini masih tersedia dan siap untuk dibooking oleh konsumen. Silakan arahkan Agensi ke menu Form Booking.' 
                      : selectedUnit.status === 'BOOKED' 
                      ? 'Unit ini sedang dalam proses pemesanan / KPR. Hubungi tim Admin KPR untuk detail berkas konsumen.' 
                      : 'Unit ini telah terjual (Akad/Cash). Data telah dikunci oleh sistem.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button onClick={() => setSelectedUnit(null)} className="px-5 py-2 font-bold text-gray-500 hover:text-gray-800 transition-colors">Tutup Jendela</button>
            </div>

          </div>
        </div>
      )}
      
    </div>
  )
}