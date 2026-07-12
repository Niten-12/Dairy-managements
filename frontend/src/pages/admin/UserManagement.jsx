import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  getUsers, getUserStats, createUser, updateUser, toggleUserStatus,
  resetUserPassword, deleteUser, exportUsersCsv, bulkDeleteUsers, bulkStatusUsers
} from '../../api/adminApi'

/* ─── helpers ──────────────────────────────────────────────────────────────── */

function timeAgo(isoStr) {
  if (!isoStr) return 'Never'
  const diff = Date.now() - new Date(isoStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)   return 'Just now'
  if (m < 60)  return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24)  return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 30)  return `${d}d ago`
  return new Date(isoStr).toLocaleDateString()
}

function fmtDate(isoStr) {
  if (!isoStr) return '—'
  return new Date(isoStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

const ROLE_LABELS = { ADMIN: 'Admin', FARMER: 'Farmer', DELIVERY_BOY: 'Delivery Boy', CUSTOMER: 'Customer' }
const ROLE_COLORS = {
  ADMIN:        { bg: '#fef3c7', color: '#92400e' },
  FARMER:       { bg: '#d1fae5', color: '#065f46' },
  DELIVERY_BOY: { bg: '#dbeafe', color: '#1e40af' },
  CUSTOMER:     { bg: '#f3e8ff', color: '#6b21a8' },
}

function initials(name = '') {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

/* ─── small UI atoms ────────────────────────────────────────────────────────── */

function Toast({ toasts }) {
  return (
    <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background: t.type === 'success' ? '#166534' : '#7f1d1d',
          color: '#fff', padding: '10px 16px', borderRadius: 8,
          boxShadow: '0 4px 12px rgba(0,0,0,0.25)', fontSize: 14,
          minWidth: 220, animation: 'slideIn .2s ease',
        }}>{t.msg}</div>
      ))}
    </div>
  )
}

function useToast() {
  const [toasts, setToasts] = useState([])
  const push = useCallback((msg, type = 'success') => {
    const id = Date.now()
    setToasts(p => [...p, { id, msg, type }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500)
  }, [])
  return { toasts, push }
}

function Spinner() {
  return <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .6s linear infinite' }} />
}

function ModalShell({ title, onClose, children, width = 440 }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}
      onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: width, maxHeight: '90vh', overflowY: 'auto', padding: 24, boxShadow: '0 20px 60px rgba(0,0,0,.3)' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#6b7280' }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function Field({ label, children, error }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 4 }}>{label}</label>
      {children}
      {error && <p style={{ color: '#dc2626', fontSize: 12, margin: '3px 0 0' }}>{error}</p>}
    </div>
  )
}

const inputStyle = {
  width: '100%', padding: '8px 10px', border: '1px solid #d1d5db',
  borderRadius: 6, fontSize: 14, outline: 'none', boxSizing: 'border-box',
}

function ModalActions({ onCancel, onConfirm, confirmLabel, danger, loading }) {
  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
      <button onClick={onCancel} style={{ padding: '8px 16px', border: '1px solid #d1d5db', borderRadius: 6, background: '#fff', cursor: 'pointer', fontSize: 14 }}>Cancel</button>
      <button onClick={onConfirm} disabled={loading} style={{ padding: '8px 16px', borderRadius: 6, border: 'none', background: danger ? '#dc2626' : '#2563eb', color: '#fff', cursor: loading ? 'not-allowed' : 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
        {loading ? <Spinner /> : null}{confirmLabel}
      </button>
    </div>
  )
}

/* ─── Stats Cards ─────────────────────────────────────────────────────────── */

function StatsCards({ stats, onFilter }) {
  const cards = [
    { key: 'all',     label: 'Total Users',   value: stats.total,        icon: '👥', color: '#6366f1', filter: {} },
    { key: 'active',  label: 'Active',        value: stats.active,       icon: '✅', color: '#16a34a', filter: { active: 'true' } },
    { key: 'inactive',label: 'Inactive',      value: stats.inactive,     icon: '⛔', color: '#dc2626', filter: { active: 'false' } },
    { key: 'cust',    label: 'Customers',     value: stats.customers,    icon: '🛒', color: '#7c3aed', filter: { role: 'CUSTOMER' } },
    { key: 'farm',    label: 'Farmers',       value: stats.farmers,      icon: '🌾', color: '#059669', filter: { role: 'FARMER' } },
    { key: 'del',     label: 'Delivery Boys', value: stats.deliveryBoys, icon: '🚚', color: '#2563eb', filter: { role: 'DELIVERY_BOY' } },
    { key: 'adm',     label: 'Admins',        value: stats.admins,       icon: '🛡️', color: '#92400e', filter: { role: 'ADMIN' } },
  ]
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
      {cards.map(c => (
        <button key={c.key} onClick={() => onFilter(c.filter)}
          style={{ background: '#fff', border: `2px solid ${c.color}22`, borderRadius: 10, padding: '12px 14px', cursor: 'pointer', textAlign: 'left', transition: 'border-color .15s' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = c.color}
          onMouseLeave={e => e.currentTarget.style.borderColor = `${c.color}22`}>
          <div style={{ fontSize: 20, marginBottom: 4 }}>{c.icon}</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: c.color }}>{c.value ?? '—'}</div>
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{c.label}</div>
        </button>
      ))}
    </div>
  )
}

/* ─── Role selector ────────────────────────────────────────────────────────── */

function RoleSelector({ value, onChange, filterAdmin = false }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={inputStyle}>
      {!filterAdmin && <option value="ADMIN">Admin</option>}
      <option value="CUSTOMER">Customer</option>
      <option value="FARMER">Farmer</option>
      <option value="DELIVERY_BOY">Delivery Boy</option>
    </select>
  )
}

/* ─── Create User Modal ────────────────────────────────────────────────────── */

function CreateUserModal({ onClose, onCreated, push }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: 'FARMER' })
  const [err, setErr]   = useState({})
  const [loading, setLoading] = useState(false)
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const submit = async () => {
    const e = {}
    if (!form.name.trim())     e.name     = 'Name is required'
    if (!form.email.trim())    e.email    = 'Email is required'
    if (!form.password.trim()) e.password = 'Password is required'
    else if (form.password.length < 6) e.password = 'Min 6 characters'
    if (Object.keys(e).length) { setErr(e); return }
    setLoading(true)
    try {
      const { data } = await createUser(form)
      push(`${data.name} created successfully`)
      onCreated(data)
    } catch (ex) {
      push(ex.response?.data?.message || 'Failed to create user', 'error')
    } finally { setLoading(false) }
  }

  return (
    <ModalShell title="Create User" onClose={onClose}>
      <Field label="Full Name" error={err.name}>
        <input style={inputStyle} value={form.name} onChange={set('name')} placeholder="John Doe" />
      </Field>
      <Field label="Email" error={err.email}>
        <input style={inputStyle} type="email" value={form.email} onChange={set('email')} placeholder="john@example.com" />
      </Field>
      <Field label="Phone (optional)">
        <input style={inputStyle} value={form.phone} onChange={set('phone')} placeholder="10-digit mobile" maxLength={10} />
      </Field>
      <Field label="Password" error={err.password}>
        <input style={inputStyle} type="password" value={form.password} onChange={set('password')} placeholder="Min 6 chars" />
      </Field>
      <Field label="Role">
        <RoleSelector value={form.role} onChange={v => setForm(p => ({ ...p, role: v }))} filterAdmin />
      </Field>
      <ModalActions onCancel={onClose} onConfirm={submit} confirmLabel="Create User" loading={loading} />
    </ModalShell>
  )
}

/* ─── Edit User Modal ──────────────────────────────────────────────────────── */

function EditUserModal({ user, onClose, onUpdated, push }) {
  const [form, setForm] = useState({ name: user.name, email: user.email || '', phone: user.phone || '', role: user.role })
  const [err, setErr]   = useState({})
  const [loading, setLoading] = useState(false)
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const submit = async () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (Object.keys(e).length) { setErr(e); return }
    setLoading(true)
    try {
      const { data } = await updateUser(user.id, form)
      push(`${data.name} updated`)
      onUpdated(data)
    } catch (ex) {
      push(ex.response?.data?.message || 'Failed to update user', 'error')
    } finally { setLoading(false) }
  }

  return (
    <ModalShell title="Edit User" onClose={onClose}>
      <Field label="Full Name" error={err.name}>
        <input style={inputStyle} value={form.name} onChange={set('name')} />
      </Field>
      <Field label="Email">
        <input style={inputStyle} type="email" value={form.email} onChange={set('email')} disabled={user.role === 'ADMIN'} />
      </Field>
      <Field label="Phone">
        <input style={inputStyle} value={form.phone} onChange={set('phone')} maxLength={10} />
      </Field>
      {user.role !== 'ADMIN' && (
        <Field label="Role">
          <RoleSelector value={form.role} onChange={v => setForm(p => ({ ...p, role: v }))} filterAdmin />
        </Field>
      )}
      <ModalActions onCancel={onClose} onConfirm={submit} confirmLabel="Save Changes" loading={loading} />
    </ModalShell>
  )
}

/* ─── Reset Password Modal ─────────────────────────────────────────────────── */

function ResetPasswordModal({ user, onClose, push }) {
  const [pwd, setPwd] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (pwd.length < 6) { setErr('Min 6 characters'); return }
    setLoading(true)
    try {
      await resetUserPassword(user.id, { newPassword: pwd })
      push(`Password reset for ${user.name}`)
      onClose()
    } catch (ex) {
      push(ex.response?.data?.message || 'Failed to reset password', 'error')
    } finally { setLoading(false) }
  }

  return (
    <ModalShell title={`Reset Password — ${user.name}`} onClose={onClose}>
      <Field label="New Password" error={err}>
        <input style={inputStyle} type="password" value={pwd} onChange={e => { setPwd(e.target.value); setErr('') }} placeholder="Min 6 characters" />
      </Field>
      <ModalActions onCancel={onClose} onConfirm={submit} confirmLabel="Reset Password" loading={loading} />
    </ModalShell>
  )
}

/* ─── Confirm Modal ────────────────────────────────────────────────────────── */

function ConfirmModal({ title, message, onCancel, onConfirm, danger = true, loading }) {
  return (
    <ModalShell title={title} onClose={onCancel} width={380}>
      <p style={{ color: '#374151', margin: '0 0 20px', lineHeight: 1.5 }}>{message}</p>
      <ModalActions onCancel={onCancel} onConfirm={onConfirm} confirmLabel="Confirm" danger={danger} loading={loading} />
    </ModalShell>
  )
}

/* ─── Pagination ───────────────────────────────────────────────────────────── */

function Pagination({ page, totalPages, total, size, onPage, onSize }) {
  if (total === 0) return null
  const from = page * size + 1
  const to   = Math.min((page + 1) * size, total)

  const pages = []
  for (let i = 0; i < totalPages; i++) {
    if (totalPages <= 7 || i === 0 || i === totalPages - 1 || Math.abs(i - page) <= 1) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...')
    }
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 16, padding: '12px 0' }}>
      <span style={{ fontSize: 13, color: '#6b7280' }}>Showing {from}–{to} of {total} users</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button onClick={() => onPage(page - 1)} disabled={page === 0}
          style={{ padding: '5px 10px', border: '1px solid #d1d5db', borderRadius: 6, background: '#fff', cursor: page === 0 ? 'not-allowed' : 'pointer', opacity: page === 0 ? .4 : 1 }}>‹</button>
        {pages.map((p, i) => (
          p === '...'
            ? <span key={`dot${i}`} style={{ padding: '0 4px', color: '#9ca3af' }}>…</span>
            : <button key={p} onClick={() => onPage(p)}
                style={{ padding: '5px 10px', border: '1px solid', borderColor: p === page ? '#2563eb' : '#d1d5db', borderRadius: 6, background: p === page ? '#2563eb' : '#fff', color: p === page ? '#fff' : '#374151', cursor: 'pointer', fontWeight: p === page ? 700 : 400 }}>{p + 1}</button>
        ))}
        <button onClick={() => onPage(page + 1)} disabled={page >= totalPages - 1}
          style={{ padding: '5px 10px', border: '1px solid #d1d5db', borderRadius: 6, background: '#fff', cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer', opacity: page >= totalPages - 1 ? .4 : 1 }}>›</button>
        <select value={size} onChange={e => onSize(Number(e.target.value))}
          style={{ padding: '5px 8px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, cursor: 'pointer' }}>
          {[10, 20, 50].map(n => <option key={n} value={n}>{n} / page</option>)}
        </select>
      </div>
    </div>
  )
}

/* ─── Icon Button ───────────────────────────────────────────────────────────── */

function Btn({ title, onClick, children, disabled }) {
  return (
    <button title={title} onClick={disabled ? undefined : onClick} disabled={disabled}
      style={{ padding: '4px 7px', border: '1px solid #e5e7eb', borderRadius: 5, background: '#fff', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.35 : 1, fontSize: 14, lineHeight: 1 }}>
      {children}
    </button>
  )
}

/* ─── Main Component ────────────────────────────────────────────────────────── */

export default function UserManagement() {
  const [sp, setSP] = useSearchParams()

  const [users,      setUsers]      = useState([])
  const [stats,      setStats]      = useState({ total: 0, admins: 0, farmers: 0, deliveryBoys: 0, customers: 0, active: 0, inactive: 0 })
  const [pagination, setPagination] = useState({ page: 0, size: 10, total: 0, totalPages: 0, hasNext: false, hasPrevious: false })
  const [loading,      setLoading]      = useState(false)
  const [statsLoading, setStatsLoading] = useState(false)
  const [selected,   setSelected]   = useState(new Set())
  const [modal,      setModal]      = useState(null)
  const [confirm,    setConfirm]    = useState(null)
  const [confirmLoading, setConfirmLoading] = useState(false)

  const { toasts, push } = useToast()
  const debounceRef = useRef(null)

  const search = sp.get('search') || ''
  const role   = sp.get('role')   || ''
  const active = sp.get('active') || ''
  const page   = parseInt(sp.get('page') || '0', 10)
  const size   = parseInt(sp.get('size') || '10', 10)

  const setParam = (key, val) => {
    const next = new URLSearchParams(sp)
    if (val === '' || val === null || val === undefined) next.delete(key)
    else next.set(key, val)
    next.set('page', '0')
    setSP(next)
  }

  const setAllParams = (obj) => {
    const next = new URLSearchParams()
    Object.entries(obj).forEach(([k, v]) => { if (v != null && v !== '') next.set(k, v) })
    setSP(next)
  }

  const loadStats = useCallback(async () => {
    setStatsLoading(true)
    try { const { data } = await getUserStats(); setStats(data) }
    catch { /* silent */ }
    finally { setStatsLoading(false) }
  }, [])

  const loadUsers = useCallback(async (params) => {
    setLoading(true)
    try {
      const { data } = await getUsers(params)
      setUsers(data.content || [])
      setPagination({
        page: data.page, size: data.size, total: data.total,
        totalPages: data.totalPages, hasNext: data.hasNext, hasPrevious: data.hasPrevious,
      })
    } catch { push('Failed to load users', 'error') }
    finally { setLoading(false) }
  }, [push])

  useEffect(() => { loadStats() }, [loadStats])

  useEffect(() => {
    const params = {}
    if (search) params.search = search
    if (role)   params.role   = role
    if (active) params.active = active
    params.page = page
    params.size = size
    loadUsers(params)
    setSelected(new Set())
  }, [search, role, active, page, size, loadUsers])

  const handleSearchChange = (val) => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setParam('search', val), 400)
  }

  const handleExport = async () => {
    try {
      const params = {}
      if (search) params.search = search
      if (role)   params.role   = role
      if (active) params.active = active
      const { data } = await exportUsersCsv(params)
      const url = URL.createObjectURL(new Blob([data], { type: 'text/csv' }))
      const a   = document.createElement('a')
      a.href = url; a.download = `users_${new Date().toISOString().slice(0,10)}.csv`; a.click()
      URL.revokeObjectURL(url)
      push('CSV exported successfully')
    } catch { push('Export failed', 'error') }
  }

  const allSelected = users.length > 0 && users.every(u => selected.has(u.id))
  const toggleAll   = () => setSelected(allSelected ? new Set() : new Set(users.map(u => u.id)))
  const toggleOne   = (id) => setSelected(prev => {
    const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next
  })

  const handleBulkDelete = () => {
    const ids = [...selected]
    setConfirm({
      title: 'Delete Selected Users',
      message: `Delete ${ids.length} selected user(s)? Admins and your own account are skipped.`,
      onConfirm: async () => {
        setConfirmLoading(true)
        try {
          const { data } = await bulkDeleteUsers(ids)
          push(`Deleted ${data.deleted} user(s)${data.skipped ? `, skipped ${data.skipped}` : ''}`)
          setSelected(new Set()); setConfirm(null)
          await loadUsers({ search, role, active, page, size }); await loadStats()
        } catch { push('Bulk delete failed', 'error') }
        finally { setConfirmLoading(false) }
      }
    })
  }

  const handleBulkStatus = (targetActive) => {
    const ids = [...selected]
    const verb = targetActive ? 'Activate' : 'Deactivate'
    setConfirm({
      title: `Bulk ${verb}`,
      message: `${verb} ${ids.length} selected user(s)?`,
      danger: !targetActive,
      onConfirm: async () => {
        setConfirmLoading(true)
        try {
          const { data } = await bulkStatusUsers(ids, targetActive)
          push(`${verb}d ${data.updated} user(s)${data.skipped ? `, skipped ${data.skipped}` : ''}`)
          setSelected(new Set()); setConfirm(null)
          await loadUsers({ search, role, active, page, size }); await loadStats()
        } catch { push('Bulk status update failed', 'error') }
        finally { setConfirmLoading(false) }
      }
    })
  }

  const handleToggle = (user) => {
    const next = !user.active
    setConfirm({
      title: next ? 'Activate User' : 'Deactivate User',
      message: next ? `Activate ${user.name}? They can log in again.` : `Deactivate ${user.name}? They won't be able to log in.`,
      danger: !next,
      onConfirm: async () => {
        setConfirmLoading(true)
        try {
          const { data } = await toggleUserStatus(user.id)
          setUsers(p => p.map(u => u.id === data.id ? data : u))
          push(`${data.name} ${data.active ? 'activated' : 'deactivated'}`)
          setConfirm(null); await loadStats()
        } catch (ex) { push(ex.response?.data?.message || 'Failed', 'error') }
        finally { setConfirmLoading(false) }
      }
    })
  }

  const handleDelete = (user) => {
    setConfirm({
      title: 'Delete User',
      message: `Permanently delete ${user.name}? This cannot be undone.`,
      onConfirm: async () => {
        setConfirmLoading(true)
        try {
          await deleteUser(user.id)
          setUsers(p => p.filter(u => u.id !== user.id))
          push(`${user.name} deleted`)
          setConfirm(null); await loadStats()
        } catch (ex) { push(ex.response?.data?.message || 'Failed', 'error') }
        finally { setConfirmLoading(false) }
      }
    })
  }

  const hasFilters = search || role || active

  return (
    <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
      <style>{`
        @keyframes spin    { to { transform: rotate(360deg) } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(20px) } to { opacity: 1; transform: none } }
      `}</style>
      <Toast toasts={toasts} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>User Management</h1>
          <p style={{ margin: '2px 0 0', color: '#6b7280', fontSize: 14 }}>Manage all platform users</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={handleExport}
            style={{ padding: '8px 14px', border: '1px solid #d1d5db', borderRadius: 6, background: '#fff', cursor: 'pointer', fontSize: 13 }}>
            📥 Export CSV
          </button>
          <button onClick={() => setModal({ type: 'create' })}
            style={{ padding: '8px 16px', borderRadius: 6, border: 'none', background: '#2563eb', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            + Add User
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {!statsLoading && <StatsCards stats={stats} onFilter={setAllParams} />}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12, alignItems: 'center' }}>
        <input
          key={search}
          defaultValue={search}
          onChange={e => handleSearchChange(e.target.value)}
          placeholder="Search name, email, phone…"
          style={{ ...inputStyle, maxWidth: 260 }}
        />
        <select value={role} onChange={e => setParam('role', e.target.value)}
          style={{ ...inputStyle, maxWidth: 160 }}>
          <option value="">All Roles</option>
          <option value="ADMIN">Admin</option>
          <option value="CUSTOMER">Customer</option>
          <option value="FARMER">Farmer</option>
          <option value="DELIVERY_BOY">Delivery Boy</option>
        </select>
        <select value={active} onChange={e => setParam('active', e.target.value)}
          style={{ ...inputStyle, maxWidth: 140 }}>
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        {hasFilters && (
          <button onClick={() => setAllParams({})}
            style={{ padding: '8px 12px', border: '1px solid #fca5a5', borderRadius: 6, background: '#fef2f2', color: '#dc2626', cursor: 'pointer', fontSize: 13 }}>
            ✕ Clear
          </button>
        )}
        <span style={{ marginLeft: 'auto', fontSize: 13, color: '#6b7280' }}>
          {pagination.total} user{pagination.total !== 1 ? 's' : ''} found
        </span>
      </div>

      {/* Bulk Action Bar */}
      {selected.size > 0 && (
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '10px 14px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#1e40af' }}>{selected.size} selected</span>
          <button onClick={() => handleBulkStatus(true)}
            style={{ padding: '5px 12px', border: '1px solid #6ee7b7', borderRadius: 5, background: '#d1fae5', color: '#065f46', cursor: 'pointer', fontSize: 13 }}>✓ Activate</button>
          <button onClick={() => handleBulkStatus(false)}
            style={{ padding: '5px 12px', border: '1px solid #fcd34d', borderRadius: 5, background: '#fef3c7', color: '#92400e', cursor: 'pointer', fontSize: 13 }}>⛔ Deactivate</button>
          <button onClick={handleBulkDelete}
            style={{ padding: '5px 12px', border: '1px solid #fca5a5', borderRadius: 5, background: '#fee2e2', color: '#b91c1c', cursor: 'pointer', fontSize: 13 }}>🗑 Delete</button>
          <button onClick={() => setSelected(new Set())}
            style={{ marginLeft: 'auto', padding: '5px 10px', border: '1px solid #d1d5db', borderRadius: 5, background: '#fff', cursor: 'pointer', fontSize: 13, color: '#6b7280' }}>Clear</button>
        </div>
      )}

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb', overflowX: 'auto' }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#9ca3af' }}>Loading…</div>
        ) : users.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#9ca3af' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>👤</div>
            <p style={{ margin: 0, fontWeight: 600 }}>No users found</p>
            {hasFilters && <p style={{ margin: '4px 0 0', fontSize: 13 }}>Try adjusting your filters</p>}
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '10px 12px', textAlign: 'center', width: 40 }}>
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} />
                </th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>USER</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>ROLE</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>STATUS</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>LAST LOGIN</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>JOINED</th>
                <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>2FA</th>
                <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => {
                const rc = ROLE_COLORS[u.role] || ROLE_COLORS.CUSTOMER
                const isChecked = selected.has(u.id)
                return (
                  <tr key={u.id} style={{ borderBottom: '1px solid #f3f4f6', opacity: u.active ? 1 : 0.65, background: isChecked ? '#eff6ff' : i % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      <input type="checkbox" checked={isChecked} onChange={() => toggleOne(u.id)} />
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: rc.bg, color: rc.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                          {initials(u.name)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{u.name}</div>
                          <div style={{ fontSize: 12, color: '#6b7280' }}>{u.email || u.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ background: rc.bg, color: rc.color, padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
                        {ROLE_LABELS[u.role] || u.role}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ background: u.active ? '#dcfce7' : '#f3f4f6', color: u.active ? '#15803d' : '#6b7280', padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
                        {u.active ? '● Active' : '○ Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: 13, color: '#6b7280' }}>{timeAgo(u.lastLoginAt)}</td>
                    <td style={{ padding: '10px 12px', fontSize: 13, color: '#6b7280' }}>{fmtDate(u.createdAt)}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: 16 }}>
                      <span title={u.twoFactorEnabled ? '2FA enabled' : '2FA disabled'}>
                        {u.twoFactorEnabled ? '🛡️' : '—'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                        <Btn title="Edit"           onClick={() => setModal({ type: 'edit', user: u })}>✏️</Btn>
                        <Btn title={u.active ? 'Deactivate' : 'Activate'} onClick={() => handleToggle(u)} disabled={u.role === 'ADMIN'}>
                          {u.active ? '🔒' : '🔓'}
                        </Btn>
                        <Btn title="Reset Password" onClick={() => setModal({ type: 'reset', user: u })}>🔑</Btn>
                        <Btn title="Delete"         onClick={() => handleDelete(u)} disabled={u.role === 'ADMIN'}>🗑️</Btn>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      <Pagination
        page={pagination.page} totalPages={pagination.totalPages}
        total={pagination.total} size={size}
        onPage={p => setParam('page', p)}
        onSize={s => { const n = new URLSearchParams(sp); n.set('size', s); n.set('page', '0'); setSP(n) }}
      />

      {/* Modals */}
      {modal?.type === 'create' && (
        <CreateUserModal onClose={() => setModal(null)} push={push}
          onCreated={async () => { setModal(null); await loadUsers({ search, role, active, page, size }); await loadStats() }} />
      )}
      {modal?.type === 'edit' && (
        <EditUserModal user={modal.user} onClose={() => setModal(null)} push={push}
          onUpdated={data => { setUsers(p => p.map(u => u.id === data.id ? data : u)); setModal(null) }} />
      )}
      {modal?.type === 'reset' && (
        <ResetPasswordModal user={modal.user} onClose={() => setModal(null)} push={push} />
      )}
      {confirm && (
        <ConfirmModal title={confirm.title} message={confirm.message}
          danger={confirm.danger !== false}
          onCancel={() => setConfirm(null)} onConfirm={confirm.onConfirm}
          loading={confirmLoading} />
      )}
    </div>
  )
}
