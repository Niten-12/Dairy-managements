import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function AdminRoute() {
  const { user, isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/" replace />
  if (user?.role !== 'ADMIN') return <Navigate to="/dashboard" replace />
  return <Outlet />
}

export default AdminRoute
