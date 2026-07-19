import { useNavigate } from 'react-router-dom'
import { Map } from 'lucide-react'

export default function SchemeJourneyCard({ scheme }) {
  const nav = useNavigate()
  return (
    <button
      id={`start-journey-${scheme.id}`}
      onClick={() => nav(`/journey?scheme_id=${scheme.id}`)}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        padding: '0.55rem 1rem', borderRadius: 9,
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.13)',
        color: 'white', cursor: 'pointer',
        fontSize: '0.78rem', fontWeight: 600,
        transition: 'all 0.2s', whiteSpace: 'nowrap'
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
      aria-label={`Start step-by-step journey for ${scheme.name}`}
      title="Launch voice-guided journey"
    >
      <Map size={13} />
      Start Journey
    </button>
  )
}
