import { useState, useEffect } from 'react'
import { getProjects, createProject } from '../services/projectService'
import { Building, Plus, MapPin } from 'lucide-react'

export default function MasterProject() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // State untuk form input
  const [formData, setFormData] = useState({
    project_code: '',
    project_name: '',
    location: ''
  })

  const loadProjects = async () => {
    try {
      const data = await getProjects()
      setProjects(data)
    } catch (error) {
      console.error("Gagal memuat project:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProjects()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await createProject(formData)
      alert('Perumahan berhasil ditambahkan!')
      setFormData({ project_code: '', project_name: '', location: '' }) // Reset form
      loadProjects() // Refresh tabel
    } catch (error) {
      alert('Gagal menyimpan: ' + error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Building className="text-blue-600" /> Master Project
        </h1>
        <p className="text-gray-500">Kelola data perumahan PT BERKAH CAHAYA GEMILANG</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri: Form Input */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Plus size={18} /> Tambah Project
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Kode Project</label>
              <input 
                type="text" 
                required
                placeholder="Contoh: MCR-01"
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                value={formData.project_code}
                onChange={(e) => setFormData({...formData, project_code: e.target.value.toUpperCase()})}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Project</label>
              <input 
                type="text" 
                required
                placeholder="Contoh: Mutiara Citra Residence"
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.project_name}
                onChange={(e) => setFormData({...formData, project_name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Lokasi</label>
              <textarea 
                required
                rows="3"
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
              ></textarea>
            </div>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-blue-600 text-white font-bold py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Project'}
            </button>
          </form>
        </div>

        {/* Kolom Kanan: Tabel Data */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-700">
                  <th className="p-4 font-semibold text-sm">Kode</th>
                  <th className="p-4 font-semibold text-sm">Nama Project</th>
                  <th className="p-4 font-semibold text-sm">Lokasi</th>
                  <th className="p-4 font-semibold text-sm">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan="4" className="p-4 text-center text-gray-500">Memuat data...</td></tr>
                ) : projects.length === 0 ? (
                  <tr><td colSpan="4" className="p-4 text-center text-gray-500">Belum ada data project</td></tr>
                ) : (
                  projects.map(project => (
                    <tr key={project.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-bold text-blue-600">{project.project_code}</td>
                      <td className="p-4 font-semibold">{project.project_name}</td>
                      <td className="p-4 text-sm text-gray-600 flex items-start gap-1">
                        <MapPin size={14} className="mt-1 flex-shrink-0" /> {project.location}
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-1 text-xs font-bold bg-green-100 text-green-700 rounded-full">
                          {project.status}
                        </span>
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