/**
 * Defensive display helpers for product data. Backend validation hardening is
 * a later phase, so legacy/malformed rows may still exist. These helpers fail
 * gracefully WITHOUT inventing business values (e.g. a missing price is shown
 * as unavailable, never as ₹0, which would misrepresent the product).
 */

/** Parse a price-like value to a finite positive number, else null. */
export function toPrice(value) {
  const n = typeof value === 'number' ? value : parseFloat(value)
  return Number.isFinite(n) && n >= 0 ? n : null
}

/** "₹28" for a valid price; a neutral placeholder otherwise. */
export function formatPrice(value, { decimals = 0 } = {}) {
  const n = toPrice(value)
  return n === null ? '—' : `₹${n.toFixed(decimals)}`
}

/**
 * Whole-number discount % only when BOTH prices are valid and the original is
 * strictly greater than the current price. Returns null otherwise — no
 * division by zero, no negative or nonsensical badges.
 */
export function discountPercent(price, originalPrice) {
  const p = toPrice(price)
  const o = toPrice(originalPrice)
  if (p === null || o === null || o <= 0 || o <= p) return null
  return Math.round((1 - p / o) * 100)
}

/** True only when a real discount can be displayed. */
export function hasDiscount(price, originalPrice) {
  return discountPercent(price, originalPrice) !== null
}

/**
 * Canonical tagType → badge colors. Matches the backend/admin vocabulary
 * (success | warning | error | info); anything else (incl. null) falls back to
 * neutral grey. Single source of truth for storefront tag badges.
 */
const TAG_BADGE = {
  success: { background: '#dcfce7', color: '#15803d' },
  warning: { background: '#fef3c7', color: '#d97706' },
  error:   { background: '#fee2e2', color: '#dc2626' },
  info:    { background: '#dbeafe', color: '#1d4ed8' },
}
const TAG_BADGE_FALLBACK = { background: '#f1f5f9', color: '#475569' }

export function tagBadgeStyle(tagType) {
  return TAG_BADGE[tagType] || TAG_BADGE_FALLBACK
}
