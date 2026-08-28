import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
  Mail,
  Lock,
  Loader2,
  ShieldCheck,
  Home,
  Eye,
  EyeOff,
  ArrowLeft
} from "lucide-react";

import bgImage from "../assets/backdrop-baru.png"; 

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  
  // State untuk tombol Lihat Password
  const [showPassword, setShowPassword] = useState(false);

  // State untuk mode Lupa Password (Pop-up / View Ganti)
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const navigate = useNavigate();

  // Fungsi Login Utama
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      navigate("/");
    } catch (err) {
      setError(err.message || "Email atau password salah.");
    } finally {
      setLoading(false);
    }
  };

  // Fungsi Kirim Email Lupa Password via Supabase
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setResetLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      // Mengirim email reset password. 
      // Redirect otomatis ke halaman utama aplikasi Anda setelah diklik dari email
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: window.location.origin, // Akan mengarah ke domain aplikasi Anda (localhost atau netlify)
      });

      if (error) throw error;
      
      setSuccessMsg("Instruksi pemulihan kata sandi telah dikirim ke email Anda. Silakan cek inbox atau folder spam.");
      setResetEmail("");
    } catch (err) {
      setError(err.message || "Gagal mengirim email pemulihan.");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat relative flex items-center justify-end px-6 lg:px-24"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      {/* Overlay Gelap Tipis */}
      <div className="absolute inset-0 bg-gradient-to-l from-black/60 via-black/10 to-transparent" />

      {/* KOTAK UTAMA */}
      <div className="relative z-10 w-full lg:w-[420px]">
        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
          
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-green-700 flex items-center justify-center shadow-lg">
              <Home className="text-white" size={36} />
            </div>
            <h2 className="text-3xl font-bold text-white mt-5">
              {isForgotPassword ? "Reset Sandi" : "Selamat Datang"}
            </h2>
            <p className="text-emerald-100 text-sm mt-2">
              {isForgotPassword ? "Masukkan email terdaftar Anda" : "Login untuk mengakses sistem"}
            </p>
          </div>

          {/* NOTIFIKASI ERROR */}
          {error && (
            <div className="mb-5 bg-red-500/20 border border-red-300/30 text-red-100 rounded-xl p-3 text-sm">
              {error}
            </div>
          )}

          {/* NOTIFIKASI SUKSES */}
          {successMsg && (
            <div className="mb-5 bg-emerald-500/20 border border-emerald-300/30 text-emerald-100 rounded-xl p-3 text-sm leading-relaxed">
              {successMsg}
            </div>
          )}

          {/* KONDISI TAMPILAN FORM: LOGIN ATAU LUPA PASSWORD */}
          {!isForgotPassword ? (
            /* ================= FORM LOGIN UTAMA ================= */
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="text-white text-sm font-semibold mb-2 block">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 text-emerald-300" size={18} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@bcg.co.id"
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-black/40 border border-white/20 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-white text-sm font-semibold mb-2 block">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 text-emerald-300" size={18} />
                  
                  {/* INPUT PASSWORD DENGAN FITUR LIHAT PASSWORD */}
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-12 py-3 rounded-xl bg-black/40 border border-white/20 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />

                  {/* TOMBOL MATA (LIHAT / SEMBUNYIKAN PASSWORD) */}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-3.5 text-slate-300 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center text-sm">
                <label className="flex items-center gap-2 text-slate-200 cursor-pointer">
                  <input type="checkbox" className="accent-emerald-500" />
                  Ingat Saya
                </label>
                <button
                  type="button"
                  onClick={() => { setIsForgotPassword(true); setError(""); setSuccessMsg(""); }}
                  className="text-emerald-300 hover:text-emerald-200 transition-colors"
                >
                  Lupa Password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-500 to-green-700 hover:from-emerald-600 hover:to-green-800 transition duration-300 shadow-lg disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><Loader2 className="animate-spin" size={18} /> Memverifikasi...</>
                ) : (
                  <><ShieldCheck size={18} /> Masuk ke Dashboard</>
                )}
              </button>
            </form>
          ) : (
            /* ================= FORM LUPA PASSWORD ================= */
            <form onSubmit={handleForgotPassword} className="space-y-5">
              <div>
                <label className="text-white text-sm font-semibold mb-2 block">
                  Email Perusahaan / Akun
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 text-emerald-300" size={18} />
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="nama@bcg.co.id"
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-black/40 border border-white/20 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
                <p className="text-xs text-slate-300 mt-2">
                  Kami akan mengirimkan tautan tautan pemulihan sandi langsung ke email tersebut.
                </p>
              </div>

              <button
                type="submit"
                disabled={resetLoading}
                className="w-full py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-500 to-green-700 hover:from-emerald-600 hover:to-green-800 transition duration-300 shadow-lg disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {resetLoading ? (
                  <><Loader2 className="animate-spin" size={18} /> Mengirim Tautan...</>
                ) : (
                  <>Kirim Email Pemulihan</>
                )}
              </button>

              <button
                type="button"
                onClick={() => { setIsForgotPassword(false); setError(""); setSuccessMsg(""); }}
                className="w-full py-2.5 rounded-xl font-semibold text-slate-300 hover:text-white bg-white/5 border border-white/10 hover:bg-white/10 transition flex items-center justify-center gap-2 text-sm"
              >
                <ArrowLeft size={16} /> Kembali ke Menu Login
              </button>
            </form>
          )}

          <div className="mt-8 pt-6 border-t border-white/20 text-center">
            <p className="text-xs text-slate-300 leading-5">
              © {new Date().getFullYear()} PT. Berkah Cahaya Gemilang
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}