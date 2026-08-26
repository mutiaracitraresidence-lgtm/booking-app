import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { LayoutDashboard, Grid3X3, Building, Home, LogOut, FileText, Wallet, FileSpreadsheet, FolderOpen } from 'lucide-react'
import Login from './pages/Login'
import StockUnit from './pages/StockUnit'
import MasterProject from './pages/MasterProject'
import MasterUnit from './pages/MasterUnit'
import CreateBooking from './pages/CreateBooking' 
import ProtectedRoute from './components/ProtectedRoute'
import FinanceApproval from './pages/FinanceApproval'
import KprManagement from './pages/KprManagement'
import Dashboard from './pages/Dashboard'
import AgencyPortal from './pages/AgencyPortal'
import VerifyReceipt from './pages/VerifyReceipt'
import UserManagement from './pages/UserManagement'
import { Users } from 'lucide-react' // Tambahkan ikon ini jika belum ada

// Komponen Sidebar Layout
const MainLayout = ({ children }) => {
  // 1. PASTIKAN 'user' DITAMBAHKAN DI SINI
  const { logout, userProfile, user } = useAuth()
  
  // LOGIKA DETEKSI JABATAN (ROLE)
  // 2. DEFINISIKAN userEmail SEBELUM DIGUNAKAN
  const userEmail = user?.email || userProfile?.email || ''
  const userRole = userProfile?.roles?.name?.toLowerCase() || ''
  
  // 3. JALUR VIP: Email Anda otomatis menjadi Super Admin
  const isSuperAdmin = userRole === 'super admin' || userRole === 'admin' || userEmail === 'irvannurcahyo439@gmail.com'
  
  const isAgency = userRole === 'agency' || userRole === 'marketing'
  const isFinance = userRole === 'finance' || userRole === 'keuangan'
  const isKpr = userRole === 'kpr' || userRole === 'admin kpr'

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-xl font-bold text-blue-400">Berkah Cahaya<br/>Gemilang</h2>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {/* MENU UMUM (Semua Bisa Lihat) */}
          <Link to="/" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 transition-colors">
            <LayoutDashboard size={20} /> Dashboard
          </Link>
          
          <Link to="/stock" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 transition-colors">
            <Grid3X3 size={20} /> Live Stock
          </Link>

          {/* MENU AGENSI & MARKETING */}
          {(isSuperAdmin || isAgency) && (
            <>
              <Link to="/booking" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 transition-colors text-yellow-400">
                <FileText size={20} /> Form Booking
              </Link>
              <Link to="/agency-portal" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 transition-colors text-purple-400">
                <FolderOpen size={20} /> Portal Agensi
              </Link>
            </>
          )}

          {/* MENU KEUANGAN */}
          {(isSuperAdmin || isFinance) && (
            <Link to="/finance" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 transition-colors text-green-400">
              <Wallet size={20} /> Validasi Keuangan
            </Link>
          )}

          {/* MENU ADMIN KPR */}
          {(isSuperAdmin || isKpr) && (
            <Link to="/kpr" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 transition-colors text-blue-300">
              <FileSpreadsheet size={20} /> Pemberkasan KPR
            </Link>
          )}

          {/* MENU MASTER DATA (Hanya Super Admin) */}
          {isSuperAdmin && (
            <div className="pt-4 mt-4 border-t border-slate-800">
              <p className="text-[10px] uppercase font-bold text-slate-500 mb-2 px-3">Data Master (Khusus Direksi)</p>
              <Link to="/project" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 transition-colors">
                <Building size={20} /> Master Project
              </Link>
              <Link to="/unit" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 transition-colors">
                <Home size={20} /> Master Unit
              </Link>
            </div>
          )}
          {/* MENU MASTER DATA (Hanya Super Admin) */}
          {isSuperAdmin && (
            <div className="pt-4 mt-4 border-t border-slate-800">
              <p className="text-[10px] uppercase font-bold text-slate-500 mb-2 px-3">Data Master (Khusus Direksi)</p>
              <Link to="/project" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 transition-colors">
                <Building size={20} /> Master Project
              </Link>
              <Link to="/unit" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 transition-colors">
                <Home size={20} /> Master Unit
              </Link>

              {/* TOMBOL MENU BARU */}
              <Link to="/users" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 transition-colors text-emerald-400">
                <Users size={20} /> Kelola Akun
              </Link>
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="mb-4 px-3">
            <p className="text-sm font-semibold truncate">{userProfile?.full_name || 'Admin / User'}</p>
            <p className="text-xs text-yellow-500 uppercase font-bold">{userProfile?.roles?.name || (isSuperAdmin ? 'SUPER ADMIN' : 'AUTHORIZED')}</p>
          </div>
          <button onClick={logout} className="w-full flex items-center justify-center gap-2 p-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors font-semibold">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* Konten Utama */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><MainLayout><Dashboard /></MainLayout></ProtectedRoute>} />
          <Route path="/project" element={<ProtectedRoute><MainLayout><MasterProject /></MainLayout></ProtectedRoute>} />
          <Route path="/unit" element={<ProtectedRoute><MainLayout><MasterUnit /></MainLayout></ProtectedRoute>} />
          <Route path="/stock" element={<ProtectedRoute><MainLayout><StockUnit /></MainLayout></ProtectedRoute>} />
          <Route path="/booking" element={<ProtectedRoute><MainLayout><CreateBooking /></MainLayout></ProtectedRoute>} />
          <Route path="/finance" element={<ProtectedRoute><MainLayout><FinanceApproval /></MainLayout></ProtectedRoute>} />
          <Route path="/kpr" element={<ProtectedRoute><MainLayout><KprManagement /></MainLayout></ProtectedRoute>} />
          <Route path="/agency-portal" element={<ProtectedRoute><MainLayout><AgencyPortal /></MainLayout></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
          <Route path="/verify" element={<VerifyReceipt />} />
          <Route path="/users" element={<ProtectedRoute><MainLayout><UserManagement /></MainLayout></ProtectedRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}