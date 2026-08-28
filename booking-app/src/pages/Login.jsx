import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Lock, Loader2, ShieldCheck, ArrowLeft, Eye, EyeOff } from 'lucide-react'

export default function ChangePassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const navigate = useNavigate()

  const handleUpdatePassword = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (password !== confirmPassword) {
      setError('Konfirmasi password tidak cocok.')
      return
    }

    if (password.length < 6) {
      setError('Password baru minimal harus 6 karakter.')
      return
    }

    setLoading(true)

    try {
      // Fungsi Supabase untuk memperbarui password user yang sedang login
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) throw error

      setSuccess('Password berhasil diperbarui! Mengalihkan ke dashboard...')
      setTimeout(() => {
        navigate('/')
      }, 2000)
    } catch (err) {
      setError(err.message || 'Gagal memperbarui password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md bg-slate-800/80 backdrop-blur-xl border border-slate-700 rounded-3xl p-8 shadow-2xl">
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mb-4">
            <ShieldCheck className="text-emerald-400" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-white">Ganti Password Baru</h2>
          <p className="text-slate-400 text-sm mt-2">
            Silakan masukkan kata sandi baru untuk akun Anda.
          </p>
        </div>

        {error && (
          <div className="mb-5 bg-red-500/20 border border-red-500/30 text-red-200 rounded-xl p-3 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-200 rounded-xl p-3 text-sm">
            {success}
          </div>
        )}

        <form onSubmit={handleUpdatePassword} className="space-y-5">
          <div>
            <label className="text-white text-xs font-bold uppercase tracking-wider mb-2 block">
              Password Baru
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 text-slate-400" size={18} />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-12 py-3 rounded-xl bg-slate-900/50 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-3.5 text-slate-400 hover:text-white"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-white text-xs font-bold uppercase tracking-wider mb-2 block">
              Konfirmasi Password Baru
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 text-slate-400" size={18} />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-900/50 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition shadow-lg shadow-emerald-600/30 disabled:opacity-70 flex items-center justify-center gap-2 text-sm"
          >
            {loading ? (
              <><Loader2 className="animate-spin" size={18} /> Menyimpan...</>
            ) : (
              <>Simpan Password Baru</>
            )}
          </button>

          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full py-2.5 rounded-xl font-semibold text-slate-400 hover:text-white bg-slate-700/40 hover:bg-slate-700 transition flex items-center justify-center gap-2 text-sm"
          >
            <ArrowLeft size={16} /> Kembali ke Dashboard
          </button>
        </form>
      </div>
    </div>
  )
}