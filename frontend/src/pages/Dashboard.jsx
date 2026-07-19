import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Bell, FileText, ScanLine, Calculator, Shield, TrendingUp, Clock } from 'lucide-react'
import useStore from '../store/useStore'
import { alertsAPI, schemesAPI } from '../services/api'

const QUICK_LINKS = [
  { to: '/schemes', icon: Search, label: 'Find Schemes', desc: 'AI scheme matching' },
  { to: '/ocr', icon: ScanLine, label: 'Scan Document', desc: 'OCR extraction' },
  { to: '/summarize', icon: FileText, label: 'Summarize PDF', desc: 'Policy summary' },
  { to: '/roi', icon: Calculator, label: 'ROI Calculator', desc: 'Calculate savings' },
  { to: '/vault', icon: Shield, label: 'My Vault', desc: 'Secure documents' },
  { to: '/alerts', icon: Bell, label: 'Alerts', desc: 'Deadline reminders' },
]

export default function Dashboard() {
  const { user } = useStore()
  const [stats, setStats] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [recentSchemes, setRecentSchemes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, alertsRes, schemesRes] = await Promise.all([
          alertsAPI.stats(),
          alertsAPI.upcoming(30),
          schemesAPI.list({ limit: 4 }),
        ])
        setStats(statsRes.data)
        setAlerts(alertsRes.data.alerts?.slice(0, 3) || [])
        setRecentSchemes(schemesRes.data.schemes || [])
      } catch {}
      setLoading(false)
    }
    load()
  }, [])

  const urgencyColor = (days) => days <= 5 ? '#fca5a5' : days <= 15 ? '#fde047' : '#86efac'

  return (
    <div className="page-container">
      {/* Welcome */}
      <div style={{ marginBottom: '2rem' }} className="animate-fade-in">
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', marginBottom: '0.35rem' }}>
          Welcome back, {user?.name?.split(' ')[0] || 'Farmer'} 👋
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.9rem' }}>
          {user?.state && user?.district ? `${user.district}, ${user.state}` : 'Complete your profile to get personalized scheme recommendations'}
        </p>
      </div>

      {/* Stats Row */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }} className="stagger">
          {[
            { label: 'Active Schemes', value: stats.total_active_schemes, icon: TrendingUp },
            { label: 'Expiring (30 days)', value: stats.expiring_in_30_days, icon: Clock },
            { label: 'States Covered', value: stats.total_states_covered, icon: Search },
            { label: 'Documents', value: stats.total_documents || 0, icon: Shield },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="glass-card animate-slide-up" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <Icon size={16} color="rgba(255,255,255,0.5)" />
                <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white' }}>{value}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Quick Links */}
        <div>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'white', marginBottom: '1rem' }}>Quick Actions</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }} className="stagger">
            {QUICK_LINKS.map(({ to, icon: Icon, label, desc }) => (
              <Link key={to} to={to} className="glass-card animate-slide-up" style={{ padding: '1.25rem', textDecoration: 'none', display: 'block' }}>
                <Icon size={20} color="rgba(255,255,255,0.7)" style={{ marginBottom: '0.5rem' }} />
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'white', marginBottom: '0.15rem' }}>{label}</div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>{desc}</div>
              </Link>
            ))}
          </div>
        </div>

        {/* Alerts */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'white' }}>Upcoming Deadlines</h2>
            <Link to="/alerts" style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', textDecoration: 'none' }}>View all →</Link>
          </div>
          {alerts.length === 0 && !loading ? (
            <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem' }}>
              No upcoming deadlines in 30 days
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {alerts.map((a) => (
                <div key={a.scheme_id} className="glass-card" style={{ padding: '1rem' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'white', marginBottom: '0.25rem' }}>{a.scheme_name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Clock size={12} color={urgencyColor(a.days_remaining)} />
                    <span style={{ fontSize: '0.78rem', color: urgencyColor(a.days_remaining) }}>{a.days_remaining} days remaining</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Profile hint */}
          {!user?.state && (
            <div className="glass-card" style={{ padding: '1rem', marginTop: '0.75rem', borderColor: 'rgba(255,255,255,0.2)' }}>
              <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem' }}>
                💡 Complete your profile for AI-matched schemes
              </div>
              <Link to="/schemes" style={{ fontSize: '0.8rem', color: 'white', fontWeight: 600, textDecoration: 'none' }}>
                Start matching →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Recent Schemes */}
      <div style={{ marginTop: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'white' }}>Active Schemes</h2>
          <Link to="/schemes" style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', textDecoration: 'none' }}>Browse all →</Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
          {recentSchemes.map((s) => (
            <div key={s.id} className="glass-card" style={{ padding: '1rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'white', marginBottom: '0.25rem' }}>{s.name}</div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.5rem' }}>{s.category}</div>
              {s.subsidy_amount && <span className="badge badge-white">{s.subsidy_amount}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
