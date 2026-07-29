import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { HERO } from '../../config/heroConfig'
import { getPublicProducts, getPublicCategories, getFeaturedProducts } from '../../api/publicProductApi'
import { classifyError } from '../../utils/apiError'
import { formatPrice, discountPercent, tagBadgeStyle } from '../../utils/productDisplay'
import ProductErrorState from '../../components/public/ProductErrorState'
import ProductImage from '../../components/public/ProductImage'


/* ── Scroll-reveal hook ──────────────────────────────────────── */
function useInView(threshold = 0.12) {
  const ref  = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold }
    )
    const el = ref.current
    if (el) observer.observe(el)
    return () => { if (el) observer.unobserve(el) }
  }, [threshold])
  return [ref, visible]
}

/* ─────────────────────────────────────────────────────────────
   DATA
───────────────────────────────────────────────────────────── */

const STEPS = HERO.steps

const TESTIMONIALS = [
  {
    id: 't1', name: 'Priya Sharma', city: 'Mumbai', initials: 'PS', avatarBg: '#16a34a',
    rating: 5,
    quote: 'Best milk I\'ve ever tasted! It arrives by 6:30 AM — still cold from the farm. My kids have stopped asking for flavoured drinks since we switched to DairyFresh.',
  },
  {
    id: 't2', name: 'Rahul Mehta', city: 'Delhi NCR', initials: 'RM', avatarBg: '#2563eb',
    rating: 5,
    quote: 'The paneer is so fresh and soft — nothing like the market paneer that crumbles. We make restaurant-quality paneer butter masala at home now!',
  },
  {
    id: 't3', name: 'Anita Krishnan', city: 'Bengaluru', initials: 'AK', avatarBg: '#7c3aed',
    rating: 5,
    quote: 'Love the subscription plan. I paused it for a week when I was travelling and resumed with one tap. The app is super smooth and the ghee is absolutely divine.',
  },
]

/* ─────────────────────────────────────────────────────────────
   SECTIONS
───────────────────────────────────────────────────────────── */

const AD_STATS = HERO.stats

/* ── Animated cow + buffalo illustration (mobile/tablet hero only) ── */
function FarmAnimalsIllustration() {
  return (
    <div className="pub-hero-farm-illustration">
      <svg viewBox="0 0 320 170" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Cow and buffalo illustration">
        {/* Ground */}
        <ellipse cx="160" cy="152" rx="150" ry="16" fill="#bbf7d0" />

        {/* Floating clover accents */}
        <text x="34" y="34" fontSize="16" className="pfa-float-a">🍀</text>
        <text x="270" y="26" fontSize="14" className="pfa-float-b">☁️</text>
        <text x="150" y="18" fontSize="13" className="pfa-float-c">☀️</text>

        {/* ── Buffalo (back, right) ── */}
        <g className="pfa-bob-b">
          <ellipse cx="222" cy="112" rx="46" ry="30" fill="#334155" />
          {/* legs */}
          <rect x="192" y="130" width="9" height="22" rx="4" fill="#1e293b" />
          <rect x="212" y="134" width="9" height="20" rx="4" fill="#1e293b" />
          <rect x="234" y="134" width="9" height="20" rx="4" fill="#1e293b" />
          <rect x="252" y="130" width="9" height="22" rx="4" fill="#1e293b" />
          {/* tail */}
          <path d="M266 100 Q280 112 274 130" stroke="#1e293b" strokeWidth="4" fill="none" strokeLinecap="round" className="pfa-tail" style={{ transformBox: 'fill-box', transformOrigin: '0% 0%' }} />
          {/* head */}
          <ellipse cx="192" cy="94" rx="24" ry="21" fill="#334155" />
          {/* horns */}
          <path d="M178 78 Q166 62 176 50" stroke="#78716c" strokeWidth="6" fill="none" strokeLinecap="round" />
          <path d="M204 78 Q218 62 210 50" stroke="#78716c" strokeWidth="6" fill="none" strokeLinecap="round" />
          {/* muzzle */}
          <ellipse cx="180" cy="104" rx="11" ry="8" fill="#57534e" />
          <circle cx="176" cy="103" r="1.6" fill="#1c1917" />
          <circle cx="184" cy="103" r="1.6" fill="#1c1917" />
          {/* eyes */}
          <ellipse cx="188" cy="88" rx="2.6" ry="3.2" fill="#fff" className="pfa-blink-b" style={{ transformBox: 'fill-box', transformOrigin: '50% 50%' }} />
          <ellipse cx="200" cy="88" rx="2.6" ry="3.2" fill="#fff" className="pfa-blink-b" style={{ transformBox: 'fill-box', transformOrigin: '50% 50%' }} />
          {/* ears */}
          <ellipse cx="176" cy="90" rx="5" ry="8" fill="#334155" transform="rotate(-20 176 90)" />
          <ellipse cx="210" cy="90" rx="5" ry="8" fill="#334155" transform="rotate(20 210 90)" />
        </g>

        {/* ── Cow (front, left) ── */}
        <g className="pfa-bob-a">
          <ellipse cx="112" cy="120" rx="54" ry="34" fill="#fff" stroke="#e2e8f0" strokeWidth="1.5" />
          {/* spots */}
          <ellipse cx="94" cy="108" rx="13" ry="10" fill="#334155" />
          <ellipse cx="134" cy="130" rx="11" ry="8" fill="#334155" />
          <ellipse cx="128" cy="104" rx="7" ry="6" fill="#334155" />
          {/* legs */}
          <rect x="76" y="142" width="10" height="24" rx="5" fill="#1e293b" />
          <rect x="98" y="146" width="10" height="22" rx="5" fill="#1e293b" />
          <rect x="122" y="146" width="10" height="22" rx="5" fill="#1e293b" />
          <rect x="144" y="142" width="10" height="24" rx="5" fill="#1e293b" />
          {/* udder */}
          <ellipse cx="112" cy="150" rx="14" ry="8" fill="#fecdd3" />
          {/* tail */}
          <path d="M162 106 Q178 118 172 140" stroke="#334155" strokeWidth="4" fill="none" strokeLinecap="round" className="pfa-tail" style={{ transformBox: 'fill-box', transformOrigin: '0% 0%' }} />
          {/* head */}
          <ellipse cx="68" cy="98" rx="26" ry="23" fill="#fff" stroke="#e2e8f0" strokeWidth="1.5" />
          {/* horns */}
          <path d="M54 78 Q48 66 56 58" stroke="#e7c9a9" strokeWidth="5" fill="none" strokeLinecap="round" />
          <path d="M82 78 Q90 66 82 58" stroke="#e7c9a9" strokeWidth="5" fill="none" strokeLinecap="round" />
          {/* ears */}
          <ellipse cx="46" cy="94" rx="7" ry="10" fill="#fce7e3" transform="rotate(-24 46 94)" />
          <ellipse cx="90" cy="94" rx="7" ry="10" fill="#fce7e3" transform="rotate(24 90 94)" />
          {/* snout */}
          <ellipse cx="52" cy="112" rx="15" ry="11" fill="#fecdd3" />
          <ellipse cx="47" cy="112" rx="2" ry="2.6" fill="#be123c" />
          <ellipse cx="58" cy="112" rx="2" ry="2.6" fill="#be123c" />
          {/* spot on head */}
          <ellipse cx="82" cy="90" rx="9" ry="8" fill="#334155" />
          {/* eyes */}
          <ellipse cx="58" cy="92" rx="2.8" ry="3.4" fill="#1e293b" className="pfa-blink-a" style={{ transformBox: 'fill-box', transformOrigin: '50% 50%' }} />
          <ellipse cx="76" cy="92" rx="2.8" ry="3.4" fill="#1e293b" className="pfa-blink-a" style={{ transformBox: 'fill-box', transformOrigin: '50% 50%' }} />
        </g>
      </svg>
    </div>
  )
}

/* ── 1. Hero — 2-column layout ──────────────────────────────── */
function HeroSection() {
  const navigate = useNavigate()
  const [tickerCats,   setTickerCats]   = useState([])
  const [heroSearch,   setHeroSearch]   = useState('')

  useEffect(() => {
    // Decorative category marquee only. If it fails we render nothing here
    // (items stays []) — the real, retryable categories UI lives in
    // CategoriesSection. Kept intentionally non-blocking, not silently
    // swallowed elsewhere.
    getPublicCategories()
      .then(r => setTickerCats(Array.isArray(r.data) ? r.data : []))
      .catch(() => setTickerCats([]))
  }, [])

  const handleHeroSearch = (e) => {
    e.preventDefault()
    const q = heroSearch.trim()
    if (q) navigate(`/products?search=${encodeURIComponent(q)}`)
    else   navigate('/products')
  }

  const ALL  = { id: 'all', emoji: '🛒', name: 'All' }
  const items = tickerCats.length ? [ALL, ...tickerCats] : []

  return (
    <section className="pub-hero">
      <div className="pub-hero-orb pub-hero-orb1" />
      <div className="pub-hero-orb pub-hero-orb2" />
      <div className="pub-hero-orb pub-hero-orb3" />

      {/* Category pills strip */}
      {items.length > 0 && (
        <div className="pub-hero-ticker">
          <div className="pub-hero-ticker-track">
            {items.map((cat, i) => (
              <span key={cat.id} className="pub-hero-ticker-pill">
                <span className="pub-hero-ticker-emoji">{cat.emoji}</span>
                {cat.name}
                {i < items.length - 1 && <span className="pub-hero-ticker-sep">✦</span>}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 2-column grid */}
      <div className="pub-hero-grid">

        {/* LEFT — text content */}
        <div className="pub-hero-left">
          {/* Mobile/tablet-only hand-lettered header (≤1024px) */}
          <div className="pub-hero-m-accent pub-ha-badge">{HERO.mobileHero.accent}</div>
          <h1 className="pub-hero-m-title pub-ha-title">
            {HERO.mobileHero.headline.map((line, i) => (
              <span key={i}>{i > 0 && <br />}{line}</span>
            ))}
          </h1>

          {/* Desktop-only badge / headline / subtitle (>1024px) */}
          <div className="pub-hero-badge pub-ha-badge">
            <span className="pub-hero-badge-dot" />
            {HERO.badge.emoji} {HERO.badge.text}
          </div>

          <h1 className="pub-hero-title pub-ha-title">
            {HERO.headline.map((part, i) => (
              <span key={i}>
                {part.newLine && <br />}
                {part.accent
                  ? <span className="pub-hero-accent">{part.text}</span>
                  : part.text}
              </span>
            ))}
          </h1>

          <p className="pub-hero-subtitle pub-ha-sub">{HERO.subtitle}</p>

          <FarmAnimalsIllustration />

          <div className="pub-hero-ctas pub-ha-ctas">
            <button
              className="pub-btn pub-btn-primary pub-btn-lg pub-hero-btn-glow"
              onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}
            >
              {HERO.cta.primary}
            </button>
            <button
              className="pub-btn pub-btn-outline pub-btn-lg"
              onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}
            >
              {HERO.cta.secondary}
            </button>
          </div>

          <div className="pub-hero-trust pub-ha-trust">
            {HERO.trust.map((item, i) => (
              <span key={i} style={{ display: 'contents' }}>
                {i > 0 && <span className="pub-hero-trust-sep" />}
                <span className="pub-hero-trust-item">{item.emoji} {item.text}</span>
              </span>
            ))}
          </div>

          {/* Hero Search */}
          <form onSubmit={handleHeroSearch} className="pub-hero-search-form" style={{ display: 'flex', gap: 8, marginTop: 20, maxWidth: 440 }}>
            <input
              type="text"
              className="pub-hero-search-input"
              value={heroSearch}
              onChange={e => setHeroSearch(e.target.value)}
              placeholder="Search milk, paneer, ghee..."
              style={{
                flex: 1, padding: '12px 18px', borderRadius: 9999,
                border: '1.5px solid rgba(255,255,255,0.35)',
                background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)',
                color: '#0f172a', fontSize: 14, outline: 'none', fontFamily: 'inherit',
                boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
              }}
            />
            <button
              type="submit"
              style={{
                padding: '12px 20px', borderRadius: 9999, border: 'none',
                background: 'linear-gradient(135deg,#16a34a,#15803d)',
                color: '#fff', fontWeight: 700, fontSize: 14,
                cursor: 'pointer', whiteSpace: 'nowrap',
                boxShadow: '0 4px 14px rgba(22,163,74,0.4)',
              }}
            >
              🔍 Search
            </button>
          </form>
        </div>

        {/* RIGHT — ad card */}
        <div className="pub-hero-adcard pub-ha-adcard">
          <div className="pub-hero-adcard-header">
            <span className="pub-hero-adcard-header-dot" />
            How It Works
            <span className="pub-hero-adcard-header-tag">3 Easy Steps</span>
          </div>

          <div className="pub-hero-adcard-steps">
            {STEPS.map((s, i) => (
              <div key={s.num} className="pub-hero-adcard-step-wrap">
                <div className="pub-hero-adcard-step">
                  <div className="pub-hero-adcard-step-num">{s.num}</div>
                  <div className="pub-hero-adcard-step-emoji">{s.emoji}</div>
                  <div className="pub-hero-adcard-step-title">{s.title}</div>
                </div>
                {i < STEPS.length - 1 && (
                  <span className="pub-hero-adcard-arrow">→</span>
                )}
              </div>
            ))}
          </div>

          <div className="pub-hero-adcard-divider" />

          <div className="pub-hero-adcard-stats">
            {AD_STATS.map((s) => (
              <div key={s.val} className="pub-hero-adcard-stat">
                <span className="pub-hero-adcard-stat-emoji">{s.emoji}</span>
                <span className="pub-hero-adcard-stat-val">{s.val}</span>
                <span className="pub-hero-adcard-stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  )
}


/* ── 2. Featured Products ────────────────────────────────────── */
function FeaturedSection() {
  const { addItem } = useCart()
  const [products, setProducts] = useState([])
  const [status,   setStatus]   = useState('loading') // loading | success | error
  const [error,    setError]    = useState(null)
  const [addedId,  setAddedId]  = useState(null)
  const [ref, visible] = useInView(0.05)

  const load = useCallback(async () => {
    setStatus('loading'); setError(null)
    try {
      const { data } = await getFeaturedProducts()
      setProducts(Array.isArray(data) ? data : [])
      setStatus('success')
    } catch (err) {
      setError(classifyError(err))
      setStatus('error')
    }
  }, [])

  useEffect(() => { load() }, [load])

  // Failure must NOT look like "no featured products" — show a scoped,
  // retryable error instead of collapsing the section.
  if (status === 'error') {
    return (
      <section className="pub-section-sm" style={{ paddingTop: 32, paddingBottom: 0 }}>
        <div className="pub-container">
          <ProductErrorState
            compact
            message={error?.message}
            retryable={error?.retryable}
            onRetry={load}
          />
        </div>
      </section>
    )
  }

  // Genuinely no featured items (or still loading the first batch): render
  // nothing — the full catalog below is the primary product surface.
  if (status === 'loading' || products.length === 0) return null

  const handleAdd = (p) => {
    addItem({ id: p.id, name: p.name, price: p.price, emoji: p.emoji, unit: p.unit })
    setAddedId(p.id)
    setTimeout(() => setAddedId(null), 1500)
  }

  return (
    <section className="pub-section-sm" ref={ref} style={{ paddingTop: 32, paddingBottom: 0 }}>
      <div className="pub-container">
        {/* Section header */}
        <div className={`pub-reveal pub-d1 ${visible ? 'pub-in' : ''}`}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'linear-gradient(90deg,#fef3c7,#fde68a)', color: '#d97706',
              fontSize: 11, fontWeight: 800, padding: '4px 12px', borderRadius: 999,
              letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8,
              border: '1px solid #fde68a',
            }}>
              ⭐ Featured Products
            </span>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#0f172a' }}>
              Our Best Sellers
            </h2>
          </div>
          <button
            onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}
            style={{ fontSize: 13, fontWeight: 600, color: '#16a34a', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
          >
            View all →
          </button>
        </div>

        {/* Horizontal scroll strip */}
        <div className={`pub-reveal pub-d2 ${visible ? 'pub-in' : ''}`}
          style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 12,
            scrollbarWidth: 'none', msOverflowStyle: 'none',
          }}>
          {products.map((p) => {
            const isAdded = addedId === p.id
            return (
              <div key={p.id} style={{
                flexShrink: 0, width: 170, borderRadius: 16, overflow: 'hidden',
                background: '#fff', border: '1.5px solid #e2e8f0',
                boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
                transition: 'transform 200ms, box-shadow 200ms',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.06)' }}
              >
                {/* Card image */}
                <div style={{
                  height: 110, background: p.bgGradient || 'linear-gradient(135deg,#f0fdf4,#dcfce7)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 52, position: 'relative', overflow: 'hidden',
                }}>
                  <ProductImage
                    src={p.imageUrl}
                    alt={p.name}
                    fallback={p.emoji || '📦'}
                    imgStyle={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }}
                  />
                  <span style={{
                    position: 'absolute', top: 8, left: 8,
                    background: 'linear-gradient(90deg,#d97706,#f59e0b)',
                    color: '#fff', fontSize: 9, fontWeight: 800,
                    padding: '3px 8px', borderRadius: 999, letterSpacing: '0.05em',
                  }}>⭐ FEATURED</span>
                  {discountPercent(p.price, p.originalPrice) !== null && (
                    <span style={{
                      position: 'absolute', top: 8, right: 8,
                      background: '#ef4444', color: '#fff',
                      fontSize: 9, fontWeight: 800,
                      padding: '3px 7px', borderRadius: 999,
                    }}>
                      -{discountPercent(p.price, p.originalPrice)}%
                    </span>
                  )}
                </div>

                {/* Card body */}
                <div style={{ padding: '10px 12px 12px' }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#0f172a', marginBottom: 2, lineHeight: 1.3 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginBottom: 8 }}>{p.unit}</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      {discountPercent(p.price, p.originalPrice) !== null && (
                        <div style={{ fontSize: 10, color: '#94a3b8', textDecoration: 'line-through', lineHeight: 1 }}>
                          {formatPrice(p.originalPrice)}
                        </div>
                      )}
                      <span style={{ fontSize: 15, fontWeight: 800, color: '#16a34a' }}>
                        {formatPrice(p.price)}
                      </span>
                    </div>
                    <button
                      onClick={() => handleAdd(p)}
                      style={{
                        width: 30, height: 30, borderRadius: '50%', border: 'none', cursor: 'pointer',
                        background: isAdded ? '#16a34a' : 'linear-gradient(135deg,#16a34a,#15803d)',
                        color: '#fff', fontSize: 16, fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 200ms', boxShadow: '0 2px 8px rgba(22,163,74,0.35)',
                      }}
                    >
                      {isAdded ? '✓' : '+'}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}


/* ── 3. Products Section (categories + inline products) ────── */
function CategoriesSection() {
  const { addItem }  = useCart()
  const [ref, visible] = useInView(0.05)

  const [categories, setCategories] = useState([])
  const [products,   setProducts]   = useState([])
  const [activeCat,  setActiveCat]  = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [prodError,  setProdError]  = useState(null) // classified error or null
  const [addedId,    setAddedId]    = useState(null)

  // Categories drive the filter pills only. Their failure must never blank the
  // product grid, so this load is independent and degrades to "no filters".
  const loadCategories = useCallback(async () => {
    try {
      const { data } = await getPublicCategories()
      setCategories(Array.isArray(data) ? data : [])
    } catch {
      setCategories([]) // filter row simply hides; products still load below
    }
  }, [])

  useEffect(() => { loadCategories() }, [loadCategories])

  const loadProducts = useCallback(async () => {
    setLoading(true); setProdError(null)
    try {
      const { data } = await getPublicProducts({ categoryId: activeCat })
      setProducts(Array.isArray(data) ? data : [])
    } catch (err) {
      // On failure keep prior products untouched and raise an error flag —
      // never overwrite the grid with [] as if the catalog were empty.
      setProdError(classifyError(err))
    } finally {
      setLoading(false)
    }
  }, [activeCat])

  useEffect(() => { loadProducts() }, [loadProducts])

  const handleAdd = (p) => {
    addItem({ id: p.id, name: p.name, price: p.price, emoji: p.emoji, unit: p.unit })
    setAddedId(p.id)
    setTimeout(() => setAddedId(null), 1500)
  }

  return (
    <section id="products" className="pub-section" ref={ref}>
      <div className="pub-container">


        {/* Category tab pills */}
        <div className={`pub-hp-tabs pub-reveal pub-d1 ${visible ? 'pub-in' : ''}`}>
          <button
            className={`pub-hp-tab${activeCat === null ? ' pub-hp-tab-active' : ''}`}
            onClick={() => setActiveCat(null)}
          >
            🛒 All
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              className={`pub-hp-tab${activeCat === cat.id ? ' pub-hp-tab-active' : ''}`}
              onClick={() => setActiveCat(cat.id === activeCat ? null : cat.id)}
            >
              {cat.emoji} {cat.name}
            </button>
          ))}
        </div>

        {/* Products grid */}
        <div className="pub-hp-grid">
          {loading
            ? [...Array(8)].map((_, i) => (
                <div key={i} className="pub-hp-skeleton">
                  <div className="skeleton" style={{ height: 180, borderRadius: '12px 12px 0 0' }} />
                  <div style={{ padding: '16px 16px 18px' }}>
                    <div className="skeleton" style={{ height: 16, width: '68%', marginBottom: 8, borderRadius: 6 }} />
                    <div className="skeleton" style={{ height: 12, width: '90%', marginBottom: 4, borderRadius: 6 }} />
                    <div className="skeleton" style={{ height: 12, width: '55%', marginBottom: 16, borderRadius: 6 }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div className="skeleton" style={{ height: 22, width: 56, borderRadius: 6 }} />
                      <div className="skeleton" style={{ height: 38, width: 38, borderRadius: '50%' }} />
                    </div>
                  </div>
                </div>
              ))
            : prodError
            ? (
                <ProductErrorState
                  message={prodError.message}
                  retryable={prodError.retryable}
                  onRetry={loadProducts}
                />
              )
            : products.length === 0
            ? (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 20px' }}>
                  <div style={{ fontSize: 56 }}>🥛</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginTop: 12 }}>
                    No products available yet
                  </div>
                  <div style={{ fontSize: 14, color: '#64748b', marginTop: 6 }}>
                    Please check back soon.
                  </div>
                </div>
              )
            : products.map((p, i) => {
                const isAdded = addedId === p.id
                const tagStyle = tagBadgeStyle(p.tagType)

                return (
                  <div
                    key={p.id}
                    className={`pub-hp-card pub-reveal pub-reveal-scale ${visible ? 'pub-in' : ''}`}
                    style={{ transitionDelay: `${0.06 * (i % 8)}s` }}
                  >
                    <div
                      className="pub-hp-card-img"
                      style={{ background: p.bgGradient || 'linear-gradient(135deg,#f0fdf4,#dcfce7)' }}
                    >
                      <ProductImage
                        src={p.imageUrl}
                        alt={p.name}
                        fallback={p.emoji || '📦'}
                        imgStyle={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                        fallbackStyle={{ fontSize: 68 }}
                      />
                      {p.tag && (
                        <span className="pub-hp-card-tag" style={tagStyle}>{p.tag}</span>
                      )}
                      {discountPercent(p.price, p.originalPrice) !== null && (
                        <span style={{
                          position: 'absolute', top: 10, right: 10,
                          background: '#ef4444', color: '#fff',
                          fontSize: 10, fontWeight: 800,
                          padding: '3px 8px', borderRadius: 999,
                        }}>
                          -{discountPercent(p.price, p.originalPrice)}%
                        </span>
                      )}
                    </div>
                    <div className="pub-hp-card-body">
                      <div className="pub-hp-card-name">{p.name}</div>
                      <div className="pub-hp-card-desc">{p.description}</div>
                      <div className="pub-hp-card-foot">
                        <div>
                          {discountPercent(p.price, p.originalPrice) !== null && (
                            <div style={{ fontSize: 11, color: '#94a3b8', textDecoration: 'line-through', lineHeight: 1, marginBottom: 2 }}>
                              {formatPrice(p.originalPrice)}
                            </div>
                          )}
                          <div className="pub-hp-card-price">{formatPrice(p.price)}</div>
                          <div className="pub-hp-card-unit">{p.unit}</div>
                        </div>
                        <button
                          className={`pub-hp-card-add${isAdded ? ' pub-hp-card-added' : ''}`}
                          onClick={() => handleAdd(p)}
                          title="Add to cart"
                        >
                          {isAdded ? '✓' : '+'}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })
          }
        </div>

      </div>
    </section>
  )
}

/* ── 4. Testimonials ───────────────────────────────────────── */
function TestimonialsSection() {
  const [ref, visible] = useInView(0.08)
  return (
    <section id="testimonials" className="pub-section" style={{ background: '#f8fafc' }} ref={ref}>
      <div className="pub-container">
        <div className={`pub-text-center pub-reveal ${visible ? 'pub-in' : ''}`}>
          <span className="pub-section-eyebrow">💬 Real Reviews</span>
          <h2 className="pub-section-title">What Our Families Are Saying</h2>
          <p className="pub-section-subtitle">
            Over 50,000 families have made DairyFresh a part of their morning routine.
            Here&apos;s what they love most.
          </p>
        </div>

        <div className="pub-testi-grid">
          {TESTIMONIALS.map((t, i) => (
            <div
              key={t.id}
              className={`pub-reveal pub-reveal-scale ${visible ? 'pub-in' : ''} pub-d${i + 1}`}
            >
              <div className="pub-testi-card">
                <div className="pub-stars">
                  {'★'.repeat(t.rating)}
                </div>
                <p className="pub-testi-quote">{t.quote}</p>
                <div className="pub-testi-author">
                  <div className="pub-testi-avatar" style={{ background: t.avatarBg }}>
                    {t.initials}
                  </div>
                  <div>
                    <div className="pub-testi-name">{t.name}</div>
                    <div className="pub-testi-city">📍 {t.city}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Aggregate rating bar */}
        <div
          className={`pub-reveal pub-d4 ${visible ? 'pub-in' : ''}`}
          style={{
            marginTop: 48,
            background: '#fff',
            borderRadius: 20,
            padding: '24px 32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 48,
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            border: '1px solid #e2e8f0',
            flexWrap: 'wrap',
          }}
        >
          {[
            { label: 'Product Quality',  pct: 97 },
            { label: 'On-time Delivery', pct: 95 },
            { label: 'Customer Support', pct: 94 },
            { label: 'Value for Money',  pct: 96 },
          ].map((r) => (
            <div key={r.label} style={{ textAlign: 'center', minWidth: 120 }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#16a34a' }}>{r.pct}%</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{r.label}</div>
              <div style={{
                height: 4, background: '#e2e8f0', borderRadius: 4, marginTop: 6, overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%', width: `${r.pct}%`,
                  background: 'linear-gradient(90deg,#16a34a,#22c55e)',
                  borderRadius: 4,
                  transition: 'width 1.2s ease',
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── 9. Newsletter ─────────────────────────────────────────── */
function NewsletterSection() {
  const [ref, visible] = useInView(0.1)
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (email.trim()) { setSubmitted(true); setEmail('') }
  }

  return (
    <section className="pub-section-sm pub-newsletter" ref={ref}>
      <div className="pub-container">
        <div className={`pub-nl-inner pub-reveal ${visible ? 'pub-in' : ''}`}>
          <div>
            <h3 className="pub-nl-title">Stay Fresh. Get Updates. 🥛</h3>
            <p className="pub-nl-sub">
              New products, seasonal offers, and farm news — delivered to your inbox.
            </p>
          </div>
          {submitted ? (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '13px 24px', background: '#dcfce7',
              borderRadius: 9999, color: '#15803d', fontWeight: 700, fontSize: 15,
            }}>
              ✅ Subscribed! Welcome to the DairyFresh family.
            </div>
          ) : (
            <form className="pub-nl-form" onSubmit={handleSubmit}>
              <input
                type="email"
                className="pub-nl-input"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button type="submit" className="pub-btn pub-btn-primary">
                Subscribe →
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────────────────
   MAIN HOME COMPONENT
───────────────────────────────────────────────────────────── */
function Home() {
  const navigate = useNavigate()

  return (
    <>
      <HeroSection />
      <FeaturedSection />
      <CategoriesSection />
      <TestimonialsSection />
      <NewsletterSection />
    </>
  )
}

export default Home
