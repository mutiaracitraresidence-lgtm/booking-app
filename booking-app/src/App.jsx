import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { LayoutDashboard, Grid3X3, Building, Home, LogOut, FileText, Wallet, FileSpreadsheet, FolderOpen, Users, Menu, X,Lock, } from 'lucide-react'

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
import ChangePassword from './pages/ChangePassword'

const MainLayout = ({ children }) => {
  const { logout, userProfile, user } = useAuth()
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const location = useLocation()
  
  const userEmail = user?.email || userProfile?.email || ''
  const userRole = userProfile?.roles?.name?.toLowerCase() || ''
  
  // Perbaikan Logika Jabatan (Cocok dengan Database Supabase)
  const isSuperAdmin = userRole === 'direktur' || userEmail === 'irvannurcahyo439@gmail.com'
  const isAgency = userRole === 'agensi' || isSuperAdmin
  const isFinance = userRole === 'admin keuangan' || isSuperAdmin
  const isKpr = userRole === 'admin kpr' || isSuperAdmin

  const closeMenu = () => setIsMobileOpen(false)
  const isActive = (path) => location.pathname === path ? 'bg-blue-600 text-white' : 'hover:bg-slate-800'

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      
      {/* Header Khusus HP */}
      <div className="md:hidden fixed top-0 w-full bg-slate-900 text-white z-50 flex justify-between items-center p-4 shadow-md">
        <h2 className="text-lg font-bold text-blue-400">Berkah Cahaya Gemilang</h2>
        <button onClick={() => setIsMobileOpen(!isMobileOpen)} className="p-1 bg-slate-800 rounded-md">
          {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Overlay Gelap HP */}
      {isMobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={closeMenu}></div>
      )}

      {/* Sidebar Menu Responsif */}
      <aside className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-slate-900 text-white flex flex-col transition-transform duration-300 ease-in-out ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} pt-16 md:pt-0`}>
        
        <div className="p-6 hidden md:block border-b border-slate-800">
          <h2 className="text-xl font-bold text-blue-400">Berkah Cahaya<br/>Gemilang</h2>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <Link to="/" onClick={closeMenu} className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${isActive('/')}`}>
            <LayoutDashboard size={20} /> Dashboard
          </Link>
          
          <Link to="/stock" onClick={closeMenu} className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${isActive('/stock')}`}>
            <Grid3X3 size={20} /> Live Stock
          </Link>

          {isAgency && (
            <>
              <Link to="/booking" onClick={closeMenu} className={`flex items-center gap-3 p-3 rounded-lg transition-colors text-yellow-400 ${isActive('/booking')}`}>
                <FileText size={20} /> Form Booking
              </Link>
              <Link to="/agency-portal" onClick={closeMenu} className={`flex items-center gap-3 p-3 rounded-lg transition-colors text-purple-400 ${isActive('/agency-portal')}`}>
                <FolderOpen size={20} /> Portal Agensi
              </Link>
            </>
          )}

          {isFinance && (
            <Link to="/finance" onClick={closeMenu} className={`flex items-center gap-3 p-3 rounded-lg transition-colors text-green-400 ${isActive('/finance')}`}>
              <Wallet size={20} /> Validasi Keuangan
            </Link>
          )}

          {isKpr && (
            <Link to="/kpr" onClick={closeMenu} className={`flex items-center gap-3 p-3 rounded-lg transition-colors text-blue-300 ${isActive('/kpr')}`}>
              <FileSpreadsheet size={20} /> Pemberkasan KPR
            </Link>
          )}

          {/* Menghapus Blok Kode Menu Direksi yang Ganda */}
          {isSuperAdmin && (
            <div className="pt-4 mt-4 border-t border-slate-800">
              <p className="text-[10px] uppercase font-bold text-slate-500 mb-2 px-3">Data Master (Khusus Direksi)</p>
              <Link to="/project" onClick={closeMenu} className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${isActive('/project')}`}>
                <Building size={20} /> Master Project
              </Link>
              <Link to="/unit" onClick={closeMenu} className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${isActive('/unit')}`}>
                <Home size={20} /> Master Unit
              </Link>
              <Link to="/users" onClick={closeMenu} className={`flex items-center gap-3 p-3 rounded-lg transition-colors text-emerald-400 ${isActive('/users')}`}>
                <Users size={20} /> Kelola Akun
              </Link>
              <Link to="/change-password" className="w-full flex items-center justify-center gap-2 p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors font-semibold text-sm mb-2">
                <Lock size={16} /> Ganti Password
              </Link>
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="mb-4 px-3">
            <p className="text-sm font-semibold truncate">{userProfile?.full_name || 'Admin / User'}</p>
            <p className="text-xs text-yellow-500 uppercase font-bold">{userProfile?.roles?.name || (isSuperAdmin ? 'DIREKTUR' : 'AUTHORIZED')}</p>
          </div>
          <button onClick={logout} className="w-full flex items-center justify-center gap-2 p-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors font-semibold">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* Konten Utama Responsif */}
      <main className="flex-1 overflow-y-auto pt-16 md:pt-0">
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
          <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}