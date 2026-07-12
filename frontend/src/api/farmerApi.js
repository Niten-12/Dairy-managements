import axiosInstance from './axiosInstance'

export const addMilkEntry   = (data) => axiosInstance.post('/api/farmer/milk-collection', data)
export const getMyEntries   = ()     => axiosInstance.get('/api/farmer/milk-collection')
export const getFarmerStats = ()     => axiosInstance.get('/api/farmer/stats')
