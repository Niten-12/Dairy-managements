import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import StatCard from '../../components/ui/StatCard'
import { addMilkEntry, getMyEntries, getFarmerStats } from '../../api/farmerApi'

const SESSION_OPTIONS = ['MORNING', 'EVENING']

const SESSION_LABEL = { MORNING: '🌅 Morning', EVENING: '🌙 Evening' }

const emptyForm = {
  collectionDate: new Date().toISOString().slice(0, 10),
  session: 'MORNING',
  quantityLitres: '',
  fatPercentage: '',
  notes: '',
}

function FarmerDashboard() {
  const { user } = useAuth()

  const [stats,   setStats]   = useState(null)
  const [entries, setEntries] = useState([])
  const [tab,     setTab]     = useState('add')
  const [form,    setForm]    = useState(emptyForm)
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState('')

  const loadData = async () => {
    try {
      const [s, e] = await Promise.all([getFarmerStats(), getMyEntries()])
      setStats(s.data)
      setEntries(e.data)
    } catch {
      // silently fail on load
    }
  }

  useEffect(() => { loadData() }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!form.quantityLitres || Number(form.quantityLitres) < 0.1) {
      setError('Quantity must be at least 0.1 litres')
      return
    }
    setSaving(true)
    try {
      await addMilkEntry({
        collectionDate: form.collectionDate,
        session:        form.session,
        quantityLitres: parseFloat(form.quantityLitres),
        fatPercentage:  form.fatPercentage ? parseFloat(form.fatPercentage) : null,
        notes:          form.notes || null,
      })
      setSuccess('Entry added successfully!')
      setForm({ ...emptyForm, collectionDate: form.collectionDate })
      await loadData()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add entry')
    } finally {
      setSaving(false)
    }
  }

  const statCards = [
    {
      id: 'today',
      label: "Today's Collection",
      value: stats ? `${Number(stats.todayLitres).toFixed(1)} L` : '— L',
      icon: '🥛',
      color: 'var(--color-emerald-600)',
      bg: 'var(--color-emerald-100)',
      delay: 0,
    },
    {
      id: 'week',
      label: 'Last 7 Days',
      value: stats ? `${Number(stats.weekLitres).toFixed(1)} L` : '— L',
      icon: '📅',
      color: 'var(--color-blue-600)',
      bg: 'var(--color-blue-100)',
      delay: 1,
    },
    {
      id: 'month',
      label: 'This Month',
      value: stats ? `${Number(stats.monthLitres).toFixed(1)} L` : '— L',
      icon: '📊',
      color: 'var(--color-amber-600)',
      bg: 'var(--color-amber-100)',
      delay: 2,
    },
    {
      id: 'fat',
      label: 'Avg Fat % (Month)',
      value: stats ? `${Number(stats.avgFatPercent).toFixed(2)}%` : '—%',
      icon: '🧪',
      color: 'var(--color-red-600)',
      bg: 'var(--color-red-100)',
      delay: 3,
    },
  ]

  return (
    <div style={{ maxWidth: '1100px' }}>
      {/* Header */}
      <div className="anim-fade-in-up" style={{ marginBottom: 'var(--space-7)', animationFillMode: 'both' }}>
        <h1
          style={{
            margin: '0 0 var(--space-1)',
            fontSize: 'var(--text-2xl)',
            fontWeight: 'var(--font-bold)',
            color: 'var(--color-text)',
          }}
        >
          Welcome, {user?.name} 👋
        </h1>
        <p style={{ margin: 0, fontSize: 'var(--text-base)', color: 'var(--color-text-muted)' }}>
          Track your milk collection and monitor daily production
        </p>
      </div>

      {/* Stat cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-7)',
        }}
      >
        {statCards.map((s) => (
          <StatCard key={s.id} label={s.label} value={s.value} icon={s.icon} color={s.color} bg={s.bg} delay={s.delay} />
        ))}
      </div>

      {/* Main card with tabs */}
      <div
        className="anim-fade-in-up anim-delay-4"
        style={{
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-card)',
          overflow: 'hidden',
          animationFillMode: 'both',
        }}
      >
        {/* Tab bar */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)' }}>
          {[
            { key: 'add',     label: '➕ Add Entry' },
            { key: 'history', label: `📋 History (${entries.length})` },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: 'var(--space-4) var(--space-6)',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontSize: 'var(--text-sm)',
                fontWeight: tab === t.key ? 'var(--font-semibold)' : 'var(--font-normal)',
                color: tab === t.key ? 'var(--color-primary)' : 'var(--color-text-muted)',
                borderBottom: tab === t.key ? '2px solid var(--color-primary)' : '2px solid transparent',
                marginBottom: '-1px',
                transition: 'all 0.2s',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Add Entry tab */}
        {tab === 'add' && (
          <div style={{ padding: 'var(--space-6)' }}>
            <form onSubmit={handleSubmit}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: 'var(--space-4)',
                  marginBottom: 'var(--space-4)',
                }}
              >
                {/* Date */}
                <div>
                  <label style={labelStyle}>Collection Date *</label>
                  <input
                    type="date"
                    name="collectionDate"
                    value={form.collectionDate}
                    onChange={handleChange}
                    max={new Date().toISOString().slice(0, 10)}
                    required
                    style={inputStyle}
                  />
                </div>

                {/* Session */}
                <div>
                  <label style={labelStyle}>Session *</label>
                  <select name="session" value={form.session} onChange={handleChange} required style={inputStyle}>
                    {SESSION_OPTIONS.map((s) => (
                      <option key={s} value={s}>{SESSION_LABEL[s]}</option>
                    ))}
                  </select>
                </div>

                {/* Quantity */}
                <div>
                  <label style={labelStyle}>Quantity (Litres) *</label>
                  <input
                    type="number"
                    name="quantityLitres"
                    value={form.quantityLitres}
                    onChange={handleChange}
                    min="0.1"
                    step="0.1"
                    placeholder="e.g. 12.5"
                    required
                    style={inputStyle}
                  />
                </div>

                {/* Fat % */}
                <div>
                  <label style={labelStyle}>Fat Percentage (optional)</label>
                  <input
                    type="number"
                    name="fatPercentage"
                    value={form.fatPercentage}
                    onChange={handleChange}
                    min="0"
                    max="20"
                    step="0.01"
                    placeholder="e.g. 4.20"
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Notes */}
              <div style={{ marginBottom: 'var(--space-5)' }}>
                <label style={labelStyle}>Notes (optional)</label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  placeholder="Any observations about today's collection…"
                  rows={2}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>

              {error && (
                <div style={{ ...alertStyle, background: '#fee2e2', color: '#991b1b', marginBottom: 'var(--space-4)' }}>
                  ❌ {error}
                </div>
              )}
              {success && (
                <div style={{ ...alertStyle, background: '#d1fae5', color: '#065f46', marginBottom: 'var(--space-4)' }}>
                  ✅ {success}
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                style={{
                  padding: 'var(--space-3) var(--space-7)',
                  background: saving ? 'var(--color-text-muted)' : 'var(--color-primary)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 'var(--font-semibold)',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  transition: 'background 0.2s',
                }}
              >
                {saving ? 'Saving…' : '💾 Save Entry'}
              </button>
            </form>
          </div>
        )}

        {/* History tab */}
        {tab === 'history' && (
          <div>
            {entries.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--color-text-muted)' }}>
                <div style={{ fontSize: '3rem', marginBottom: 'var(--space-3)' }}>🥛</div>
                <p style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-medium)' }}>No entries yet</p>
                <p style={{ fontSize: 'var(--text-sm)' }}>Add your first milk collection entry</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--color-slate-50)' }}>
                      {['Date', 'Session', 'Quantity', 'Fat %', 'Notes'].map((h) => (
                        <th
                          key={h}
                          style={{
                            padding: 'var(--space-3) var(--space-4)',
                            textAlign: 'left',
                            fontSize: 'var(--text-xs)',
                            fontWeight: 'var(--font-semibold)',
                            color: 'var(--color-text-muted)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((e) => (
                      <tr
                        key={e.id}
                        style={{ borderTop: '1px solid var(--color-border)' }}
                      >
                        <td style={tdStyle}>
                          {new Date(e.collectionDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td style={tdStyle}>
                          <span
                            style={{
                              padding: '2px 10px',
                              borderRadius: 'var(--radius-full)',
                              fontSize: 'var(--text-xs)',
                              fontWeight: 'var(--font-semibold)',
                              background: e.session === 'MORNING' ? '#fef9c3' : '#ede9fe',
                              color: e.session === 'MORNING' ? '#854d0e' : '#5b21b6',
                            }}
                          >
                            {SESSION_LABEL[e.session]}
                          </span>
                        </td>
                        <td style={{ ...tdStyle, fontWeight: 'var(--font-semibold)', color: 'var(--color-emerald-600)' }}>
                          {Number(e.quantityLitres).toFixed(1)} L
                        </td>
                        <td style={tdStyle}>
                          {e.fatPercentage ? `${Number(e.fatPercentage).toFixed(2)}%` : '—'}
                        </td>
                        <td style={{ ...tdStyle, color: 'var(--color-text-muted)', maxWidth: '200px' }}>
                          {e.notes || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

const labelStyle = {
  display: 'block',
  marginBottom: 'var(--space-1)',
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--font-medium)',
  color: 'var(--color-text)',
}

const inputStyle = {
  width: '100%',
  padding: 'var(--space-2) var(--space-3)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  fontSize: 'var(--text-sm)',
  color: 'var(--color-text)',
  background: 'var(--color-bg)',
  boxSizing: 'border-box',
  outline: 'none',
}

const alertStyle = {
  padding: 'var(--space-3) var(--space-4)',
  borderRadius: 'var(--radius-md)',
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--font-medium)',
}

const tdStyle = {
  padding: 'var(--space-3) var(--space-4)',
  fontSize: 'var(--text-sm)',
  color: 'var(--color-text)',
  verticalAlign: 'middle',
}

export default FarmerDashboard
