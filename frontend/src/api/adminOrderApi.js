import axiosInstance from './axiosInstance'

export const adminGetAllOrders      = (status)     => axiosInstance.get('/admin/orders', { params: status ? { status } : {} })
export const adminGetOrderById      = (id)         => axiosInstance.get(`/admin/orders/${id}`)
export const adminCreateOrder       = (data)       => axiosInstance.post('/admin/orders', data)
export const adminUpdateOrderStatus = (id, status) => axiosInstance.put(`/admin/orders/${id}/status`, { status })
