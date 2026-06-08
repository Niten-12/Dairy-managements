import { useAuth } from '../context/AuthContext'

const stats = [
  { label: 'Total Cattle', value: '0', color: '#3b82f6' },
  { label: 'Milk Production Today', value: '0 L', color: '#10b981' },
  { label: 'Active Farmers', value: '0', color: '#f59e0b' },
  { label: 'Pending Collections', value: '0', color: '#ef4444' },
]

function Dashboard() {
  const { user } = useAuth()

  return (
    <div>
      <h1 style={{ margin: '0 0 4px', color: '#1e293b', fontSize: '24px' }}>Dashboard</h1>
      <p style={{ margin: '0 0 28px', color: '#64748b', fontSize: '14px' }}>
        Welcome back, <strong>{user?.name}</strong>
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {stats.map((stat) => (
          <div key={stat.label} style={{
            background: '#fff', padding: '24px', borderRadius: '12px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)', borderTop: `4px solid ${stat.color}`
          }}>
            <p style={{ margin: '0 0 8px', color: '#64748b', fontSize: '13px', fontWeight: '500' }}>
              {stat.label}
            </p>
            <p style={{ margin: 0, fontSize: '32px', fontWeight: '700', color: '#1e293b' }}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Dashboard
