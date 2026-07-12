import { Routes, Route, Navigate } from 'react-router-dom'
import PublicLayout from '../components/layout/PublicLayout'
import Home from '../pages/public/Home'
import Products from '../pages/public/Products'
import ProductDetail from '../pages/public/ProductDetail'
import MainLayout from '../components/layout/MainLayout'
import AdminLayout from '../components/layout/AdminLayout'
import SharedRoute from '../components/SharedRoute'
import AdminRoute from '../components/AdminRoute'
import CustomerDashboard from '../pages/customer/CustomerDashboard'
import MyOrders from '../pages/customer/MyOrders'
import OrderDetail from '../pages/customer/OrderDetail'
import FarmerDashboard from '../pages/farmer/FarmerDashboard'
import DeliveryDashboard from '../pages/delivery/DeliveryDashboard'
import AdminDashboard from '../pages/admin/AdminDashboard'
import AdminSettings from '../pages/admin/AdminSettings'
import UserManagement from '../pages/admin/UserManagement'
import ProductManagement from '../pages/admin/ProductManagement'
import OrderManagement from '../pages/admin/OrderManagement'
import AuditLogs from '../pages/admin/AuditLogs'
import RoleRedirect from '../components/RoleRedirect'

function AppRoutes() {
  return (
    <Routes>
      {/* ── Public website ───────────────────────────── */}
      <Route element={<PublicLayout />}>
        <Route path="/"             element={<Home />} />
        <Route path="/products"     element={<Products />} />
        <Route path="/products/:id" element={<ProductDetail />} />
      </Route>

      <Route path="/login"    element={<Navigate to="/" replace />} />
      <Route path="/register" element={<Navigate to="/" replace />} />

      {/* Shared Portal — CUSTOMER, FARMER, DELIVERY_BOY */}
      <Route element={<SharedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<RoleRedirect />} />
          <Route path="/dashboard/customer" element={<CustomerDashboard />} />
          <Route path="/my-orders" element={<MyOrders />} />
          <Route path="/my-orders/:id" element={<OrderDetail />} />
          <Route path="/dashboard/farmer" element={<FarmerDashboard />} />
          <Route path="/dashboard/delivery" element={<DeliveryDashboard />} />
        </Route>
      </Route>

      {/* Admin Portal — ADMIN only */}
      <Route element={<AdminRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard"   element={<AdminDashboard />} />
          <Route path="/admin/users"       element={<UserManagement />} />
          <Route path="/admin/products"    element={<ProductManagement />} />
          <Route path="/admin/orders"      element={<OrderManagement />} />
          <Route path="/admin/audit-logs"  element={<AuditLogs />} />
          <Route path="/admin/settings"    element={<AdminSettings />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default AppRoutes
