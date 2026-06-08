/* SkeletonLoader — Shimmer placeholder for loading states */

function SkeletonCard() {
  return (
    <div
      style={{
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px',
        boxShadow: 'var(--shadow-card)',
        borderLeft: '3px solid var(--color-slate-200)',
      }}
    >
      {/* Icon placeholder */}
      <div
        className="skeleton"
        style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-lg)', marginBottom: '16px' }}
      />
      {/* Label placeholder */}
      <div
        className="skeleton"
        style={{ width: '60%', height: '12px', borderRadius: 'var(--radius-sm)', marginBottom: '10px' }}
      />
      {/* Value placeholder */}
      <div
        className="skeleton"
        style={{ width: '40%', height: '32px', borderRadius: 'var(--radius-sm)' }}
      />
    </div>
  )
}

function SkeletonListItem() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '14px 0',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      <div
        className="skeleton"
        style={{ width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0 }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="skeleton" style={{ width: '45%', height: '13px', borderRadius: 'var(--radius-sm)', marginBottom: '8px' }} />
        <div className="skeleton" style={{ width: '30%', height: '11px', borderRadius: 'var(--radius-sm)' }} />
      </div>
      <div className="skeleton" style={{ width: '60px', height: '24px', borderRadius: 'var(--radius-full)' }} />
    </div>
  )
}

function SkeletonTableRow() {
  return (
    <tr>
      {[35, 20, 20, 15, 10].map((w, i) => (
        <td key={i} style={{ padding: '12px 16px' }}>
          <div
            className="skeleton"
            style={{ width: `${w}%`, height: '14px', borderRadius: 'var(--radius-sm)' }}
          />
        </td>
      ))}
    </tr>
  )
}

function SkeletonLoader({ cards = 4, type = 'stats' }) {
  if (type === 'stats') {
    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 'var(--space-4)',
        }}
      >
        {Array.from({ length: cards }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    )
  }

  if (type === 'list') {
    return (
      <div style={{ padding: '0 4px' }}>
        {Array.from({ length: cards }).map((_, i) => (
          <SkeletonListItem key={i} />
        ))}
      </div>
    )
  }

  if (type === 'table') {
    return (
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          {Array.from({ length: cards }).map((_, i) => (
            <SkeletonTableRow key={i} />
          ))}
        </tbody>
      </table>
    )
  }

  return null
}

export default SkeletonLoader
