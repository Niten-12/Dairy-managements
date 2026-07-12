import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { placeOrder } from '../../api/orderApi'

function CheckoutModal({ onClose }) {
  const navigate  = useNavigate()
  const { user }  = useAuth()
  const { items, totalPrice, clearCart } = useCart()

  const [form, setForm] = useState({
    deliveryName:    user?.name || '',
    deliveryPhone:   '',
    deliveryAddress: '',
    deliveryCity:    '',
    deliveryPincode: '',
    notes:           '',
  })
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [success,  setSuccess]  = useState(null)

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.deliveryName.trim() || !form.deliveryPhone.trim() || !form.deliveryAddress.trim()) {
      setError('Name, phone and address are required.')
      return
    }
    setLoading(true)
    try {
      const payload = {
        ...form,
        items: items.map(i => ({
          productId:    i.id,
          productName:  i.name,
          productEmoji: i.emoji,
          productUnit:  i.unit,
          quantity:     i.qty,
          unitPrice:    i.price,
        })),
      }
      const { data } = await placeOrder(payload)
      setSuccess(data)
      clearCart()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleViewOrders = () => {
    onClose()
    navigate('/my-orders')
  }

  return (
    <>
      {/* Overlay */}
      <div
        onClick={!success ? onClose : undefined}
        style={{
          position: 'fixed', inset: 0, zIndex: 3000,
          background: 'rgba(15,23,42,0.6)',
          backdropFilter: 'blur(4px)',
          animation: 'pub-fade-in 200ms both',
        }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%', zIndex: 3001,
        transform: 'translate(-50%,-50%)',
        width: 480, maxWidth: '95vw', maxHeight: '92vh',
        background: '#fff', borderRadius: 20,
        boxShadow: '0 24px 80px rgba(0,0,0,0.22)',
        display: 'flex', flexDirection: 'column',
        animation: 'pub-slide-up 300ms cubic-bezier(0.22,1,0.36,1) both',
      }}>

        {/* ── Header ─────────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px', borderBottom: '1px solid #e2e8f0', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22 }}>{success ? '🎉' : '📦'}</span>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
                {success ? 'Order Placed!' : 'Delivery Details'}
              </div>
              {!success && (
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 1 }}>
                  Total: ₹{totalPrice.toFixed(2)} · {items.length} item{items.length !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          </div>
          {!success && (
            <button
              onClick={onClose}
              style={{
                width: 36, height: 36, borderRadius: '50%',
                border: '1px solid #e2e8f0', background: 'transparent',
                cursor: 'pointer', fontSize: 17, color: '#64748b',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >✕</button>
          )}
        </div>

        {/* ── Body ───────────────────────────────── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

          {/* SUCCESS STATE */}
          {success ? (
            <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>
                Thank you, {success.deliveryName}!
              </div>
              <div style={{ fontSize: 14, color: '#64748b', marginBottom: 20, lineHeight: 1.6 }}>
                Your order has been placed successfully.<br />
                You'll receive your delivery before 7 AM tomorrow.
              </div>

              {/* Order number box */}
              <div style={{
                background: '#f0fdf4', border: '1.5px solid #bbf7d0',
                borderRadius: 14, padding: '16px 20px', marginBottom: 24, textAlign: 'left',
              }}>
                <div style={{ fontSize: 11, color: '#15803d', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
                  Order Number
                </div>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#15803d', letterSpacing: 1 }}>
                  {success.orderNumber}
                </div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 8 }}>
                  Amount: <strong style={{ color: '#0f172a' }}>₹{parseFloat(success.totalAmount).toFixed(2)}</strong>
                  &nbsp;·&nbsp; Status: <strong style={{ color: '#f59e0b' }}>PENDING</strong>
                </div>
              </div>

              <button
                onClick={handleViewOrders}
                className="pub-btn pub-btn-primary"
                style={{ width: '100%', justifyContent: 'center', fontSize: 15, padding: '14px 24px', marginBottom: 12 }}
              >
                View My Orders →
              </button>
              <button
                onClick={onClose}
                style={{
                  width: '100%', padding: '12px 24px', borderRadius: 12,
                  border: '1.5px solid #e2e8f0', background: 'transparent',
                  fontSize: 14, fontWeight: 600, color: '#64748b', cursor: 'pointer',
                }}
              >
                Continue Shopping
              </button>
            </div>

          ) : (
            /* FORM STATE */
            <form onSubmit={handleSubmit} id="checkout-form">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                {/* Row: Name + Phone */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Field label="Full Name *" name="deliveryName"  value={form.deliveryName}  onChange={handle} placeholder="Ravi Kumar" />
                  <Field label="Phone *"     name="deliveryPhone" value={form.deliveryPhone} onChange={handle} placeholder="98765 43210" />
                </div>

                {/* Address */}
                <div>
                  <label style={labelStyle}>Address *</label>
                  <textarea
                    name="deliveryAddress"
                    value={form.deliveryAddress}
                    onChange={handle}
                    placeholder="House no, Street, Area..."
                    rows={2}
                    style={{ ...inputStyle, resize: 'none', lineHeight: 1.5 }}
                  />
                </div>

                {/* Row: City + Pincode */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Field label="City"    name="deliveryCity"    value={form.deliveryCity}    onChange={handle} placeholder="Hyderabad" />
                  <Field label="Pincode" name="deliveryPincode" value={form.deliveryPincode} onChange={handle} placeholder="500001" />
                </div>

                {/* Notes */}
                <div>
                  <label style={labelStyle}>Delivery Notes (optional)</label>
                  <input
                    name="notes"
                    value={form.notes}
                    onChange={handle}
                    placeholder="Leave at door, call before delivery..."
                    style={inputStyle}
                  />
                </div>

                {error && (
                  <div style={{
                    background: '#fef2f2', border: '1px solid #fecaca',
                    borderRadius: 10, padding: '10px 14px',
                    fontSize: 13, color: '#dc2626', fontWeight: 600,
                  }}>
                    {error}
                  </div>
                )}
              </div>
            </form>
          )}
        </div>

        {/* ── Footer (only in form state) ─────────── */}
        {!success && (
          <div style={{
            padding: '16px 24px 20px',
            borderTop: '1px solid #e2e8f0',
            flexShrink: 0, background: '#f8fafc',
          }}>
            {/* Order summary strip */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12,
              padding: '10px 14px', marginBottom: 14,
              fontSize: 14, fontWeight: 700, color: '#0f172a',
            }}>
              <span>Order Total</span>
              <span style={{ color: '#16a34a', fontSize: 18 }}>₹{totalPrice.toFixed(2)}</span>
            </div>
            <button
              form="checkout-form"
              type="submit"
              disabled={loading}
              className="pub-btn pub-btn-primary"
              style={{ width: '100%', justifyContent: 'center', fontSize: 15, padding: '14px 24px', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Placing Order...' : '🛒 Place Order'}
            </button>
          </div>
        )}
      </div>
    </>
  )
}

/* ── Sub-components ─────────────────────────────── */

function Field({ label, name, value, onChange, placeholder }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input
        name={name} value={value} onChange={onChange}
        placeholder={placeholder} style={inputStyle}
      />
    </div>
  )
}

const labelStyle = {
  display: 'block', fontSize: 12, fontWeight: 700,
  color: '#374151', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5,
}

const inputStyle = {
  width: '100%', padding: '10px 12px', borderRadius: 10,
  border: '1.5px solid #e2e8f0', fontSize: 14, color: '#0f172a',
  background: '#fff', outline: 'none', boxSizing: 'border-box',
  fontFamily: 'inherit',
  transition: 'border-color 200ms',
}

export default CheckoutModal
