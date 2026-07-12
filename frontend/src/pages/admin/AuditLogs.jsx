import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getAuditLogs } from '../../api/adminApi'

/* ─── helpers ─────────────────────────────────────────────────────────────── */

function fmtDateTime(isoStr) {
  if (!isoStr) return '—'
  return new Date(isoStr).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

function timeAgo(isoStr) {
  if (!isoStr) return ''
  const diff = Date.now() - new Date(isoStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

const ACTION_META = {
  USER_CREATED:     { label: 'Created',     icon: '✅', bg: '#d1fae5', color: '#065f46' },
  USER_UPDATED:     { label: 'Updated',     icon: '✏️', bg: '#dbeafe', color: '#1e40af' },
  USER_DELETED:     { label: 'Deleted',     icon: '🗑️', bg: '#fee2e2', color: '#b91c1c' },
  USER_ACTIVATED:   { label: 'Activated',   icon: '🔓', bg: '#d1fae5', color: '#065f46' },
  USER_DEACTIVATED: { label: 'Deactivated', icon: '🔒', bg: '#fef3c7', color: '#92400e' },
  PASSWORD_RESET:   { label: 'Pwd Reset',   icon: '🔑', bg: '#f3e8ff', color: '#6b21a8' },
}

const ALL_ACTIONS = Object.keys(ACTION_META)

const inputStyle = {
  padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6,
  fontSize: 14, outline: 'none', boxSizing: 'border-box',
}

/* ─── Pagination ───────────────────────────────────────────────────────────── */

function Pagination({ page, totalPages, total, size, onPage, onSize }) {
  if (total === 0) return null
  const from = page * size + 1
  const to   = Math.min((page + 1) * size, total)

  const pages = []
  for (let i = 0; i < totalPages; i++) {
    if (totalPages <= 7 || i === 0 || i === totalPages - 1 || Math.abs(i - page) <= 1) pages.push(i)
    else if (pages[pages.length - 1] !== '...') pages.push('...')
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
      <span style={{ fontSize: 13, color: '#6b7280' }}>Showing {from}–{to} of {total} entries</span>
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
          style={{ padding: '5px 8px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13 }}>
          {[10, 20, 50].map(n => <option key={n} value={n}>{n} / page</option>)}
        </select>
      </div>
    </div>
  )
}

/* ─── Main Component ─────────────────────────────────────────────────────── */

export default function AuditLogs() {
  const [sp, setSP] = useSearchParams()

  const [logs,       setLogs]       = useState([])
  const [pagination, setPagination] = useState({ page: 0, size: 20, total: 0, totalPages: 0 })
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState('')

  const action      = sp.get('action')      || ''
  const performedBy = sp.get('performedBy') || ''
  const from        = sp.get('from')        || ''
  const to          = sp.get('to')          || ''
  const page        = parseInt(sp.get('page') || '0', 10)
  const size        = parseInt(sp.get('size') || '20', 10)

  const setParam = (key, val) => {
    const next = new URLSearchParams(sp)
    if (!val) next.delete(key); else next.set(key, val)
    next.set('page', '0')
    setSP(next)
  }

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const params = { page, size }
      if (action)      params.action      = action
      if (performedBy) params.performedBy = performedBy
      if (from)        params.from        = from
      if (to)          params.to          = to
      const { data } = await getAuditLogs(params)
      setLogs(data.content || [])
      setPagination({ page: data.page, size: data.size, total: data.total, totalPages: data.totalPages })
    } catch { setError('Failed to load audit logs') }
    finally { setLoading(false) }
  }, [action, performedBy, from, to, page, size])

  useEffect(() => { load() }, [load])

  const clearFilters = () => setSP(new URLSearchParams())
  const hasFilters = action || performedBy || from || to

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Audit Trail</h1>
        <p style={{ margin: '2px 0 0', color: '#6b7280', fontSize: 14 }}>All admin actions recorded with full context</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
        <select value={action} onChange={e => setParam('action', e.target.value)}
          style={{ ...inputStyle, minWidth: 160 }}>
          <option value="">All Actions</option>
          {ALL_ACTIONS.map(a => (
            <option key={a} value={a}>{ACTION_META[a]?.label || a}</option>
          ))}
        </select>
        <input value={performedBy} onChange={e => setParam('performedBy', e.target.value)}
          placeholder="Performed by…" style={{ ...inputStyle, minWidth: 200 }} />
        <input type="date" value={from} onChange={e => setParam('from', e.target.value)}
          style={inputStyle} />
        <span style={{ color: '#9ca3af', fontSize: 13 }}>to</span>
        <input type="date" value={to} onChange={e => setParam('to', e.target.value)}
          style={inputStyle} />
        {hasFilters && (
          <button onClick={clearFilters}
            style={{ padding: '8px 12px', border: '1px solid #fca5a5', borderRadius: 6, background: '#fef2f2', color: '#dc2626', cursor: 'pointer', fontSize: 13 }}>
            ✕ Clear
          </button>
        )}
        <span style={{ marginLeft: 'auto', fontSize: 13, color: '#6b7280' }}>
          {pagination.total} entr{pagination.total !== 1 ? 'ies' : 'y'}
        </span>
      </div>

      {/* Table */}
      {error ? (
        <div style={{ padding: 32, textAlign: 'center', color: '#dc2626' }}>{error}</div>
      ) : loading ? (
        <div style={{ padding: 48, textAlign: 'center', color: '#9ca3af' }}>Loading…</div>
      ) : logs.length === 0 ? (
        <div style={{ padding: 48, textAlign: 'center', color: '#9ca3af' }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>📋</div>
          <p style={{ margin: 0, fontWeight: 600 }}>No audit logs found</p>
          {hasFilters && <p style={{ margin: '4px 0 0', fontSize: 13 }}>Try adjusting your filters</p>}
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                {['ACTION', 'TARGET USER', 'PERFORMED BY', 'DETAILS', 'WHEN'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#6b7280', letterSpacing: '.5px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map((log, i) => {
                const meta = ACTION_META[log.action] || { label: log.action, icon: '•', bg: '#f3f4f6', color: '#374151' }
                return (
                  <tr key={log.id} style={{ borderBottom: '1px solid #f3f4f6', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ background: meta.bg, color: meta.color, padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        {meta.icon} {meta.label}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{log.targetUserName || '—'}</div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>{log.targetUserEmail || `ID: ${log.targetUserId}`}</div>
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 13, color: '#374151' }}>{log.performedBy}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: '#6b7280', maxWidth: 220 }}>
                      {log.details || '—'}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ fontSize: 13, color: '#374151', whiteSpace: 'nowrap' }}>{fmtDateTime(log.createdAt)}</div>
                      <div style={{ fontSize: 11, color: '#9ca3af' }}>{timeAgo(log.createdAt)}</div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        page={pagination.page} totalPages={pagination.totalPages}
        total={pagination.total} size={size}
        onPage={p => setParam('page', p)}
        onSize={s => { const n = new URLSearchParams(sp); n.set('size', s); n.set('page', '0'); setSP(n) }}
      />
    </div>
  )
}
