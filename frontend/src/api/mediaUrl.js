/**
 * Resolves a backend-relative media path (e.g. "/uploads/products/x.jpg") to a
 * URL the current runtime can actually fetch.
 *
 * Why this exists: the backend stores image URLs as site-relative paths. In the
 * browser build that is correct — the dev proxy and nginx both forward
 * "/uploads/**" to the backend, so the path resolves against the same origin.
 * Inside the Capacitor APK there is no such origin: the web layer is served from
 * the app bundle ("https://localhost"), so a relative "/uploads/..." resolves to
 * the bundle and 404s. Those builds set VITE_MEDIA_BASE_URL (or VITE_API_URL) to
 * the real backend origin, and this helper prefixes it.
 *
 * Deliberately narrow: it only rewrites root-relative paths. Absolute URLs
 * (http/https), data: URIs and blob: previews are returned untouched, so an
 * admin's local file-preview blob is never mangled into a broken remote URL.
 */

/** Backend origin for media, without a trailing slash. Empty means "same origin". */
const MEDIA_BASE = (() => {
  const explicit = import.meta.env.VITE_MEDIA_BASE_URL
  if (explicit) return explicit.replace(/\/+$/, '')

  // Fall back to the API URL with its trailing "/api" removed, so a single
  // VITE_API_URL=https://host/api is enough to configure both API and media.
  const api = import.meta.env.VITE_API_URL
  if (api && /^https?:\/\//i.test(api)) {
    return api.replace(/\/+$/, '').replace(/\/api$/, '')
  }
  return ''
})()

export function resolveMediaUrl(src) {
  if (!src) return src
  if (/^(https?:|data:|blob:)/i.test(src)) return src
  if (!MEDIA_BASE) return src
  return src.startsWith('/') ? MEDIA_BASE + src : `${MEDIA_BASE}/${src}`
}

export default resolveMediaUrl
