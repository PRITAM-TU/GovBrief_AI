import { useState, useEffect, useRef } from 'react'
import { Bot, Play, CheckCircle, XCircle, Loader, Download, ChevronRight, Zap, FileText, Shield, Search, Sparkles } from 'lucide-react'
import { agentAPI } from '../services/api'
import toast from 'react-hot-toast'

const STEP_ICONS = ['📄', '🔍', '📝', '✅', '📄', '🎉']
const STEP_COLORS = {
  pending:  { color: 'rgba(255,255,255,0.2)', bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.06)' },
  running:  { color: '#60a5fa',               bg: 'rgba(96,165,250,0.08)',  border: 'rgba(96,165,250,0.25)' },
  done:     { color: '#86efac',               bg: 'rgba(34,197,94,0.08)',   border: 'rgba(34,197,94,0.2)'  },
  error:    { color: '#fca5a5',               bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.2)'  },
}

const ALL_STEPS = [
  { step_num:1, title:'📄 Reading Documents',    detail:'Scanning uploaded documents & profile…' },
  { step_num:2, title:'🔍 Checking Eligibility', detail:'Analysing against scheme requirements…'  },
  { step_num:3, title:'📝 Filling Form',          detail:'Auto-filling all required fields…'        },
  { step_num:4, title:'✅ Validating',            detail:'Running field validation checks…'          },
  { step_num:5, title:'📄 Generating PDF',        detail:'Generating official application PDF…'     },
  { step_num:6, title:'🎉 Application Ready',     detail:'Preparing your confirmation summary…'      },
]

function StepRow({ step, liveStep }) {
  const st = liveStep ? liveStep.status : (step.step_num < 1 ? 'done' : 'pending')
  const c  = STEP_COLORS[st] || STEP_COLORS.pending

  return (
    <div style={{
      display:'flex', alignItems:'flex-start', gap:'0.85rem', padding:'0.9rem 1rem',
      background: c.bg, border:`1px solid ${c.border}`, borderRadius:10,
      transition:'all 0.4s ease', marginBottom:'0.5rem'
    }}>
      <div style={{
        width:32, height:32, borderRadius:'50%', display:'flex', alignItems:'center',
        justifyContent:'center', fontSize:'0.9rem', flexShrink:0,
        background: c.bg, border:`1.5px solid ${c.border}`,
      }}>
        {st === 'running' && <div style={{ width:14,height:14,border:`2px solid ${c.color}`,borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.8s linear infinite' }} />}
        {st === 'done'    && <span style={{ fontSize:'0.85rem' }}>✓</span>}
        {st === 'error'   && <span style={{ fontSize:'0.85rem' }}>✗</span>}
        {st === 'pending' && <span style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.2)' }}>{step.step_num}</span>}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontWeight:600, fontSize:'0.85rem', color: c.color, marginBottom:'0.2rem' }}>
          {liveStep ? liveStep.title : step.title}
        </div>
        <div style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.45)', lineHeight:1.5 }}>
          {liveStep ? liveStep.detail : step.detail}
        </div>
        {/* Output preview */}
        {liveStep?.output?.eligibility_score !== undefined && (
          <div style={{ marginTop:'0.4rem', display:'inline-flex', gap:'0.5rem', alignItems:'center' }}>
            <span className="badge badge-success">Score: {liveStep.output.eligibility_score}/100</span>
            {liveStep.output.estimated_benefit && (
              <span className="badge badge-info">{liveStep.output.estimated_benefit}</span>
            )}
          </div>
        )}
        {liveStep?.output?.warnings?.length > 0 && (
          <div style={{ marginTop:'0.35rem' }}>
            {liveStep.output.warnings.slice(0,2).map((w,i) => (
              <div key={i} style={{ fontSize:'0.72rem', color:'#fde047', marginTop:'0.15rem' }}>⚠ {w}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function AgentRunner({ schemes }) {
  const [selectedScheme, setSelectedScheme] = useState('')
  const [runId, setRunId]     = useState(null)
  const [runData, setRunData] = useState(null)
  const [polling, setPolling] = useState(false)
  const [launching, setLaunching] = useState(false)
  const pollRef = useRef(null)

  const startAgent = async () => {
    if (!selectedScheme) { toast.error('Select a scheme first'); return }
    setLaunching(true)
    setRunData(null)
    try {
      const res = await agentAPI.startRun(selectedScheme)
      const rid = res.data.run_id
      setRunId(rid)
      setRunData({ status:'running', steps:[], result:null })
      setPolling(true)
      toast.success('🤖 Agent launched! Watch it work…')
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'Failed to start agent')
    }
    setLaunching(false)
  }

  // Poll every 800ms until done/error
  useEffect(() => {
    if (!polling || !runId) return
    pollRef.current = setInterval(async () => {
      try {
        const res = await agentAPI.getStatus(runId)
        setRunData(res.data)
        if (res.data.status === 'done' || res.data.status === 'error') {
          setPolling(false)
          clearInterval(pollRef.current)
          if (res.data.status === 'done') toast.success('✅ Application ready!')
          else toast.error('Agent encountered an error')
        }
      } catch { setPolling(false); clearInterval(pollRef.current) }
    }, 800)
    return () => clearInterval(pollRef.current)
  }, [polling, runId])

  const reset = () => { setRunId(null); setRunData(null); setPolling(false); setSelectedScheme('') }

  const schemeName = schemes.find(s => s.key === selectedScheme)?.name || ''
  const isDone  = runData?.status === 'done'
  const isError = runData?.status === 'error'
  const result  = runData?.result

  // Merge placeholder steps with live steps
  const displaySteps = ALL_STEPS.map(s => {
    const live = runData?.steps?.find(ls => ls.step_num === s.step_num)
    return { placeholder: s, live }
  })

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'1.25rem' }}>
        <div style={{ width:40, height:40, borderRadius:10, background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Bot size={20} color="white" />
        </div>
        <div>
          <div style={{ fontWeight:700, fontSize:'1rem', color:'white' }}>AI Application Agent</div>
          <div style={{ fontSize:'0.73rem', color:'rgba(255,255,255,0.4)' }}>Autonomously applies to schemes on your behalf</div>
        </div>
        <div style={{ marginLeft:'auto' }}>
          <span className="badge badge-info" style={{ gap:'0.3rem' }}><Zap size={10} />BETA</span>
        </div>
      </div>

      {/* Scheme selector */}
      {!runData && (
        <div style={{ marginBottom:'1rem' }}>
          <label style={{ fontSize:'0.78rem', color:'rgba(255,255,255,0.45)', display:'block', marginBottom:'0.4rem' }}>
            Select Scheme to Apply For
          </label>
          <select className="glass-input" value={selectedScheme} onChange={e => setSelectedScheme(e.target.value)} style={{ marginBottom:'0.85rem' }}>
            <option value="">Choose a government scheme…</option>
            {schemes.map(s => <option key={s.key} value={s.key}>{s.name}</option>)}
          </select>

          {/* How it works */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'0.5rem', marginBottom:'1rem' }}>
            {[
              { icon:<FileText size={13} />, label:'Reads your documents' },
              { icon:<Search size={13} />,   label:'Checks eligibility' },
              { icon:<Sparkles size={13} />, label:'Generates PDF form' },
            ].map((item, i) => (
              <div key={i} style={{ padding:'0.6rem', borderRadius:8, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', textAlign:'center' }}>
                <div style={{ color:'rgba(255,255,255,0.5)', marginBottom:'0.3rem' }}>{item.icon}</div>
                <div style={{ fontSize:'0.68rem', color:'rgba(255,255,255,0.35)' }}>{item.label}</div>
              </div>
            ))}
          </div>

          <button onClick={startAgent} disabled={launching || !selectedScheme} className="glass-btn btn-white" style={{ width:'100%', padding:'0.9rem', fontSize:'0.9rem' }}>
            {launching ? <><Loader size={15} style={{ animation:'spin 0.8s linear infinite' }} /> Launching Agent…</> : <><Bot size={15} /> 🚀 Auto-Apply with AI Agent</>}
          </button>
          {selectedScheme && (
            <p style={{ fontSize:'0.71rem', color:'rgba(255,255,255,0.25)', textAlign:'center', marginTop:'0.5rem' }}>
              Agent will read your OCR documents &amp; profile to fill {schemeName}
            </p>
          )}
        </div>
      )}

      {/* Live Agent Steps */}
      {runData && (
        <div>
          {/* Status bar */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem', padding:'0.7rem 1rem', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10 }}>
            <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
              {polling && <div style={{ width:8,height:8,borderRadius:'50%',background:'#60a5fa',animation:'pulse 1s ease-in-out infinite' }} />}
              {isDone  && <div style={{ width:8,height:8,borderRadius:'50%',background:'#86efac' }} />}
              {isError && <div style={{ width:8,height:8,borderRadius:'50%',background:'#fca5a5' }} />}
              <span style={{ fontSize:'0.8rem', color:'rgba(255,255,255,0.7)', fontWeight:600 }}>
                {polling ? 'Agent running…' : isDone ? 'Completed!' : 'Error occurred'}
              </span>
            </div>
            <button onClick={reset} className="glass-btn btn-ghost" style={{ padding:'0.3rem 0.75rem', fontSize:'0.72rem' }}>
              New Run
            </button>
          </div>

          {/* Steps */}
          <div>
            {displaySteps.map(({ placeholder, live }) => (
              <StepRow key={placeholder.step_num} step={placeholder} liveStep={live} />
            ))}
          </div>

          {/* Result card */}
          {isDone && result && (
            <div className="animate-slide-up" style={{ marginTop:'1rem', padding:'1.25rem', background:'rgba(34,197,94,0.06)', border:'1px solid rgba(34,197,94,0.2)', borderRadius:12 }}>
              <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.85rem' }}>
                <CheckCircle size={18} color="#86efac" />
                <span style={{ fontWeight:700, color:'white', fontSize:'1rem' }}>Application Ready!</span>
              </div>
              <p style={{ fontSize:'0.8rem', color:'rgba(255,255,255,0.55)', marginBottom:'1rem', lineHeight:1.6 }}>
                {result.confirmation_message}
              </p>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.5rem', marginBottom:'1rem' }}>
                <div style={{ padding:'0.65rem', borderRadius:8, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ fontSize:'0.68rem', color:'rgba(255,255,255,0.35)', marginBottom:'0.2rem' }}>Eligibility Score</div>
                  <div style={{ fontSize:'1.1rem', fontWeight:700, color:'#86efac' }}>{result.eligibility_score}/100</div>
                </div>
                <div style={{ padding:'0.65rem', borderRadius:8, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ fontSize:'0.68rem', color:'rgba(255,255,255,0.35)', marginBottom:'0.2rem' }}>Est. Benefit</div>
                  <div style={{ fontSize:'0.8rem', fontWeight:600, color:'white' }}>{result.estimated_benefit || 'As per scheme'}</div>
                </div>
              </div>
              {result.download_url && (
                <a href={`http://localhost:8000${result.download_url}`} target="_blank" rel="noreferrer"
                   className="glass-btn btn-white" style={{ display:'flex', width:'100%', justifyContent:'center', padding:'0.85rem', textDecoration:'none', gap:'0.5rem' }}>
                  <Download size={15} /> Download Application Form
                </a>
              )}
              {result.eligibility_reasons?.length > 0 && (
                <div style={{ marginTop:'0.85rem' }}>
                  <div style={{ fontSize:'0.72rem', color:'rgba(255,255,255,0.35)', marginBottom:'0.35rem' }}>Why You Qualify</div>
                  {result.eligibility_reasons.map((r, i) => (
                    <div key={i} style={{ fontSize:'0.78rem', color:'rgba(255,255,255,0.55)', display:'flex', alignItems:'center', gap:'0.4rem', marginBottom:'0.2rem' }}>
                      <ChevronRight size={11} color="#86efac" />{r}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {isError && (
            <div style={{ marginTop:'0.75rem', padding:'1rem', background:'rgba(239,68,68,0.07)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:10 }}>
              <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.4rem' }}>
                <XCircle size={15} color="#fca5a5" />
                <span style={{ fontSize:'0.85rem', fontWeight:600, color:'#fca5a5' }}>Agent Error</span>
              </div>
              <p style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.4)' }}>{runData.error || 'An error occurred. Please try again.'}</p>
              <button onClick={reset} className="glass-btn btn-ghost" style={{ width:'100%', padding:'0.7rem', marginTop:'0.75rem', fontSize:'0.8rem' }}>
                Try Again
              </button>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes spin  { to{transform:rotate(360deg)} }
      `}</style>
    </div>
  )
}
