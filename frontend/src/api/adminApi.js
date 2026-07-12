import axiosInstance from './axiosInstance'

// Users — CRUD
export const getUsers          = (params) => axiosInstance.get('/admin/users', { params })
export const createUser        = (data)   => axiosInstance.post('/admin/users', data)
export const updateUser        = (id, data) => axiosInstance.put(`/admin/users/${id}`, data)
export const toggleUserStatus  = (id)    => axiosInstance.patch(`/admin/users/${id}/toggle-status`)
export const resetUserPassword = (id, data) => axiosInstance.post(`/admin/users/${id}/reset-password`, data)
export const deleteUser        = (id)    => axiosInstance.delete(`/admin/users/${id}`)

// Users — Stats, Export, Bulk
export const getUserStats  = ()       => axiosInstance.get('/admin/users/stats')
export const exportUsersCsv = (params) =>
  axiosInstance.get('/admin/users/export', { params, responseType: 'blob' })
export const bulkDeleteUsers = (ids)            => axiosInstance.post('/admin/users/bulk-delete', { ids })
export const bulkStatusUsers = (ids, active)    => axiosInstance.post('/admin/users/bulk-status', { ids, active })

// Audit Logs
export const getAuditLogs = (params) => axiosInstance.get('/admin/audit-logs', { params })

// Products
export const getAdminProducts    = ()       => axiosInstance.get('/admin/products')
export const createProduct       = (data)   => axiosInstance.post('/admin/products', data)
export const updateProduct       = (id, data) => axiosInstance.put(`/admin/products/${id}`, data)
export const deleteProduct       = (id)     => axiosInstance.delete(`/admin/products/${id}`)
export const toggleProductStatus = (id)     => axiosInstance.patch(`/admin/products/${id}/toggle-status`)

// Orders
export const getAdminOrders    = ()       => axiosInstance.get('/admin/orders')
export const updateOrderStatus = (id, data) => axiosInstance.put(`/admin/orders/${id}/status`, data)
