import { useState, useRef, useEffect } from 'react'
import { Play, Pause, Volume2, RotateCcw } from 'lucide-react'

export default function AudioPlayer({ src, label = 'Audio Guide' }) {
  const audioRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)

  useEffect(() => {
    const a = audioRef.current
    if (!a) return
    const onTime = () => setProgress((a.currentTime / a.duration) * 100 || 0)
    const onLoad = () => setDuration(a.duration)
    const onEnd = () => setPlaying(false)
    a.addEventListener('timeupdate', onTime)
    a.addEventListener('loadedmetadata', onLoad)
    a.addEventListener('ended', onEnd)
    return () => { a.removeEventListener('timeupdate', onTime); a.removeEventListener('loadedmetadata', onLoad); a.removeEventListener('ended', onEnd) }
  }, [src])

  const toggle = () => {
    const a = audioRef.current
    if (!a) return
    if (playing) { a.pause(); setPlaying(false) } else { a.play(); setPlaying(true) }
  }

  const restart = () => { const a = audioRef.current; if (!a) return; a.currentTime = 0; a.play(); setPlaying(true) }
  const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`

  return (
    <div style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <audio ref={audioRef} src={src} />
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Volume2 size={16} color="rgba(255,255,255,0.5)" />
        <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'white', flex: 1 }}>{label}</span>
        {duration > 0 && <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>{fmt(duration)}</span>}
      </div>
      <div style={{ width: '100%', height: '3px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${progress}%`, background: 'white', borderRadius: '2px', transition: 'width 0.1s' }} />
      </div>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button onClick={toggle} className="glass-btn btn-white" style={{ flex: 1, padding: '0.5rem', gap: '0.4rem' }}>
          {playing ? <Pause size={15} /> : <Play size={15} />}
          {playing ? 'Pause' : 'Play'}
        </button>
        <button onClick={restart} className="glass-btn btn-ghost" style={{ padding: '0.5rem 0.75rem' }}>
          <RotateCcw size={14} />
        </button>
      </div>
    </div>
  )
}
