import publicApi from './publicApi'

/**
 * Public storefront product/category reads. One place that owns the public
 * product endpoint URLs (mirrors the admin `adminProductApi` pattern) so no
 * page hardcodes '/api/products...' independently.
 */

export const getPublicProducts = ({ categoryId, search } = {}) => {
  const params = {}
  if (categoryId) params.categoryId = categoryId
  if (search) params.search = search
  return publicApi.get('/products', { params })
}

export const getPublicCategories = () => publicApi.get('/products/categories')

export const getFeaturedProducts = () => publicApi.get('/products/featured')

export const getPublicProductById = (id) => publicApi.get(`/products/${id}`)
