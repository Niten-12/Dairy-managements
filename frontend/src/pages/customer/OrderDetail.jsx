import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getOrderById, cancelOrder } from '../../api/orderApi'

const STEPS = [
  { key: 'PENDING',          icon: '📋', label: 'Order Placed'     },
  { key: 'CONFIRMED',        icon: '✅', label: 'Confirmed'         },
  { key: 'PROCESSING',       icon: '⚙️', label: 'Processing'        },
  { key: 'OUT_FOR_DELIVERY', icon: '🚚', label: 'Out for Delivery'  },
  { key: 'DELIVERED',        icon: '🎉', label: 'Delivered'         },
]

const STATUS_ORDER = ['PENDING', 'CONFIRMED', 'PROCESSING', 'OUT_FOR_DELIVERY', 'DELIVERED']

const STATUS_BADGE = {
  PENDING:          { label: 'Pending',         color: '#92400e', bg: '#fef3c7', border: '#fde68a' },
  CONFIRMED:        { label: 'Confirmed',        color: '#1e40af', bg: '#eff6ff', border: '#bfdbfe' },
  PROCESSING:       { label: 'Processing',       color: '#5b21b6', bg: '#f5f3ff', border: '#ddd6fe' },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery', color: '#92400e', bg: '#fff7ed', border: '#fed7aa' },
  DELIVERED:        { label: 'Delivered',        color: '#14532d', bg: '#f0fdf4', border: '#bbf7d0' },
  CANCELLED:        { label: 'Cancelled',        color: '#7f1d1d', bg: '#fef2f2', border: '#fecaca' },
}

function OrderDetail() {
  const { id }     = useParams()
  const navigate   = useNavigate()
  const [order, setOrder]       = useState(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    getOrderById(id)
      .then(r => setOrder(r.data))
      .catch(() => setError('Order not found or access denied.'))
      .finally(() => setLoading(false))
  }, [id])

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return
    setCancelling(true)
    try {
      const { data } = await cancelOrder(id)
      setOrder(data)
    } catch (err) {
      alert(err.response?.data?.message || 'Could not cancel order.')
    } finally {
      setCancelling(false)
    }
  }

  if (loading) return <Shell><LoadingState /></Shell>
  if (error || !order) return <Shell><ErrorState message={error} onBack={() => navigate('/my-orders')} /></Shell>

  const cfg         = STATUS_BADGE[order.status] || STATUS_BADGE.PENDING
  const isCancelled = order.status === 'CANCELLED'
  const currentStep = STATUS_ORDER.indexOf(order.status)
  const date        = new Date(order.createdAt).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  return (
    <Shell>
      {/* Back + header */}
      <div style={{ marginBottom: 24 }}>
        <button
          onClick={() => navigate('/my-orders')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'none', border: 'none', color: '#64748b',
            fontSize: 14, fontWeight: 600, cursor: 'pointer', padding: 0, marginBottom: 16,
          }}
        >
          ← Back to Orders
        </button>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#0f172a' }}>
              #{order.orderNumber}
            </div>
            <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 3 }}>{date}</div>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: cfg.bg, border: `1.5px solid ${cfg.border}`,
            borderRadius: 20, padding: '6px 14px',
          }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: cfg.color }}>{cfg.label}</span>
          </div>
        </div>
      </div>

      {/* Status Timeline */}
      {!isCancelled ? (
        <Card title="Order Status">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative', padding: '8px 0' }}>
            {/* Connecting line */}
            <div style={{
              position: 'absolute', top: 28, left: '10%', right: '10%', height: 3,
              background: '#e2e8f0', zIndex: 0,
            }} />
            <div style={{
              position: 'absolute', top: 28, left: '10%', height: 3, zIndex: 1,
              background: '#16a34a',
              width: currentStep < 0 ? '0%' : `${(currentStep / (STEPS.length - 1)) * 80}%`,
              transition: 'width 600ms ease',
            }} />

            {STEPS.map((step, idx) => {
              const done    = currentStep >= idx
              const current = currentStep === idx
              return (
                <div key={step.key} style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  gap: 8, zIndex: 2, flex: 1,
                }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: '50%',
                    background: done ? '#16a34a' : '#f1f5f9',
                    border: current ? '3px solid #16a34a' : done ? '3px solid #16a34a' : '2px solid #e2e8f0',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 20,
                    boxShadow: current ? '0 0 0 6px #bbf7d0' : 'none',
                    transition: 'all 400ms',
                  }}>
                    {done ? (current && idx < STEPS.length - 1 ? step.icon : '✓') : step.icon}
                  </div>
                  <div style={{
                    fontSize: 11, fontWeight: done ? 700 : 500,
                    color: done ? '#16a34a' : '#94a3b8',
                    textAlign: 'center', lineHeight: 1.3,
                  }}>
                    {step.label}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      ) : (
        <div style={{
          background: '#fef2f2', border: '1.5px solid #fecaca',
          borderRadius: 14, padding: '20px 24px', marginBottom: 20,
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <span style={{ fontSize: 36 }}>❌</span>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#dc2626' }}>Order Cancelled</div>
            <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>
              This order was cancelled. No payment was charged.
            </div>
          </div>
        </div>
      )}

      {/* Order Items */}
      <Card title={`Items (${order.items?.length || 0})`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {order.items?.map(item => (
            <div key={item.id} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '12px', background: '#f8fafc', borderRadius: 12,
            }}>
              <span style={{ fontSize: 32, flexShrink: 0 }}>{item.productEmoji}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{item.productName}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                  {item.productUnit} · ₹{parseFloat(item.unitPrice).toFixed(2)} × {item.quantity}
                </div>
              </div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#16a34a', flexShrink: 0 }}>
                ₹{parseFloat(item.subtotal).toFixed(2)}
              </div>
            </div>
          ))}
        </div>

        {/* Total */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginTop: 16, paddingTop: 14, borderTop: '2px solid #e2e8f0',
        }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#334155' }}>Order Total</span>
          <span style={{ fontSize: 22, fontWeight: 900, color: '#16a34a' }}>
            ₹{parseFloat(order.totalAmount).toFixed(2)}
          </span>
        </div>
      </Card>

      {/* Delivery Details */}
      <Card title="Delivery Address">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <InfoField label="Name"    value={order.deliveryName} />
          <InfoField label="Phone"   value={order.deliveryPhone} />
          <div style={{ gridColumn: '1 / -1' }}>
            <InfoField label="Address" value={order.deliveryAddress} />
          </div>
          {order.deliveryCity    && <InfoField label="City"    value={order.deliveryCity} />}
          {order.deliveryPincode && <InfoField label="Pincode" value={order.deliveryPincode} />}
          {order.notes && (
            <div style={{ gridColumn: '1 / -1' }}>
              <InfoField label="Notes" value={order.notes} />
            </div>
          )}
        </div>
      </Card>

      {/* Cancel Button */}
      {order.status === 'PENDING' && (
        <button
          onClick={handleCancel}
          disabled={cancelling}
          style={{
            width: '100%', padding: '14px 24px', borderRadius: 12, marginTop: 4,
            background: '#fef2f2', border: '1.5px solid #fecaca',
            color: '#ef4444', fontSize: 15, fontWeight: 700,
            cursor: cancelling ? 'not-allowed' : 'pointer',
            opacity: cancelling ? 0.6 : 1,
          }}
        >
          {cancelling ? 'Cancelling...' : '✕ Cancel Order'}
        </button>
      )}
    </Shell>
  )
}

/* ── Sub-components ─────────────────────────────────── */

function Card({ title, children }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 16,
      border: '1.5px solid #e2e8f0',
      padding: '20px 24px', marginBottom: 16,
    }}>
      <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {title}
      </div>
      {children}
    </div>
  )
}

function InfoField({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>
        {label}
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{value}</div>
    </div>
  )
}

function LoadingState() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {[1, 2, 3].map(i => (
        <div key={i} style={{ height: 120, borderRadius: 16, background: '#f1f5f9', animation: 'pulse 1.5s ease-in-out infinite' }} />
      ))}
    </div>
  )
}

function ErrorState({ message, onBack }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 24px' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: '#dc2626', marginBottom: 20 }}>{message}</div>
      <button onClick={onBack} style={{
        padding: '10px 24px', borderRadius: 10, background: '#16a34a',
        border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
      }}>← Back to Orders</button>
    </div>
  )
}

function Shell({ children }) {
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 20px' }}>
      {children}
    </div>
  )
}

export default OrderDetail
