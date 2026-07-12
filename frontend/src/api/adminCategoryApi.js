import axiosInstance from './axiosInstance'

export const adminGetCategories       = ()          => axiosInstance.get('/admin/categories')
export const adminCreateCategory      = (data)      => axiosInstance.post('/admin/categories', data)
export const adminUpdateCategory      = (id, data)  => axiosInstance.put(`/admin/categories/${id}`, data)
export const adminDeleteCategory      = (id)        => axiosInstance.delete(`/admin/categories/${id}`)
export const adminUploadCategoryImage = (id, form)  => axiosInstance.post(`/admin/categories/${id}/image`, form, {
  headers: { 'Content-Type': 'multipart/form-data' },
})
