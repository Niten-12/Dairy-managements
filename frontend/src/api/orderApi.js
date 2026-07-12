import axiosInstance from './axiosInstance'

export const placeOrder   = (data) => axiosInstance.post('/orders', data)
export const getMyOrders  = ()     => axiosInstance.get('/orders/my')
export const getOrderById = (id)   => axiosInstance.get(`/orders/${id}`)
export const cancelOrder  = (id)   => axiosInstance.put(`/orders/${id}/cancel`)
