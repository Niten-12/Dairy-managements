import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { useCart } from '../../context/CartContext'


/* ── Skeleton loader ──────────────────────────────────────── */
function ProductSkeleton() {
  return (
    <div style={{
      background: '#fff', borderRadius: 20, overflow: 'hidden',
      border: '1.5px solid #e2e8f0',
    }}>
      <div className="skeleton" style={{ height: 190 }} />
      <div style={{ padding: '16px 18px 18px' }}>
        <div className="skeleton" style={{ height: 18, width: '70%', marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 13, width: '90%', marginBottom: 4 }} />
        <div className="skeleton" style={{ height: 13, width: '60%', marginBottom: 14 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="skeleton" style={{ height: 22, width: 60 }} />
          <div className="skeleton" style={{ height: 38, width: 38, borderRadius: '50%' }} />
        </div>
      </div>
    </div>
  )
}

/* ── Product card ─────────────────────────────────────────── */
function ProductCard({ product, onAdd, onView }) {
  const [added, setAdded] = useState(false)

  const handleAdd = () => {
    onAdd(product)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  const tagClass = {
    best:  { bg: '#fef3c7', color: '#d97706' },
    fresh: { bg: '#dcfce7', color: '#15803d' },
    new:   { bg: '#dbeafe', color: '#1d4ed8' },
  }[product.tagType] || { bg: '#f1f5f9', color: '#475569' }

  return (
    <div
      style={{
        background: '#fff', borderRadius: 20,
        border: '1.5px solid #e2e8f0',
        overflow: 'hidden', display: 'flex', flexDirection: 'column',
        transition: 'all 250ms ease',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-8px)'
        e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.12)'
        e.currentTarget.style.borderColor = '#bbf7d0'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'none'
        e.currentTarget.style.borderColor = '#e2e8f0'
      }}
      onClick={() => onView(product.id)}
    >
      {/* Image area */}
      <div style={{
        height: 190, display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: 78, position: 'relative',
        background: product.bgGradient || 'linear-gradient(135deg,#f0fdf4,#dcfce7)',
        flexShrink: 0, overflow: 'hidden',
      }}>
        {product.imageUrl && (
          <img src={product.imageUrl} alt={product.name}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        )}
        {product.tag && (
          <span style={{
            position: 'absolute', top: 12, left: 12,
            padding: '4px 10px', borderRadius: 9999,
            fontSize: 10.5, fontWeight: 700, letterSpacing: '0.03em',
            background: tagClass.bg, color: tagClass.color,
          }}>
            {product.tag}
          </span>
        )}
        {product.originalPrice && (
          <span style={{
            position: 'absolute', top: 12, right: 12,
            background: '#ef4444', color: '#fff',
            fontSize: 10, fontWeight: 800,
            padding: '3px 9px', borderRadius: 999,
          }}>
            -{Math.round((1 - product.price / product.originalPrice) * 100)}%
          </span>
        )}
        {!product.imageUrl && <span style={{ lineHeight: 1, userSelect: 'none' }}>{product.emoji}</span>}
      </div>

      {/* Body */}
      <div style={{ padding: '16px 18px 18px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', marginBottom: 5 }}>
          {product.name}
        </div>
        <div style={{
          fontSize: 12.5, color: '#64748b', lineHeight: 1.55,
          marginBottom: 14, flex: 1,
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {product.description}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            {product.originalPrice && (
              <div style={{ fontSize: 12, color: '#94a3b8', textDecoration: 'line-through', lineHeight: 1, marginBottom: 3 }}>
                ₹{parseFloat(product.originalPrice).toFixed(0)}
              </div>
            )}
            <div style={{ fontSize: 20, fontWeight: 900, color: '#16a34a', lineHeight: 1 }}>
              ₹{parseFloat(product.price).toFixed(0)}
            </div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{product.unit}</div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); handleAdd() }}
            style={{
              width: 40, height: 40, borderRadius: '50%',
              background: added ? '#15803d' : '#16a34a',
              color: '#fff', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: added ? 18 : 22, fontWeight: 700, lineHeight: 1,
              transition: 'all 250ms ease',
              boxShadow: '0 4px 14px rgba(22,163,74,0.35)',
              flexShrink: 0,
            }}
            title="Add to cart"
          >
            {added ? '✓' : '+'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Main Products Page ───────────────────────────────────── */
function Products() {
  const navigate       = useNavigate()
  const [params, setParams] = useSearchParams()
  const { addItem }    = useCart()

  const [categories,  setCategories]  = useState([])
  const [products,    setProducts]    = useState([])
  const [loading,     setLoading]     = useState(true)
  const [activeCat,   setActiveCat]   = useState(null)
  const [search,      setSearch]      = useState(params.get('search') || '')
  const [searchInput, setSearchInput] = useState(params.get('search') || '')
  const searchTimer = useRef(null)

  /* fetch categories once */
  useEffect(() => {
    axios.get(`/api/products/categories`)
      .then((r) => setCategories(r.data))
      .catch(console.error)
  }, [])

  /* fetch products when filter changes */
  useEffect(() => {
    setLoading(true)
    const qp = new URLSearchParams()
    if (activeCat) qp.set('categoryId', activeCat)
    if (search)    qp.set('search', search)
    axios.get(`/api/products?${qp}`)
      .then((r) => setProducts(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [activeCat, search])

  /* debounced search */
  const handleSearchInput = (val) => {
    setSearchInput(val)
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      setSearch(val)
      setActiveCat(null)
    }, 400)
  }

  const selectCategory = (id) => {
    setActiveCat(id === activeCat ? null : id)
    setSearch('')
    setSearchInput('')
  }

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', paddingTop: 'var(--pub-navbar-height)' }}>

      {/* ── Hero bar ───────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg,#16a34a 0%,#15803d 100%)',
        padding: '40px 28px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: '-60%', right: '-10%',
          width: '50%', height: '220%',
          background: 'rgba(255,255,255,0.04)', borderRadius: '50%',
          pointerEvents: 'none',
        }} />
        <span className="pub-section-eyebrow" style={{ background:'rgba(255,255,255,0.15)', color:'#fff', borderColor:'rgba(255,255,255,0.3)' }}>
          🛒 All Products
        </span>
        <h1 style={{
          fontSize: 'clamp(1.6rem,4vw,2.4rem)', fontWeight: 900,
          color: '#fff', margin: '8px 0 10px', letterSpacing: '-0.03em',
        }}>
          Fresh Dairy, Delivered Daily
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 15, maxWidth: 500, margin: '0 auto' }}>
          Browse 20+ farm-fresh products — all lab-tested, zero adulteration.
        </p>

        {/* Search bar */}
        <div style={{
          maxWidth: 520, margin: '24px auto 0',
          display: 'flex', gap: 10,
        }}>
          <input
            type="text"
            placeholder="Search milk, paneer, ghee..."
            value={searchInput}
            onChange={(e) => handleSearchInput(e.target.value)}
            style={{
              flex: 1, padding: '13px 20px',
              borderRadius: 9999, border: 'none',
              fontSize: 14, fontFamily: 'inherit',
              outline: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            }}
          />
          <button
            className="pub-btn pub-btn-white pub-btn-sm"
            style={{ flexShrink: 0 }}
            onClick={() => { setSearch(searchInput); setActiveCat(null) }}
          >
            🔍 Search
          </button>
        </div>
      </div>

      <div className="pub-container" style={{ padding: '32px 28px' }}>

        {/* ── Category filter tabs ────────────────── */}
        <div style={{
          display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 28,
        }}>
          <button
            onClick={() => selectCategory(null)}
            style={{
              padding: '8px 18px', borderRadius: 9999, fontSize: 13,
              fontWeight: 700, cursor: 'pointer', border: '1.5px solid',
              transition: 'all 200ms',
              background: !activeCat ? '#16a34a' : '#fff',
              color:      !activeCat ? '#fff'    : '#475569',
              borderColor:!activeCat ? '#16a34a' : '#e2e8f0',
            }}
          >
            All Products
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => selectCategory(cat.id)}
              style={{
                padding: '8px 18px', borderRadius: 9999, fontSize: 13,
                fontWeight: 700, cursor: 'pointer', border: '1.5px solid',
                transition: 'all 200ms',
                background: activeCat === cat.id ? '#16a34a' : '#fff',
                color:      activeCat === cat.id ? '#fff'    : '#475569',
                borderColor:activeCat === cat.id ? '#16a34a' : '#e2e8f0',
              }}
            >
              {cat.emoji} {cat.name}
            </button>
          ))}
        </div>

        {/* ── Result count ────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 20,
        }}>
          <div style={{ fontSize: 14, color: '#64748b', fontWeight: 600 }}>
            {loading ? 'Loading...' : `${products.length} products found`}
            {search && (
              <span style={{ color: '#16a34a' }}> for "{search}"</span>
            )}
          </div>
          {(search || activeCat) && (
            <button
              onClick={() => { setSearch(''); setSearchInput(''); setActiveCat(null) }}
              style={{
                fontSize: 12, color: '#ef4444', fontWeight: 700,
                background: '#fef2f2', border: '1px solid #fecaca',
                borderRadius: 20, padding: '4px 12px', cursor: 'pointer',
              }}
            >
              ✕ Clear filter
            </button>
          )}
        </div>

        {/* ── Products grid ───────────────────────── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: 20,
        }}>
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <ProductSkeleton key={i} />)
            : products.length === 0
              ? (
                <div style={{
                  gridColumn: '1/-1', textAlign: 'center',
                  padding: '60px 20px',
                }}>
                  <div style={{ fontSize: 56 }}>🔍</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginTop: 12 }}>
                    No products found
                  </div>
                  <div style={{ fontSize: 14, color: '#64748b', marginTop: 6 }}>
                    Try a different search or category
                  </div>
                </div>
              )
              : products.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onAdd={addItem}
                  onView={(id) => navigate(`/products/${id}`)}
                />
              ))
          }
        </div>
      </div>
    </div>
  )
}

export default Products
