import axios from 'axios'

/**
 * Axios client for PUBLIC, unauthenticated endpoints (the storefront:
 * products, categories, featured, product detail).
 *
 * Responsibilities / deliberate non-responsibilities:
 *  - Uses the SAME base-URL strategy as the authenticated `axiosInstance`
 *    (VITE_API_URL or '/api'), so there is one source of truth for the API
 *    origin and no hardcoded '/api/...' paths scattered across pages.
 *  - Does NOT attach the admin JWT — these endpoints are public, and leaking
 *    a token onto them is unnecessary.
 *  - Does NOT globally redirect on 401. Public endpoints are permitAll; an
 *    unexpected 401 here must surface to the calling feature (via classifyError)
 *    rather than silently tearing down the user's session.
 *  - Does NOT swallow errors — rejections propagate to the caller so each
 *    feature can distinguish loading / empty / error locally.
 */
const publicApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
})

export default publicApi
