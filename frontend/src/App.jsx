import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useEffect } from 'react'
import useStore from './store/useStore'

import Landing from './pages/Landing'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import SchemeMatcher from './pages/SchemeMatcher'
import PolicySummarizer from './pages/PolicySummarizer'
import DocumentOCR from './pages/DocumentOCR'
import FormFiller from './pages/FormFiller'
import TTSGuide from './pages/TTSGuide'
import ROICalculator from './pages/ROICalculator'
import DocumentVault from './pages/DocumentVault'
import AlertsPage from './pages/AlertsPage'
import Community from './pages/Community'
import ApplicationTracker from './pages/ApplicationTracker'
import SchemeJourney from './pages/SchemeJourney'
import AdminPage from './pages/AdminPage'
import Navbar from './components/Navbar'
import FloatingChatbot from './components/FloatingChatbot'

function ProtectedRoute({ children }) {
  const isAuthenticated = useStore((s) => s.isAuthenticated)
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function AppLayout({ children }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex' }}>
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <Navbar />
      <main style={{ flex: 1, padding: '2rem', marginLeft: '260px' }} className="z-content main-content">
        {children}
      </main>
      <FloatingChatbot />
      <style>{`
        @media (max-width: 900px) {
          .main-content {
            margin-left: 0 !important;
            padding-top: 80px !important;
            padding-left: 1rem !important;
            padding-right: 1rem !important;
          }
        }
      `}</style>
    </div>
  )
}

export default function App() {
  const { isAuthenticated, fetchMe } = useStore()

  useEffect(() => {
    if (isAuthenticated) fetchMe()
  }, [])

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'rgba(15,15,15,0.95)',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(20px)',
            borderRadius: '12px',
          },
        }}
      />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
        <Route path="/schemes" element={<ProtectedRoute><AppLayout><SchemeMatcher /></AppLayout></ProtectedRoute>} />
        <Route path="/summarize" element={<ProtectedRoute><AppLayout><PolicySummarizer /></AppLayout></ProtectedRoute>} />
        <Route path="/ocr" element={<ProtectedRoute><AppLayout><DocumentOCR /></AppLayout></ProtectedRoute>} />
        <Route path="/forms" element={<ProtectedRoute><AppLayout><FormFiller /></AppLayout></ProtectedRoute>} />
        <Route path="/tts" element={<ProtectedRoute><AppLayout><TTSGuide /></AppLayout></ProtectedRoute>} />
        <Route path="/roi" element={<ProtectedRoute><AppLayout><ROICalculator /></AppLayout></ProtectedRoute>} />
        <Route path="/vault" element={<ProtectedRoute><AppLayout><DocumentVault /></AppLayout></ProtectedRoute>} />
        <Route path="/alerts" element={<ProtectedRoute><AppLayout><AlertsPage /></AppLayout></ProtectedRoute>} />
        <Route path="/community" element={<ProtectedRoute><AppLayout><Community /></AppLayout></ProtectedRoute>} />
        <Route path="/tracker" element={<ProtectedRoute><AppLayout><ApplicationTracker /></AppLayout></ProtectedRoute>} />
        <Route path="/journey" element={<ProtectedRoute><AppLayout><SchemeJourney /></AppLayout></ProtectedRoute>} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}
