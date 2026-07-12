import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import { useCart } from '../../context/CartContext'


function ProductDetail() {
  const { id }       = useParams()
  const navigate     = useNavigate()
  const { addItem, openDrawer } = useCart()

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [qty,     setQty]     = useState(1)
  const [added,   setAdded]   = useState(false)

  useEffect(() => {
    setLoading(true)
    axios.get(`/api/products/${id}`)
      .then((r) => setProduct(r.data))
      .catch(() => navigate('/products'))
      .finally(() => setLoading(false))
  }, [id, navigate])

  const handleAdd = () => {
    for (let i = 0; i < qty; i++) addItem(product)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
    openDrawer()
  }

  if (loading) return (
    <div style={{
      minHeight: '100vh', paddingTop: 'var(--pub-navbar-height)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 48,
    }}>
      🥛
    </div>
  )

  if (!product) return null

  const tagClass = {
    best:  { bg: '#fef3c7', color: '#d97706' },
    fresh: { bg: '#dcfce7', color: '#15803d' },
    new:   { bg: '#dbeafe', color: '#1d4ed8' },
  }[product.tagType] || { bg: '#f1f5f9', color: '#475569' }

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', paddingTop: 'var(--pub-navbar-height)' }}>
      <div className="pub-container" style={{ padding: '40px 28px' }}>

        {/* Breadcrumb */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 24, fontSize: 13, color: '#64748b' }}>
          <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#16a34a', fontWeight: 600 }}>Home</button>
          <span>›</span>
          <button onClick={() => navigate('/products')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#16a34a', fontWeight: 600 }}>Products</button>
          <span>›</span>
          <span style={{ color: '#94a3b8' }}>{product.name}</span>
        </div>

        {/* Main grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 40, alignItems: 'start',
        }}>

          {/* Left — image */}
          <div style={{
            background: product.bgGradient || 'linear-gradient(135deg,#f0fdf4,#dcfce7)',
            borderRadius: 24, height: 380,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 140, position: 'relative', overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
          }}>
            {product.imageUrl
              ? <img src={product.imageUrl} alt={product.name}
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ lineHeight: 1 }}>{product.emoji}</span>
            }
            {product.tag && (
              <span style={{
                position: 'absolute', top: 16, left: 16,
                padding: '6px 14px', borderRadius: 9999,
                fontSize: 12, fontWeight: 700,
                background: tagClass.bg, color: tagClass.color,
              }}>
                {product.tag}
              </span>
            )}
          </div>

          {/* Right — details */}
          <div>
            {/* Category */}
            <div style={{ fontSize: 13, color: '#16a34a', fontWeight: 700, marginBottom: 8 }}>
              {product.categoryEmoji} {product.categoryName}
            </div>

            {/* Name */}
            <h1 style={{
              fontSize: 'clamp(1.6rem,3vw,2.2rem)', fontWeight: 900,
              color: '#0f172a', letterSpacing: '-0.03em',
              lineHeight: 1.15, marginBottom: 12,
            }}>
              {product.name}
            </h1>

            {/* Price */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 36, fontWeight: 900, color: '#16a34a', lineHeight: 1 }}>
                ₹{parseFloat(product.price).toFixed(0)}
              </span>
              <span style={{ fontSize: 15, color: '#64748b' }}>/ {product.unit}</span>
              {product.originalPrice && (
                <>
                  <span style={{ fontSize: 18, color: '#94a3b8', textDecoration: 'line-through' }}>
                    ₹{parseFloat(product.originalPrice).toFixed(0)}
                  </span>
                  <span style={{
                    fontSize: 13, fontWeight: 800, padding: '4px 10px',
                    background: '#fef2f2', color: '#ef4444', borderRadius: 999,
                    border: '1px solid #fecaca',
                  }}>
                    {Math.round((1 - product.price / product.originalPrice) * 100)}% OFF
                  </span>
                </>
              )}
            </div>

            {/* Description */}
            <p style={{
              fontSize: 15, color: '#475569', lineHeight: 1.75,
              marginBottom: 24,
              padding: '16px', background: '#fff',
              borderRadius: 12, border: '1px solid #e2e8f0',
            }}>
              {product.description}
            </p>

            {/* Features */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
              {[
                { icon: '✅', text: 'Lab tested — 18+ quality checks' },
                { icon: '🌾', text: 'Farm direct — no middlemen' },
                { icon: '🚚', text: 'Morning delivery before 7 AM' },
                { icon: '🔄', text: 'Easy returns & refund guarantee' },
              ].map((f) => (
                <div key={f.text} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#334155', fontWeight: 500 }}>
                  <span>{f.icon}</span> {f.text}
                </div>
              ))}
            </div>

            {/* Qty + Add to cart */}
            <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 16 }}>
              {/* Qty selector */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                background: '#f8fafc', border: '1.5px solid #e2e8f0',
                borderRadius: 9999, padding: '6px 14px',
              }}>
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  style={{
                    width: 30, height: 30, borderRadius: '50%',
                    background: qty === 1 ? '#f1f5f9' : '#e2e8f0',
                    border: 'none', cursor: 'pointer',
                    fontSize: 18, fontWeight: 700, color: '#334155',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  −
                </button>
                <span style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', minWidth: 24, textAlign: 'center' }}>
                  {qty}
                </span>
                <button
                  onClick={() => setQty(qty + 1)}
                  style={{
                    width: 30, height: 30, borderRadius: '50%',
                    background: '#16a34a',
                    border: 'none', cursor: 'pointer',
                    fontSize: 18, fontWeight: 700, color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  +
                </button>
              </div>

              {/* Add to cart button */}
              <button
                className="pub-btn pub-btn-primary pub-btn-lg"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={handleAdd}
              >
                {added ? '✓ Added to Cart!' : `🛒 Add to Cart — ₹${(parseFloat(product.price) * qty).toFixed(0)}`}
              </button>
            </div>

            {/* Subscribe CTA */}
            <button
              className="pub-btn pub-btn-outline"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => navigate('/products')}
            >
              🛒 Browse More Products
            </button>

            {/* Stock info */}
            <div style={{
              marginTop: 16, fontSize: 12, color: '#64748b',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: product.stock > 20 ? '#16a34a' : '#f59e0b',
              }} />
              {product.stock > 20 ? 'In Stock' : `Only ${product.stock} left`}
              {' · '}Delivery: Before 7 AM tomorrow
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductDetail
