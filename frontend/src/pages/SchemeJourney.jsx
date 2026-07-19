import React, { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { journeyAPI } from '../services/api'
import { Map, Play, Pause, ChevronLeft, ChevronRight, Eye, EyeOff, Globe, Loader, CheckCircle, Clock, Star, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const LANG_KEY = { en: 'simple_explanation', hi: 'hindi_text', bn: 'bengali_text' }
const LABEL_COLOR = { Pending: '#888', 'In Review': '#fde047', Approved: '#86efac', Completed: '#4ade80' }
const LABEL_BG = { Pending: 'rgba(255,255,255,0.06)', 'In Review': 'rgba(234,179,8,0.12)', Approved: 'rgba(34,197,94,0.12)', Completed: 'rgba(34,197,94,0.18)' }

function speak(text, lang) {
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = lang === 'hi' ? 'hi-IN' : lang === 'bn' ? 'bn-IN' : 'en-IN'
  u.rate = 0.9
  window.speechSynthesis.speak(u)
}

export default function SchemeJourney() {
  const [params] = useSearchParams()
  const [schemes, setSchemes] = useState([])
  const [selectedId, setSelectedId] = useState(params.get('scheme_id') || '')
  const [journey, setJourney] = useState(null)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [a11y, setA11y] = useState(false)
  const [lang, setLang] = useState('en')
  const [done, setDone] = useState(false)
  const [stepImages, setStepImages] = useState({}) // { stepIndex: { url, loading, error } }
  const requestedRef = React.useRef(new Set())

  useEffect(() => {
    journeyAPI.schemes().then(r => setSchemes(r.data.schemes || [])).catch(() => {})
  }, [])

  useEffect(() => {
    if (params.get('scheme_id') && schemes.length) generate(params.get('scheme_id'))
  }, [schemes])

  const fetchStepImage = async (stepIndex, prompt) => {
    if (requestedRef.current.has(stepIndex)) return
    requestedRef.current.add(stepIndex)
    setStepImages(prev => ({ ...prev, [stepIndex]: { loading: true, url: null, quota: false, error: false } }))
    try {
      const r = await journeyAPI.image(prompt, stepIndex + 1)
      const { image_b64, mime_type, model_used } = r.data
      const url = `data:${mime_type};base64,${image_b64}`
      setStepImages(prev => ({ ...prev, [stepIndex]: { loading: false, url, model_used, quota: false, error: false } }))
    } catch (err) {
      const is429 = err?.response?.status === 429
      setStepImages(prev => ({ ...prev, [stepIndex]: { loading: false, url: null, quota: is429, error: !is429 } }))
    }
  }

  const generate = async (id) => {
    const sid = id || selectedId
    if (!sid) return toast.error('Please select a scheme')
    setLoading(true); setJourney(null); setStep(0); setDone(false); setStepImages({}); requestedRef.current = new Set()
    try {
      const r = await journeyAPI.generate({ scheme_id: parseInt(sid) })
      setJourney(r.data.journey)
      toast.success('Journey generated!')
      // Pre-fetch image for step 0 immediately
      if (r.data.journey?.steps?.[0]) {
        fetchStepImage(0, r.data.journey.steps[0].visual_prompt)
      }
    } catch { toast.error('Failed to generate journey') }
    setLoading(false)
  }

  const cur = journey?.steps?.[step]

  // Fetch image whenever step changes
  useEffect(() => {
    if (cur?.visual_prompt) fetchStepImage(step, cur.visual_prompt)
    // Pre-fetch next step too
    const next = journey?.steps?.[step + 1]
    if (next?.visual_prompt) fetchStepImage(step + 1, next.visual_prompt)
  }, [step, journey])

  const playNarration = useCallback(() => {
    if (!cur) return
    const text = a11y
      ? `${cur.voice_narration}. ${cur.accessibility_description}`
      : cur.voice_narration
    speak(text, lang)
    setPlaying(true)
    setTimeout(() => setPlaying(false), 6000)
  }, [cur, a11y, lang])

  useEffect(() => {
    if (a11y && cur) playNarration()
  }, [step, a11y])

  const next = () => {
    if (step < (journey?.steps?.length || 1) - 1) setStep(s => s + 1)
    else setDone(true)
  }
  const prev = () => { setDone(false); setStep(s => Math.max(0, s - 1)) }

  useEffect(() => {
    const handler = e => {
      if (e.key === 'ArrowRight') next()
      if (e.key === 'ArrowLeft') prev()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [step, journey])

  const ov = journey?.overview
  const total = journey?.steps?.length || 0
  const pct = total ? Math.round(((step + 1) / total) * 100) : 0

  return (
    <div className="page-container animate-fade-in" style={{ maxWidth: 900 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
        <div style={{ width: 36, height: 36, background: 'white', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Map size={18} color="black" />
        </div>
        <h1 className="section-title">Scheme Journey</h1>
      </div>
      <p className="section-sub" style={{ marginBottom: '2rem' }}>Voice-guided, step-by-step visual journey — accessible for every farmer</p>

      {/* Scheme Selector */}
      {!journey && (
        <div className="glass-card" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-3)', marginBottom: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Select a Government Scheme</div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <select
              className="glass-input"
              value={selectedId}
              onChange={e => setSelectedId(e.target.value)}
              style={{ flex: 1, minWidth: 220 }}
              aria-label="Select scheme"
            >
              <option value="">— Choose a scheme —</option>
              {schemes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <button
              id="generate-journey-btn"
              className="glass-btn btn-white"
              onClick={() => generate()}
              disabled={loading || !selectedId}
              style={{ padding: '0.75rem 1.75rem', minWidth: 170 }}
            >
              {loading ? <><Loader size={15} className="animate-spin-slow" /> Generating...</> : <><Map size={15} /> Generate Journey</>}
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <Loader size={36} className="animate-spin-slow" style={{ margin: '0 auto 1rem', display: 'block', color: 'rgba(255,255,255,0.4)' }} />
          <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>AI is crafting your journey...</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>Generating voice narrations, visual scenes & accessibility descriptions</div>
        </div>
      )}

      {journey && !loading && (
        <>
          {/* Overview */}
          <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Star size={14} color="#fde047" />
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#fde047', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Scheme Overview</span>
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'white', marginBottom: '0.25rem' }}>{ov?.scheme_name}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-2)', marginBottom: '0.75rem' }}>{ov?.purpose}</div>
                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                  <div><div style={{ fontSize: '0.65rem', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>Benefits</div><div style={{ fontSize: '0.82rem', color: '#86efac', fontWeight: 600 }}>{ov?.benefits}</div></div>
                  <div><div style={{ fontSize: '0.65rem', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>Timeline</div><div style={{ fontSize: '0.82rem', color: '#c4b5fd', fontWeight: 600 }}><Clock size={11} style={{ display: 'inline', marginRight: 4 }} />{ov?.estimated_timeline}</div></div>
                  <div><div style={{ fontSize: '0.65rem', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>Eligibility</div><div style={{ fontSize: '0.82rem', color: 'var(--text-2)' }}>{ov?.eligibility_summary}</div></div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0, alignItems: 'center' }}>
                {/* Lang switcher */}
                <button title="English" onClick={() => setLang('en')} style={{ padding: '0.4rem 0.75rem', borderRadius: 8, border: lang === 'en' ? '1.5px solid white' : '1px solid rgba(255,255,255,0.15)', background: lang === 'en' ? 'rgba(255,255,255,0.12)' : 'transparent', color: 'white', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>EN</button>
                <button title="हिन्दी" onClick={() => setLang('hi')} style={{ padding: '0.4rem 0.75rem', borderRadius: 8, border: lang === 'hi' ? '1.5px solid white' : '1px solid rgba(255,255,255,0.15)', background: lang === 'hi' ? 'rgba(255,255,255,0.12)' : 'transparent', color: 'white', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>HI</button>
                <button title="বাংলা" onClick={() => setLang('bn')} style={{ padding: '0.4rem 0.75rem', borderRadius: 8, border: lang === 'bn' ? '1.5px solid white' : '1px solid rgba(255,255,255,0.15)', background: lang === 'bn' ? 'rgba(255,255,255,0.12)' : 'transparent', color: 'white', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>BN</button>
                <button title={a11y ? 'Disable Accessibility Mode' : 'Enable Accessibility Mode'} onClick={() => setA11y(v => !v)} style={{ padding: '0.4rem 0.75rem', borderRadius: 8, border: a11y ? '1.5px solid #86efac' : '1px solid rgba(255,255,255,0.15)', background: a11y ? 'rgba(34,197,94,0.12)' : 'transparent', color: a11y ? '#86efac' : 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                  {a11y ? <><Eye size={12} /> A11Y ON</> : <><EyeOff size={12} /> A11Y</>}
                </button>
                <button onClick={() => { setJourney(null); setStep(0); setDone(false) }} style={{ padding: '0.4rem 0.75rem', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '0.72rem' }}>← Back</button>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: `${done ? 100 : pct}%`, height: '100%', background: 'linear-gradient(90deg, rgba(255,255,255,0.5), white)', borderRadius: 3, transition: 'width 0.5s ease' }} />
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-3)', fontWeight: 600, flexShrink: 0 }}>{done ? '100%' : `${pct}%`}</span>
          </div>

          {/* Step Indicators */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
            {journey.steps.map((s, i) => (
              <button
                key={i}
                onClick={() => { setStep(i); setDone(false) }}
                aria-label={`Step ${i + 1}: ${s.step_title}`}
                style={{
                  flexShrink: 0, width: 34, height: 34, borderRadius: '50%',
                  border: i === step && !done ? '2px solid white' : i < step || done ? '2px solid #86efac' : '1.5px solid rgba(255,255,255,0.18)',
                  background: i === step && !done ? 'white' : i < step || done ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.05)',
                  color: i === step && !done ? 'black' : i < step || done ? '#86efac' : 'rgba(255,255,255,0.45)',
                  cursor: 'pointer', fontSize: '0.78rem', fontWeight: 800, transition: 'all 0.25s',
                }}
              >
                {i < step || done ? <CheckCircle size={14} /> : i + 1}
              </button>
            ))}
          </div>

          {/* Step Card */}
          {!done && cur && (
            <div className="glass-card animate-slide-up" key={step} style={{ padding: '2rem', marginBottom: '1.5rem' }}>
              {/* Step header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: '1rem', fontWeight: 900, color: 'black' }}>{cur.step_number}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.2rem' }}>Step {cur.step_number} of {total}</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'white' }}>{cur.step_title}</div>
                </div>
                <span style={{ padding: '0.35rem 0.85rem', borderRadius: 99, fontSize: '0.7rem', fontWeight: 700, background: LABEL_BG[cur.progress_label] || 'rgba(255,255,255,0.06)', color: LABEL_COLOR[cur.progress_label] || '#888', border: `1px solid ${LABEL_COLOR[cur.progress_label]}30`, letterSpacing: '0.05em' }}>
                  {cur.progress_label}
                </span>
              </div>

              {/* Visual Scene — real AI-generated image */}
              {(() => {
                const img = stepImages[step]

                // 1. Loading state
                if (img?.loading) return (
                  <div style={{ borderRadius: 14, marginBottom: '1.5rem', height: 200, background: 'linear-gradient(135deg, rgba(30,20,10,0.9), rgba(10,20,30,0.9))', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                    <div style={{ width: 36, height: 36, border: '3px solid rgba(255,200,80,0.25)', borderTopColor: 'rgba(255,200,80,0.9)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    <div style={{ fontSize: '0.78rem', color: 'rgba(255,200,80,0.75)', fontWeight: 600 }}>Generating scene with AI...</div>
                    <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.06em' }}>nano-banana-pro-preview</div>
                  </div>
                )

                // 2. Real image from AI
                if (img?.url) return (
                  <div style={{ borderRadius: 14, marginBottom: '1.5rem', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.12)', position: 'relative' }}>
                    <img
                      src={img.url}
                      alt={cur.accessibility_description}
                      style={{ width: '100%', display: 'block', maxHeight: 300, objectFit: 'cover', borderRadius: 14 }}
                    />
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0.6rem 0.85rem', background: 'linear-gradient(transparent, rgba(0,0,0,0.8))', borderRadius: '0 0 14px 14px' }}>
                      <span style={{ fontSize: '0.6rem', color: 'rgba(255,200,80,0.9)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>🎨 {img.model_used || 'nano-banana-pro-preview'}</span>
                    </div>
                  </div>
                )

                // 3. Quota exhausted — beautiful cinematic scene card
                if (img?.quota) return (
                  <div style={{ borderRadius: 14, marginBottom: '1.5rem', overflow: 'hidden', position: 'relative', minHeight: 190, background: 'linear-gradient(135deg, #0d1b0d 0%, #0a1020 40%, #1a0d10 100%)', border: '1px solid rgba(255,200,80,0.15)' }}>
                    {/* Animated gradient orbs */}
                    <div style={{ position: 'absolute', top: -30, left: -30, width: 140, height: 140, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,200,80,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
                    <div style={{ position: 'absolute', bottom: -20, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle, rgba(80,200,255,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
                    <div style={{ position: 'absolute', top: 10, right: 12 }}>
                      <span style={{ padding: '0.25rem 0.6rem', borderRadius: 99, fontSize: '0.6rem', fontWeight: 700, background: 'rgba(234,179,8,0.12)', color: '#fde047', border: '1px solid rgba(234,179,8,0.2)', letterSpacing: '0.06em' }}>⚡ QUOTA LIMIT</span>
                    </div>
                    <div style={{ padding: '1.5rem', position: 'relative', zIndex: 1 }}>
                      <div style={{ fontSize: '2rem', marginBottom: '0.6rem' }}>
                        {['🌾', '🌻', '🏡', '🚜', '💧', '☀️', '🌱'][step % 7]}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'rgba(255,200,80,0.6)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>🎬 Visual Scene Description</div>
                      <div style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.82)', lineHeight: 1.65, fontStyle: 'italic' }}>{cur.visual_prompt}</div>
                      <div style={{ marginTop: '0.85rem', fontSize: '0.68rem', color: 'rgba(255,255,255,0.3)' }}>Image generation quota reached — scene shown as description</div>
                    </div>
                  </div>
                )

                // 4. Generic fallback (null state before fetch starts)
                return (
                  <div style={{ borderRadius: 14, overflow: 'hidden', marginBottom: '1.5rem', background: 'linear-gradient(135deg, rgba(30,20,10,0.9) 0%, rgba(10,20,30,0.9) 100%)', border: '1px solid rgba(255,255,255,0.1)', padding: '1.25rem', position: 'relative', minHeight: 90 }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(135deg, rgba(255,200,80,0.05) 0%, rgba(80,200,255,0.05) 100%)', pointerEvents: 'none', borderRadius: 14 }} />
                    <div style={{ fontSize: '0.6rem', color: 'rgba(255,200,80,0.7)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>🎬 Scene Visual</div>
                    <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, fontStyle: 'italic' }}>{cur.visual_prompt}</div>
                  </div>
                )
              })()}


              {/* Explanation */}
              <div style={{ fontSize: a11y ? '1.1rem' : '1rem', lineHeight: 1.75, color: 'white', fontWeight: 500, marginBottom: '1.25rem', padding: '1rem 1.25rem', background: 'rgba(255,255,255,0.04)', borderRadius: 10, borderLeft: '3px solid rgba(255,255,255,0.2)' }}>
                {cur[LANG_KEY[lang]] || cur.simple_explanation}
              </div>

              {/* Accessibility Description */}
              {a11y && (
                <div style={{ fontSize: '0.88rem', color: '#86efac', lineHeight: 1.65, marginBottom: '1.25rem', padding: '0.875rem 1.1rem', background: 'rgba(34,197,94,0.07)', borderRadius: 10, border: '1px solid rgba(34,197,94,0.15)' }} aria-live="polite">
                  <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.35rem', color: '#4ade80' }}>♿ Scene Description</div>
                  {cur.accessibility_description}
                </div>
              )}

              {/* Animation hint */}
              <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.9em' }}>✨</span> {cur.animation_description}
              </div>

              {/* User action */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1.1rem', background: 'rgba(255,255,255,0.05)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', marginBottom: '1.5rem' }}>
                <CheckCircle size={16} color="#86efac" />
                <div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.15rem' }}>Your Action</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'white' }}>{cur.user_action}</div>
                </div>
              </div>

              {/* Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button id="prev-step-btn" onClick={prev} disabled={step === 0} className="glass-btn btn-ghost" style={{ padding: '0.65rem 1.25rem' }} aria-label="Previous step">
                  <ChevronLeft size={16} /> Prev
                </button>
                <button
                  id="play-narration-btn"
                  onClick={playNarration}
                  className="glass-btn"
                  style={{ flex: 1, background: playing ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.08)', border: `1px solid ${playing ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.12)'}`, color: playing ? '#86efac' : 'white', padding: '0.65rem', transition: 'all 0.2s' }}
                  aria-label="Play voice narration"
                >
                  {playing ? <><Pause size={15} /> Playing...</> : <><Play size={15} /> Play Voice Narration</>}
                </button>
                <button id="next-step-btn" onClick={next} className="glass-btn btn-white" style={{ padding: '0.65rem 1.25rem' }} aria-label="Next step">
                  {step === total - 1 ? 'Finish' : 'Next'} <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Final Summary */}
          {done && journey.journey_summary && (
            <div className="glass-card animate-slide-up" style={{ padding: '2rem', marginBottom: '1.5rem', border: '1px solid rgba(134,239,172,0.2)', background: 'rgba(34,197,94,0.04)' }}>
              <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🎉</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'white', marginBottom: '0.5rem' }}>Journey Complete!</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-2)', lineHeight: 1.6 }}>{journey.journey_summary.full_summary}</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="glass-card-md" style={{ padding: '1rem' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.4rem' }}><Clock size={10} style={{ display: 'inline', marginRight: 4 }} />Approval Timeline</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#c4b5fd' }}>{journey.journey_summary.approval_timeline}</div>
                </div>
                <div className="glass-card-md" style={{ padding: '1rem' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.4rem' }}>Total Steps</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#86efac' }}>{total} steps completed ✓</div>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><AlertCircle size={11} /> Common Mistakes to Avoid</div>
                {journey.journey_summary.common_mistakes?.map((m, i) => (
                  <div key={i} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <span style={{ color: '#fca5a5', marginTop: 2, flexShrink: 0 }}>⚠</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-2)', lineHeight: 1.5 }}>{m}</span>
                  </div>
                ))}
              </div>

              <div style={{ padding: '1.25rem', background: 'rgba(34,197,94,0.08)', borderRadius: 12, border: '1px solid rgba(34,197,94,0.2)', textAlign: 'center', fontSize: '0.95rem', lineHeight: 1.7, color: '#86efac', fontWeight: 500 }}>
                {journey.journey_summary.encouraging_message}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button onClick={() => { setStep(0); setDone(false) }} className="glass-btn btn-ghost" style={{ flex: 1, padding: '0.75rem' }}>
                  <ChevronLeft size={15} /> Review Steps
                </button>
                <button onClick={() => { setJourney(null); setStep(0); setDone(false) }} className="glass-btn btn-white" style={{ flex: 1, padding: '0.75rem' }}>
                  <Map size={15} /> New Journey
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
