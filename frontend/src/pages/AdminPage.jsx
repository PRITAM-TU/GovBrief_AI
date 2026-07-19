import { useState, useEffect, useRef } from 'react'
import {
  ShieldCheck, Lock, Globe, Zap, Trash2, RefreshCw,
  CheckCircle, XCircle, Loader, AlertTriangle, Radio,
  Database, Plus, ExternalLink, Sparkles, Eye, EyeOff
} from 'lucide-react'
import { adminAPI } from '../services/api'
import toast from 'react-hot-toast'

// ── Password Gate ─────────────────────────────────────────────────────────────
function PasswordGate({ onAuth }) {
  const [pwd, setPwd] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [shake, setShake] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!pwd.trim()) return
    setLoading(true)
    try {
      await adminAPI.verify(pwd)
      toast.success('🔓 Admin access granted')
      onAuth(pwd)
    } catch {
      setShake(true)
      setTimeout(() => setShake(false), 600)
      toast.error('❌ Invalid admin password')
      setPwd('')
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', position: 'relative', overflow: 'hidden'
    }}>
      {/* Background glow */}
      <div style={{ position:'absolute', top:'30%', left:'50%', transform:'translateX(-50%)', width:500, height:500,
        background:'radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 70%)', pointerEvents:'none', borderRadius:'50%' }} />

      <div style={{
        width: '100%', maxWidth: 420, padding: '0 1.5rem',
        animation: shake ? 'shake 0.5s ease' : 'fadeIn 0.5s ease',
      }}>
        {/* Icon */}
        <div style={{ textAlign:'center', marginBottom:'2rem' }}>
          <div style={{ display:'inline-flex', width:72, height:72, borderRadius:20,
            background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.15)',
            alignItems:'center', justifyContent:'center', marginBottom:'1.25rem' }}>
            <ShieldCheck size={32} color="white" />
          </div>
          <div style={{ fontSize:'1.6rem', fontWeight:800, color:'white', marginBottom:'0.4rem' }}>Admin Portal</div>
          <div style={{ fontSize:'0.85rem', color:'rgba(255,255,255,0.4)' }}>
            GovBrief AI — Restricted Access Only
          </div>
        </div>

        <form onSubmit={handleLogin}>
          <div className="glass-card" style={{ padding:'2rem', borderColor:'rgba(255,255,255,0.12)' }}>
            <div style={{ marginBottom:'1.5rem' }}>
              <label style={{ fontSize:'0.78rem', color:'rgba(255,255,255,0.45)', display:'block', marginBottom:'0.5rem', letterSpacing:'0.05em', textTransform:'uppercase' }}>
                Admin Password
              </label>
              <div style={{ position:'relative' }}>
                <input
                  type={show ? 'text' : 'password'}
                  className="glass-input"
                  placeholder="Enter admin password…"
                  value={pwd}
                  onChange={e => setPwd(e.target.value)}
                  autoFocus
                  style={{ paddingRight:'3rem' }}
                />
                <button type="button" onClick={() => setShow(s => !s)} style={{
                  position:'absolute', right:'0.75rem', top:'50%', transform:'translateY(-50%)',
                  background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.4)', padding:0
                }}>
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading || !pwd.trim()} className="glass-btn btn-white"
              style={{ width:'100%', padding:'0.9rem', fontSize:'0.95rem' }}>
              {loading
                ? <><Loader size={16} style={{ animation:'spin 0.8s linear infinite' }} /> Verifying…</>
                : <><Lock size={16} /> Enter Admin Dashboard</>
              }
            </button>

            <div style={{ marginTop:'1.25rem', padding:'0.85rem', borderRadius:10,
              background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ fontSize:'0.72rem', color:'rgba(255,255,255,0.3)', lineHeight:1.7 }}>
                🔐 This panel is for authorized administrators only.<br/>
                All actions are logged. Unauthorized access is prohibited.
              </div>
            </div>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes shake {
          0%,100%{transform:translateX(0)} 20%{transform:translateX(-10px)} 40%{transform:translateX(10px)}
          60%{transform:translateX(-6px)} 80%{transform:translateX(6px)}
        }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </div>
  )
}

// ── Live Broadcast Feed ───────────────────────────────────────────────────────
function BroadcastFeed({ events }) {
  const endRef = useRef(null)
  useEffect(() => { endRef.current?.scrollIntoView({ behavior:'smooth' }) }, [events])

  if (events.length === 0) return (
    <div style={{ padding:'2rem', textAlign:'center', color:'rgba(255,255,255,0.25)', fontSize:'0.82rem' }}>
      <Radio size={20} style={{ marginBottom:'0.5rem', display:'block', margin:'0 auto 0.5rem' }} />
      No broadcasts yet. Scrape a URL to broadcast live.
    </div>
  )

  return (
    <div style={{ maxHeight:300, overflowY:'auto', display:'flex', flexDirection:'column', gap:'0.5rem' }}>
      {events.map((ev, i) => (
        <div key={i} className="animate-slide-right" style={{
          padding:'0.75rem 1rem', borderRadius:10,
          background: ev.type === 'new_scheme_live' ? 'rgba(34,197,94,0.07)' : 'rgba(255,255,255,0.04)',
          border:`1px solid ${ev.type === 'new_scheme_live' ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.08)'}`,
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.6rem' }}>
            <div style={{ width:7, height:7, borderRadius:'50%', background:'#86efac', flexShrink:0,
              animation:'pulse 1.5s infinite' }} />
            <span style={{ fontSize:'0.82rem', fontWeight:600, color:'white' }}>{ev.scheme_name || ev.message}</span>
            <span style={{ marginLeft:'auto', fontSize:'0.7rem', color:'rgba(255,255,255,0.3)' }}>
              {new Date(ev.timestamp).toLocaleTimeString('en-IN')}
            </span>
          </div>
          {ev.category && (
            <div style={{ marginTop:'0.3rem', paddingLeft:'1.3rem' }}>
              <span className="badge badge-info" style={{ marginRight:'0.4rem' }}>{ev.category}</span>
              {ev.subsidy_amount && <span className="badge badge-success">{ev.subsidy_amount}</span>}
            </div>
          )}
        </div>
      ))}
      <div ref={endRef} />
    </div>
  )
}

// ── Scheme Row ────────────────────────────────────────────────────────────────
function SchemeRow({ scheme, adminPwd, onDeleted }) {
  const [deleting, setDeleting] = useState(false)
  const [confirm, setConfirm] = useState(false)

  const handleDelete = async () => {
    if (!confirm) { setConfirm(true); return }
    setDeleting(true)
    try {
      await adminAPI.delete(adminPwd, scheme.id)
      toast.success(`'${scheme.name}' deleted`)
      onDeleted(scheme.id)
    } catch (e) { toast.error(e?.response?.data?.detail || 'Delete failed') }
    setDeleting(false)
    setConfirm(false)
  }

  return (
    <tr>
      <td style={{ padding:'0.7rem 1rem', fontSize:'0.82rem', color:'white', fontWeight:500 }}>
        #{scheme.id} — {scheme.name}
      </td>
      <td style={{ padding:'0.7rem 1rem' }}>
        <span className="badge badge-info">{scheme.category}</span>
      </td>
      <td style={{ padding:'0.7rem 1rem', fontSize:'0.78rem', color:'rgba(255,255,255,0.5)' }}>
        {scheme.subsidy_amount || '—'}
      </td>
      <td style={{ padding:'0.7rem 1rem', fontSize:'0.75rem', color:'rgba(255,255,255,0.35)' }}>
        {scheme.applicable_states?.length > 20 ? scheme.applicable_states.slice(0,20)+'…' : scheme.applicable_states}
      </td>
      <td style={{ padding:'0.7rem 1rem' }}>
        <span className={`badge ${scheme.is_active ? 'badge-success' : 'badge-danger'}`}>
          {scheme.is_active ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td style={{ padding:'0.7rem 1rem', fontSize:'0.72rem', color:'rgba(255,255,255,0.3)' }}>
        {scheme.created_at ? new Date(scheme.created_at).toLocaleDateString('en-IN') : '—'}
      </td>
      <td style={{ padding:'0.7rem 1rem' }}>
        <button onClick={handleDelete} disabled={deleting} className="glass-btn btn-danger"
          style={{ padding:'0.3rem 0.7rem', fontSize:'0.72rem', gap:'0.3rem' }}>
          {deleting ? <Loader size={11} style={{ animation:'spin 0.8s linear infinite' }} />
            : confirm ? <><AlertTriangle size={11} /> Confirm?</>
            : <><Trash2 size={11} /> Delete</>}
        </button>
      </td>
    </tr>
  )
}

// ── Main Admin Dashboard ──────────────────────────────────────────────────────
function AdminDashboard({ adminPwd, onLogout }) {
  const [url, setUrl]         = useState('')
  const [scraping, setScraping] = useState(false)
  const [result, setResult]   = useState(null)
  const [schemes, setSchemes] = useState([])
  const [loadingSchemes, setLoadingSchemes] = useState(true)
  const [broadcasts, setBroadcasts] = useState([])
  const wsRef = useRef(null)

  useEffect(() => {
    loadSchemes()
    // WebSocket to receive own broadcasts
    try {
      const ws = new WebSocket('ws://localhost:8000/api/payouts/ws')
      wsRef.current = ws
      ws.onmessage = (e) => {
        const data = JSON.parse(e.data)
        if (data.type === 'new_scheme_live') {
          setBroadcasts(prev => [data, ...prev].slice(0, 20))
        }
      }
    } catch {}
    return () => wsRef.current?.close()
  }, [])

  const loadSchemes = async () => {
    setLoadingSchemes(true)
    try {
      const res = await adminAPI.schemes(adminPwd)
      setSchemes(res.data || [])
    } catch (e) { toast.error('Failed to load schemes') }
    setLoadingSchemes(false)
  }

  const handleScrape = async (e) => {
    e.preventDefault()
    if (!url.trim()) { toast.error('Enter a URL'); return }
    if (!url.startsWith('http')) { toast.error('URL must start with http:// or https://'); return }
    setScraping(true)
    setResult(null)
    try {
      const res = await adminAPI.scrape(adminPwd, url.trim())
      setResult({ ...res.data, success: true })
      toast.success(`✅ ${res.data.scheme_name} added & broadcast!`)
      setUrl('')
      loadSchemes()
    } catch (e) {
      const msg = e?.response?.data?.detail || 'Scraping failed'
      setResult({ success: false, message: msg })
      toast.error(msg)
    }
    setScraping(false)
  }

  const handleDeletedScheme = (id) => {
    setSchemes(prev => prev.filter(s => s.id !== id))
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'2rem', flexWrap:'wrap', gap:'1rem' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
          <div style={{ width:48, height:48, borderRadius:14, background:'rgba(255,255,255,0.07)',
            border:'1px solid rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <ShieldCheck size={24} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize:'1.5rem', fontWeight:800, color:'white', margin:0 }}>Admin Dashboard</h1>
            <div style={{ fontSize:'0.8rem', color:'rgba(255,255,255,0.4)' }}>GovBrief AI — Scheme Management Portal</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:'0.75rem', alignItems:'center' }}>
          <span className="badge badge-success"><div style={{ width:6,height:6,borderRadius:'50%',background:'#86efac' }} /> Admin Authenticated</span>
          <button onClick={onLogout} className="glass-btn btn-ghost" style={{ padding:'0.5rem 1rem', fontSize:'0.8rem' }}>
            <Lock size={13} /> Logout
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1rem', marginBottom:'2rem' }}>
        {[
          { icon:<Database size={18} />, label:'Total Schemes', value: schemes.length, color:'#c4b5fd' },
          { icon:<Radio size={18} />,   label:'Live Broadcasts', value: broadcasts.length, color:'#86efac' },
          { icon:<Sparkles size={18} />,label:'Active Schemes', value: schemes.filter(s=>s.is_active).length, color:'#fde047' },
        ].map((s, i) => (
          <div key={i} className="glass-card" style={{ padding:'1.25rem', display:'flex', alignItems:'center', gap:'1rem' }}>
            <div style={{ color: s.color }}>{s.icon}</div>
            <div>
              <div style={{ fontSize:'1.4rem', fontWeight:800, color:'white' }}>{s.value}</div>
              <div style={{ fontSize:'0.73rem', color:'rgba(255,255,255,0.4)' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem', alignItems:'start', marginBottom:'2rem' }}>
        {/* Left: URL scraper */}
        <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
          <div className="glass-card" style={{ padding:'1.75rem', borderColor:'rgba(255,255,255,0.12)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'1.5rem' }}>
              <Globe size={18} color="rgba(255,255,255,0.7)" />
              <span style={{ fontWeight:700, color:'white', fontSize:'1rem' }}>🌐 Live Scheme Scraper</span>
              <span className="badge badge-info" style={{ marginLeft:'auto' }}><Zap size={9} /> AI Powered</span>
            </div>

            <form onSubmit={handleScrape}>
              <div style={{ marginBottom:'1rem' }}>
                <label style={{ fontSize:'0.78rem', color:'rgba(255,255,255,0.45)', display:'block', marginBottom:'0.45rem', textTransform:'uppercase', letterSpacing:'0.05em' }}>
                  Government Scheme URL
                </label>
                <input
                  className="glass-input"
                  placeholder="https://pmkisan.gov.in  /  https://agricoop.nic.in/…"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  disabled={scraping}
                />
              </div>

              {/* Suggested URLs */}
              <div style={{ marginBottom:'1rem' }}>
                <div style={{ fontSize:'0.72rem', color:'rgba(255,255,255,0.3)', marginBottom:'0.5rem' }}>Quick suggestions:</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'0.4rem' }}>
                  {[
                    'https://pmkisan.gov.in',
                    'https://pmfby.gov.in',
                    'https://agricoop.nic.in',
                    'https://vikaspedia.in/agriculture',
                  ].map(u => (
                    <button key={u} type="button" onClick={() => setUrl(u)}
                      className="glass-btn btn-ghost" style={{ padding:'0.25rem 0.6rem', fontSize:'0.68rem', borderRadius:6 }}>
                      {u.replace('https://','').split('/')[0]}
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" disabled={scraping || !url.trim()} className="glass-btn btn-white"
                style={{ width:'100%', padding:'0.9rem', fontSize:'0.9rem' }}>
                {scraping
                  ? <><Loader size={16} style={{ animation:'spin 0.8s linear infinite' }} /> AI Scraping & Extracting…</>
                  : <><Plus size={16} /> Scrape & Add to Database</>
                }
              </button>
            </form>

            {/* Scraping progress */}
            {scraping && (
              <div className="animate-slide-up" style={{ marginTop:'1.25rem' }}>
                {[
                  '🌐 Fetching page content…',
                  '🤖 AI extracting scheme details…',
                  '💾 Saving to database…',
                  '📡 Broadcasting to community…',
                ].map((step, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:'0.6rem',
                    padding:'0.5rem 0.75rem', marginBottom:'0.3rem', borderRadius:8,
                    background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)',
                    animation:`fadeIn 0.4s ease ${i * 0.3}s both`
                  }}>
                    <Loader size={12} style={{ animation:'spin 0.8s linear infinite', color:'#60a5fa', flexShrink:0 }} />
                    <span style={{ fontSize:'0.78rem', color:'rgba(255,255,255,0.55)' }}>{step}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Result */}
            {result && !scraping && (
              <div className="animate-slide-up" style={{ marginTop:'1.25rem', padding:'1.25rem', borderRadius:12,
                background: result.success ? 'rgba(34,197,94,0.07)' : 'rgba(239,68,68,0.07)',
                border: `1px solid ${result.success ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}` }}>
                <div style={{ display:'flex', alignItems:'center', gap:'0.6rem', marginBottom:'0.75rem' }}>
                  {result.success ? <CheckCircle size={18} color="#86efac" /> : <XCircle size={18} color="#fca5a5" />}
                  <span style={{ fontWeight:700, color:'white', fontSize:'0.95rem' }}>
                    {result.success ? result.scheme_name : 'Scraping Failed'}
                  </span>
                </div>
                {result.success ? (
                  <div style={{ display:'flex', flexDirection:'column', gap:'0.4rem' }}>
                    <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap' }}>
                      {result.category && <span className="badge badge-info">{result.category}</span>}
                      {result.subsidy_amount && <span className="badge badge-success">{result.subsidy_amount}</span>}
                      {result.ministry && <span className="badge badge-white">{result.ministry}</span>}
                    </div>
                    <div style={{ fontSize:'0.78rem', color:'rgba(255,255,255,0.55)', marginTop:'0.35rem' }}>
                      {result.benefits_preview}
                    </div>
                    <div style={{ fontSize:'0.72rem', color:'#86efac', marginTop:'0.2rem', display:'flex', alignItems:'center', gap:'0.4rem' }}>
                      <Radio size={11} /> Broadcast sent to all community clients
                    </div>
                  </div>
                ) : (
                  <p style={{ fontSize:'0.8rem', color:'rgba(255,255,255,0.5)', margin:0 }}>{result.message}</p>
                )}
              </div>
            )}
          </div>

          {/* How it works */}
          <div className="glass-card" style={{ padding:'1.25rem' }}>
            <div style={{ fontSize:'0.78rem', fontWeight:600, color:'rgba(255,255,255,0.5)', marginBottom:'0.85rem', textTransform:'uppercase', letterSpacing:'0.06em' }}>
              How It Works
            </div>
            {[
              { icon:'🌐', text:'Admin pastes any .gov.in scheme URL' },
              { icon:'🤖', text:'Gemini AI reads the page & extracts structured data' },
              { icon:'💾', text:'Scheme auto-saved to GovBrief database' },
              { icon:'📡', text:'Live broadcast to all community users via WebSocket' },
              { icon:'🎯', text:'ML recommender instantly matches new scheme to farmers' },
            ].map((item, i) => (
              <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:'0.75rem', padding:'0.4rem 0',
                borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                <span style={{ fontSize:'1rem', flexShrink:0 }}>{item.icon}</span>
                <span style={{ fontSize:'0.78rem', color:'rgba(255,255,255,0.5)', lineHeight:1.5 }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Live broadcast feed */}
        <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
          <div className="glass-card" style={{ padding:'1.5rem' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'0.6rem', marginBottom:'1.25rem' }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:'#86efac', animation:'pulse 1.5s infinite' }} />
              <span style={{ fontWeight:700, color:'white', fontSize:'0.95rem' }}>📡 Live Community Broadcast</span>
              <span style={{ marginLeft:'auto', fontSize:'0.72rem', color:'rgba(255,255,255,0.3)' }}>
                {broadcasts.length} event{broadcasts.length !== 1 ? 's' : ''}
              </span>
            </div>
            <BroadcastFeed events={broadcasts} />
          </div>
        </div>
      </div>

      {/* Schemes Database Table */}
      <div className="glass-card" style={{ padding:'1.75rem' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.25rem', flexWrap:'wrap', gap:'0.75rem' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.6rem' }}>
            <Database size={17} color="rgba(255,255,255,0.6)" />
            <span style={{ fontWeight:700, color:'white', fontSize:'1rem' }}>Schemes Database</span>
            <span className="badge badge-white">{schemes.length} schemes</span>
          </div>
          <button onClick={loadSchemes} disabled={loadingSchemes} className="glass-btn btn-ghost"
            style={{ padding:'0.45rem 0.9rem', fontSize:'0.78rem' }}>
            <RefreshCw size={13} style={{ animation: loadingSchemes ? 'spin 1s linear infinite' : 'none' }} /> Refresh
          </button>
        </div>

        {loadingSchemes ? (
          <div style={{ textAlign:'center', padding:'3rem', color:'rgba(255,255,255,0.3)' }}>
            <Loader size={24} style={{ animation:'spin 1s linear infinite' }} />
          </div>
        ) : schemes.length === 0 ? (
          <div style={{ textAlign:'center', padding:'3rem', color:'rgba(255,255,255,0.3)', fontSize:'0.88rem' }}>
            No schemes in database. Scrape a URL to add one!
          </div>
        ) : (
          <div style={{ overflowX:'auto', maxHeight:420, overflowY:'auto' }}>
            <table className="glass-table" style={{ minWidth:800 }}>
              <thead>
                <tr>
                  {['Scheme Name','Category','Subsidy','States','Status','Added','Action'].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {schemes.map(s => (
                  <SchemeRow key={s.id} scheme={s} adminPwd={adminPwd} onDeleted={handleDeletedScheme} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin    { to{transform:rotate(360deg)} }
        @keyframes fadeIn  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:0.3} }
      `}</style>
    </div>
  )
}

// ── Root Export ───────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [adminPwd, setAdminPwd] = useState(null)

  if (!adminPwd) {
    return <PasswordGate onAuth={(pwd) => setAdminPwd(pwd)} />
  }

  return (
    <AdminDashboard
      adminPwd={adminPwd}
      onLogout={() => { setAdminPwd(null); toast('Logged out of admin panel') }}
    />
  )
}
