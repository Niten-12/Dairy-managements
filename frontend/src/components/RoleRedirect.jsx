import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const roleRoutes = {
  CUSTOMER: '/dashboard/customer',
  FARMER: '/dashboard/farmer',
  DELIVERY_BOY: '/dashboard/delivery',
}

function RoleRedirect() {
  const { user } = useAuth()
  const target = roleRoutes[user?.role] || '/login'
  return <Navigate to={target} replace />
}

export default RoleRedirect
