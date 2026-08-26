import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { forceResetUnitStatus } from '../services/bookingService'
import { Building, Home, CheckCircle, Clock, Key } from 'lucide-react'

export default function MasterUnit() {
  const [projects, setProjects] = useState([])
  const [units, setUnits] = useState([])
  const [loading, setLoading] = useState(true)

  const [selectedProject, setSelectedProject] = useState('')
  const [blok, setBlok] = useState('')
  const [nomorUnit, setNomorUnit] = useState('')
  const [tipe, setTipe] = useState('')
  const [harga, setHarga] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const { data: projData } = await supabase.from('projects').select('*')
      setProjects(projData || [])

      const { data: unitData } = await supabase.from('units').select('*, projects(project_name)').order('unit_code', { ascending: true })
      setUnits(unitData || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const getSelectedProjectCode = () => {
    const proj = projects.find(p => p.id === Number(selectedProject))
    if (!proj) return 'PROJ'
    return proj.project_name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 5)
  }

  const generatedCode = selectedProject && blok && nomorUnit ? `${getSelectedProjectCode()}-${blok.toUpperCase()}-${nomorUnit}` : ''

  const handleAddUnit = async (e) => {
    e.preventDefault()
    if (!generatedCode) return alert("Mohon lengkapi data blok dan nomor unit!")

    try {
      const { error } = await supabase.from('units').insert([
        {
          project_id: selectedProject,
          unit_code: generatedCode,
          type: tipe,
          price: Number(harga),
          status: 'AVAILABLE'
        }
      ])
      if (error) throw error

      alert("Unit baru berhasil ditambahkan!")
      setBlok('')
      setNomorUnit('')
      setTipe('')
      setHarga('')
      fetchData()
    } catch (err) {
      alert("Gagal menambah unit: " + err.message)
    }
  }

  // FUNGSI BARU: Menangani Pilihan Dropdown
  const handleActionChange = async (unitId, unitCode, actionReason) => {
    if (!actionReason) return

    const confirmMsg = `PERINGATAN: Anda memilih "${actionReason}" untuk unit ${unitCode}.\n\nIni akan mereset status kaveling menjadi AVAILABLE dan membatalkan data booking/KPR yang sedang berjalan. Apakah Anda yakin ingin melanjutkan?`

    if (window.confirm(confirmMsg)) {
      try {
        await forceResetUnitStatus(unitId, actionReason)
        alert(`Unit ${unitCode} berhasil dikosongkan karena ${actionReason}!`)
        fetchData()
      } catch (err) {
        alert("Gagal memperbarui status: " + err.message)
        fetchData()
      }
    } else {
      // Jika user klik cancel, kembalikan data tabel seperti semula
      fetchData()
    }
  }

  if (loading) return <div className="p-8 font-semibold text-gray-500">Memuat Data Master Unit...</div>

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><Home className="text-blue-600" /> Master Unit Perumahan</h1>
        <p className="text-gray-500">Kelola daftar kaveling unit dan atur ulang status unit jika konsumen batal atau pindah.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* KOLOM KIRI: FORM TAMBAH UNIT */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><Building size={18} className="text-blue-600"/> Tambah Unit Baru</h2>
          <form onSubmit={handleAddUnit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Pilih Project</label>
              <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)} required className="w-full p-2.5 border rounded-lg text-sm bg-white">
                <option value="">-- Pilih Project --</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.project_name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Blok</label>
                <input type="text" value={blok} onChange={(e) => setBlok(e.target.value)} placeholder="Contoh: A12" required className="w-full p-2.5 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">No Unit</label>
                <input type="text" value={nomorUnit} onChange={(e) => setNomorUnit(e.target.value)} placeholder="Contoh: 01" required className="w-full p-2.5 border rounded-lg text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Kode Unit (Otomatis)</label>
              <input type="text" value={generatedCode} disabled placeholder="Terisi otomatis..." className="w-full p-2.5 border rounded-lg text-sm bg-gray-100 text-gray-500 font-mono font-bold" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Tipe (L/B)</label>
              <input type="text" value={tipe} onChange={(e) => setTipe(e.target.value)} placeholder="Contoh: 36/60" required className="w-full p-2.5 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Harga Jual (Rp)</label>
              <input type="number" value={harga} onChange={(e) => setHarga(e.target.value)} placeholder="185000000" required className="w-full p-2.5 border rounded-lg text-sm font-bold text-emerald-700" />
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-lg shadow transition-colors text-sm">
              Simpan Unit Baru
            </button>
          </form>
        </div>

        {/* KOLOM KANAN: TABEL DAFTAR UNIT */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Daftar Seluruh Unit Kaveling</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-xs text-gray-500 uppercase">
                  <th className="py-3 px-3">Project</th>
                  <th className="py-3 px-3">Kode Unit</th>
                  <th className="py-3 px-3">Tipe</th>
                  <th className="py-3 px-3">Harga</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-center">Aksi / Edit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {units.length === 0 ? (
                  <tr><td colSpan="6" className="py-8 text-center text-gray-400 italic">Belum ada unit terdaftar.</td></tr>
                ) : (
                  units.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="py-3 px-3 font-semibold text-gray-700 text-xs">{u.projects?.project_name}</td>
                      <td className="py-3 px-3 font-bold text-blue-700">{u.unit_code}</td>
                      <td className="py-3 px-3 text-gray-600 text-xs">{u.type || '-'}</td>
                      <td className="py-3 px-3 font-bold text-slate-800">Rp {Number(u.price).toLocaleString('id-ID')}</td>
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                          u.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-800' :
                          u.status === 'BOOKED' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {u.status === 'AVAILABLE' && <CheckCircle size={10}/>}
                          {u.status === 'BOOKED' && <Clock size={10}/>}
                          {u.status === 'SOLD' && <Key size={10}/>}
                          {u.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        {u.status !== 'AVAILABLE' ? (
                          /* DROPDOWN MENU AKSI */
                          <select
                            onChange={(e) => {
                              handleActionChange(u.id, u.unit_code, e.target.value)
                              e.target.value = "" // Reset dropdown setelah dipilih
                            }}
                            defaultValue=""
                            className="bg-white border border-gray-300 text-slate-700 text-xs rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2 cursor-pointer shadow-sm font-semibold mx-auto"
                          >
                            <option value="" disabled>-- Pilih Aksi --</option>
                            <option value="Batal / Mundur">Batal / Mundur</option>
                            <option value="Pindah Kavling">Pindah Kavling</option>
                          </select>
                        ) : (
                          <span className="text-xs text-emerald-500 font-semibold bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">Siap Jual</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}