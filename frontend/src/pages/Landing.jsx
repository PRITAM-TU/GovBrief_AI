import { Link } from 'react-router-dom'
import { Leaf, Shield, Mic, FileText, ScanLine, Calculator, ArrowRight, ChevronDown } from 'lucide-react'

const FEATURES = [
  { icon: FileText, title: 'Scheme Matcher', desc: 'AI finds the best government subsidies for your land, crop, and income profile.' },
  { icon: ScanLine, title: 'Document OCR', desc: 'Scan Aadhaar, land records, and passbooks — we extract data automatically.' },
  { icon: FileText, title: 'Policy Summarizer', desc: 'Upload any government PDF and get a simple, plain-language summary.' },
  { icon: Shield, title: 'Secure Vault', desc: 'All documents encrypted with AES-256. Only you can access them.' },
  { icon: Mic, title: 'Voice Guide', desc: 'Listen to scheme information in Hindi, Bengali, Odia, Telugu, and more.' },
  { icon: Calculator, title: 'ROI Calculator', desc: 'See exactly how much you save with subsidy before applying.' },
]

const STATS = [
  { value: '30+', label: 'Schemes Covered' },
  { value: '10+', label: 'Indian Languages' },
  { value: '28', label: 'States & UTs' },
  { value: 'AES-256', label: 'Encryption' },
]

export default function Landing() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', overflowX: 'hidden' }}>
      {/* Background orbs */}
      <div style={{ position: 'fixed', width: 700, height: 700, borderRadius: '50%', background: 'white', filter: 'blur(120px)', opacity: 0.025, top: -200, left: -200, pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', width: 500, height: 500, borderRadius: '50%', background: 'white', filter: 'blur(100px)', opacity: 0.02, bottom: -100, right: -100, pointerEvents: 'none' }} />

      {/* Navbar */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, padding: '0 2rem', height: 70, display: 'flex', alignItems: 'center', background: 'rgba(5,5,5,0.8)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
          <div style={{ width: 34, height: 34, background: 'white', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Leaf size={18} color="black" />
          </div>
          <span style={{ fontWeight: 800, fontSize: '1rem', color: 'white' }}>GovBrief <span style={{ color: 'rgba(255,255,255,0.4)' }}>AI</span></span>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/login" style={{ padding: '0.5rem 1.25rem', borderRadius: 10, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: 'white', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500 }}>Sign In</Link>
          <Link to="/login?register=1" style={{ padding: '0.5rem 1.25rem', borderRadius: 10, background: 'white', color: 'black', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 700 }}>Get Started</Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '120px 2rem 4rem', position: 'relative' }}>
        <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 1rem', borderRadius: 99, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '2rem' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#86efac', animation: 'pulse 2s infinite' }} />
            AI-Powered Rural Assistance Platform
          </div>
        </div>

        <h1 className="animate-slide-up" style={{ animationDelay: '0.2s', fontSize: 'clamp(2.5rem, 6vw, 5rem)', fontWeight: 900, lineHeight: 1.08, letterSpacing: '-0.03em', color: 'white', maxWidth: '900px', marginBottom: '1.5rem' }}>
          Your{' '}
          <span style={{ background: 'linear-gradient(135deg, #fff 0%, #888 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            Digital Policy
          </span>
          {' '}Assistant
        </h1>

        <p className="animate-slide-up" style={{ animationDelay: '0.35s', fontSize: 'clamp(1rem, 2vw, 1.2rem)', color: 'rgba(255,255,255,0.5)', maxWidth: '600px', lineHeight: 1.7, marginBottom: '2.5rem' }}>
          Discover government subsidies, understand complex policies, scan documents, and fill forms — all in one place, in your language.
        </p>

        <div className="animate-slide-up" style={{ animationDelay: '0.45s', display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link to="/login?register=1" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.9rem 2rem', borderRadius: 12, background: 'white', color: 'black', textDecoration: 'none', fontWeight: 800, fontSize: '1rem', boxShadow: '0 0 40px rgba(255,255,255,0.15)', transition: 'all 0.2s' }}>
            Start for Free <ArrowRight size={18} />
          </Link>
          <a href="#features" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.9rem 2rem', borderRadius: 12, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: 'white', textDecoration: 'none', fontWeight: 600, fontSize: '1rem' }}>
            See Features <ChevronDown size={16} />
          </a>
        </div>

        {/* Stats */}
        <div className="animate-slide-up" style={{ animationDelay: '0.6s', display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '4rem' }}>
          {STATS.map(({ value, label }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'white', letterSpacing: '-0.02em' }}>{value}</div>
              <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.1rem' }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" style={{ padding: '6rem 2rem', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 3rem)', fontWeight: 800, color: 'white', letterSpacing: '-0.02em', marginBottom: '1rem' }}>
            Everything a Farmer Needs
          </h2>
          <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.45)', maxWidth: 500, margin: '0 auto' }}>
            12 AI-powered modules designed specifically for Indian farmers navigating government schemes.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }} className="stagger">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="glass-card animate-slide-up" style={{ padding: '1.75rem' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <Icon size={20} color="white" />
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'white', marginBottom: '0.5rem' }}>{title}</h3>
              <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '5rem 2rem', textAlign: 'center' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', padding: '3rem 2rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 24 }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'white', marginBottom: '1rem' }}>Ready to get started?</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '2rem', fontSize: '1rem' }}>Register free and find schemes you qualify for in minutes.</p>
          <Link to="/login?register=1" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.9rem 2.5rem', borderRadius: 12, background: 'white', color: 'black', textDecoration: 'none', fontWeight: 800, fontSize: '1rem' }}>
            Create Free Account <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '2rem', textAlign: 'center', fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)' }}>
        © 2026 GovBrief AI — Smart Subsidies & Policy Navigator for Indian Farmers
      </footer>
    </div>
  )
}
