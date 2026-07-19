import { useState, useEffect, useRef } from 'react'
import { Users, CheckCircle, Send, Loader, Sparkles, ExternalLink } from 'lucide-react'
import { payoutsAPI, schemesAPI } from '../services/api'
import toast from 'react-hot-toast'

export default function Community() {
  const [payouts, setPayouts] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [schemes, setSchemes] = useState([])
  const [liveUpdates, setLiveUpdates] = useState([])
  const [liveSchemes, setLiveSchemes] = useState([])
  const [form, setForm] = useState({ scheme_id:'', amount_received:'', district:'', state:'', comment:'' })
  const wsRef = useRef(null)

  const upd = (k,v) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    loadPayouts()
    schemesAPI.list({ limit:30 }).then(r => setSchemes(r.data.schemes || [])).catch(() => {})
    // WebSocket for live updates
    try {
      const ws = new WebSocket(`ws://localhost:8000/api/payouts/ws`)
      wsRef.current = ws
      ws.onmessage = (e) => {
        const data = JSON.parse(e.data)
        if (data.type === 'new_payout') {
          setLiveUpdates(prev => [data, ...prev].slice(0, 5))
        }
        if (data.type === 'new_scheme_live') {
          setLiveSchemes(prev => [data, ...prev].slice(0, 5))
          toast.success(`🆕 New scheme added: ${data.scheme_name}`, { duration: 5000 })
        }
      }
    } catch {}
    return () => { wsRef.current?.close() }
  }, [])

  const loadPayouts = async () => {
    try {
      const res = await payoutsAPI.list()
      setPayouts(res.data || [])
    } catch {}
    setLoading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.scheme_id || !form.amount_received || !form.district || !form.state) {
      toast.error('Please fill all required fields')
      return
    }
    setSubmitting(true)
    try {
      await payoutsAPI.submit({ ...form, scheme_id: parseInt(form.scheme_id) })
      toast.success('Payout verified and posted!')
      setForm({ scheme_id:'', amount_received:'', district:'', state:'', comment:'' })
      loadPayouts()
    } catch { toast.error('Submission failed') }
    setSubmitting(false)
  }

  const timeAgo = (iso) => {
    const diff = (Date.now() - new Date(iso)) / 1000
    if (diff < 60) return `${Math.floor(diff)}s ago`
    if (diff < 3600) return `${Math.floor(diff/60)}m ago`
    if (diff < 86400) return `${Math.floor(diff/3600)}h ago`
    return new Date(iso).toLocaleDateString('en-IN')
  }

  return (
    <div className="page-container">
      <h1 className="section-title" style={{ marginBottom:'0.35rem' }}>Crowdsourced Payout Verifier</h1>
      <p className="section-sub" style={{ marginBottom:'2rem' }}>Village leaders verify real subsidy payouts to help other farmers</p>

      {/* Live new scheme announcements */}
      {liveSchemes.length > 0 && (
        <div style={{ marginBottom:'1.5rem' }}>
          <div style={{ fontSize:'0.75rem', fontWeight:600, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:'0.6rem' }}>🆕 Live — New Schemes Added</div>
          {liveSchemes.map((s, i) => (
            <div key={i} className="animate-slide-right" style={{ padding:'0.9rem 1.25rem', borderRadius:10, background:'rgba(99,102,241,0.07)', border:'1px solid rgba(99,102,241,0.2)', marginBottom:'0.5rem', display:'flex', alignItems:'center', gap:'1rem', flexWrap:'wrap' }}>
              <Sparkles size={14} color="#c4b5fd" style={{ flexShrink:0 }} />
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, color:'white', fontSize:'0.85rem' }}>{s.scheme_name}</div>
                <div style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.45)', marginTop:'0.15rem' }}>{s.category} • {s.applicable_states} • {s.subsidy_amount || 'Subsidy available'}</div>
              </div>
              {s.source_url && (
                <a href={s.source_url} target="_blank" rel="noreferrer" className="glass-btn btn-ghost"
                   style={{ padding:'0.3rem 0.7rem', fontSize:'0.72rem', textDecoration:'none', gap:'0.3rem' }}>
                  <ExternalLink size={11} /> View
                </a>
              )}
              <span style={{ fontSize:'0.7rem', color:'rgba(255,255,255,0.25)' }}>{new Date(s.timestamp).toLocaleTimeString('en-IN')}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'400px 1fr', gap:'1.5rem', alignItems:'start' }}>
        {/* Submit form */}
        <div className="glass-card" style={{ padding:'1.5rem' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'1.25rem' }}>
            <CheckCircle size={16} color="rgba(255,255,255,0.6)" />
            <span style={{ fontWeight:700, color:'white' }}>Submit Payout Verification</span>
          </div>
          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'0.85rem' }}>
            <div>
              <label style={{ fontSize:'0.78rem', color:'rgba(255,255,255,0.45)', display:'block', marginBottom:'0.35rem' }}>Scheme *</label>
              <select className="glass-input" value={form.scheme_id} onChange={e => upd('scheme_id', e.target.value)}>
                <option value="">Select scheme...</option>
                {schemes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:'0.78rem', color:'rgba(255,255,255,0.45)', display:'block', marginBottom:'0.35rem' }}>Amount Received *</label>
              <input className="glass-input" placeholder="e.g. ₹6000 or ₹2000" value={form.amount_received} onChange={e => upd('amount_received', e.target.value)} />
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
              <div>
                <label style={{ fontSize:'0.78rem', color:'rgba(255,255,255,0.45)', display:'block', marginBottom:'0.35rem' }}>District *</label>
                <input className="glass-input" placeholder="Your district" value={form.district} onChange={e => upd('district', e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize:'0.78rem', color:'rgba(255,255,255,0.45)', display:'block', marginBottom:'0.35rem' }}>State *</label>
                <input className="glass-input" placeholder="State" value={form.state} onChange={e => upd('state', e.target.value)} />
              </div>
            </div>
            <div>
              <label style={{ fontSize:'0.78rem', color:'rgba(255,255,255,0.45)', display:'block', marginBottom:'0.35rem' }}>Comment (optional)</label>
              <textarea className="glass-input" placeholder="Share your experience..." value={form.comment} onChange={e => upd('comment', e.target.value)} rows={3} style={{ resize:'vertical' }} />
            </div>
            <button type="submit" disabled={submitting} className="glass-btn btn-white" style={{ padding:'0.875rem', width:'100%', opacity: submitting ? 0.7 : 1 }}>
              {submitting ? <><Loader size={15} className="animate-spin-slow" /> Submitting...</> : <><Send size={15} /> Submit Verification</>}
            </button>
          </form>
        </div>

        {/* Feed */}
        <div>
          {/* Live updates */}
          {liveUpdates.length > 0 && (
            <div style={{ marginBottom:'1rem' }}>
              {liveUpdates.map((u, i) => (
                <div key={i} className="animate-slide-right" style={{ padding:'0.75rem 1rem', borderRadius:10, background:'rgba(34,197,94,0.07)', border:'1px solid rgba(34,197,94,0.2)', marginBottom:'0.5rem', display:'flex', alignItems:'center', gap:'0.75rem' }}>
                  <div style={{ width:6, height:6, borderRadius:'50%', background:'#86efac', animation:'pulse 1.5s infinite', flexShrink:0 }} />
                  <span style={{ fontSize:'0.82rem', color:'rgba(255,255,255,0.7)' }}>
                    <strong style={{ color:'white' }}>{u.scheme_name}</strong> — {u.amount_received} received in {u.district}, {u.state}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div style={{ fontWeight:700, color:'white', marginBottom:'1rem', display:'flex', alignItems:'center', gap:'0.5rem' }}>
            <Users size={16} color="rgba(255,255,255,0.5)" />
            Community Verifications ({payouts.length})
          </div>

          {loading ? (
            <div style={{ textAlign:'center', padding:'3rem', color:'rgba(255,255,255,0.3)' }}><Loader size={24} className="animate-spin-slow" /></div>
          ) : payouts.length === 0 ? (
            <div className="glass-card" style={{ padding:'3rem', textAlign:'center', color:'rgba(255,255,255,0.4)', fontSize:'0.9rem' }}>
              No verifications yet. Be the first!
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem', maxHeight:500, overflowY:'auto' }}>
              {payouts.map(p => (
                <div key={p.id} className="glass-card" style={{ padding:'1.25rem' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'1rem', marginBottom:'0.5rem' }}>
                    <div>
                      <div style={{ fontWeight:700, fontSize:'0.875rem', color:'white', marginBottom:'0.2rem' }}>
                        {schemes.find(s => s.id === p.scheme_id)?.name || `Scheme #${p.scheme_id}`}
                      </div>
                      <div style={{ fontSize:'0.78rem', color:'rgba(255,255,255,0.45)' }}>{p.district}, {p.state}</div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontWeight:800, color:'#86efac', fontSize:'1rem' }}>{p.amount_received}</div>
                      <div style={{ fontSize:'0.72rem', color:'rgba(255,255,255,0.3)' }}>{timeAgo(p.created_at)}</div>
                    </div>
                  </div>
                  {p.comment && <div style={{ fontSize:'0.82rem', color:'rgba(255,255,255,0.6)', fontStyle:'italic' }}>"{p.comment}"</div>}
                  {p.is_verified && <div style={{ marginTop:'0.5rem', display:'inline-flex', alignItems:'center', gap:'0.3rem' }}><CheckCircle size={12} color="#86efac" /><span style={{ fontSize:'0.72rem', color:'#86efac' }}>Verified by village leader</span></div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
