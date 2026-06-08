import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import LiveClock from '../ui/LiveClock'
import LanguageSwitcher from '../ui/LanguageSwitcher'

const routeTitleKeys = {
  '/dashboard/customer': 'page_customer_dashboard',
  '/dashboard/farmer':   'page_farmer_dashboard',
  '/dashboard/delivery': 'page_delivery_dashboard',
}

const roleBadgeStyle = {
  CUSTOMER:     { bg: 'var(--color-blue-100)',    color: 'var(--color-blue-700)'    },
  FARMER:       { bg: 'var(--color-emerald-100)', color: 'var(--color-emerald-600)' },
  DELIVERY_BOY: { bg: 'var(--color-amber-100)',   color: 'var(--color-amber-600)'   },
}

const roleAvatarColors = {
  CUSTOMER:     '#2563eb',
  FARMER:       '#059669',
  DELIVERY_BOY: '#d97706',
}

const roleNavKey = {
  CUSTOMER:     'role_customer',
  FARMER:       'role_farmer',
  DELIVERY_BOY: 'role_delivery_boy',
}

function getInitials(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('')
}

function Navbar({ onMenuToggle }) {
  const { user, logout } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const { t } = useTranslation(['common', 'nav', 'dashboard'])
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  const badgeStyle   = roleBadgeStyle[user?.role] || { bg: 'var(--color-slate-100)', color: 'var(--color-slate-600)' }
  const titleKey     = routeTitleKeys[location.pathname]
  const pageTitle    = titleKey ? t(`nav:${titleKey}`) : t('nav:page_customer_dashboard')
  const initials     = getInitials(user?.name)
  const avatarBg     = roleAvatarColors[user?.role] || '#2563eb'
  const roleLabelKey = roleNavKey[user?.role]

  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleLogout = () => {
    setDropdownOpen(false)
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <header style={{
      height: 'var(--navbar-height)', background: 'var(--color-surface)',
      borderBottom: '1px solid var(--color-border)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 var(--space-6)', flexShrink: 0, gap: 'var(--space-4)',
      position: 'relative', zIndex: 30,
      boxShadow: 'var(--shadow-xs)',
    }}>
      {/* Left: hamburger (mobile) + page title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', minWidth: 0 }}>
        <button
          onClick={onMenuToggle}
          className="nav-hamburger"
          style={{
            width: '38px', height: '38px', borderRadius: 'var(--radius-md)',
            background: 'transparent', border: '1px solid var(--color-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0,
            transition: 'background var(--transition-fast)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-slate-100)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
        >
          <span style={{ fontSize: '16px' }}>☰</span>
        </button>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--font-semibold)', color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {pageTitle}
          </div>
        </div>
      </div>

      {/* Right: clock, language switcher, search, notifications, avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexShrink: 0 }}>
        {/* Live Clock — hidden on small screens */}
        <div className="navbar-clock">
          <LiveClock />
        </div>

        {/* Language switcher */}
        <LanguageSwitcher accentColor="var(--color-blue-600)" />

        {/* Search */}
        <button title={t('common:search')} style={{
          width: '36px', height: '36px', borderRadius: 'var(--radius-md)',
          background: 'transparent', border: '1px solid var(--color-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', transition: 'background var(--transition-fast)',
          flexShrink: 0,
        }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-slate-100)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
        >
          <span style={{ fontSize: '14px' }}>🔍</span>
        </button>

        {/* Notifications */}
        <button title={t('common:notifications')} style={{
          width: '36px', height: '36px', borderRadius: 'var(--radius-md)',
          background: 'transparent', border: '1px solid var(--color-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', position: 'relative',
          transition: 'background var(--transition-fast)', flexShrink: 0,
        }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-slate-100)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
        >
          <span style={{ fontSize: '15px' }}>🔔</span>
          <span style={{
            position: 'absolute', top: '8px', right: '8px',
            width: '7px', height: '7px', borderRadius: '50%',
            background: 'var(--color-blue-600)', border: '1.5px solid #fff',
          }} />
        </button>

        {/* Avatar + dropdown */}
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setDropdownOpen((p) => !p)}
            style={{
              display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
              padding: '5px 10px 5px 5px', borderRadius: 'var(--radius-full)',
              border: '1px solid var(--color-border)',
              background: 'transparent', cursor: 'pointer',
              transition: 'background var(--transition-fast)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-slate-100)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
          >
            <div style={{
              width: '30px', height: '30px', borderRadius: '50%',
              background: avatarBg, color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '12px', fontWeight: 'var(--font-bold)', flexShrink: 0,
            }}>
              {initials}
            </div>
            <span className="navbar-username" style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', color: 'var(--color-text)', whiteSpace: 'nowrap' }}>
              {user?.name?.split(' ')[0]}
            </span>
            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>▾</span>
          </button>

          {dropdownOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: 0,
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-dropdown)',
              minWidth: '220px', zIndex: 60, overflow: 'hidden',
              animation: 'scaleIn 150ms both', transformOrigin: 'top right',
            }}>
              {/* User info */}
              <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%',
                  background: avatarBg, color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '14px', fontWeight: 'var(--font-bold)', flexShrink: 0,
                }}>
                  {initials}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user?.name}
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user?.email}
                  </div>
                  {roleLabelKey && (
                    <span style={{
                      display: 'inline-block', marginTop: '4px',
                      fontSize: '10px', fontWeight: 'var(--font-semibold)',
                      padding: '2px 7px', borderRadius: 'var(--radius-full)',
                      background: badgeStyle.bg, color: badgeStyle.color,
                    }}>
                      {t(`nav:${roleLabelKey}`)}
                    </span>
                  )}
                </div>
              </div>
              {/* Logout */}
              <button
                onClick={handleLogout}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
                  padding: 'var(--space-3) var(--space-4)',
                  background: 'transparent', cursor: 'pointer',
                  fontSize: 'var(--text-sm)', color: 'var(--color-red-600)',
                  fontWeight: 'var(--font-medium)',
                  transition: 'background var(--transition-fast)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-red-50)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
              >
                <span>🚪</span> {t('common:logout')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Responsive CSS */}
      <style>{`
        .nav-hamburger { display: none !important; }
        .navbar-clock { display: block; }
        .navbar-username { display: block; }
        @media (max-width: 1023px) {
          .nav-hamburger { display: flex !important; }
        }
        @media (max-width: 768px) {
          .navbar-clock { display: none !important; }
          .navbar-username { display: none !important; }
        }
      `}</style>
    </header>
  )
}

export default Navbar
