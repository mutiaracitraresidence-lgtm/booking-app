import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
  Mail,
  Lock,
  Loader2,
  ShieldCheck,
  Home,
} from "lucide-react";

// Ganti nama file ini sesuai dengan nama gambar baru Anda di folder assets
import bgImage from "../assets/backdrop-baru.png"; 

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

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

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat relative flex items-center justify-end px-6 lg:px-24"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      {/* Overlay Gelap Tipis di Kanan untuk Menajamkan Form */}
      <div className="absolute inset-0 bg-gradient-to-l from-black/60 via-black/10 to-transparent" />

      {/* =====================================================
          HANYA MENAMPILKAN FORM LOGIN DI SEBELAH KANAN
      ====================================================== */}
      <div className="relative z-10 w-full lg:w-[420px]">
        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
          
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-green-700 flex items-center justify-center shadow-lg">
              <Home className="text-white" size={36} />
            </div>
            <h2 className="text-3xl font-bold text-white mt-5">
              Selamat Datang
            </h2>
            <p className="text-emerald-100 text-sm mt-2">
              Login untuk mengakses sistem
            </p>
          </div>

          {error && (
            <div className="mb-5 bg-red-500/20 border border-red-300/30 text-red-100 rounded-xl p-3 text-sm">
              {error}
            </div>
          )}

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
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-black/40 border border-white/20 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
            </div>

            <div className="flex justify-between items-center text-sm">
              <label className="flex items-center gap-2 text-slate-200">
                <input type="checkbox" className="accent-emerald-500" />
                Ingat Saya
              </label>
              <button type="button" className="text-emerald-300 hover:text-emerald-200">
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