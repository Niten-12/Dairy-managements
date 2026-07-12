import { useState, useEffect, useCallback } from 'react'
import { adminGetAllOrders, adminUpdateOrderStatus } from '../../api/adminOrderApi'
import AdminCreateOrderModal from '../../components/admin/AdminCreateOrderModal'

const STATUS_LIST = ['PENDING', 'CONFIRMED', 'PROCESSING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED']

const STATUS_CFG = {
  PENDING:          { label: 'Pending',         color: '#92400e', bg: '#fef3c7', border: '#fde68a' },
  CONFIRMED:        { label: 'Confirmed',        color: '#1e40af', bg: '#eff6ff', border: '#bfdbfe' },
  PROCESSING:       { label: 'Processing',       color: '#5b21b6', bg: '#f5f3ff', border: '#ddd6fe' },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery', color: '#92400e', bg: '#fff7ed', border: '#fed7aa' },
  DELIVERED:        { label: 'Delivered',        color: '#14532d', bg: '#f0fdf4', border: '#bbf7d0' },
  CANCELLED:        { label: 'Cancelled',        color: '#7f1d1d', bg: '#fef2f2', border: '#fecaca' },
}

const NEXT_STATUSES = {
  PENDING:          ['CONFIRMED', 'CANCELLED'],
  CONFIRMED:        ['PROCESSING', 'CANCELLED'],
  PROCESSING:       ['OUT_FOR_DELIVERY', 'CANCELLED'],
  OUT_FOR_DELIVERY: ['DELIVERED'],
  DELIVERED:        [],
  CANCELLED:        [],
}

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function OrderManagement() {
  const [orders,     setOrders]     = useState([])
  const [loading,    setLoading]    = useState(true)
  const [pageError,  setPageError]  = useState('')
  const [activeTab,  setActiveTab]  = useState('ALL')
  const [updatingId, setUpdatingId] = useState(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [notice, setNotice] = useState('')

  const load = useCallback(async () => {
    try {
      setLoading(true); setPageError('')
      const { data } = await adminGetAllOrders()
      setOrders(data)
    } catch {
      setPageError('Failed to load orders.')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  /* ── counts per status ─────────────────────────── */
  const counts = STATUS_LIST.reduce((acc, s) => {
    acc[s] = orders.filter(o => o.status === s).length
    return acc
  }, {})

  /* ── filtered list ─────────────────────────────── */
  const visible = activeTab === 'ALL' ? orders : orders.filter(o => o.status === activeTab)

  /* ── stats ─────────────────────────────────────── */
  const totalRevenue = orders
    .filter(o => o.status !== 'CANCELLED')
    .reduce((sum, o) => sum + parseFloat(o.totalAmount || 0), 0)

  const todayOrders = orders.filter(o => {
    const d = new Date(o.createdAt)
    const n = new Date()
    return d.getDate() === n.getDate() && d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear()
  }).length

  /* ── update status ─────────────────────────────── */
  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingId(orderId)
    try {
      const { data } = await adminUpdateOrderStatus(orderId, newStatus)
      setOrders(prev => prev.map(o => o.id === data.id ? data : o))
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status.')
    } finally { setUpdatingId(null) }
  }

  const closeCreate = useCallback(() => setCreateOpen(false), [])

  const handleCreated = (createdOrder) => {
    setOrders(previous => [createdOrder, ...previous])
    setActiveTab('ALL')
    setCreateOpen(false)
    setNotice(`Order ${createdOrder.orderNumber} created successfully.`)
    window.setTimeout(() => setNotice(''), 4000)
  }

  return (
    <div style={{ maxWidth: 1300 }}>

      {/* Header */}
      <div className="anim-fade-in-up" style={{ marginBottom: 'var(--space-7)', animationFillMode: 'both', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', color: 'var(--color-text)' }}>
            Order Management
          </h1>
          <p style={{ margin: 0, fontSize: 'var(--text-base)', color: 'var(--color-text-muted)' }}>
            Create, track and update customer orders
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 16px', border: 0, borderRadius: 11,
            background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff',
            fontSize: 13, fontWeight: 800, cursor: 'pointer',
            boxShadow: '0 8px 20px rgba(124,58,237,.22)',
          }}
        >
          <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> New Order
        </button>
      </div>

      {notice && (
        <div style={{ margin: '-12px 0 18px', padding: '10px 14px', border: '1px solid #bbf7d0', borderRadius: 11, background: '#f0fdf4', color: '#15803d', fontSize: 13, fontWeight: 700 }}>
          ✓ {notice}
        </div>
      )}

      {/* Stats */}
      <div className="anim-fade-in-up" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 14, marginBottom: 24, animationFillMode: 'both', animationDelay: '60ms' }}>
        {[
          { label: 'Total Orders', value: orders.length, color: '#7c3aed', bg: '#f5f3ff' },
          { label: 'Pending',      value: counts.PENDING || 0, color: '#d97706', bg: '#fef3c7' },
          { label: "Today's",      value: todayOrders,   color: '#2563eb', bg: '#eff6ff' },
          { label: 'Revenue',      value: `₹${totalRevenue.toFixed(0)}`, color: '#16a34a', bg: '#f0fdf4' },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, borderRadius: 14, padding: '14px 18px' }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: s.color, opacity: 0.7, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Status filter tabs */}
      <div className="anim-fade-in-up" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20, animationFillMode: 'both', animationDelay: '100ms' }}>
        {[['ALL', 'All Orders', orders.length], ...STATUS_LIST.map(s => [s, STATUS_CFG[s].label, counts[s] || 0])].map(([val, label, count]) => (
          <button key={val} onClick={() => setActiveTab(val)}
            style={{
              padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              border: `1.5px solid ${activeTab === val ? '#7c3aed' : 'var(--color-border)'}`,
              background: activeTab === val ? '#f5f3ff' : '#fff',
              color: activeTab === val ? '#7c3aed' : 'var(--color-text-muted)',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
            {label}
            <span style={{ fontSize: 11, fontWeight: 700, background: activeTab === val ? '#7c3aed' : '#e2e8f0', color: activeTab === val ? '#fff' : '#64748b', borderRadius: 10, padding: '1px 6px' }}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Orders table */}
      <div className="anim-fade-in-up" style={{ background: '#fff', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)', animationFillMode: 'both', animationDelay: '130ms' }}>
        {loading ? (
          <div style={{ padding: 64, textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading orders...</div>
        ) : pageError ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-red-600)' }}>{pageError}</div>
        ) : (
          <>
            <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--color-border)', background: '#fafafa', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', fontWeight: 'var(--font-semibold)' }}>
              {visible.length} order{visible.length !== 1 ? 's' : ''}
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', background: '#fafafa' }}>
                    {['Order #', 'Customer', 'Date', 'Items', 'Amount', 'Status', 'Update Status'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 'var(--font-semibold)', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visible.length === 0 ? (
                    <tr><td colSpan={7} style={{ padding: 52, textAlign: 'center', color: 'var(--color-text-muted)' }}>No orders in this category</td></tr>
                  ) : visible.map((o, i) => {
                    const cfg   = STATUS_CFG[o.status] || STATUS_CFG.PENDING
                    const nexts = NEXT_STATUSES[o.status] || []
                    return (
                      <tr key={o.id}
                        style={{ borderBottom: i < visible.length - 1 ? '1px solid var(--color-border)' : 'none', transition: 'background var(--transition-fast)' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                        onMouseLeave={e => e.currentTarget.style.background = ''}>

                        {/* Order # */}
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontWeight: 'var(--font-semibold)', color: 'var(--color-text)', fontFamily: 'monospace', fontSize: 12 }}>
                            {o.orderNumber}
                          </div>
                        </td>

                        {/* Customer */}
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontWeight: 'var(--font-medium)', color: 'var(--color-text)' }}>{o.deliveryName}</div>
                          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 1 }}>{o.deliveryPhone}</div>
                        </td>

                        {/* Date */}
                        <td style={{ padding: '12px 14px', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                          {fmtDate(o.createdAt)}
                        </td>

                        {/* Items */}
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                            {o.items?.slice(0, 3).map(item => (
                              <span key={item.id} style={{ fontSize: 18 }} title={item.productName}>{item.productEmoji}</span>
                            ))}
                            {(o.items?.length || 0) > 3 && (
                              <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>+{o.items.length - 3}</span>
                            )}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
                            {o.items?.length || 0} item{(o.items?.length || 0) !== 1 ? 's' : ''}
                          </div>
                        </td>

                        {/* Amount */}
                        <td style={{ padding: '12px 14px', fontWeight: 'var(--font-semibold)', color: '#16a34a', whiteSpace: 'nowrap' }}>
                          ₹{parseFloat(o.totalAmount).toFixed(2)}
                        </td>

                        {/* Status badge */}
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{
                            fontSize: 11, padding: '3px 9px', borderRadius: 12, fontWeight: 700, whiteSpace: 'nowrap',
                            background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color,
                          }}>{cfg.label}</span>
                        </td>

                        {/* Update status */}
                        <td style={{ padding: '12px 14px' }}>
                          {nexts.length === 0 ? (
                            <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>—</span>
                          ) : (
                            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                              {nexts.map(next => {
                                const nc = STATUS_CFG[next]
                                return (
                                  <button
                                    key={next}
                                    onClick={() => handleStatusChange(o.id, next)}
                                    disabled={updatingId === o.id}
                                    style={{
                                      padding: '4px 10px', borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: updatingId === o.id ? 'not-allowed' : 'pointer',
                                      border: `1px solid ${nc.border}`, background: nc.bg, color: nc.color,
                                      opacity: updatingId === o.id ? 0.6 : 1, whiteSpace: 'nowrap',
                                    }}
                                  >
                                    {updatingId === o.id ? '...' : `→ ${nc.label}`}
                                  </button>
                                )
                              })}
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {createOpen && <AdminCreateOrderModal onClose={closeCreate} onCreated={handleCreated} />}
    </div>
  )
}
