/**
 * Scoped error panel for public product/category sections. Renders a safe
 * message and — only when the failure is retryable — a Retry button that
 * re-runs the exact failed request. Never shown for empty results; empty and
 * error are distinct states by design.
 */
function ProductErrorState({
  message = "We couldn't load products right now.",
  retryable = true,
  onRetry,
  retrying = false,
  compact = false,
}) {
  return (
    <div
      role="alert"
      style={{
        gridColumn: '1 / -1',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: compact ? '32px 20px' : '60px 20px',
        gap: 10,
      }}
    >
      <div style={{ fontSize: compact ? 40 : 56, lineHeight: 1 }}>⚠️</div>
      <div style={{ fontSize: compact ? 15 : 18, fontWeight: 800, color: '#0f172a' }}>
        Couldn't load products
      </div>
      <div style={{ fontSize: 14, color: '#64748b', maxWidth: 360 }}>{message}</div>
      {retryable && onRetry && (
        <button
          onClick={onRetry}
          disabled={retrying}
          className="pub-btn pub-btn-primary pub-btn-sm"
          style={{ marginTop: 6, opacity: retrying ? 0.7 : 1, cursor: retrying ? 'wait' : 'pointer' }}
        >
          {retrying ? 'Retrying…' : '↻ Try again'}
        </button>
      )}
    </div>
  )
}

export default ProductErrorState
