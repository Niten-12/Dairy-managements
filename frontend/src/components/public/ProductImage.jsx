import { useState } from 'react'
import { resolveMediaUrl } from '../../api/mediaUrl'

/**
 * Renders a product/category image with a safe fallback. If the URL is missing,
 * invalid, 404s, or fails to decode, it shows the provided emoji/placeholder
 * instead of a blank tile.
 *
 * Responsibility is strictly "render an image safely" — no pricing or product
 * business logic. The onError handler flips to fallback exactly once (guarded
 * by state), so a broken URL can never cause an infinite error loop, and it
 * never touches any state outside this component.
 *
 * The backend hands back site-relative "/uploads/..." paths; resolveMediaUrl
 * turns those into an absolute backend URL when the build has no same-origin
 * backend (the Capacitor APK), and leaves them alone in the web build.
 */
function ProductImage({ src, alt = '', fallback = '📦', imgStyle, fallbackStyle }) {
  const [failed, setFailed] = useState(false)

  const showImage = src && !failed

  if (!showImage) {
    return <span style={{ lineHeight: 1, userSelect: 'none', ...fallbackStyle }}>{fallback}</span>
  }

  return (
    <img
      src={resolveMediaUrl(src)}
      alt={alt}
      onError={() => setFailed(true)}
      style={imgStyle}
    />
  )
}

export default ProductImage
