import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Mail, Lock, Loader2, Home } from 'lucide-react'
// Pastikan letak dan nama gambar sudah sesuai
import bgImage from '../assets/backdrop.jpg' 

// Komponen SVG Siluet Perumahan Modern
const CitySilhouette = () => (
  <svg className="absolute bottom-0 w-full h-32 md:h-48 text-slate-800/10 drop-shadow-md pointer-events-none" viewBox="0 0 1440 200" preserveAspectRatio="none" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
     <path d="M0,200 L0,150 L50,100 L100,150 L100,120 L150,70 L200,120 L200,90 L250,40 L300,90 L300,130 L350,80 L400,130 L400,100 L450,50 L500,100 L500,140 L550,90 L600,140 L600,110 L650,60 L700,110 L700,150 L750,100 L800,150 L800,120 L850,70 L900,120 L900,160 L950,110 L1000,160 L1000,200 L1050,150 L1100,200 L1150,150 L1200,200 L1250,170 L1300,220 L1350,150 L1400,200 L1440,150 L1440,200 Z"></path>
  </svg>
)

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white font-sans">
      
      {/* BAGIAN KIRI: Visual (Gambar MCR/BCG & Siluet) */}
      <div className="relative w-full md:w-1/2 lg:w-3/5 bg-slate-100 flex flex-col items-center justify-center p-8 overflow-hidden min-h-[300px] md:min-h-screen border-b md:border-r border-slate-200">
        <div className="relative z-10 w-full max-w-md flex flex-col items-center transition-transform hover:scale-105 duration-500">
          <img 
            src={bgImage} 
            alt="Mutiara Citra Residence" 
            className="w-full h-auto drop-shadow-xl rounded-2xl mix-blend-multiply" 
          />
        </div>
        {/* Siluet terpasang otomatis di dasar area visual */}
        <CitySilhouette />
      </div>

      {/* BAGIAN KANAN: Form Login Interaktif */}
      <div className="w-full md:w-1/2 lg:w-2/5 flex items-center justify-center bg-white p-8 md:p-12 shadow-[-15px_0_30px_-15px_rgba(0,0,0,0.05)] z-20">
        <div className="w-full max-w-sm space-y-8">
          
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-600/30">
              <Home className="text-white w-8 h-8" />
            </div>
            <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Login Sistem</h2>
            <p className="text-slate-500 mt-2 text-sm">ERP Berkah Cahaya Gemilang</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6 mt-8">
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-semibold border border-red-100 flex items-start gap-2">
                <span className="w-2 h-2 mt-1.5 bg-red-600 rounded-full animate-pulse flex-shrink-0"></span> {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-2 tracking-wider">Alamat Email</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-4 top-3.5 text-slate-400" />
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@perusahaan.com" className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-2 tracking-wider">Password</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-3.5 text-slate-400" />
                  <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none" />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                <span className="text-slate-600 font-medium group-hover:text-slate-800 transition-colors">Ingat saya</span>
              </label>
              <a href="#" className="font-bold text-blue-600 hover:text-blue-700 transition-colors">Lupa Password?</a>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-blue-600/30 transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0 flex items-center justify-center gap-2">
              {loading ? <><Loader2 className="animate-spin" size={18} /> Memverifikasi...</> : 'Masuk ke Dashboard'}
            </button>
          </form>

          <div className="pt-8 text-center">
            <p className="text-xs text-slate-400 font-medium">© {new Date().getFullYear()} PT. Berkah Cahaya Gemilang.<br/>Sistem Manajemen KPR & Penjualan.</p>
          </div>
          
        </div>
      </div>
      
    </div>
  )
}