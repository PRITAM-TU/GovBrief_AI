import { useState, useEffect, useRef } from 'react'
import { MessageCircle, X, Send, Mic, MicOff, Globe, ChevronDown, Loader, Bot, Sparkles } from 'lucide-react'
import useStore from '../store/useStore'
import API from '../services/api'

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'hi', label: 'हिंदी', flag: '🇮🇳' },
  { code: 'bn', label: 'বাংলা', flag: '🇧🇩' },
  { code: 'te', label: 'తెలుగు', flag: '🌿' },
  { code: 'mr', label: 'मराठी', flag: '🌾' },
  { code: 'ta', label: 'தமிழ்', flag: '🌻' },
  { code: 'or', label: 'ଓଡ଼ିଆ', flag: '🌿' },
]

const STARTER_QUESTIONS = [
  'PM-KISAN में कैसे register करें?',
  'What docs for crop insurance?',
  'Solar pump subsidy eligibility?',
  'Kisan Credit Card apply kaise karein?',
]

export default function FloatingChatbot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [language, setLanguage] = useState('en')
  const [langOpen, setLangOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [listening, setListening] = useState(false)
  const [showStarters, setShowStarters] = useState(true)
  const [unread, setUnread] = useState(0)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const recognitionRef = useRef(null)

  const user = useStore((s) => s.user)
  const isAuthenticated = useStore((s) => s.isAuthenticated)

  // Scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 200)
      setUnread(0)
    }
  }, [open])

  // Setup Web Speech API
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) return
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SR()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = language === 'hi' ? 'hi-IN' : language === 'bn' ? 'bn-IN' : 'en-IN'
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript
      setInput(transcript)
      setListening(false)
    }
    recognition.onerror = () => setListening(false)
    recognition.onend = () => setListening(false)
    recognitionRef.current = recognition
  }, [language])

  const toggleVoice = () => {
    if (!recognitionRef.current) return
    if (listening) {
      recognitionRef.current.stop()
      setListening(false)
    } else {
      recognitionRef.current.start()
      setListening(true)
    }
  }

  const sendMessage = async (text) => {
    const msg = (text || input).trim()
    if (!msg || loading) return

    setInput('')
    setShowStarters(false)
    setLoading(true)

    const userMsg = { role: 'user', content: msg, timestamp: new Date() }
    setMessages(prev => [...prev, userMsg])

    try {
      const farmerProfile = user ? {
        name: user.name,
        state: user.state,
        district: user.district,
        land_size: user.land_size,
        crop_types: user.crop_types,
        farmer_category: user.farmer_category,
      } : {}

      const res = await API.post('/chatbot/chat', {
        message: msg,
        history: messages.slice(-8).map(m => ({ role: m.role, content: m.content })),
        language,
        farmer_profile: farmerProfile,
      })

      const aiMsg = {
        role: 'assistant',
        content: res.data.reply,
        sources: res.data.sources || [],
        suggested_questions: res.data.suggested_questions || [],
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, aiMsg])

      if (!open) setUnread(n => n + 1)
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I\'m having trouble connecting. Please try again in a moment.',
        sources: [],
        suggested_questions: [],
        timestamp: new Date(),
      }])
    }
    setLoading(false)
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const formatTime = (d) => d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })

  if (!isAuthenticated) return null

  return (
    <>
      {/* ── Floating Bubble ─────────────────────────────────────────── */}
      <button
        onClick={() => setOpen(o => !o)}
        id="chatbot-bubble"
        style={{
          position: 'fixed', bottom: 28, right: 28, zIndex: 9999,
          width: 58, height: 58, borderRadius: '50%',
          background: 'white', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 0 0 rgba(255,255,255,0.3)',
          animation: open ? 'none' : 'chatPulse 2.5s ease-in-out infinite',
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.7), 0 0 0 4px rgba(255,255,255,0.15)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.6)' }}
      >
        {open ? <X size={22} color="black" /> : <MessageCircle size={22} color="black" />}
        {unread > 0 && !open && (
          <span style={{
            position: 'absolute', top: -4, right: -4,
            background: '#86efac', color: 'black', borderRadius: '50%',
            width: 20, height: 20, fontSize: '0.7rem', fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>{unread}</span>
        )}
      </button>

      {/* ── Chat Window ─────────────────────────────────────────────── */}
      <div style={{
        position: 'fixed', bottom: 98, right: 28, zIndex: 9998,
        width: 380, height: 580, borderRadius: 20,
        background: 'rgba(8,8,8,0.97)',
        backdropFilter: 'blur(30px) saturate(180%)',
        border: '1px solid rgba(255,255,255,0.12)',
        boxShadow: '0 24px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        transformOrigin: 'bottom right',
        transform: open ? 'scale(1)' : 'scale(0.85)',
        opacity: open ? 1 : 0,
        pointerEvents: open ? 'all' : 'none',
        transition: 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1), opacity 0.2s ease',
      }}>

        {/* Header */}
        <div style={{
          padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          background: 'rgba(255,255,255,0.03)',
        }}>
          <div style={{
            width: 38, height: 38, borderRadius: '50%',
            background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Bot size={18} color="black" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'white', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              GovBrief AI <Sparkles size={12} color="#86efac" />
            </div>
            <div style={{ fontSize: '0.72rem', color: '#86efac', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#86efac', animation: 'pulse 2s infinite' }} />
              Policy Assistant · 24/7 Online
            </div>
          </div>

          {/* Language selector */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setLangOpen(o => !o)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.3rem',
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8, padding: '0.35rem 0.6rem', cursor: 'pointer', color: 'white',
                fontSize: '0.75rem', fontWeight: 600,
              }}
            >
              <Globe size={12} />
              {LANGUAGES.find(l => l.code === language)?.flag}
              <ChevronDown size={10} />
            </button>
            {langOpen && (
              <div style={{
                position: 'absolute', top: '110%', right: 0, zIndex: 10,
                background: 'rgba(12,12,12,0.98)', border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 10, overflow: 'hidden', minWidth: 130,
                boxShadow: '0 12px 40px rgba(0,0,0,0.7)',
              }}>
                {LANGUAGES.map(l => (
                  <button
                    key={l.code}
                    onClick={() => { setLanguage(l.code); setLangOpen(false) }}
                    style={{
                      width: '100%', textAlign: 'left', padding: '0.55rem 0.85rem',
                      background: language === l.code ? 'rgba(255,255,255,0.08)' : 'transparent',
                      border: 'none', cursor: 'pointer', color: 'white', fontSize: '0.8rem',
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                    }}
                  >
                    <span>{l.flag}</span> {l.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

          {/* Welcome */}
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', padding: '1.5rem 0.5rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🌾</div>
              <div style={{ fontWeight: 700, color: 'white', marginBottom: '0.4rem', fontSize: '0.95rem' }}>
                Namaste{user?.name ? `, ${user.name.split(' ')[0]}` : ''}!
              </div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
                Ask me anything about government agricultural schemes, subsidies, or policies in your language.
              </div>
            </div>
          )}

          {/* Starter chips */}
          {showStarters && messages.length === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                Suggested Questions
              </div>
              {STARTER_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(q)}
                  style={{
                    textAlign: 'left', padding: '0.6rem 0.9rem',
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 10, cursor: 'pointer', color: 'rgba(255,255,255,0.7)',
                    fontSize: '0.8rem', transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'white' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)' }}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Chat messages */}
          {messages.map((msg, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: '0.3rem' }}>
              <div
                className={msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}
                style={{ fontSize: '0.85rem', lineHeight: 1.55, color: 'white' }}
              >
                {msg.content}
              </div>

              {/* Sources */}
              {msg.sources?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', paddingLeft: '0.25rem' }}>
                  {msg.sources.map((src, j) => (
                    <span key={j} style={{
                      fontSize: '0.67rem', padding: '0.15rem 0.5rem', borderRadius: 99,
                      background: 'rgba(134,239,172,0.08)', border: '1px solid rgba(134,239,172,0.2)',
                      color: '#86efac',
                    }}>
                      📌 {src}
                    </span>
                  ))}
                </div>
              )}

              {/* Suggested follow-up questions */}
              {msg.role === 'assistant' && msg.suggested_questions?.length > 0 && i === messages.length - 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', width: '100%', marginTop: '0.25rem' }}>
                  {msg.suggested_questions.map((q, j) => (
                    <button
                      key={j}
                      onClick={() => sendMessage(q)}
                      style={{
                        textAlign: 'left', padding: '0.45rem 0.75rem',
                        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                        borderRadius: 8, cursor: 'pointer', color: 'rgba(255,255,255,0.55)',
                        fontSize: '0.76rem', transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'white' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)' }}
                    >
                      ↪ {q}
                    </button>
                  ))}
                </div>
              )}

              <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.2)' }}>
                {formatTime(msg.timestamp)}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div className="chat-bubble-ai" style={{ display: 'flex', gap: '4px', alignItems: 'center', padding: '0.75rem 1rem' }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{
                    width: 7, height: 7, borderRadius: '50%', background: 'rgba(255,255,255,0.5)',
                    animation: `typingBounce 1.2s ${i * 0.2}s ease-in-out infinite`,
                  }} />
                ))}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        <div style={{
          padding: '0.85rem 1rem', borderTop: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', gap: '0.5rem', alignItems: 'flex-end',
          background: 'rgba(255,255,255,0.02)',
        }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask about any government scheme..."
            rows={1}
            style={{
              flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12, padding: '0.65rem 0.9rem', color: 'white', fontSize: '0.85rem',
              resize: 'none', outline: 'none', fontFamily: 'Inter, sans-serif', lineHeight: 1.45,
              maxHeight: 90, overflowY: 'auto',
              transition: 'border-color 0.2s',
            }}
            onFocus={e => { e.target.style.borderColor = 'rgba(255,255,255,0.22)' }}
            onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)' }}
          />

          {/* Voice button */}
          <button
            onClick={toggleVoice}
            title={listening ? 'Stop listening' : 'Voice input'}
            style={{
              width: 38, height: 38, borderRadius: '50%', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              background: listening ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.06)',
              transition: 'all 0.2s',
            }}
          >
            {listening ? <MicOff size={16} color="#fca5a5" /> : <Mic size={16} color="rgba(255,255,255,0.5)" />}
          </button>

          {/* Send button */}
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            style={{
              width: 38, height: 38, borderRadius: '50%', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              background: input.trim() && !loading ? 'white' : 'rgba(255,255,255,0.08)',
              transition: 'all 0.2s',
            }}
          >
            {loading ? <Loader size={15} color="rgba(255,255,255,0.4)" style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={15} color={input.trim() ? 'black' : 'rgba(255,255,255,0.3)'} />}
          </button>
        </div>
      </div>

      {/* Inline keyframe styles */}
      <style>{`
        @keyframes chatPulse {
          0%, 100% { box-shadow: 0 8px 32px rgba(0,0,0,0.6), 0 0 0 0 rgba(255,255,255,0.25); }
          50%       { box-shadow: 0 8px 32px rgba(0,0,0,0.6), 0 0 0 12px rgba(255,255,255,0); }
        }
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
          30%            { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  )
}
