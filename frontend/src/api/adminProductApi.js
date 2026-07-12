import axiosInstance from './axiosInstance'

export const adminGetAllProducts    = ()           => axiosInstance.get('/admin/products')
export const adminGetProductStats   = ()           => axiosInstance.get('/admin/products/stats')
export const adminCreateProduct     = (data)       => axiosInstance.post('/admin/products', data)
export const adminUpdateProduct     = (id, data)   => axiosInstance.put(`/admin/products/${id}`, data)
export const adminDeleteProduct     = (id)         => axiosInstance.delete(`/admin/products/${id}`)
export const adminToggleProduct     = (id)         => axiosInstance.patch(`/admin/products/${id}/toggle`)
export const adminUploadProductImage = (id, form)  => axiosInstance.post(`/admin/products/${id}/image`, form, {
  headers: { 'Content-Type': 'multipart/form-data' },
})
export const adminBulkDeleteProducts  = (ids)      => axiosInstance.post('/admin/products/bulk-delete', { ids })
export const adminBulkSetAvailable    = (ids, available) =>
  axiosInstance.post('/admin/products/bulk-available', { ids, available })
