import { useEffect, useState } from 'react'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'
import { useAuthModal } from '../../context/AuthModalContext'
import CheckoutModal from './CheckoutModal'

function CartDrawer() {
  const { user } = useAuth()
  const { openLogin } = useAuthModal()
  const { items, totalItems, totalPrice, drawerOpen, closeDrawer, removeItem, setQty, clearCart } = useCart()
  const [checkoutOpen, setCheckoutOpen] = useState(false)

  /* lock body scroll when open */
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [drawerOpen])

  if (!drawerOpen && !checkoutOpen) return null

  const handleCheckout = () => {
    if (user) {
      setCheckoutOpen(true)
    } else {
      closeDrawer()
      openLogin()
    }
  }

  return (
    <>
      {/* Checkout Modal */}
      {checkoutOpen && (
        <CheckoutModal onClose={() => { setCheckoutOpen(false); closeDrawer() }} />
      )}

      {/* Overlay + Drawer */}
      {drawerOpen && (
      <>
      <div
        onClick={closeDrawer}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(15,23,42,0.52)',
          zIndex: 2000,
          backdropFilter: 'blur(4px)',
          animation: 'pub-fade-in 200ms both',
        }}
      />

      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 420, maxWidth: '95vw',
        background: '#fff',
        zIndex: 2001,
        display: 'flex', flexDirection: 'column',
        boxShadow: '-8px 0 48px rgba(0,0,0,0.16)',
        animation: 'pub-slide-right-in 300ms cubic-bezier(0.22,1,0.36,1) both',
      }}>

        {/* ── Header ──────────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px',
          borderBottom: '1px solid #e2e8f0',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22 }}>🛒</span>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
                Your Cart
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 1 }}>
                {totalItems} {totalItems === 1 ? 'item' : 'items'}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {items.length > 0 && (
              <button
                onClick={clearCart}
                style={{
                  fontSize: 12, color: '#ef4444', fontWeight: 600,
                  background: '#fef2f2', border: '1px solid #fecaca',
                  borderRadius: 20, padding: '4px 10px', cursor: 'pointer',
                }}
              >
                Clear All
              </button>
            )}
            <button
              onClick={closeDrawer}
              style={{
                width: 36, height: 36, borderRadius: '50%',
                border: '1px solid #e2e8f0', background: 'transparent',
                cursor: 'pointer', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 17, color: '#64748b',
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* ── Items ───────────────────────────────── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
          {items.length === 0 ? (
            <EmptyCart />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {items.map((item) => (
                <CartItem
                  key={item.id}
                  item={item}
                  onRemove={() => removeItem(item.id)}
                  onQtyChange={(qty) => setQty(item.id, qty)}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Footer ──────────────────────────────── */}
        {items.length > 0 && (
          <div style={{
            padding: '16px 24px 24px',
            borderTop: '1px solid #e2e8f0',
            flexShrink: 0,
            background: '#f8fafc',
          }}>
            {/* Delivery note */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: '#f0fdf4', border: '1px solid #bbf7d0',
              borderRadius: 10, padding: '10px 14px', marginBottom: 16,
            }}>
              <span style={{ fontSize: 18 }}>🚚</span>
              <span style={{ fontSize: 13, color: '#15803d', fontWeight: 600 }}>
                Free delivery · Arrives before 7 AM tomorrow
              </span>
            </div>

            {/* Price breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748b' }}>
                <span>Subtotal ({totalItems} items)</span>
                <span>₹{totalPrice.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748b' }}>
                <span>Delivery</span>
                <span style={{ color: '#16a34a', fontWeight: 600 }}>FREE</span>
              </div>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                fontSize: 17, fontWeight: 800, color: '#0f172a',
                paddingTop: 10, borderTop: '1px solid #e2e8f0',
              }}>
                <span>Total</span>
                <span style={{ color: '#16a34a' }}>₹{totalPrice.toFixed(2)}</span>
              </div>
            </div>

            {/* Checkout button */}
            <button
              className="pub-btn pub-btn-primary"
              style={{ width: '100%', justifyContent: 'center', fontSize: 15, padding: '14px 24px' }}
              onClick={handleCheckout}
            >
              Proceed to Checkout →
            </button>
            {!user && (
              <p style={{ textAlign: 'center', fontSize: 12, color: '#94a3b8', marginTop: 10 }}>
                🔒 Login required to complete order
              </p>
            )}
          </div>
        )}
      </div>
      </>
      )}
    </>
  )
}

/* ── Empty state ──────────────────────────────────────────── */
function EmptyCart() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100%', gap: 16, padding: '40px 24px',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 72 }}>🛒</div>
      <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
        Your cart is empty
      </div>
      <div style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>
        Add fresh dairy products to your cart and get them delivered before 7 AM!
      </div>
    </div>
  )
}

/* ── Single cart item ─────────────────────────────────────── */
function CartItem({ item, onRemove, onQtyChange }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 14,
      border: '1.5px solid #e2e8f0',
      padding: '14px', display: 'flex', gap: 12,
      transition: 'border-color 200ms',
    }}>
      {/* Emoji */}
      <div style={{
        width: 56, height: 56, borderRadius: 12, flexShrink: 0,
        background: item.bgGradient || 'linear-gradient(135deg,#f0fdf4,#dcfce7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 28,
      }}>
        {item.emoji}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 14, fontWeight: 700, color: '#0f172a',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {item.name}
        </div>
        <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
          {item.unit}
        </div>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#16a34a', marginTop: 4 }}>
          ₹{(item.price * item.qty).toFixed(2)}
        </div>
      </div>

      {/* Qty controls + remove */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
        <button
          onClick={onRemove}
          style={{
            width: 24, height: 24, borderRadius: '50%',
            background: '#fef2f2', border: '1px solid #fecaca',
            color: '#ef4444', fontSize: 13, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          ✕
        </button>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: '#f8fafc', borderRadius: 20, padding: '4px 6px',
          border: '1px solid #e2e8f0',
        }}>
          <button
            onClick={() => onQtyChange(item.qty - 1)}
            style={{
              width: 26, height: 26, borderRadius: '50%',
              background: item.qty === 1 ? '#fee2e2' : '#e2e8f0',
              border: 'none', cursor: 'pointer',
              fontSize: 16, fontWeight: 700, lineHeight: 1,
              color: item.qty === 1 ? '#ef4444' : '#334155',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {item.qty === 1 ? '🗑' : '−'}
          </button>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', minWidth: 20, textAlign: 'center' }}>
            {item.qty}
          </span>
          <button
            onClick={() => onQtyChange(item.qty + 1)}
            style={{
              width: 26, height: 26, borderRadius: '50%',
              background: '#16a34a', border: 'none', cursor: 'pointer',
              fontSize: 16, fontWeight: 700, color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            +
          </button>
        </div>
      </div>
    </div>
  )
}

export default CartDrawer
