import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import LiveClock from '../ui/LiveClock'
import LanguageSwitcher from '../ui/LanguageSwitcher'

const ACCENT_COLOR = '#7c3aed'
const AVATAR_BG    = 'linear-gradient(135deg, #7c3aed, #6d28d9)'

function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
}

function AdminNavbar({ onMenuToggle }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation(['common', 'nav'])
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)
  const initials = getInitials(user?.name)

  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
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
    <header
      style={{
        height: 'var(--navbar-height)',
        background: 'var(--color-surface)',
        borderBottom: '1px solid rgba(124,58,237,0.12)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 var(--space-7)',
        flexShrink: 0,
        gap: 'var(--space-4)',
        boxShadow: '0 1px 4px rgba(124,58,237,0.06)',
        position: 'relative',
        zIndex: 30,
      }}
    >
      {/* Left: hamburger + Admin Panel label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', minWidth: 0 }}>
        {/* Hamburger — mobile only */}
        <button
          onClick={onMenuToggle}
          className="admin-hamburger-btn"
          style={{
            width: '40px', height: '40px', borderRadius: 'var(--radius-md)',
            background: 'transparent', border: '1px solid rgba(124,58,237,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, cursor: 'pointer',
            transition: 'background var(--transition-fast)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-violet-50)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
        >
          <span style={{ fontSize: '18px', lineHeight: 1 }}>☰</span>
        </button>

        <div>
          <div
            style={{
              fontSize: 'var(--text-lg)',
              fontWeight: 'var(--font-semibold)',
              color: 'var(--color-text)',
            }}
          >
            {t('common:admin_panel')}
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: '1px' }}>
            {t('common:full_control')}
          </div>
        </div>
      </div>

      {/* Right: clock, language switcher, search, notification, avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexShrink: 0 }}>
        {/* Live Clock — hidden on small screens */}
        <div className="admin-navbar-clock">
          <LiveClock />
        </div>

        {/* Language switcher */}
        <LanguageSwitcher accentColor="#7c3aed" borderColor="rgba(124,58,237,0.2)" />

        {/* Search */}
        <button
          title={t('common:search')}
          style={{
            width: '38px', height: '38px', borderRadius: 'var(--radius-md)',
            background: 'transparent', border: '1px solid rgba(124,58,237,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'background var(--transition-fast)',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-violet-50)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
        >
          <span style={{ fontSize: '15px' }}>🔍</span>
        </button>

        {/* Notification */}
        <button
          title={t('common:notifications')}
          style={{
            width: '38px', height: '38px', borderRadius: 'var(--radius-md)',
            background: 'transparent', border: '1px solid rgba(124,58,237,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', position: 'relative',
            transition: 'background var(--transition-fast)',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-violet-50)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
        >
          <span style={{ fontSize: '16px' }}>🔔</span>
          <span
            style={{
              position: 'absolute', top: '8px', right: '8px',
              width: '7px', height: '7px', borderRadius: '50%',
              background: ACCENT_COLOR,
              border: '1.5px solid #fff',
            }}
          />
        </button>

        {/* Avatar + dropdown */}
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setDropdownOpen((p) => !p)}
            style={{
              display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
              padding: '5px 10px 5px 5px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid rgba(124,58,237,0.2)',
              background: 'transparent',
              cursor: 'pointer',
              transition: 'background var(--transition-fast)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-violet-50)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
          >
            <div
              style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: AVATAR_BG, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '12px', fontWeight: 'var(--font-bold)',
                flexShrink: 0,
              }}
            >
              {initials}
            </div>
            <span
              className="admin-navbar-name"
              style={{
                fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)',
                color: 'var(--color-text)', whiteSpace: 'nowrap',
              }}
            >
              {user?.name?.split(' ')[0]}
            </span>
            <span style={{ fontSize: '10px', color: ACCENT_COLOR }}>▾</span>
          </button>

          {dropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                background: 'var(--color-surface)',
                border: '1px solid rgba(124,58,237,0.15)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: '0 8px 24px rgba(124,58,237,0.15)',
                minWidth: '220px',
                zIndex: 60,
                overflow: 'hidden',
                animation: 'scaleIn 150ms both',
                transformOrigin: 'top right',
              }}
            >
              <div
                style={{
                  padding: 'var(--space-4)',
                  borderBottom: '1px solid rgba(124,58,237,0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                }}
              >
                <div
                  style={{
                    width: '40px', height: '40px', borderRadius: '50%',
                    background: AVATAR_BG, color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '14px', fontWeight: 'var(--font-bold)',
                    flexShrink: 0,
                  }}
                >
                  {initials}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)',
                      color: 'var(--color-text)', overflow: 'hidden',
                      textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}
                  >
                    {user?.name}
                  </div>
                  <div
                    style={{
                      fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}
                  >
                    {user?.email}
                  </div>
                  <span
                    style={{
                      display: 'inline-block', marginTop: '4px',
                      fontSize: '10px', fontWeight: 'var(--font-bold)',
                      padding: '2px 7px', borderRadius: 'var(--radius-full)',
                      background: 'var(--color-violet-100)', color: ACCENT_COLOR,
                      letterSpacing: '0.3px',
                    }}
                  >
                    {t('nav:role_admin')}
                  </span>
                </div>
              </div>

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
                <span>🚪</span>
                <span>{t('common:logout')}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .admin-hamburger-btn { display: none !important; }
        .admin-navbar-clock { display: block; }
        .admin-navbar-name { display: block; }
        @media (max-width: 1023px) {
          .admin-hamburger-btn { display: flex !important; }
        }
        @media (max-width: 768px) {
          .admin-navbar-clock { display: none !important; }
          .admin-navbar-name { display: none !important; }
        }
      `}</style>
    </header>
  )
}

export default AdminNavbar
