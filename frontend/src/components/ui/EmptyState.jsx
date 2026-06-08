/* EmptyState — Centered empty/placeholder state */

function EmptyState({ icon = '📭', title = 'Nothing here yet', description = '', action }) {
  return (
    <div
      className="anim-fade-in"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        textAlign: 'center',
        animationFillMode: 'both',
      }}
    >
      {/* Icon */}
      <div
        style={{
          fontSize: '40px',
          marginBottom: 'var(--space-4)',
          opacity: 0.55,
          lineHeight: 1,
        }}
      >
        {icon}
      </div>

      {/* Title */}
      <p
        style={{
          margin: '0 0 var(--space-2)',
          fontSize: 'var(--text-md)',
          fontWeight: 'var(--font-semibold)',
          color: 'var(--color-slate-500)',
        }}
      >
        {title}
      </p>

      {/* Description */}
      {description && (
        <p
          style={{
            margin: '0 0 var(--space-5)',
            fontSize: 'var(--text-sm)',
            color: 'var(--color-text-subtle)',
            maxWidth: '320px',
            lineHeight: 1.6,
          }}
        >
          {description}
        </p>
      )}

      {/* Optional action */}
      {action && (
        <div style={{ marginTop: description ? '0' : 'var(--space-4)' }}>
          {action}
        </div>
      )}
    </div>
  )
}

export default EmptyState
