import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Users, UserPlus, Trash2, Shield, Mail, Lock, Briefcase } from 'lucide-react'

// Kunci Master untuk akses Admin tanpa ter-logout
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SERVICE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_KEY

export default function UserManagement() {
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)

  // Form State
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [selectedRole, setSelectedRole] = useState('') // Akan menampung UUID
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    fetchRoles()
    fetchAppUsers()
  }, [])

  // Mengambil daftar Role (Jabatan) dari tabel yang sudah dibuka RLS-nya
  const fetchRoles = async () => {
    try {
      const { data, error } = await supabase.from('roles').select('*')
      if (!error && data) {
        setRoles(data)
      } else {
        console.error("Gagal memuat roles:", error)
      }
    } catch (err) {
      console.error("Error roles:", err)
    }
  }

  const fetchAppUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*, roles(name)')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Error fetching app users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async (e) => {
    e.preventDefault()
    if (!selectedRole) return alert("Mohon pilih Jabatan (Role) terlebih dahulu!")

    setIsCreating(true)
    try {
      // 1. Buat Akun Auth via Admin API (Agar Anda tidak ter-logout)
      const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
        method: 'POST',
        headers: {
          'apikey': SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email,
          password: password,
          email_confirm: true
        })
      })
      
      const newAuthUser = await response.json()
      if (!response.ok) throw new Error(newAuthUser.msg || newAuthUser.message || "Gagal membuat akses login")

      const userId = newAuthUser.id

      // 2. Simpan profil lengkap beserta Jabatannya ke tabel 'users'
      const { error: profileError } = await supabase.from('users').insert([
        {
          id: userId,
          email: email,
          full_name: fullName,
          role_id: selectedRole // Menerima UUID langsung, tanpa Number()
        }
      ])

      if (profileError) throw profileError

      alert("Akun berhasil didaftarkan dan jabatan berhasil ditetapkan!")
      setEmail('')
      setPassword('')
      setFullName('')
      setSelectedRole('')
      fetchAppUsers()
    } catch (error) {
      alert("Gagal membuat akun: " + error.message)
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteUser = async (userId, userEmail) => {
    if (userEmail === 'irvannurcahyo439@gmail.com') {
      return alert("AKSES DITOLAK: Anda tidak bisa menghapus akun Super Admin Utama!")
    }

    if (window.confirm(`Hapus akun ${userEmail} dari daftar sistem?`)) {
      try {
        // Hapus akses login dari sistem Auth
        await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
          method: 'DELETE',
          headers: {
            'apikey': SERVICE_KEY,
            'Authorization': `Bearer ${SERVICE_KEY}`
          }
        })
        
        // Hapus profil dari tabel users
        const { error } = await supabase.from('users').delete().eq('id', userId)
        if (error) throw error
        
        alert("Data akun berhasil dihapus!")
        fetchAppUsers()
      } catch (error) {
        alert("Gagal menghapus data: " + error.message)
      }
    }
  }

  if (loading) return <div className="p-8 text-gray-500 font-bold animate-pulse">Memuat Data Pengguna...</div>

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><Users className="text-blue-600" /> Manajemen Akun Sistem</h1>
        <p className="text-gray-500">Daftarkan akun baru, tentukan jabatan (Direktur, Admin Keuangan, Admin KPR, atau Agensi).</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* KIRI: FORM BUAT AKUN */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
          <h2 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2"><UserPlus size={18} className="text-emerald-600"/> Daftarkan Akun Baru</h2>
          <form onSubmit={handleCreateUser} className="space-y-4">
            
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Nama Lengkap</label>
              <div className="relative">
                <Users size={16} className="absolute left-3 top-3 text-gray-400"/>
                <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nama Karyawan / Agensi" className="w-full pl-9 p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Alamat Email (Login)</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-3 text-gray-400"/>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@perusahaan.com" className="w-full pl-9 p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-3 text-gray-400"/>
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimal 6 karakter" minLength={6} className="w-full pl-9 p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500" />
              </div>
            </div>

            <div className="pt-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Pilih Jabatan (Role)</label>
              <div className="relative">
                <Briefcase size={16} className="absolute left-3 top-3 text-gray-400"/>
                <select 
                  required 
                  value={selectedRole} 
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full pl-9 p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 bg-white cursor-pointer"
                >
                  <option value="" disabled>-- Pilih Jabatan --</option>
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.name.toUpperCase()}</option>
                  ))}
                </select>
              </div>
            </div>

            <button type="submit" disabled={isCreating} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 mt-2 px-4 rounded-xl shadow-md transition-colors text-sm disabled:opacity-50">
              {isCreating ? 'Mendaftarkan...' : 'Daftarkan Akun Baru'}
            </button>
          </form>
        </div>

        {/* KANAN: TABEL DAFTAR AKUN */}
        <div className="xl:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Daftar Pengguna & Jabatan Sistem</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-xs text-gray-500 uppercase bg-gray-50">
                  <th className="py-3 px-4 rounded-tl-lg">Nama & Email</th>
                  <th className="py-3 px-4 text-center">Jabatan (Role)</th>
                  <th className="py-3 px-4 text-center">Tanggal Dibuat</th>
                  <th className="py-3 px-4 text-center rounded-tr-lg">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {users.length === 0 ? (
                  <tr><td colSpan="4" className="text-center py-8 text-gray-400">Belum ada data pengguna...</td></tr>
                ) : (
                  users.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-800 flex items-center gap-1.5">
                          {u.email === 'irvannurcahyo439@gmail.com' && <Shield size={14} className="text-blue-600" title="Super Admin"/>}
                          {u.full_name || 'Tanpa Nama'}
                        </p>
                        <p className="text-xs text-gray-500">{u.email}</p>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="bg-blue-50 text-blue-700 font-bold text-xs px-3 py-1 rounded-full uppercase border border-blue-100">
                          {u.roles?.name || 'User'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-xs text-gray-500">{new Date(u.created_at).toLocaleDateString('id-ID')}</td>
                      <td className="py-3 px-4 text-center">
                        <button 
                          onClick={() => handleDeleteUser(u.id, u.email)}
                          className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white p-2 rounded-lg transition-colors"
                          title="Hapus Pengguna"
                        >
                          <Trash2 size={16} />
                        </button>
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