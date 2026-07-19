import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Loader, Search, Filter } from 'lucide-react'
import { schemesAPI } from '../services/api'
import useStore from '../store/useStore'
import SchemeCard from '../components/SchemeCard'
import toast from 'react-hot-toast'

export default function SchemeMatcher() {
  const { chatHistory, farmerProfile, addChatMessage, updateFarmerProfile, user } = useStore()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [matched, setMatched] = useState([])
  const [matching, setMatching] = useState(false)
  const [schemes, setSchemes] = useState([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [categories, setCategories] = useState([])
  const chatEndRef = useRef(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory])

  useEffect(() => {
    schemesAPI.categories().then(r => setCategories(r.data || [])).catch(() => {})
    loadSchemes()
    if (chatHistory.length === 0) {
      addChatMessage('ai', `Namaste! 🌾 I'm GovBrief AI. I'll help you find the best government schemes for your farm. Which state are you farming in?`)
    }
  }, [])

  const loadSchemes = async (params = {}) => {
    try {
      const res = await schemesAPI.list({ limit: 20, ...params })
      setSchemes(res.data.schemes || [])
    } catch {}
  }

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    const msg = input.trim()
    setInput('')
    addChatMessage('user', msg)
    setLoading(true)
    try {
      const res = await schemesAPI.chat({ message: msg, conversation_history: chatHistory.slice(-6), farmer_profile: farmerProfile })
      addChatMessage('ai', res.data.reply)
      if (res.data.profile_update && Object.keys(res.data.profile_update).length > 0) {
        updateFarmerProfile(res.data.profile_update)
      }
    } catch {
      addChatMessage('ai', 'I had trouble processing that. Please try again.')
    }
    setLoading(false)
  }

  const runAIMatch = async () => {
    const profile = { ...farmerProfile, name: user?.name, state: user?.state || farmerProfile.state, district: user?.district || farmerProfile.district, land_size: user?.land_size, income: user?.income, crop_types: user?.crop_types, farmer_category: user?.farmer_category }
    setMatching(true)
    try {
      const res = await schemesAPI.match({ farmer_profile: profile, state: profile.state })
      setMatched(res.data.matched_schemes || [])
      if (res.data.matched_schemes?.length > 0) toast.success(`Found ${res.data.matched_schemes.length} matching schemes!`)
    } catch { toast.error('Match failed — check API key') }
    setMatching(false)
  }

  return (
    <div className="page-container">
      <h1 className="section-title" style={{ marginBottom: '0.35rem' }}>Scheme Matcher</h1>
      <p className="section-sub" style={{ marginBottom: '2rem' }}>AI-powered scheme discovery — chat to find eligible subsidies</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Chat */}
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: 520 }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Bot size={16} color="rgba(255,255,255,0.6)" />
            <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'white' }}>AI Scheme Assistant</span>
            {Object.keys(farmerProfile).length > 0 && (
              <span className="badge badge-success" style={{ marginLeft: 'auto' }}>Profile learned</span>
            )}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {chatHistory.map((m, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', flexDirection: m.role === 'user' ? 'row-reverse' : 'row' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: m.role === 'user' ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {m.role === 'user' ? <User size={13} color="white" /> : <Bot size={13} color="rgba(255,255,255,0.7)" />}
                </div>
                <div className={m.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'} style={{ fontSize: '0.85rem', lineHeight: 1.55, color: 'rgba(255,255,255,0.85)' }}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Bot size={13} color="rgba(255,255,255,0.7)" /></div>
                <div className="chat-bubble-ai"><Loader size={14} className="animate-spin-slow" color="rgba(255,255,255,0.5)" /></div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div style={{ padding: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: '0.5rem' }}>
            <input className="glass-input" placeholder="Type your message..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} style={{ flex: 1 }} />
            <button onClick={sendMessage} disabled={loading} className="glass-btn btn-white" style={{ padding: '0.65rem 1rem', flexShrink: 0 }}>
              <Send size={15} />
            </button>
          </div>
        </div>

        {/* Scheme list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <button onClick={runAIMatch} disabled={matching} className="glass-btn btn-white" style={{ width: '100%', padding: '0.875rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {matching ? <><Loader size={16} className="animate-spin-slow" /> Running ML Engine...</> : <><Search size={16} /> Run ML Recommendation Engine</>}
            </div>
            <div style={{ fontSize: '0.65rem', color: 'rgba(0,0,0,0.5)', fontWeight: 600 }}>Powered by XGBoost Predictive Model</div>
          </button>

          {matched.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: 450, overflowY: 'auto' }}>
              {matched.map((s, i) => (
                <div key={i} className="glass-card" style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'white', flex: 1 }}>{s.scheme_name}</span>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', width: '100px' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: '0.2rem' }}>Approval Chance</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%' }}>
                        <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ width: `${s.eligibility_score}%`, height: '100%', background: s.eligibility_score >= 80 ? '#86efac' : s.eligibility_score >= 60 ? '#fde047' : '#fca5a5' }} />
                        </div>
                        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: s.eligibility_score >= 80 ? '#86efac' : s.eligibility_score >= 60 ? '#fde047' : '#fca5a5' }}>{s.eligibility_score}%</span>
                      </div>
                    </div>
                  </div>
                  {s.reasons_eligible?.map((r, j) => <div key={j} style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.55)', marginBottom: '0.2rem' }}>• {r}</div>)}
                  {s.estimated_benefit && <div style={{ marginTop: '0.5rem', fontSize: '0.78rem', color: 'white', fontWeight: 600 }}>Benefit: {s.estimated_benefit}</div>}
                </div>
              ))}
            </div>
          )}

          {matched.length === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: 430, overflowY: 'auto' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input className="glass-input" placeholder="Search schemes..." value={search} onChange={e => { setSearch(e.target.value); loadSchemes({ search: e.target.value, category }) }} />
                <select className="glass-input" style={{ width: 140 }} value={category} onChange={e => { setCategory(e.target.value); loadSchemes({ search, category: e.target.value }) }}>
                  <option value="">All categories</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              {schemes.map(s => <SchemeCard key={s.id} scheme={s} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
