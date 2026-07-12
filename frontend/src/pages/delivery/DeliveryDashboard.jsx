import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import StatCard from '../../components/ui/StatCard'
import { getPendingDeliveries, markDelivered, getDeliveryHistory } from '../../api/deliveryApi'

const STATUS_COLOR = {
  OUT_FOR_DELIVERY: { bg: '#fef9c3', color: '#854d0e' },
  DELIVERED:        { bg: '#d1fae5', color: '#065f46' },
}

function DeliveryDashboard() {
  const { user } = useAuth()

  const [tab,       setTab]       = useState('pending')
  const [pending,   setPending]   = useState([])
  const [history,   setHistory]   = useState([])
  const [loading,   setLoading]   = useState(true)
  const [marking,   setMarking]   = useState(null)
  const [error,     setError]     = useState('')

  const loadData = async () => {
    setLoading(true)
    try {
      const [p, h] = await Promise.all([getPendingDeliveries(), getDeliveryHistory()])
      setPending(p.data)
      setHistory(h.data)
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const handleMarkDelivered = async (id) => {
    setMarking(id)
    setError('')
    try {
      await markDelivered(id)
      await loadData()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update order')
    } finally {
      setMarking(null)
    }
  }

  const todayStr = new Date().toISOString().slice(0, 10)
  const todayDelivered = history.filter(
    (o) => o.updatedAt && o.updatedAt.slice(0, 10) === todayStr
  ).length

  const statCards = [
    {
      id: 'pending',
      label: 'Pending Deliveries',
      value: String(pending.length),
      icon: '🚚',
      color: 'var(--color-amber-600)',
      bg: 'var(--color-amber-100)',
      delay: 0,
    },
    {
      id: 'today',
      label: 'Delivered Today',
      value: String(todayDelivered),
      icon: '✅',
      color: 'var(--color-emerald-600)',
      bg: 'var(--color-emerald-100)',
      delay: 1,
    },
    {
      id: 'total',
      label: 'Total Delivered',
      value: String(history.length),
      icon: '📦',
      color: 'var(--color-blue-600)',
      bg: 'var(--color-blue-100)',
      delay: 2,
    },
  ]

  return (
    <div style={{ maxWidth: '1100px' }}>
      {/* Header */}
      <div className="anim-fade-in-up" style={{ marginBottom: 'var(--space-7)', animationFillMode: 'both' }}>
        <h1
          style={{
            margin: '0 0 var(--space-1)',
            fontSize: 'var(--text-2xl)',
            fontWeight: 'var(--font-bold)',
            color: 'var(--color-text)',
          }}
        >
          Welcome, {user?.name} 👋
        </h1>
        <p style={{ margin: 0, fontSize: 'var(--text-base)', color: 'var(--color-text-muted)' }}>
          Manage your deliveries and mark orders as delivered
        </p>
      </div>

      {/* Stat cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-7)',
        }}
      >
        {statCards.map((s) => (
          <StatCard key={s.id} label={s.label} value={s.value} icon={s.icon} color={s.color} bg={s.bg} delay={s.delay} />
        ))}
      </div>

      {/* Main card */}
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
        {/* Tab bar */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)' }}>
          {[
            { key: 'pending', label: `🚚 Pending (${pending.length})` },
            { key: 'history', label: `✅ History (${history.length})` },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: 'var(--space-4) var(--space-6)',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontSize: 'var(--text-sm)',
                fontWeight: tab === t.key ? 'var(--font-semibold)' : 'var(--font-normal)',
                color: tab === t.key ? 'var(--color-primary)' : 'var(--color-text-muted)',
                borderBottom: tab === t.key ? '2px solid var(--color-primary)' : '2px solid transparent',
                marginBottom: '-1px',
                transition: 'all 0.2s',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {error && (
          <div
            style={{
              margin: 'var(--space-4)',
              padding: 'var(--space-3) var(--space-4)',
              background: '#fee2e2',
              color: '#991b1b',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-sm)',
            }}
          >
            ❌ {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--color-text-muted)' }}>
            Loading…
          </div>
        ) : (
          <>
            {/* Pending tab */}
            {tab === 'pending' && (
              <>
                {pending.length === 0 ? (
                  <EmptyBox icon="🎉" title="No pending deliveries" desc="All caught up! Check back later." />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {pending.map((order, idx) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        idx={idx}
                        actionLabel="Mark Delivered"
                        actionColor="var(--color-emerald-600)"
                        onAction={() => handleMarkDelivered(order.id)}
                        loading={marking === order.id}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {/* History tab */}
            {tab === 'history' && (
              <>
                {history.length === 0 ? (
                  <EmptyBox icon="📦" title="No delivered orders yet" desc="Delivered orders will appear here." />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {history.map((order, idx) => (
                      <OrderCard key={order.id} order={order} idx={idx} showDeliveredBadge />
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function OrderCard({ order, idx, actionLabel, actionColor, onAction, loading, showDeliveredBadge }) {
  const itemsPreview = order.items
    ?.slice(0, 3)
    .map((i) => `${i.productEmoji || '🥛'} ${i.productName} ×${i.quantity}`)
    .join(', ')

  return (
    <div
      style={{
        padding: 'var(--space-5) var(--space-6)',
        borderTop: idx > 0 ? '1px solid var(--color-border)' : 'none',
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        gap: 'var(--space-4)',
        alignItems: 'center',
      }}
    >
      <div>
        {/* Order number + badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
          <span style={{ fontWeight: 'var(--font-semibold)', fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>
            {order.orderNumber}
          </span>
          {showDeliveredBadge && (
            <span
              style={{
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                fontSize: 'var(--text-xs)',
                fontWeight: 'var(--font-semibold)',
                background: '#d1fae5',
                color: '#065f46',
              }}
            >
              ✅ Delivered
            </span>
          )}
        </div>

        {/* Customer name + phone */}
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text)', marginBottom: 'var(--space-1)' }}>
          👤 {order.deliveryName}
          {order.deliveryPhone && (
            <span style={{ color: 'var(--color-text-muted)', marginLeft: 'var(--space-2)' }}>
              📞 {order.deliveryPhone}
            </span>
          )}
        </div>

        {/* Address */}
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-2)' }}>
          📍 {[order.deliveryAddress, order.deliveryCity, order.deliveryPincode].filter(Boolean).join(', ')}
        </div>

        {/* Items preview */}
        {itemsPreview && (
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
            {itemsPreview}
            {order.items?.length > 3 && ` +${order.items.length - 3} more`}
          </div>
        )}
      </div>

      {/* Right side: amount + action */}
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div
          style={{
            fontSize: 'var(--text-md)',
            fontWeight: 'var(--font-bold)',
            color: 'var(--color-text)',
            marginBottom: 'var(--space-2)',
          }}
        >
          ₹{Number(order.totalAmount).toFixed(2)}
        </div>
        {onAction && (
          <button
            onClick={onAction}
            disabled={loading}
            style={{
              padding: 'var(--space-2) var(--space-4)',
              background: loading ? 'var(--color-text-muted)' : actionColor,
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-xs)',
              fontWeight: 'var(--font-semibold)',
              cursor: loading ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap',
              transition: 'background 0.2s',
            }}
          >
            {loading ? '…' : actionLabel}
          </button>
        )}
      </div>
    </div>
  )
}

function EmptyBox({ icon, title, desc }) {
  return (
    <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--color-text-muted)' }}>
      <div style={{ fontSize: '3rem', marginBottom: 'var(--space-3)' }}>{icon}</div>
      <p style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-medium)', margin: '0 0 var(--space-1)' }}>
        {title}
      </p>
      <p style={{ fontSize: 'var(--text-sm)', margin: 0 }}>{desc}</p>
    </div>
  )
}

export default DeliveryDashboard
