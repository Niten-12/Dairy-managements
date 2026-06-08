import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import useSidebar from '../../hooks/useSidebar'

function MainLayout() {
  const { collapsed, mobileOpen, toggle, toggleMobile, closeMobile } = useSidebar()

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      {/* Mobile overlay — renders behind sidebar, above content */}
      {mobileOpen && (
        <div
          onClick={closeMobile}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,23,42,0.55)',
            zIndex: 40,
            backdropFilter: 'blur(2px)',
            animation: 'fadeIn 200ms both',
          }}
        />
      )}

      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        closeMobile={closeMobile}
        onToggleCollapse={toggle}
      />

      {/* Right-side content: on desktop it is pushed by sidebar width via padding-left */}
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
        <Navbar onMenuToggle={toggleMobile} />
        <main
          style={{
            flex: 1,
            overflowY: 'auto',
            background: 'var(--color-bg)',
            padding: 'var(--space-6)',
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default MainLayout
