import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Building2, Mail, Lock, AlertCircle, CheckCircle2 } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)
  
  // State untuk mengganti mode (Login vs Lupa Password)
  const [isResetMode, setIsResetMode] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      if (isResetMode) {
        // PROSES RESET PASSWORD
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/login`, // Arahkan kembali ke sini setelah klik email
        })
        if (resetError) throw resetError
        
        setMessage("Tautan reset password telah dikirim! Silakan cek kotak masuk atau folder SPAM di email Anda.")
      } else {
        // PROSES LOGIN NORMAL
        const { error: loginError } = await login(email, password)
        if (loginError) throw loginError
        navigate('/')
      }
    } catch (err) {
      setError(err.message === 'Invalid login credentials' ? 'Email atau Password salah!' : err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center mb-4"><Building2 size={48} className="text-blue-600" /></div>
        <h2 className="text-3xl font-black text-slate-900">ERP Berkah Cahaya</h2>
        <p className="mt-2 text-sm text-slate-600">Sistem Manajemen Booking & Penjualan</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl border border-slate-100 sm:rounded-2xl sm:px-10 relative overflow-hidden">
          
          {/* Hiasan Latar */}
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 to-blue-400"></div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <h3 className="text-xl font-bold text-slate-800 text-center mb-6">
              {isResetMode ? 'Reset Password' : 'Login Sistem'}
            </h3>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded flex items-start gap-2">
                <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={16}/>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {message && (
              <div className="bg-emerald-50 border-l-4 border-emerald-500 p-3 rounded flex items-start gap-2">
                <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={16}/>
                <p className="text-sm text-emerald-700">{message}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700">Alamat Email</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Mail className="text-slate-400" size={18} /></div>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm" placeholder="admin@perusahaan.com" />
              </div>
            </div>

            {!isResetMode && (
              <div>
                <label className="block text-sm font-semibold text-slate-700">Password</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Lock className="text-slate-400" size={18} /></div>
                  <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm" placeholder="••••••••" />
                </div>
              </div>
            )}

            <button type="submit" disabled={loading} className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors">
              {loading ? 'Memproses...' : (isResetMode ? 'Kirim Link Reset' : 'Masuk / Login')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button type="button" onClick={() => { setIsResetMode(!isResetMode); setError(null); setMessage(null); }} className="text-sm font-semibold text-blue-600 hover:text-blue-500 transition-colors">
              {isResetMode ? 'Kembali ke halaman Login' : 'Lupa Password Anda?'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}