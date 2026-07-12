import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMyOrders, cancelOrder } from '../../api/orderApi'

const STATUS_CONFIG = {
  PENDING:          { label: 'Pending',          color: '#92400e', bg: '#fef3c7', border: '#fde68a', dot: '#f59e0b' },
  CONFIRMED:        { label: 'Confirmed',         color: '#1e40af', bg: '#eff6ff', border: '#bfdbfe', dot: '#3b82f6' },
  PROCESSING:       { label: 'Processing',        color: '#5b21b6', bg: '#f5f3ff', border: '#ddd6fe', dot: '#8b5cf6' },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery',  color: '#92400e', bg: '#fff7ed', border: '#fed7aa', dot: '#f97316' },
  DELIVERED:        { label: 'Delivered',         color: '#14532d', bg: '#f0fdf4', border: '#bbf7d0', dot: '#16a34a' },
  CANCELLED:        { label: 'Cancelled',         color: '#7f1d1d', bg: '#fef2f2', border: '#fecaca', dot: '#ef4444' },
}

function MyOrders() {
  const navigate            = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState('')
  const [cancelling, setCancelling] = useState(null)

  useEffect(() => {
    getMyOrders()
      .then(r => setOrders(r.data))
      .catch(() => setError('Failed to load orders.'))
      .finally(() => setLoading(false))
  }, [])

  const handleCancel = async (orderId) => {
    if (!window.confirm('Cancel this order?')) return
    setCancelling(orderId)
    try {
      const { data } = await cancelOrder(orderId)
      setOrders(prev => prev.map(o => o.id === data.id ? data : o))
    } catch (err) {
      alert(err.response?.data?.message || 'Could not cancel order.')
    } finally {
      setCancelling(null)
    }
  }

  if (loading) return <PageShell><LoadingState /></PageShell>
  if (error)   return <PageShell><ErrorState message={error} /></PageShell>

  return (
    <PageShell>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 26, fontWeight: 900, color: '#0f172a' }}>My Orders</div>
        <div style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>
          {orders.length} order{orders.length !== 1 ? 's' : ''} placed
        </div>
      </div>

      {orders.length === 0 ? (
        <EmptyState onShop={() => navigate('/products')} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {orders.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              onView={() => navigate(`/my-orders/${order.id}`)}
              onCancel={() => handleCancel(order.id)}
              cancelling={cancelling === order.id}
            />
          ))}
        </div>
      )}
    </PageShell>
  )
}

/* ── Order Card ──────────────────────────────────────── */

function OrderCard({ order, onView, onCancel, cancelling }) {
  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING
  const date = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
  const previewItems = order.items?.slice(0, 2) || []
  const extraCount   = (order.items?.length || 0) - previewItems.length

  return (
    <div style={{
      background: '#fff', borderRadius: 16,
      border: '1.5px solid #e2e8f0',
      padding: '20px 24px',
      transition: 'box-shadow 200ms',
    }}>
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>
            #{order.orderNumber}
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{date}</div>
        </div>
        <StatusBadge cfg={cfg} />
      </div>

      {/* Items preview */}
      <div style={{
        display: 'flex', gap: 8, alignItems: 'center', marginBottom: 14,
        padding: '10px 12px', background: '#f8fafc', borderRadius: 10,
      }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {previewItems.map(item => (
            <span key={item.id} style={{ fontSize: 24 }} title={item.productName}>
              {item.productEmoji}
            </span>
          ))}
          {extraCount > 0 && (
            <span style={{
              width: 32, height: 32, borderRadius: '50%',
              background: '#e2e8f0', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#64748b',
            }}>+{extraCount}</span>
          )}
        </div>
        <div style={{ flex: 1, marginLeft: 4 }}>
          <div style={{ fontSize: 13, color: '#334155', fontWeight: 600 }}>
            {previewItems.map(i => i.productName).join(', ')}
            {extraCount > 0 ? ` +${extraCount} more` : ''}
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 1 }}>
            {order.items?.length} item{order.items?.length !== 1 ? 's' : ''}
          </div>
        </div>
        <div style={{ fontSize: 18, fontWeight: 900, color: '#16a34a', flexShrink: 0 }}>
          ₹{parseFloat(order.totalAmount).toFixed(2)}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={onView}
          style={{
            flex: 1, padding: '9px 16px', borderRadius: 10,
            background: '#16a34a', border: 'none',
            color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
          }}
        >
          View Details →
        </button>
        {order.status === 'PENDING' && (
          <button
            onClick={onCancel}
            disabled={cancelling}
            style={{
              padding: '9px 16px', borderRadius: 10,
              background: '#fef2f2', border: '1.5px solid #fecaca',
              color: '#ef4444', fontSize: 13, fontWeight: 700,
              cursor: cancelling ? 'not-allowed' : 'pointer',
              opacity: cancelling ? 0.6 : 1,
            }}
          >
            {cancelling ? 'Cancelling...' : 'Cancel'}
          </button>
        )}
      </div>
    </div>
  )
}

/* ── Status Badge ────────────────────────────────────── */

function StatusBadge({ cfg }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      background: cfg.bg, border: `1px solid ${cfg.border}`,
      borderRadius: 20, padding: '4px 10px', flexShrink: 0,
    }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.dot }} />
      <span style={{ fontSize: 12, fontWeight: 700, color: cfg.color }}>{cfg.label}</span>
    </div>
  )
}

/* ── Empty / Loading / Error ─────────────────────────── */

function EmptyState({ onShop }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 24px' }}>
      <div style={{ fontSize: 72, marginBottom: 16 }}>📦</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>
        No orders yet
      </div>
      <div style={{ fontSize: 14, color: '#64748b', marginBottom: 24, lineHeight: 1.6 }}>
        Browse our fresh dairy products and place your first order!
      </div>
      <button
        onClick={onShop}
        style={{
          padding: '12px 28px', borderRadius: 12,
          background: '#16a34a', border: 'none',
          color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer',
        }}
      >
        Shop Now →
      </button>
    </div>
  )
}

function LoadingState() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {[1, 2, 3].map(i => (
        <div key={i} style={{
          height: 140, borderRadius: 16, background: '#f1f5f9',
          animation: 'pulse 1.5s ease-in-out infinite',
        }} />
      ))}
    </div>
  )
}

function ErrorState({ message }) {
  return (
    <div style={{
      textAlign: 'center', padding: '40px 24px',
      background: '#fef2f2', borderRadius: 16,
      border: '1px solid #fecaca', color: '#dc2626',
      fontSize: 14, fontWeight: 600,
    }}>
      {message}
    </div>
  )
}

/* ── Shell ───────────────────────────────────────────── */

function PageShell({ children }) {
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 20px' }}>
      {children}
    </div>
  )
}

export default MyOrders
