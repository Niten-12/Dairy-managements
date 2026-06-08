import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import StatCard from '../../components/ui/StatCard'
import EmptyState from '../../components/ui/EmptyState'

function DeliveryDashboard() {
  const { user } = useAuth()
  const { t } = useTranslation(['dashboard', 'common'])

  const stats = [
    { id: 'todays_deliveries', label: t('dashboard:stat_todays_deliveries'), value: '0',  icon: '🚚', color: 'var(--color-amber-600)',   bg: 'var(--color-amber-100)',   delay: 0 },
    { id: 'completed',         label: t('dashboard:stat_completed'),         value: '0',  icon: '✅', color: 'var(--color-emerald-600)', bg: 'var(--color-emerald-100)', delay: 1 },
    { id: 'pending',           label: t('dashboard:stat_pending'),           value: '0',  icon: '⏳', color: 'var(--color-red-600)',     bg: 'var(--color-red-100)',     delay: 2 },
    { id: 'week_earnings',     label: t('dashboard:stat_week_earnings'),     value: '₹0', icon: '💵', color: 'var(--color-blue-600)',    bg: 'var(--color-blue-100)',    delay: 3 },
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
          {t('dashboard:hello', { name: user?.name })}
        </h1>
        <p style={{ margin: 0, fontSize: 'var(--text-base)', color: 'var(--color-text-muted)' }}>
          {t('dashboard:delivery_subtitle')}
        </p>
      </div>

      {/* ── Stat cards ──────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-7)',
        }}
      >
        {stats.map((s) => (
          <StatCard key={s.id} label={s.label} value={s.value} icon={s.icon} color={s.color} bg={s.bg} delay={s.delay} />
        ))}
      </div>

      {/* ── Today's route ───────────────────────────── */}
      <div
        className="anim-fade-in-up anim-delay-4"
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
            {t('dashboard:todays_route')}
          </h2>
          <span
            style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--color-text-muted)',
              background: 'var(--color-slate-100)',
              padding: '3px 8px',
              borderRadius: 'var(--radius-full)',
              fontWeight: 'var(--font-medium)',
            }}
          >
            {t('dashboard:count_stops')}
          </span>
        </div>
        <EmptyState
          icon="🗺️"
          title={t('dashboard:empty_deliveries_title')}
          description={t('dashboard:empty_deliveries_desc')}
        />
      </div>
    </div>
  )
}

export default DeliveryDashboard
