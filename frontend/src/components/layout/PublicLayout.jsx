import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import PublicNavbar from '../public/PublicNavbar'
import PublicFooter from '../public/PublicFooter'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'
import { useAuthModal } from '../../context/AuthModalContext'
import '../../styles/public.css'

const ROLE_REDIRECT = {
  ADMIN:        '/admin/dashboard',
  CUSTOMER:     '/dashboard/customer',
  FARMER:       '/dashboard/farmer',
  DELIVERY_BOY: '/dashboard/delivery',
}

function MobileBottomNav() {
  const location   = useLocation()
  const navigate   = useNavigate()
  const { items, openDrawer } = useCart()
  const { user }   = useAuth()
  const { openLogin } = useAuthModal()
  const cartCount  = items.reduce((s, i) => s + i.qty, 0)
  const path       = location.pathname

  const isActive = (p) => path === p

  const goToAccount = () => {
    if (user) navigate(ROLE_REDIRECT[user.role] || '/dashboard')
    else openLogin()
  }

  return (
    <nav className="pub-mobile-nav">
      <button
        className={`pub-mobile-nav-btn ${isActive('/') ? 'pub-nav-active' : ''}`}
        onClick={() => navigate('/')}
      >
        <span className="pub-mobile-nav-icon">🏠</span>
        <span className="pub-mobile-nav-label">Home</span>
      </button>

      <button
        className={`pub-mobile-nav-btn ${isActive('/products') ? 'pub-nav-active' : ''}`}
        onClick={() => navigate('/products')}
      >
        <span className="pub-mobile-nav-icon">🛍️</span>
        <span className="pub-mobile-nav-label">Products</span>
      </button>

      <button className="pub-mobile-nav-btn" onClick={openDrawer}>
        <span className="pub-mobile-nav-icon">
          🛒
          {cartCount > 0 && (
            <span className="pub-mobile-nav-badge">
              {cartCount > 9 ? '9+' : cartCount}
            </span>
          )}
        </span>
        <span className="pub-mobile-nav-label">Cart</span>
      </button>

      <button
        className={`pub-mobile-nav-btn ${path.startsWith('/dashboard') ? 'pub-nav-active' : ''}`}
        onClick={goToAccount}
      >
        <span className="pub-mobile-nav-icon">👤</span>
        <span className="pub-mobile-nav-label">Account</span>
      </button>
    </nav>
  )
}

function PublicLayout() {
  return (
    <div style={{ minHeight: '100vh', background: '#fff', overflowX: 'hidden' }}>
      <PublicNavbar />
      <main className="pub-mobile-page">
        <Outlet />
      </main>
      <PublicFooter />
      <MobileBottomNav />
    </div>
  )
}

export default PublicLayout
