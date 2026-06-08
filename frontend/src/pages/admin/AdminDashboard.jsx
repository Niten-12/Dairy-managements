import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import StatCard from '../../components/ui/StatCard'
import EmptyState from '../../components/ui/EmptyState'

function AdminDashboard() {
  const { user } = useAuth()
  const { t } = useTranslation(['dashboard', 'common'])

  const stats = [
    { id: 'total_customers', label: t('dashboard:stat_total_customers'), value: '0',  icon: '👥', color: 'var(--color-blue-600)',    bg: 'var(--color-blue-100)',    delay: 0 },
    { id: 'total_farmers',   label: t('dashboard:stat_total_farmers'),   value: '0',  icon: '🐄', color: 'var(--color-emerald-600)', bg: 'var(--color-emerald-100)', delay: 1 },
    { id: 'delivery_boys',   label: t('dashboard:stat_delivery_boys'),   value: '0',  icon: '🚚', color: 'var(--color-amber-600)',   bg: 'var(--color-amber-100)',   delay: 2 },
    { id: 'todays_orders',   label: t('dashboard:stat_todays_orders'),   value: '0',  icon: '📦', color: 'var(--color-violet-600)',  bg: 'var(--color-violet-100)',  delay: 3 },
    { id: 'total_revenue',   label: t('dashboard:stat_total_revenue'),   value: '₹0', icon: '💰', color: 'var(--color-red-600)',     bg: 'var(--color-red-100)',     delay: 4 },
    { id: 'active_users',    label: t('dashboard:stat_active_users'),    value: '0',  icon: '✅', color: 'var(--color-cyan-600)',    bg: 'var(--color-cyan-100)',    delay: 5 },
  ]

  return (
    <div style={{ maxWidth: '1400px' }}>
      {/* ── Page header ─────────────────────────────── */}
      <div
        className="anim-fade-in-up"
        style={{ marginBottom: 'var(--space-7)', animationFillMode: 'both' }}
      >
        <h1
          style={{
            margin: '0 0 var(--space-1)',
            fontSize: 'var(--text-2xl)',
            fontWeight: 'var(--font-bold)',
            color: 'var(--color-text)',
          }}
        >
          {t('dashboard:admin_dashboard')}
        </h1>
        <p style={{ margin: 0, fontSize: 'var(--text-base)', color: 'var(--color-text-muted)' }}>
          {t('dashboard:logged_as')}{' '}
          <strong style={{ color: 'var(--color-violet-600)', fontWeight: 'var(--font-semibold)' }}>
            {user?.name}
          </strong>{' '}
          — {t('dashboard:admin_subtitle')}
        </p>
      </div>

      {/* ── Stat cards (6 stats, 3-col on wide) ─────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-7)',
        }}
      >
        {stats.map((s) => (
          <StatCard key={s.id} label={s.label} value={s.value} icon={s.icon} color={s.color} bg={s.bg} delay={s.delay} />
        ))}
      </div>

      {/* ── Lower panels ────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 'var(--space-5)',
        }}
      >
        {/* Recent Activity */}
        <div
          className="anim-fade-in-up anim-delay-6"
          style={{
            background: 'var(--color-surface)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-card)',
            overflow: 'hidden',
            animationFillMode: 'both',
          }}
        >
          <div
            style={{
              padding: 'var(--space-5) var(--space-6)',
              borderBottom: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: 'var(--text-md)',
                fontWeight: 'var(--font-semibold)',
                color: 'var(--color-text)',
              }}
            >
              {t('dashboard:recent_activity')}
            </h2>
            <span
              style={{
                fontSize: '11px',
                padding: '3px 8px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--color-violet-100)',
                color: 'var(--color-violet-600)',
                fontWeight: 'var(--font-semibold)',
              }}
            >
              Live
            </span>
          </div>
          <EmptyState
            icon="📊"
            title={t('dashboard:empty_activity')}
            description=""
          />
        </div>

        {/* Quick Actions */}
        <div
          className="anim-fade-in-up anim-delay-6"
          style={{
            background: 'var(--color-surface)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-card)',
            overflow: 'hidden',
            animationFillMode: 'both',
            animationDelay: '650ms',
          }}
        >
          <div
            style={{
              padding: 'var(--space-5) var(--space-6)',
              borderBottom: '1px solid var(--color-border)',
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: 'var(--text-md)',
                fontWeight: 'var(--font-semibold)',
                color: 'var(--color-text)',
              }}
            >
              {t('dashboard:quick_actions')}
            </h2>
          </div>
          <EmptyState
            icon="⚡"
            title={t('dashboard:empty_quick_actions')}
            description=""
          />
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
