import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'
import { useAuthModal } from '../../context/AuthModalContext'

const NAV_LINKS = [
  { label: 'Products',     id: 'products',     icon: '🛒' },
  { label: 'Why Us',       id: 'why-us',       icon: '⭐' },
  { label: 'How It Works', id: 'how-it-works', icon: '📋' },
  { label: 'Subscribe',    id: 'subscription', icon: '🔁' },
  { label: 'Reviews',      id: 'testimonials', icon: '💬' },
]

const ROLE_LABEL = {
  ADMIN:        'Admin',
  CUSTOMER:     'Customer',
  FARMER:       'Farmer',
  DELIVERY_BOY: 'Delivery',
}

const ROLE_REDIRECT = {
  ADMIN:        '/admin/dashboard',
  CUSTOMER:     '/dashboard/customer',
  FARMER:       '/dashboard/farmer',
  DELIVERY_BOY: '/dashboard/delivery',
}

function getInitials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?'
}

/* ── Search component ──────────────────────────────────────── */
function NavSearch() {
  const navigate = useNavigate()
  const [open,        setOpen]        = useState(false)
  const [query,       setQuery]       = useState('')
  const [results,     setResults]     = useState([])
  const [loading,     setLoading]     = useState(false)
  const [allProducts, setAllProducts] = useState(null)
  const inputRef = useRef(null)
  const wrapRef  = useRef(null)

  /* Close on outside click */
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) closeSearch()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  /* ESC to close */
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') closeSearch() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open])

  /* Focus input when opened */
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 60)
  }, [open])

  const closeSearch = () => { setOpen(false); setQuery(''); setResults([]) }

  /* Fetch all products once, cache */
  const getProducts = useCallback(async () => {
    if (allProducts) return allProducts
    setLoading(true)
    try {
      const { data } = await axios.get('/api/products')
      setAllProducts(data)
      return data
    } catch { return [] }
    finally { setLoading(false) }
  }, [allProducts])

  /* Debounced search filter */
  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    const timer = setTimeout(async () => {
      const products = await getProducts()
      const q = query.toLowerCase()
      const filtered = products.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q)
      ).slice(0, 7)
      setResults(filtered)
    }, 280)
    return () => clearTimeout(timer)
  }, [query])

  const handleSelect = (product) => {
    closeSearch()
    navigate(`/products/${product.id}`)
  }

  /* Highlight matched text */
  const highlight = (text, q) => {
    if (!q.trim()) return text
    const idx = text.toLowerCase().indexOf(q.toLowerCase())
    if (idx === -1) return text
    return (
      <>
        {text.slice(0, idx)}
        <mark style={{ background: '#fef08a', color: 'inherit', borderRadius: 2, padding: '0 1px' }}>
          {text.slice(idx, idx + q.length)}
        </mark>
        {text.slice(idx + q.length)}
      </>
    )
  }

  const showDropdown = open && (loading || query.trim())

  return (
    <div ref={wrapRef} className="pub-search-wrap">
      {!open ? (
        /* Search icon button */
        <button className="pub-search-icon-btn" onClick={() => setOpen(true)} title="Search products">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <circle cx="8" cy="8" r="5.5" />
            <line x1="12.5" y1="12.5" x2="16" y2="16" />
          </svg>
        </button>
      ) : (
        /* Expanded search */
        <div className="pub-search-expanded">
          <svg className="pub-search-icon-inner" width="16" height="16" viewBox="0 0 18 18" fill="none" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round">
            <circle cx="8" cy="8" r="5.5" />
            <line x1="12.5" y1="12.5" x2="16" y2="16" />
          </svg>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search products…"
            className="pub-search-input"
          />

          {loading && (
            <span style={{ position: 'absolute', right: 38, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: '#94a3b8' }}>
              ⌛
            </span>
          )}

          <button className="pub-search-close-btn" onClick={closeSearch} title="Close">✕</button>

          {/* Dropdown */}
          {showDropdown && (
            <div className="pub-search-dropdown">
              {loading && !results.length && (
                <div className="pub-search-status">Searching…</div>
              )}

              {!loading && query.trim() && results.length === 0 && (
                <div className="pub-search-empty">
                  <span style={{ fontSize: 32, display: 'block', marginBottom: 8 }}>🔍</span>
                  No products found for <strong>"{query}"</strong>
                </div>
              )}

              {results.length > 0 && (
                <>
                  <div className="pub-search-dd-header">
                    Results for <strong>"{query}"</strong>
                    <span className="pub-search-dd-count">{results.length}</span>
                  </div>

                  {results.map(p => (
                    <button key={p.id} className="pub-search-result" onClick={() => handleSelect(p)}>
                      <span className="pub-search-result-emoji">{p.emoji}</span>
                      <div className="pub-search-result-body">
                        <div className="pub-search-result-name">
                          {highlight(p.name, query)}
                        </div>
                        <div className="pub-search-result-unit">{p.unit}</div>
                      </div>
                      <div className="pub-search-result-price">₹{parseFloat(p.price).toFixed(0)}</div>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#cbd5e1" strokeWidth="1.6" strokeLinecap="round">
                        <path d="M5 3l4 4-4 4" />
                      </svg>
                    </button>
                  ))}

                  <button
                    className="pub-search-view-all"
                    onClick={() => { closeSearch(); navigate('/products') }}
                  >
                    View all products →
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Profile Dropdown ──────────────────────────────────────── */
function ProfileDropdown({ user, onClose, onLogout }) {
  const navigate = useNavigate()
  return (
    <div className="pub-profile-dropdown">
      <div className="pub-profile-dd-info">
        <div className="pub-profile-dd-avatar">{getInitials(user.name)}</div>
        <div>
          <div className="pub-profile-dd-name">{user.name}</div>
          <div className="pub-profile-dd-email">{user.email}</div>
          <span className="pub-profile-dd-role">{ROLE_LABEL[user.role] || user.role}</span>
        </div>
      </div>
      <div className="pub-profile-dd-divider" />
      <button
        className="pub-profile-dd-btn pub-profile-dd-btn-primary"
        onClick={() => { onClose(); navigate(ROLE_REDIRECT[user.role] || '/dashboard') }}
      >
        📊 Go to Dashboard
      </button>
      <button className="pub-profile-dd-btn pub-profile-dd-btn-danger" onClick={onLogout}>
        🚪 Sign Out
      </button>
    </div>
  )
}

/* ── Main Navbar ───────────────────────────────────────────── */
function PublicNavbar() {
  const navigate = useNavigate()
  const { totalItems, openDrawer } = useCart()
  const { user, logout }           = useAuth()
  const { openLogin, openRegister } = useAuthModal()

  const [scrolled,    setScrolled]    = useState(false)
  const [mobileOpen,  setMobileOpen]  = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  useEffect(() => {
    if (!profileOpen) return
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [profileOpen])

  const scrollTo = (id) => {
    setMobileOpen(false)
    setTimeout(() => {
      const el = document.getElementById(id)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 60)
  }

  const handleLogout = () => { setProfileOpen(false); logout() }

  return (
    <>
      {/* ── Navbar ─────────────────────────────────────────── */}
      <nav className={`pub-navbar${scrolled ? ' pub-nav-scrolled' : ''}`}>
        <div className="pub-navbar-inner">

          {/* Logo */}
          <a href="/" className="pub-logo">
            <div className="pub-logo-icon">🥛</div>
            <span className="pub-logo-text">
              Dairy<span className="pub-logo-accent">Fresh</span>
            </span>
          </a>

          {/* Desktop nav links */}
          <ul className="pub-nav-links">
            {NAV_LINKS.map((l) => (
              <li key={l.id}>
                <a href={`#${l.id}`} onClick={(e) => { e.preventDefault(); scrollTo(l.id) }}>
                  {l.label}
                </a>
              </li>
            ))}
          </ul>

          {/* Desktop CTA */}
          <div className="pub-navbar-ctas">

            {/* Search */}
            <NavSearch />

            {/* Cart */}
            <button
              onClick={openDrawer}
              className="pub-cart-btn"
              title="Cart"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 01-8 0"/>
              </svg>
              {totalItems > 0 && (
                <span className="pub-cart-badge">
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </button>

            {user ? (
              /* Logged-in profile button */
              <div className="pub-profile-wrap" ref={profileRef}>
                <button className="pub-profile-btn" onClick={() => setProfileOpen(p => !p)}>
                  <div className="pub-profile-btn-avatar">{getInitials(user.name)}</div>
                  <span className="pub-profile-btn-name">{user.name.split(' ')[0]}</span>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
                    style={{ transition: 'transform 200ms', transform: profileOpen ? 'rotate(180deg)' : 'none' }}>
                    <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                {profileOpen && (
                  <ProfileDropdown user={user} onClose={() => setProfileOpen(false)} onLogout={handleLogout} />
                )}
              </div>
            ) : (
              <>
                <button className="pub-btn pub-btn-outline pub-btn-sm" onClick={openLogin}>
                  Login
                </button>
                <button className="pub-btn pub-btn-primary pub-btn-sm" onClick={openRegister}>
                  Get Started →
                </button>
              </>
            )}
          </div>

          {/* Hamburger */}
          <button
            className={`pub-hamburger${mobileOpen ? ' pub-ham-open' : ''}`}
            onClick={() => setMobileOpen(p => !p)}
            aria-label="Toggle navigation"
          >
            <span /><span /><span />
          </button>
        </div>
      </nav>

      {/* ── Mobile Drawer ──────────────────────────────────── */}
      {mobileOpen && (
        <>
          <div className="pub-mob-overlay" onClick={() => setMobileOpen(false)} />
          <div className="pub-mob-drawer">
            <div className="pub-mob-drawer-head">
              <a href="/" className="pub-logo">
                <div className="pub-logo-icon" style={{ width: 36, height: 36, fontSize: 18 }}>🥛</div>
                <span className="pub-logo-text" style={{ fontSize: 18 }}>
                  Dairy<span className="pub-logo-accent">Fresh</span>
                </span>
              </a>
              <button className="pub-mob-close" onClick={() => setMobileOpen(false)}>✕</button>
            </div>
            <div className="pub-mob-body">
              {NAV_LINKS.map(l => (
                <button key={l.id} className="pub-mob-link" onClick={() => scrollTo(l.id)}>
                  <span className="pub-mob-link-icon">{l.icon}</span>{l.label}
                </button>
              ))}
            </div>
            <div className="pub-mob-footer">
              {user ? (
                <>
                  <button className="pub-btn pub-btn-primary" style={{ width: '100%', justifyContent: 'center' }}
                    onClick={() => { setMobileOpen(false); navigate(ROLE_REDIRECT[user.role] || '/dashboard') }}>
                    📊 Go to Dashboard
                  </button>
                  <button className="pub-btn pub-btn-outline" style={{ width: '100%', justifyContent: 'center' }}
                    onClick={() => { setMobileOpen(false); handleLogout() }}>
                    🚪 Sign Out
                  </button>
                </>
              ) : (
                <>
                  <button className="pub-btn pub-btn-outline" style={{ width: '100%', justifyContent: 'center' }}
                    onClick={() => { setMobileOpen(false); openLogin() }}>
                    Login
                  </button>
                  <button className="pub-btn pub-btn-primary" style={{ width: '100%', justifyContent: 'center' }}
                    onClick={() => { setMobileOpen(false); openRegister() }}>
                    Get Started →
                  </button>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </>
  )
}

export default PublicNavbar
