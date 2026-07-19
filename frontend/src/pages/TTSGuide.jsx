import { useState, useEffect } from 'react'
import { Volume2, Loader, Globe } from 'lucide-react'
import { ttsAPI, schemesAPI } from '../services/api'
import AudioPlayer from '../components/AudioPlayer'
import toast from 'react-hot-toast'

export default function TTSGuide() {
  const [languages, setLanguages] = useState([])
  const [selectedLang, setSelectedLang] = useState('hindi')
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [audioUrl, setAudioUrl] = useState(null)
  const [schemes, setSchemes] = useState([])
  const [selectedScheme, setSelectedScheme] = useState('')

  useEffect(() => {
    ttsAPI.languages().then(r => setLanguages(r.data || [])).catch(() => {})
    schemesAPI.list({ limit: 30 }).then(r => setSchemes(r.data.schemes || [])).catch(() => {})
  }, [])

  const generate = async () => {
    if (!text.trim()) { toast.error('Enter some text to convert'); return }
    setLoading(true)
    try {
      const res = await ttsAPI.generate(text, selectedLang)
      setAudioUrl(res.data.audio_url)
      toast.success('Audio generated!')
    } catch { toast.error('TTS failed — check backend') }
    setLoading(false)
  }

  const schemeAudio = async () => {
    const scheme = schemes.find(s => s.id === parseInt(selectedScheme))
    if (!scheme) { toast.error('Select a scheme'); return }
    setLoading(true)
    try {
      const res = await ttsAPI.schemeAudio(scheme, selectedLang)
      setAudioUrl(res.data.audio_url)
      setText(res.data.script || '')
      toast.success('Scheme audio ready!')
    } catch { toast.error('TTS failed') }
    setLoading(false)
  }

  const LANG_FLAGS = { hindi:'🇮🇳', bengali:'🇧🇩', odia:'🇮🇳', telugu:'🇮🇳', marathi:'🇮🇳', english:'🇬🇧', tamil:'🇮🇳', kannada:'🇮🇳', gujarati:'🇮🇳', punjabi:'🇮🇳' }

  return (
    <div className="page-container" style={{ maxWidth: 780 }}>
      <h1 className="section-title" style={{ marginBottom:'0.35rem' }}>Voice Guide (TTS)</h1>
      <p className="section-sub" style={{ marginBottom:'2rem' }}>Listen to scheme information in your local language</p>

      {/* Language Selector */}
      <div className="glass-card" style={{ padding:'1.5rem', marginBottom:'1.25rem' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'1rem' }}>
          <Globe size={16} color="rgba(255,255,255,0.6)" />
          <span style={{ fontWeight:600, color:'white', fontSize:'0.9rem' }}>Select Language</span>
        </div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:'0.5rem' }}>
          {languages.map(l => (
            <button key={l.key} onClick={() => setSelectedLang(l.key)} style={{
              padding:'0.45rem 0.9rem', borderRadius:99, fontSize:'0.82rem', fontWeight:600,
              background: selectedLang===l.key ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${selectedLang===l.key ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.08)'}`,
              color: selectedLang===l.key ? 'white' : 'rgba(255,255,255,0.5)',
              cursor:'pointer', transition:'all 0.15s',
            }}>
              {LANG_FLAGS[l.key] || '🌐'} {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* Scheme TTS */}
      <div className="glass-card" style={{ padding:'1.5rem', marginBottom:'1.25rem' }}>
        <div style={{ fontWeight:600, color:'white', marginBottom:'0.75rem', fontSize:'0.9rem' }}>Listen to Scheme Info</div>
        <div style={{ display:'flex', gap:'0.75rem' }}>
          <select className="glass-input" style={{ flex:1 }} value={selectedScheme} onChange={e => setSelectedScheme(e.target.value)}>
            <option value="">Select a scheme...</option>
            {schemes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <button onClick={schemeAudio} disabled={loading || !selectedScheme} className="glass-btn btn-white" style={{ padding:'0.65rem 1.25rem', flexShrink:0 }}>
            {loading ? <Loader size={15} className="animate-spin-slow" /> : <Volume2 size={15} />}
          </button>
        </div>
      </div>

      {/* Custom text TTS */}
      <div className="glass-card" style={{ padding:'1.5rem', marginBottom:'1.25rem' }}>
        <div style={{ fontWeight:600, color:'white', marginBottom:'0.75rem', fontSize:'0.9rem' }}>Custom Text to Speech</div>
        <textarea
          className="glass-input"
          placeholder="Type or paste any text to hear it in your selected language..."
          value={text}
          onChange={e => setText(e.target.value)}
          rows={5}
          style={{ resize:'vertical', fontFamily:'Inter, sans-serif' }}
        />
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'0.75rem' }}>
          <span style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.3)' }}>{text.length}/2000 characters</span>
          <button onClick={generate} disabled={loading || !text.trim()} className="glass-btn btn-white" style={{ padding:'0.65rem 1.5rem', opacity: !text.trim() || loading ? 0.6 : 1 }}>
            {loading ? <><Loader size={15} className="animate-spin-slow" /> Generating...</> : <><Volume2 size={15} /> Generate Audio</>}
          </button>
        </div>
      </div>

      {/* Audio Player */}
      {audioUrl && (
        <div className="animate-slide-up">
          <AudioPlayer src={audioUrl} label={`${languages.find(l => l.key===selectedLang)?.label || 'Audio'} Voice Guide`} />
        </div>
      )}
    </div>
  )
}
