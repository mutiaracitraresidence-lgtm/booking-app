import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import {
  Users,
  UserPlus,
  Trash2,
  Shield,
  Mail,
  Lock,
  Briefcase,
} from 'lucide-react'

export default function UserManagement() {
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])

  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [deletingUserId, setDeletingUserId] = useState(null)

  // Form state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [selectedRole, setSelectedRole] = useState('')

  useEffect(() => {
    loadInitialData()
  }, [])

  // =========================================================
  // LOAD DATA AWAL
  // =========================================================

  const loadInitialData = async () => {
    setLoading(true)

    try {
      await Promise.all([
        fetchRoles(),
        fetchAppUsers(),
      ])
    } finally {
      setLoading(false)
    }
  }

  // =========================================================
  // AMBIL DATA ROLE
  // =========================================================

  const fetchRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('id, name')
        .order('name', { ascending: true })

      if (error) {
        throw error
      }

      setRoles(data || [])
    } catch (error) {
      console.error('Gagal memuat roles:', error)
      setRoles([])
    }
  }

  // =========================================================
  // AMBIL DATA USER
  // =========================================================

  const fetchAppUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          email,
          full_name,
          role_id,
          created_at,
          roles (
            id,
            name
          )
        `)
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      setUsers(data || [])
    } catch (error) {
      console.error('Error fetching app users:', error)
      setUsers([])
    }
  }

  // =========================================================
  // RESET FORM
  // =========================================================

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setFullName('')
    setSelectedRole('')
  }

  // =========================================================
  // BUAT USER BARU
  // =========================================================

  const handleCreateUser = async (e) => {
    e.preventDefault()

    if (isCreating) return

    const cleanName = fullName.trim()
    const cleanEmail = email.trim().toLowerCase()

    if (!cleanName) {
      alert('Nama lengkap wajib diisi.')
      return
    }

    if (!cleanEmail) {
      alert('Email wajib diisi.')
      return
    }

    if (!password || password.length < 6) {
      alert('Password minimal 6 karakter.')
      return
    }

    if (!selectedRole) {
      alert('Mohon pilih Jabatan (Role) terlebih dahulu.')
      return
    }

    setIsCreating(true)

    try {
      const { data, error } = await supabase.functions.invoke(
        'create-user',
        {
          body: {
            email: cleanEmail,
            password,
            fullName: cleanName,
            roleId: selectedRole,
          },
        }
      )

      if (error) {
        throw error
      }

      if (!data?.success) {
        throw new Error(
          data?.message || 'Gagal membuat akun.'
        )
      }

      alert(
        data?.message ||
          'Akun berhasil didaftarkan dan jabatan berhasil ditetapkan.'
      )

      resetForm()
      await fetchAppUsers()
    } catch (error) {
      console.error('Create user error:', error)

      let message =
        error?.message || 'Terjadi kesalahan saat membuat akun.'

      // Coba membaca response dari Edge Function jika tersedia
      try {
        if (error?.context?.response) {
          const response = error.context.response.clone()
          const body = await response.json()

          if (body?.message) {
            message = body.message
          }
        }
      } catch (parseError) {
        console.warn(
          'Tidak dapat membaca detail error Edge Function:',
          parseError
        )
      }

      alert(`Gagal membuat akun: ${message}`)
    } finally {
      setIsCreating(false)
    }
  }

  // =========================================================
  // HAPUS USER
  // =========================================================

  const handleDeleteUser = async (userId, userEmail) => {
    if (!userId) {
      alert('ID user tidak ditemukan.')
      return
    }

    // Lindungi Super Admin Utama
    if (
      userEmail?.toLowerCase() ===
      'irvannurcahyo439@gmail.com'
    ) {
      alert(
        'AKSES DITOLAK: Anda tidak bisa menghapus akun Super Admin Utama.'
      )
      return
    }

    const confirmed = window.confirm(
      `Apakah Anda yakin ingin menghapus akun ${userEmail}?`
    )

    if (!confirmed) {
      return
    }

    setDeletingUserId(userId)

    try {
      const { data, error } = await supabase.functions.invoke(
        'delete-user',
        {
          body: {
            userId,
          },
        }
      )

      if (error) {
        throw error
      }

      if (!data?.success) {
        throw new Error(
          data?.message || 'Gagal menghapus akun.'
        )
      }

      alert(
        data?.message || 'Data akun berhasil dihapus.'
      )

      await fetchAppUsers()
    } catch (error) {
      console.error('Delete user error:', error)

      alert(
        `Gagal menghapus data: ${
          error?.message || 'Terjadi kesalahan.'
        }`
      )
    } finally {
      setDeletingUserId(null)
    }
  }

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="p-8 text-gray-500 font-bold animate-pulse">
        Memuat Data Pengguna...
      </div>
    )
  }

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Users className="text-blue-600" />
          Manajemen Akun Sistem
        </h1>

        <p className="text-gray-500 mt-1">
          Daftarkan akun baru dan tentukan jabatan pengguna
          dalam sistem.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* =====================================================
            FORM CREATE USER
        ====================================================== */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
          <h2 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
            <UserPlus
              size={18}
              className="text-emerald-600"
            />
            Daftarkan Akun Baru
          </h2>

          <form
            onSubmit={handleCreateUser}
            className="space-y-4"
          >
            {/* Nama */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Nama Lengkap
              </label>

              <div className="relative">
                <Users
                  size={16}
                  className="absolute left-3 top-3 text-gray-400"
                />

                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) =>
                    setFullName(e.target.value)
                  }
                  placeholder="Nama Karyawan / Agensi"
                  className="w-full pl-9 p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Alamat Email (Login)
              </label>

              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3 top-3 text-gray-400"
                />

                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  placeholder="email@perusahaan.com"
                  className="w-full pl-9 p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Password
              </label>

              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3 top-3 text-gray-400"
                />

                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  placeholder="Minimal 6 karakter"
                  minLength={6}
                  className="w-full pl-9 p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Role */}
            <div className="pt-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Pilih Jabatan (Role)
              </label>

              <div className="relative">
                <Briefcase
                  size={16}
                  className="absolute left-3 top-3 text-gray-400"
                />

                <select
                  required
                  value={selectedRole}
                  onChange={(e) =>
                    setSelectedRole(e.target.value)
                  }
                  className="w-full pl-9 p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 bg-white cursor-pointer"
                >
                  <option value="" disabled>
                    -- Pilih Jabatan --
                  </option>

                  {roles.map((role) => (
                    <option
                      key={role.id}
                      value={role.id}
                    >
                      {String(role.name || '').toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isCreating}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 mt-2 px-4 rounded-xl shadow-md transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating
                ? 'Mendaftarkan...'
                : 'Daftarkan Akun Baru'}
            </button>
          </form>
        </div>

        {/* =====================================================
            TABEL USER
        ====================================================== */}
        <div className="xl:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Daftar Pengguna & Jabatan Sistem
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Total pengguna: {users.length}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-xs text-gray-500 uppercase bg-gray-50">
                  <th className="py-3 px-4 rounded-tl-lg">
                    Nama & Email
                  </th>

                  <th className="py-3 px-4 text-center">
                    Jabatan (Role)
                  </th>

                  <th className="py-3 px-4 text-center">
                    Tanggal Dibuat
                  </th>

                  <th className="py-3 px-4 text-center rounded-tr-lg">
                    Aksi
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 text-sm">
                {users.length === 0 ? (
                  <tr>
                    <td
                      colSpan="4"
                      className="text-center py-8 text-gray-400"
                    >
                      Belum ada data pengguna...
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-gray-50"
                    >
                      {/* Nama */}
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-800 flex items-center gap-1.5">
                          {user.email
                            ?.toLowerCase() ===
                            'irvannurcahyo439@gmail.com' && (
                            <Shield
                              size={14}
                              className="text-blue-600"
                              title="Super Admin"
                            />
                          )}

                          {user.full_name ||
                            'Tanpa Nama'}
                        </p>

                        <p className="text-xs text-gray-500">
                          {user.email}
                        </p>
                      </td>

                      {/* Role */}
                      <td className="py-3 px-4 text-center">
                        <span className="bg-blue-50 text-blue-700 font-bold text-xs px-3 py-1 rounded-full uppercase border border-blue-100">
                          {user.roles?.name ||
                            'User'}
                        </span>
                      </td>

                      {/* Created At */}
                      <td className="py-3 px-4 text-center text-xs text-gray-500">
                        {user.created_at
                          ? new Date(
                              user.created_at
                            ).toLocaleDateString(
                              'id-ID'
                            )
                          : '-'}
                      </td>

                      {/* Delete */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteUser(
                              user.id,
                              user.email
                            )
                          }
                          disabled={
                            deletingUserId ===
                            user.id
                          }
                          className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Hapus Pengguna"
                        >
                          {deletingUserId ===
                          user.id ? (
                            <span className="text-xs px-1">
                              ...
                            </span>
                          ) : (
                            <Trash2 size={16} />
                          )}
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