import { Outlet } from 'react-router-dom'
import AdminSidebar from './AdminSidebar'
import AdminNavbar from './AdminNavbar'
import useSidebar from '../../hooks/useSidebar'

function AdminLayout() {
  const { collapsed, mobileOpen, toggle, toggleMobile, closeMobile } = useSidebar()

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          onClick={closeMobile}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(13,13,26,0.60)',
            zIndex: 40,
            backdropFilter: 'blur(2px)',
            animation: 'fadeIn 200ms both',
          }}
        />
      )}

      <AdminSidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        closeMobile={closeMobile}
        onToggleCollapse={toggle}
      />

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minWidth: 0,
          transition: 'padding-left var(--transition-base)',
        }}
      >
        <AdminNavbar onMenuToggle={toggleMobile} />
        <main
          style={{
            flex: 1,
            overflowY: 'auto',
            background: 'var(--color-bg)',
            padding: 'var(--space-7)',
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
