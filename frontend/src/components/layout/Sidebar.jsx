import { NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { useBrand } from '../../context/BrandContext'

/* ── Role info (labelKey used with t()) ──────────────────── */
const roleInfo = {
  CUSTOMER:     { labelKey: 'customer_portal', color: '#2563eb', bg: 'rgba(37,99,235,0.18)'  },
  FARMER:       { labelKey: 'farmer_portal',   color: '#059669', bg: 'rgba(5,150,105,0.18)'  },
  DELIVERY_BOY: { labelKey: 'delivery_portal', color: '#d97706', bg: 'rgba(217,119,6,0.18)'  },
}

/* ── Helpers ─────────────────────────────────────────────── */
function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
}

/* ── Sidebar Component ───────────────────────────────────── */
function Sidebar({ collapsed, mobileOpen, closeMobile, onToggleCollapse }) {
  const { user, logout } = useAuth()
  const { brandName } = useBrand()
  const navigate = useNavigate()
  const { t } = useTranslation(['common', 'nav'])
  const [hoveredItem, setHoveredItem] = useState(null)

  /* navConfig defined inside function body so t() is available */
  const navConfig = {
    CUSTOMER: [
      { key: 'dashboard',    path: '/dashboard/customer', icon: '🏠' },
      { key: 'my_orders',   path: '/orders',             icon: '📦', soon: true },
      { key: 'subscription',path: '/subscription',       icon: '🔁', soon: true },
      { key: 'payments',    path: '/payments',           icon: '💳', soon: true },
      { key: 'support',     path: '/support',            icon: '💬', soon: true },
    ],
    FARMER: [
      { key: 'dashboard',       path: '/dashboard/farmer', icon: '🏠' },
      { key: 'milk_collection', path: '/collection',       icon: '🥛', soon: true },
      { key: 'my_cattle',       path: '/cattle',           icon: '🐄', soon: true },
      { key: 'payments',        path: '/payments',         icon: '💰', soon: true },
      { key: 'reports',         path: '/reports',          icon: '📊', soon: true },
    ],
    DELIVERY_BOY: [
      { key: 'dashboard',    path: '/dashboard/delivery', icon: '🏠' },
      { key: 'todays_route', path: '/route',              icon: '🗺️', soon: true },
      { key: 'deliveries',   path: '/deliveries',         icon: '🚚', soon: true },
      { key: 'history',      path: '/history',            icon: '📋', soon: true },
      { key: 'earnings',     path: '/earnings',           icon: '💵', soon: true },
    ],
  }

  const items   = navConfig[user?.role] || []
  const role    = roleInfo[user?.role] || { labelKey: 'customer_portal', color: '#2563eb', bg: 'rgba(37,99,235,0.18)' }
  const initials = getInitials(user?.name)

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const sidebarStyle = {
    width: collapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)',
    minWidth: collapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)',
    height: '100vh',
    background: 'var(--color-slate-900)',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    position: 'relative',
    zIndex: 50,
    transition: 'width var(--transition-base), min-width var(--transition-base)',
    overflow: 'hidden',
    borderRight: '1px solid rgba(255,255,255,0.04)',
  }

  const mobileStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: 'var(--sidebar-width)',
    minWidth: 'var(--sidebar-width)',
    height: '100vh',
    transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
    transition: 'transform var(--transition-base)',
    zIndex: 50,
    boxShadow: mobileOpen ? 'var(--shadow-xl)' : 'none',
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside style={sidebarStyle} className="sidebar-desktop">
        <SidebarInner
          items={items}
          role={role}
          user={user}
          initials={initials}
          collapsed={collapsed}
          hoveredItem={hoveredItem}
          setHoveredItem={setHoveredItem}
          onToggleCollapse={onToggleCollapse}
          onLogout={handleLogout}
          isMobile={false}
          onClose={null}
          t={t}
          brandName={brandName}
        />
      </aside>

      {/* Mobile drawer sidebar */}
      <aside
        style={{ ...sidebarStyle, ...mobileStyle, width: 'var(--sidebar-width)', minWidth: 'var(--sidebar-width)' }}
        className="sidebar-mobile"
      >
        <SidebarInner
          items={items}
          role={role}
          user={user}
          initials={initials}
          collapsed={false}
          hoveredItem={hoveredItem}
          setHoveredItem={setHoveredItem}
          onToggleCollapse={null}
          onLogout={handleLogout}
          isMobile={true}
          onClose={closeMobile}
          t={t}
          brandName={brandName}
        />
      </aside>

      {/* Responsive CSS to show/hide desktop vs mobile sidebar */}
      <style>{`
        @media (max-width: 1023px) {
          .sidebar-desktop { display: none !important; }
        }
        @media (min-width: 1024px) {
          .sidebar-mobile { display: none !important; }
        }
      `}</style>
    </>
  )
}

/* ── Inner sidebar content (shared between desktop + mobile) ─ */
function SidebarInner({
  items, role, user, initials, collapsed, hoveredItem,
  setHoveredItem, onToggleCollapse, onLogout, isMobile, onClose, t, brandName,
}) {
  return (
    <>
      {/* ── Logo area ──────────────────────────────────── */}
      <div
        style={{
          padding: collapsed ? '20px 0' : '20px 20px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          gap: '8px',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <span style={{ fontSize: '22px', flexShrink: 0 }}>🥛</span>
          {!collapsed && (
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 'var(--text-lg)',
                  fontWeight: 'var(--font-bold)',
                  color: '#fff',
                  lineHeight: 1.2,
                  animation: 'fadeIn 200ms both',
                }}
              >
                {brandName}
              </div>
              <div
                style={{
                  marginTop: '5px',
                  fontSize: '10px',
                  fontWeight: 'var(--font-semibold)',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  background: role.color,
                  color: '#fff',
                  display: 'inline-block',
                  letterSpacing: '0.3px',
                  animation: 'fadeIn 200ms both',
                  whiteSpace: 'nowrap',
                }}
              >
                {t(`nav:${role.labelKey}`)}
              </div>
            </div>
          )}
        </div>

        {/* Mobile close button */}
        {isMobile && (
          <button
            onClick={onClose}
            style={{
              width: '32px', height: '32px', borderRadius: 'var(--radius-md)',
              background: 'rgba(255,255,255,0.08)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '16px', cursor: 'pointer', flexShrink: 0,
              transition: 'background var(--transition-fast)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
          >
            ✕
          </button>
        )}

        {/* Desktop collapse toggle */}
        {!isMobile && onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            style={{
              width: '28px', height: '28px', borderRadius: 'var(--radius-md)',
              background: 'rgba(255,255,255,0.07)', color: 'var(--color-slate-400)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '13px', cursor: 'pointer', flexShrink: 0,
              transition: 'background var(--transition-fast), color var(--transition-fast)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.14)'
              e.currentTarget.style.color = '#fff'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.07)'
              e.currentTarget.style.color = 'var(--color-slate-400)'
            }}
          >
            {collapsed ? '›' : '‹'}
          </button>
        )}
      </div>

      {/* ── Navigation ─────────────────────────────────── */}
      <nav
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '10px 0',
        }}
      >
        {items.map((item, idx) => {
          const label = t(`nav:${item.key}`)
          if (item.soon) {
            return (
              <div
                key={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: collapsed ? '11px 0' : '11px 16px',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  color: 'var(--color-slate-600)',
                  cursor: 'default',
                  fontSize: 'var(--text-base)',
                  borderLeft: '3px solid transparent',
                  position: 'relative',
                  userSelect: 'none',
                }}
                onMouseEnter={() => collapsed && setHoveredItem(`${item.path}-${idx}`)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <span style={{ fontSize: '17px', flexShrink: 0 }}>{item.icon}</span>
                {!collapsed && (
                  <>
                    <span style={{ flex: 1, whiteSpace: 'nowrap', animation: 'fadeIn 150ms both' }}>
                      {label}
                    </span>
                    <span
                      style={{
                        fontSize: '10px',
                        background: 'var(--color-slate-700)',
                        color: 'var(--color-slate-400)',
                        padding: '2px 6px',
                        borderRadius: 'var(--radius-full)',
                        fontWeight: 'var(--font-semibold)',
                      }}
                    >
                      {t('common:soon')}
                    </span>
                  </>
                )}
                {/* Tooltip when collapsed */}
                {collapsed && hoveredItem === `${item.path}-${idx}` && (
                  <SidebarTooltip label={label} extra={`· ${t('common:soon')}`} />
                )}
              </div>
            )
          }

          return (
            <div
              key={item.path}
              style={{ position: 'relative' }}
              onMouseEnter={() => collapsed && setHoveredItem(item.path)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <NavLink
                to={item.path}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: collapsed ? '11px 0' : '11px 16px',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  textDecoration: 'none',
                  fontSize: 'var(--text-base)',
                  fontWeight: isActive ? 'var(--font-semibold)' : 'var(--font-normal)',
                  color: isActive ? '#fff' : 'var(--color-slate-400)',
                  background: isActive ? role.bg : 'transparent',
                  borderLeft: isActive ? `3px solid ${role.color}` : '3px solid transparent',
                  transition: 'background var(--transition-fast), color var(--transition-fast)',
                  borderRadius: collapsed ? '0' : '0 var(--radius-md) var(--radius-md) 0',
                  marginRight: collapsed ? '0' : '8px',
                })}
                onMouseEnter={(e) => {
                  if (!e.currentTarget.classList.contains('active')) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                    e.currentTarget.style.color = '#fff'
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = ''
                  e.currentTarget.style.color = ''
                }}
              >
                <span style={{ fontSize: '17px', flexShrink: 0 }}>{item.icon}</span>
                {!collapsed && (
                  <span style={{ whiteSpace: 'nowrap', animation: 'fadeIn 150ms both' }}>
                    {label}
                  </span>
                )}
              </NavLink>
              {/* Tooltip when collapsed */}
              {collapsed && hoveredItem === item.path && (
                <SidebarTooltip label={label} />
              )}
            </div>
          )
        })}
      </nav>

      {/* ── Bottom: user + logout ────────────────────── */}
      <div
        style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          padding: collapsed ? '12px 0' : '14px 16px',
          flexShrink: 0,
        }}
      >
        {/* User info */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '10px',
            justifyContent: collapsed ? 'center' : 'flex-start',
          }}
        >
          {/* Avatar circle */}
          <div
            style={{
              width: '36px', height: '36px', borderRadius: 'var(--radius-full)',
              background: role.color, color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '13px', fontWeight: 'var(--font-bold)',
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
          {!collapsed && (
            <div style={{ minWidth: 0, animation: 'fadeIn 150ms both' }}>
              <div
                style={{
                  fontSize: 'var(--text-sm)',
                  fontWeight: 'var(--font-semibold)',
                  color: '#fff',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {user?.name}
              </div>
              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--color-slate-400)',
                  marginTop: '1px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {t(`nav:${role.labelKey}`)}
              </div>
            </div>
          )}
        </div>

        {/* Logout button */}
        <button
          onClick={onLogout}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: '8px',
            padding: collapsed ? '9px 0' : '9px 10px',
            background: 'rgba(239,68,68,0.08)',
            color: 'var(--color-red-500)',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--font-medium)',
            cursor: 'pointer',
            transition: 'background var(--transition-fast)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.18)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)' }}
        >
          <span style={{ fontSize: '15px' }}>🚪</span>
          {!collapsed && (
            <span style={{ animation: 'fadeIn 150ms both' }}>{t('common:logout')}</span>
          )}
        </button>
      </div>
    </>
  )
}

/* ── Tooltip for collapsed state ─────────────────────────── */
function SidebarTooltip({ label, extra = '' }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: 'calc(100% + 8px)',
        top: '50%',
        transform: 'translateY(-50%)',
        background: 'var(--color-slate-800)',
        color: '#fff',
        padding: '5px 10px',
        borderRadius: 'var(--radius-md)',
        fontSize: 'var(--text-xs)',
        fontWeight: 'var(--font-medium)',
        whiteSpace: 'nowrap',
        zIndex: 100,
        pointerEvents: 'none',
        boxShadow: 'var(--shadow-lg)',
        animation: 'fadeIn 150ms both',
      }}
    >
      {label}{extra ? ` ${extra}` : ''}
    </div>
  )
}

export default Sidebar
