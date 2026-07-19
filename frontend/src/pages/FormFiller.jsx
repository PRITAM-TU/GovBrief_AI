import { useState, useEffect } from 'react'
import { FileEdit, Loader, Download, AlertTriangle, CheckCircle, Wand2 } from 'lucide-react'
import { formsAPI, schemesAPI, agentAPI } from '../services/api'
import AgentRunner from '../components/AgentRunner'
import toast from 'react-hot-toast'

export default function FormFiller() {
  const [templates, setTemplates]       = useState([])
  const [schemes, setSchemes]           = useState([])
  const [agentSchemes, setAgentSchemes] = useState([])
  const [selected, setSelected]         = useState('')
  const [format, setFormat]             = useState('pdf')
  const [loading, setLoading]           = useState(false)
  const [generatedFile, setGeneratedFile] = useState(null)
  const [manualData, setManualData]     = useState({
    name:'', phone:'', state:'', district:'', land_area:'',
    crop_types:'', id_number:'', bank_account:'', ifsc_code:''
  })
  const [analysis, setAnalysis]         = useState(null)
  const [analyzing, setAnalyzing]       = useState(false)
  const [selectedScheme, setSelectedScheme] = useState('')

  useEffect(() => {
    formsAPI.templates().then(r => setTemplates(r.data || [])).catch(() => {})
    schemesAPI.list({ limit:30 }).then(r => setSchemes(r.data.schemes || [])).catch(() => {})
    agentAPI.schemes().then(r => setAgentSchemes(r.data || [])).catch(() => {})
  }, [])

  const upd = (k, v) => setManualData(d => ({ ...d, [k]:v }))

  const autoFill = async () => {
    if (!selected) { toast.error('Select a form template first'); return }
    setLoading(true)
    try {
      const res = await formsAPI.autoFill(selected, format)
      setGeneratedFile(res.data)
      toast.success('Form auto-filled from your documents!')
    } catch { toast.error('Auto-fill failed. Fill manually below.') }
    setLoading(false)
  }

  const generate = async () => {
    if (!selected) { toast.error('Select a form template'); return }
    setLoading(true)
    try {
      const res = await formsAPI.generate({ form_type:selected, data:manualData, format })
      setGeneratedFile(res.data)
      toast.success('Form generated! Ready to download.')
    } catch (err) { toast.error(err?.response?.data?.detail || 'Generation failed') }
    setLoading(false)
  }

  const analyzeRejection = async () => {
    if (!selectedScheme) { toast.error('Select a scheme to analyze against'); return }
    setAnalyzing(true)
    try {
      const res = await formsAPI.analyzeRejection({ scheme_id:parseInt(selectedScheme), application_data:manualData })
      setAnalysis(res.data)
    } catch { toast.error('Analysis failed') }
    setAnalyzing(false)
  }

  return (
    <div className="page-container">
      <h1 className="section-title" style={{ marginBottom:'0.35rem' }}>Smart Form Filler</h1>
      <p className="section-sub" style={{ marginBottom:'2rem' }}>
        Auto-fill government forms — or let the AI Agent apply for you autonomously
      </p>

      {/* ── TOP: AI Agent Section ────────────────────────────────────────── */}
      <div className="glass-card" style={{
        padding:'1.75rem', marginBottom:'2rem',
        background:'rgba(255,255,255,0.03)',
        borderColor:'rgba(255,255,255,0.12)',
        position:'relative', overflow:'hidden'
      }}>
        {/* Decorative glow */}
        <div style={{
          position:'absolute', top:-60, right:-60, width:200, height:200,
          background:'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)',
          pointerEvents:'none', borderRadius:'50%'
        }} />
        <AgentRunner schemes={agentSchemes} />
      </div>

      {/* ── Divider ──────────────────────────────────────────────────────── */}
      <div style={{ display:'flex', alignItems:'center', gap:'1rem', marginBottom:'2rem' }}>
        <div className="divider" />
        <span style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.25)', whiteSpace:'nowrap', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase' }}>
          Or Fill Manually
        </span>
        <div className="divider" />
      </div>

      {/* ── BOTTOM: Manual Form Filler ───────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem', alignItems:'start' }}>
        {/* Left column */}
        <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
          <div className="glass-card" style={{ padding:'1.5rem' }}>
            <div style={{ marginBottom:'1rem' }}>
              <label style={{ fontSize:'0.8rem', color:'rgba(255,255,255,0.5)', display:'block', marginBottom:'0.4rem' }}>Form Template</label>
              <select className="glass-input" value={selected} onChange={e => setSelected(e.target.value)}>
                <option value="">Select a form…</option>
                {templates.map(t => <option key={t.key} value={t.key}>{t.name}</option>)}
              </select>
            </div>
            <div style={{ marginBottom:'1rem' }}>
              <label style={{ fontSize:'0.8rem', color:'rgba(255,255,255,0.5)', display:'block', marginBottom:'0.4rem' }}>Output Format</label>
              <div style={{ display:'flex', gap:'0.5rem' }}>
                {['docx','pdf'].map(f => (
                  <button key={f} onClick={() => setFormat(f)} className="glass-btn" style={{
                    flex:1, padding:'0.5rem',
                    background: format===f ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)',
                    border:`1px solid ${format===f ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)'}`,
                    color:'white', fontSize:'0.82rem', fontWeight: format===f ? 700 : 400
                  }}>{f.toUpperCase()}</button>
                ))}
              </div>
            </div>
            <button onClick={autoFill} disabled={loading} className="glass-btn btn-white" style={{ width:'100%', padding:'0.875rem', marginBottom:'0.5rem' }}>
              {loading ? <Loader size={15} className="animate-spin-slow" /> : <Wand2 size={15} />} Auto-Fill from My Documents
            </button>
            <p style={{ fontSize:'0.72rem', color:'rgba(255,255,255,0.3)', textAlign:'center' }}>Uses your scanned OCR documents</p>
          </div>

          <div className="glass-card" style={{ padding:'1.5rem' }}>
            <div style={{ fontSize:'0.8rem', fontWeight:600, color:'white', marginBottom:'1rem' }}>Manual Data Entry</div>
            {[
              ['name','Full Name'],['phone','Mobile Number'],['id_number','Aadhaar/ID Number'],
              ['state','State'],['district','District'],['land_area','Land Area (acres)'],
              ['crop_types','Crop Types'],['bank_account','Bank Account'],['ifsc_code','IFSC Code']
            ].map(([k,l]) => (
              <div key={k} style={{ marginBottom:'0.6rem' }}>
                <label style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.4)', display:'block', marginBottom:'0.3rem' }}>{l}</label>
                <input className="glass-input" placeholder={l} value={manualData[k]} onChange={e => upd(k, e.target.value)} />
              </div>
            ))}
            <button onClick={generate} disabled={loading} className="glass-btn btn-ghost" style={{ width:'100%', padding:'0.8rem', marginTop:'0.5rem' }}>
              <FileEdit size={15} /> Generate Form
            </button>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
          {generatedFile && (
            <div className="glass-card animate-slide-up" style={{ padding:'1.5rem' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'1rem' }}>
                <CheckCircle size={18} color="#86efac" />
                <span style={{ fontWeight:700, color:'white', fontSize:'1rem' }}>Form Ready!</span>
              </div>
              <div style={{ fontSize:'0.85rem', color:'rgba(255,255,255,0.6)', marginBottom:'1rem', wordBreak:'break-all' }}>
                {generatedFile.filename}
              </div>
              <a href={generatedFile.download_url} download className="glass-btn btn-white" style={{ display:'inline-flex', width:'100%', justifyContent:'center', padding:'0.875rem', textDecoration:'none' }}>
                <Download size={16} /> Download {format.toUpperCase()}
              </a>
              {generatedFile.prefilled_fields && (
                <div style={{ marginTop:'1rem', fontSize:'0.78rem', color:'rgba(255,255,255,0.4)' }}>
                  Auto-filled: {generatedFile.prefilled_fields.join(', ')}
                </div>
              )}
            </div>
          )}

          {/* Rejection Analyzer */}
          <div className="glass-card" style={{ padding:'1.5rem' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'1rem' }}>
              <AlertTriangle size={16} color="rgba(255,255,255,0.6)" />
              <span style={{ fontWeight:700, color:'white', fontSize:'0.9rem' }}>AI Rejection Analyzer</span>
            </div>
            <select className="glass-input" style={{ marginBottom:'0.75rem' }} value={selectedScheme} onChange={e => setSelectedScheme(e.target.value)}>
              <option value="">Select scheme to check against…</option>
              {schemes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <button onClick={analyzeRejection} disabled={analyzing} className="glass-btn btn-ghost" style={{ width:'100%', padding:'0.8rem' }}>
              {analyzing ? <Loader size={15} className="animate-spin-slow" /> : <AlertTriangle size={15} />} Analyze Rejection Risk
            </button>
            {analysis && (
              <div style={{ marginTop:'1rem', display:'flex', flexDirection:'column', gap:'0.75rem' }} className="animate-slide-up">
                <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
                  <div style={{ fontSize:'1.5rem', fontWeight:800, color: analysis.risk_level==='low'?'#86efac':analysis.risk_level==='medium'?'#fde047':'#fca5a5' }}>
                    {analysis.overall_score}%
                  </div>
                  <div>
                    <div style={{ fontSize:'0.8rem', fontWeight:700, color:'white' }}>Application Score</div>
                    <span className={`badge badge-${analysis.risk_level==='low'?'success':analysis.risk_level==='medium'?'warning':'danger'}`}>
                      {analysis.risk_level?.toUpperCase()} RISK
                    </span>
                  </div>
                </div>
                {analysis.missing_documents?.length > 0 && (
                  <div>
                    <div style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.4)', marginBottom:'0.35rem' }}>Missing Documents</div>
                    {analysis.missing_documents.map((d,i) => (
                      <div key={i} style={{ fontSize:'0.8rem', color:'#fca5a5', display:'flex', alignItems:'center', gap:'0.4rem' }}>⚠ {d}</div>
                    ))}
                  </div>
                )}
                {analysis.recommendations?.length > 0 && (
                  <div>
                    <div style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.4)', marginBottom:'0.35rem' }}>Recommendations</div>
                    {analysis.recommendations.slice(0,3).map((r,i) => (
                      <div key={i} style={{ fontSize:'0.8rem', color:'#86efac', display:'flex', alignItems:'center', gap:'0.4rem' }}>✓ {r}</div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
