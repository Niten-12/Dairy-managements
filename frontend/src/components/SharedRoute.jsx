import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const SHARED_ROLES = ['CUSTOMER', 'FARMER', 'DELIVERY_BOY']

function SharedRoute() {
  const { user, isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/" replace />
  if (user?.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />
  if (!SHARED_ROLES.includes(user?.role)) return <Navigate to="/" replace />
  return <Outlet />
}

export default SharedRoute
