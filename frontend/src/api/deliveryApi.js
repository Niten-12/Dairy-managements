import axiosInstance from './axiosInstance'

export const getPendingDeliveries = ()    => axiosInstance.get('/api/delivery/orders/pending')
export const markDelivered        = (id)  => axiosInstance.put(`/api/delivery/orders/${id}/delivered`)
export const getDeliveryHistory   = ()    => axiosInstance.get('/api/delivery/orders/history')
