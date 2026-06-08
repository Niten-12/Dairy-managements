import { Routes, Route, Navigate } from 'react-router-dom'
import Login from '../pages/Login'
import MainLayout from '../components/layout/MainLayout'
import AdminLayout from '../components/layout/AdminLayout'
import SharedRoute from '../components/SharedRoute'
import AdminRoute from '../components/AdminRoute'
import CustomerDashboard from '../pages/customer/CustomerDashboard'
import FarmerDashboard from '../pages/farmer/FarmerDashboard'
import DeliveryDashboard from '../pages/delivery/DeliveryDashboard'
import AdminDashboard from '../pages/admin/AdminDashboard'
import AdminSettings from '../pages/admin/AdminSettings'
import RoleRedirect from '../components/RoleRedirect'

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Shared Portal — CUSTOMER, FARMER, DELIVERY_BOY */}
      <Route element={<SharedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<RoleRedirect />} />
          <Route path="/dashboard/customer" element={<CustomerDashboard />} />
          <Route path="/dashboard/farmer" element={<FarmerDashboard />} />
          <Route path="/dashboard/delivery" element={<DeliveryDashboard />} />
        </Route>
      </Route>

      {/* Admin Portal — ADMIN only */}
      <Route element={<AdminRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default AppRoutes
