import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import axiosInstance from '../../api/axiosInstance'

function StatCard({ label, value, icon, color, bg, delay = 0, onClick, badge, badgeColor }) {
  return (
    <div
      className="anim-fade-in-up"
      onClick={onClick}
      style={{
        background: bg, borderRadius: 16, padding: '18px 20px',
        border: `1.5px solid ${bg}`, cursor: onClick ? 'pointer' : 'default',
        animationFillMode: 'both', animationDelay: `${delay * 50}ms`,
        transition: 'transform 150ms, box-shadow 150ms',
        position: 'relative', overflow: 'hidden',
      }}
      onMouseEnter={e => { if (onClick) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.10)' } }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 26 }}>{icon}</span>
        {badge != null && (
          <span style={{
            fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 999,
            background: badgeColor?.bg || '#fef2f2', color: badgeColor?.text || '#dc2626',
          }}>{badge}</span>
        )}
      </div>
      <div style={{ fontSize: 28, fontWeight: 900, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, fontWeight: 700, color, opacity: 0.7, marginTop: 4 }}>{label}</div>
    </div>
  )
}

function SectionCard({ title, badge, children }) {
  return (
    <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0, fontSize: 'var(--text-md)', fontWeight: 'var(--font-semibold)', color: 'var(--color-text)' }}>{title}</h2>
        {badge && <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 999, background: '#fef3c7', color: '#d97706', fontWeight: 700 }}>{badge}</span>}
      </div>
      {children}
    </div>
  )
}

function AdminDashboard() {
  const { user } = useAuth()
  const { t }    = useTranslation(['dashboard', 'common'])
  const navigate = useNavigate()

  const [userStats,    setUserStats]    = useState(null)
  const [productStats, setProductStats] = useState(null)
  const [lowStockList, setLowStockList] = useState([])
  const [loading,      setLoading]      = useState(true)

  useEffect(() => {
    Promise.all([
      axiosInstance.get('/admin/users/stats'),
      axiosInstance.get('/admin/products/stats'),
      axiosInstance.get('/admin/products'),
    ]).then(([uRes, pRes, prodRes]) => {
      setUserStats(uRes.data)
      setProductStats(pRes.data)
      setLowStockList(
        prodRes.data
          .filter(p => p.stock <= 10)
          .sort((a, b) => a.stock - b.stock)
          .slice(0, 8)
      )
    }).catch(() => {})
    .finally(() => setLoading(false))
  }, [])

  const us = userStats    || {}
  const ps = productStats || {}

  return (
    <div style={{ maxWidth: 1400 }}>
      {/* Header */}
      <div className="anim-fade-in-up" style={{ marginBottom: 'var(--space-6)', animationFillMode: 'both' }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', color: 'var(--color-text)' }}>
          {t('dashboard:admin_dashboard')}
        </h1>
        <p style={{ margin: 0, fontSize: 'var(--text-base)', color: 'var(--color-text-muted)' }}>
          {t('dashboard:logged_as')}{' '}
          <strong style={{ color: '#16a34a' }}>{user?.name}</strong>
          {' — '}{t('dashboard:admin_subtitle')}
        </p>
      </div>

      {/* ── User Stats Row ── */}
      <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        👥 Users
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12, marginBottom: 28 }}>
        {loading ? [...Array(6)].map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 90, borderRadius: 16 }} />
        )) : [
          { label: 'Total Users',    value: us.total      ?? 0, icon: '👥', color: '#2563eb', bg: '#eff6ff' },
          { label: 'Customers',      value: us.customers  ?? 0, icon: '🛒', color: '#7c3aed', bg: '#f5f3ff' },
          { label: 'Farmers',        value: us.farmers    ?? 0, icon: '🐄', color: '#16a34a', bg: '#f0fdf4' },
          { label: 'Delivery Boys',  value: us.deliveryBoys ?? 0, icon: '🚚', color: '#d97706', bg: '#fef3c7' },
          { label: 'Active',         value: us.active     ?? 0, icon: '✅', color: '#0891b2', bg: '#ecfeff' },
          { label: 'Inactive',       value: us.inactive   ?? 0, icon: '⏸',  color: '#dc2626', bg: '#fef2f2' },
        ].map((s, i) => (
          <StatCard key={s.label} {...s} delay={i} onClick={() => navigate('/admin/users')} />
        ))}
      </div>

      {/* ── Product Stats Row ── */}
      <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        📦 Products
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12, marginBottom: 28 }}>
        {loading ? [...Array(6)].map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 90, borderRadius: 16 }} />
        )) : [
          { label: 'Total Products', value: ps.total      ?? 0, icon: '📦', color: '#7c3aed', bg: '#f5f3ff' },
          { label: 'Active',         value: ps.active     ?? 0, icon: '✅', color: '#16a34a', bg: '#f0fdf4' },
          { label: 'Inactive',       value: ps.inactive   ?? 0, icon: '❌', color: '#dc2626', bg: '#fef2f2' },
          { label: 'Featured',       value: ps.featured   ?? 0, icon: '⭐', color: '#d97706', bg: '#fef3c7' },
          {
            label: 'Low Stock (≤10)', value: ps.lowStock  ?? 0, icon: '⚠️', color: '#ea580c', bg: '#fff7ed',
            badge: ps.lowStock > 0 ? 'Alert' : null,
            badgeColor: { bg: '#fef3c7', text: '#d97706' },
          },
          {
            label: 'Out of Stock',   value: ps.outOfStock ?? 0, icon: '🔴', color: '#dc2626', bg: '#fef2f2',
            badge: ps.outOfStock > 0 ? 'Critical' : null,
            badgeColor: { bg: '#fef2f2', text: '#dc2626' },
          },
        ].map((s, i) => (
          <StatCard key={s.label} {...s} delay={i} onClick={() => navigate('/admin/products')} />
        ))}
      </div>

      {/* ── Lower panels ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 20 }}>

        {/* Low Stock Alert */}
        <SectionCard
          title="⚠️ Low Stock Alert"
          badge={lowStockList.length > 0 ? `${lowStockList.length} products` : null}
        >
          {loading ? (
            <div style={{ padding: 24 }}>
              {[...Array(4)].map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 36, marginBottom: 8, borderRadius: 8 }} />
              ))}
            </div>
          ) : lowStockList.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#64748b', fontSize: 14 }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>✅</div>
              All products have healthy stock levels
            </div>
          ) : (
            <div style={{ padding: '8px 0' }}>
              {lowStockList.map(p => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 20px', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{p.emoji || '📦'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>{p.categoryName || 'Uncategorised'}</div>
                  </div>
                  <span style={{
                    fontSize: 12, fontWeight: 800, padding: '3px 10px', borderRadius: 999,
                    background: p.stock === 0 ? '#fef2f2' : '#fff7ed',
                    color: p.stock === 0 ? '#dc2626' : '#ea580c',
                    flexShrink: 0,
                  }}>
                    {p.stock === 0 ? 'Out' : `${p.stock} left`}
                  </span>
                </div>
              ))}
              <div style={{ padding: '10px 20px' }}>
                <button onClick={() => navigate('/admin/products')}
                  style={{ width: '100%', padding: '8px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: 13, fontWeight: 600, color: '#475569', cursor: 'pointer' }}>
                  Manage Products →
                </button>
              </div>
            </div>
          )}
        </SectionCard>

        {/* Quick Actions */}
        <SectionCard title="⚡ Quick Actions">
          <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { icon: '📦', label: 'Add Product',  path: '/admin/products', color: '#16a34a', bg: '#f0fdf4' },
              { icon: '👥', label: 'Add User',     path: '/admin/users',    color: '#2563eb', bg: '#eff6ff' },
              { icon: '📋', label: 'View Orders',  path: '/admin/orders',   color: '#7c3aed', bg: '#f5f3ff' },
              { icon: '📊', label: 'Audit Logs',   path: '/admin/audit-logs', color: '#d97706', bg: '#fef3c7' },
            ].map(a => (
              <button key={a.path} onClick={() => navigate(a.path)}
                style={{
                  padding: '14px 12px', borderRadius: 12, border: 'none',
                  background: a.bg, cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  transition: 'transform 150ms, box-shadow 150ms',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.10)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}
              >
                <span style={{ fontSize: 28 }}>{a.icon}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: a.color }}>{a.label}</span>
              </button>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  )
}

export default AdminDashboard
