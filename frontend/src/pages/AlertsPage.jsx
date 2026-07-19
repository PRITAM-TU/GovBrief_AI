import { useState, useEffect } from 'react'
import { Bell, Clock, AlertTriangle, Info, Calendar } from 'lucide-react'
import { alertsAPI } from '../services/api'

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState(30)

  useEffect(() => { load() }, [filter])

  const load = async () => {
    setLoading(true)
    try {
      const res = await alertsAPI.upcoming(filter)
      setAlerts(res.data.alerts || [])
    } catch {}
    setLoading(false)
  }

  const urgency = (days) => days <= 5 ? { color:'#fca5a5', bg:'rgba(239,68,68,0.08)', border:'rgba(239,68,68,0.2)', label:'CRITICAL', icon: AlertTriangle } :
    days <= 15 ? { color:'#fde047', bg:'rgba(234,179,8,0.08)', border:'rgba(234,179,8,0.2)', label:'WARNING', icon: Clock } :
    { color:'#86efac', bg:'rgba(34,197,94,0.06)', border:'rgba(34,197,94,0.15)', label:'UPCOMING', icon: Info }

  return (
    <div className="page-container" style={{ maxWidth:800 }}>
      <h1 className="section-title" style={{ marginBottom:'0.35rem' }}>Deadline Alerts</h1>
      <p className="section-sub" style={{ marginBottom:'2rem' }}>Never miss an application deadline</p>

      {/* Filter */}
      <div style={{ display:'flex', gap:'0.5rem', marginBottom:'1.5rem' }}>
        {[7, 15, 30, 60].map(d => (
          <button key={d} onClick={() => setFilter(d)} style={{
            padding:'0.4rem 1rem', borderRadius:99, fontSize:'0.82rem', fontWeight:600, cursor:'pointer', transition:'all 0.15s',
            background: filter===d ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${filter===d ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.08)'}`,
            color: filter===d ? 'white' : 'rgba(255,255,255,0.5)',
          }}>
            Next {d} days
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:'3rem', color:'rgba(255,255,255,0.3)' }}>Loading alerts...</div>
      ) : alerts.length === 0 ? (
        <div className="glass-card" style={{ padding:'3rem', textAlign:'center' }}>
          <Bell size={36} color="rgba(255,255,255,0.15)" style={{ margin:'0 auto 1rem', display:'block' }} />
          <div style={{ color:'rgba(255,255,255,0.45)', fontSize:'0.95rem' }}>No deadlines in the next {filter} days</div>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
          {alerts.map((a, i) => {
            const u = urgency(a.days_remaining)
            const Icon = u.icon
            return (
              <div key={i} className="animate-slide-up" style={{ animationDelay:`${i*60}ms`, padding:'1.25rem', borderRadius:14, background: u.bg, border:`1px solid ${u.border}` }}>
                <div style={{ display:'flex', alignItems:'flex-start', gap:'1rem' }}>
                  <div style={{ width:38, height:38, borderRadius:10, background:u.bg, border:`1px solid ${u.border}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <Icon size={16} color={u.color} />
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, color:'white', fontSize:'0.9rem', marginBottom:'0.35rem' }}>{a.scheme_name}</div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:'0.5rem', alignItems:'center' }}>
                      <span style={{ fontSize:'0.72rem', fontWeight:700, color:u.color, background:u.bg, padding:'0.15rem 0.55rem', borderRadius:99, border:`1px solid ${u.border}` }}>{u.label}</span>
                      <span style={{ fontSize:'0.78rem', color:'rgba(255,255,255,0.5)', display:'flex', alignItems:'center', gap:'0.3rem' }}>
                        <Clock size={11} /> {a.days_remaining} days remaining
                      </span>
                      {a.subsidy_amount && <span style={{ fontSize:'0.78rem', color:'rgba(255,255,255,0.5)' }}>• {a.subsidy_amount}</span>}
                    </div>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <div style={{ fontSize:'0.72rem', color:'rgba(255,255,255,0.35)', display:'flex', alignItems:'center', gap:'0.3rem' }}>
                      <Calendar size={11} /> {new Date(a.deadline).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}
                    </div>
                    {a.category && <div style={{ fontSize:'0.72rem', color:'rgba(255,255,255,0.35)', marginTop:'0.25rem' }}>{a.category}</div>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
