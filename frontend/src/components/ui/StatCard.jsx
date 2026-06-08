/* StatCard — Premium stat display card with entrance animation */

const delayClasses = ['', 'anim-delay-1', 'anim-delay-2', 'anim-delay-3', 'anim-delay-4', 'anim-delay-5']

function StatCard({ label, value, icon, color, bg, delay = 0 }) {
  const delayClass = delayClasses[Math.min(delay, 5)]

  return (
    <div
      className={`anim-fade-in-up ${delayClass}`}
      style={{
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px',
        boxShadow: 'var(--shadow-card)',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'default',
        transition: 'transform var(--transition-base), box-shadow var(--transition-base)',
        /* Left accent bar via pseudo-like border */
        borderLeft: `3px solid ${color}`,
        animationFillMode: 'both',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = 'var(--shadow-card-hover)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'var(--shadow-card)'
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: 'var(--radius-lg)',
          background: bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '22px',
          marginBottom: 'var(--space-4)',
          flexShrink: 0,
        }}
      >
        {icon}
      </div>

      {/* Label */}
      <p
        style={{
          margin: '0 0 var(--space-1)',
          fontSize: '11px',
          fontWeight: 'var(--font-semibold)',
          color: 'var(--color-text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}
      >
        {label}
      </p>

      {/* Value */}
      <p
        style={{
          margin: 0,
          fontSize: '32px',
          fontWeight: 'var(--font-bold)',
          color: color,
          lineHeight: 1.1,
        }}
      >
        {value}
      </p>
    </div>
  )
}

export default StatCard
