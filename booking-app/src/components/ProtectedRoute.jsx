import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, userProfile } = useAuth()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && userProfile && !allowedRoles.includes(userProfile.roles?.name)) {
    return <div className="p-8 text-red-600">Akses Ditolak. Anda tidak memiliki izin.</div>
  }

  return children
}