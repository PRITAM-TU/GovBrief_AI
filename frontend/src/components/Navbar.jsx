import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import useStore from '../store/useStore'
import {
  LayoutDashboard, Search, FileText, ScanLine, FileEdit,
  Volume2, Calculator, Lock, Bell, Users, LogOut, Menu, X, Leaf, CheckSquare, Map
} from 'lucide-react'

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/schemes', icon: Search, label: 'Scheme Matcher' },
  { to: '/journey', icon: Map, label: 'Scheme Journey' },
  { to: '/tracker', icon: CheckSquare, label: 'Tracker' },
  { to: '/summarize', icon: FileText, label: 'PDF Summarizer' },
  { to: '/ocr', icon: ScanLine, label: 'Scan Documents' },
  { to: '/forms', icon: FileEdit, label: 'Form Filler' },
  { to: '/tts', icon: Volume2, label: 'Voice Guide' },
  { to: '/roi', icon: Calculator, label: 'ROI Calculator' },
  { to: '/vault', icon: Lock, label: 'Vault' },
  { to: '/alerts', icon: Bell, label: 'Alerts' },
  { to: '/community', icon: Users, label: 'Community' },
]

export default function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated, logout, user } = useStore()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/') }

  return (
    <>
      <nav className="sidebar-nav">
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', marginBottom: '2rem' }} className="logo-container">
          <div style={{
            width: 34, height: 34, borderRadius: 8,
            background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <Leaf size={18} color="black" />
          </div>
          <span style={{ fontWeight: 800, fontSize: '1.2rem', color: 'white', letterSpacing: '-0.02em' }}>
            GovBrief <span style={{ color: 'rgba(255,255,255,0.5)' }}>AI</span>
          </span>
        </Link>

        {/* Desktop nav items */}
        {isAuthenticated && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1, overflowY: 'auto', width: '100%' }} className="hidden-mobile nav-links-container">
            {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
              const active = location.pathname === to
              return (
                <Link key={to} to={to} style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.75rem 1rem', borderRadius: '10px',
                  textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500,
                  background: active ? 'rgba(255,255,255,0.1)' : 'transparent',
                  color: active ? 'white' : 'rgba(255,255,255,0.6)',
                  border: active ? '1px solid rgba(255,255,255,0.15)' : '1px solid transparent',
                  transition: 'all 0.15s ease',
                  width: '100%'
                }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.color = 'white'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)' } }}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; e.currentTarget.style.background = 'transparent' } }}
                >
                  <Icon size={18} />
                  {label}
                </Link>
              )
            })}
          </div>
        )}

        <div className="user-section">
          {isAuthenticated ? (
            <>
              <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.07)', marginBottom: '0.5rem', width: '100%' }} className="hidden-mobile">
                <div style={{ fontSize: '0.85rem', color: 'white', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'white', color: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 800, flexShrink: 0 }}>
                    {user?.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name || 'User'}</div>
                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.mobile}</div>
                  </div>
                </div>
              </div>
              <button onClick={handleLogout} className="glass-btn btn-ghost logout-btn" style={{ width: '100%', padding: '0.75rem', justifyContent: 'center' }}>
                <LogOut size={16} /> <span className="hidden-mobile">Logout</span>
              </button>
            </>
          ) : (
            <Link to="/login" className="glass-btn btn-white" style={{ width: '100%', padding: '0.75rem', justifyContent: 'center', textDecoration: 'none' }}>
              Sign In
            </Link>
          )}
          <button onClick={() => setMobileOpen(!mobileOpen)} className="mobile-menu-btn" style={{ display: 'none' }}>
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu dropdown */}
      {mobileOpen && isAuthenticated && (
        <div style={{
          position: 'fixed', top: 70, left: 0, right: 0, zIndex: 99,
          background: 'rgba(5,5,5,0.98)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          padding: '1rem',
          display: 'flex', flexDirection: 'column', gap: '0.25rem',
          maxHeight: 'calc(100vh - 70px)', overflowY: 'auto'
        }}>
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <Link key={to} to={to} onClick={() => setMobileOpen(false)} style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.75rem 1rem', borderRadius: '10px',
              textDecoration: 'none', fontSize: '1rem', fontWeight: 500,
              color: location.pathname === to ? 'white' : 'rgba(255,255,255,0.6)',
              background: location.pathname === to ? 'rgba(255,255,255,0.08)' : 'transparent',
            }}>
              <Icon size={18} /> {label}
            </Link>
          ))}
        </div>
      )}

      <style>{`
        /* Desktop Sidebar */
        .sidebar-nav {
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          width: 260px;
          z-index: 100;
          background: rgba(5,5,5,0.85);
          backdrop-filter: blur(20px);
          border-right: 1px solid rgba(255,255,255,0.07);
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 1.5rem;
        }

        .user-section {
          margin-top: auto;
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        /* Mobile Top Nav */
        @media (max-width: 900px) {
          .sidebar-nav {
            width: 100%;
            height: 70px;
            bottom: auto;
            flex-direction: row;
            align-items: center;
            padding: 0 1.5rem;
            border-right: none;
            border-bottom: 1px solid rgba(255,255,255,0.07);
          }
          
          .logo-container {
            margin-bottom: 0 !important;
          }

          .user-section {
            margin-top: 0;
            width: auto;
            margin-left: auto;
            flex-direction: row;
            align-items: center;
            gap: 1rem;
          }

          .hidden-mobile { 
            display: none !important; 
          }
          
          .mobile-menu-btn { 
            display: flex !important; 
            align-items: center; 
            justify-content: center;
            background: transparent; 
            border: none; 
            color: white; 
            cursor: pointer; 
            padding: 0;
          }

          .logout-btn {
            width: auto !important;
            padding: 0.5rem !important;
            border-radius: 50% !important;
          }
        }
      `}</style>
    </>
  )
}
