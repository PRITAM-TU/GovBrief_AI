import { Calendar, ExternalLink, Volume2 } from 'lucide-react'
import { useState } from 'react'
import { ttsAPI } from '../services/api'
import toast from 'react-hot-toast'
import SchemeJourneyCard from './SchemeJourneyCard'

export default function SchemeCard({ scheme, onAudio }) {
  const [audioUrl, setAudioUrl] = useState(null)
  const [loadingAudio, setLoadingAudio] = useState(false)

  const urgencyColor = () => {
    if (!scheme.deadline) return null
    const days = Math.ceil((new Date(scheme.deadline) - new Date()) / 86400000)
    if (days <= 5) return '#fca5a5'
    if (days <= 15) return '#fde047'
    return '#86efac'
  }

  const handleAudio = async () => {
    if (audioUrl) { new Audio(audioUrl).play(); return }
    setLoadingAudio(true)
    try {
      const res = await ttsAPI.schemeAudio(scheme, 'hindi')
      const url = res.data.audio_url
      setAudioUrl(url)
      new Audio(url).play()
    } catch { toast.error('Audio not available') }
    finally { setLoadingAudio(false) }
  }

  return (
    <div className="glass-card animate-slide-up" style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '0.75rem' }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'white', marginBottom: '0.25rem', lineHeight: 1.3 }}>
            {scheme.name}
          </h3>
          {scheme.short_name && (
            <span className="badge badge-white" style={{ marginBottom: '0.5rem', display: 'inline-flex' }}>{scheme.short_name}</span>
          )}
        </div>
        {scheme.subsidy_amount && (
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.1rem' }}>Subsidy</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'white' }}>{scheme.subsidy_amount}</div>
          </div>
        )}
      </div>

      <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, marginBottom: '1rem' }}>
        {scheme.description?.slice(0, 150)}{scheme.description?.length > 150 ? '...' : ''}
      </p>

      {/* Benefits */}
      <div style={{ marginBottom: '0.75rem', padding: '0.75rem', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>Benefits</div>
        <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.8)' }}>{scheme.benefits?.slice(0, 120)}</div>
      </div>

      {/* Documents */}
      {scheme.documents_needed && (
        <div style={{ marginBottom: '0.75rem' }}>
          <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>Documents Needed</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
            {scheme.documents_needed.split(',').slice(0, 4).map((doc, i) => (
              <span key={i} style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem', borderRadius: '99px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}>
                {doc.trim()}
              </span>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        {scheme.deadline ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: urgencyColor() || 'rgba(255,255,255,0.5)' }}>
            <Calendar size={13} />
            {new Date(scheme.deadline).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </div>
        ) : (
          <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.3)' }}>No deadline</div>
        )}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <SchemeJourneyCard scheme={scheme} />
          <button onClick={handleAudio} disabled={loadingAudio} className="glass-btn btn-ghost" style={{ padding: '0.4rem 0.7rem', fontSize: '0.78rem', gap: '0.3rem' }}>
            <Volume2 size={13} /> {loadingAudio ? '...' : 'Listen'}
          </button>
          {scheme.apply_url && (
            <a href={scheme.apply_url} target="_blank" rel="noopener noreferrer" className="glass-btn btn-white" style={{ padding: '0.4rem 0.9rem', fontSize: '0.78rem', gap: '0.3rem', textDecoration: 'none' }}>
              Apply <ExternalLink size={12} />
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
