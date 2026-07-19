import { useState } from 'react'
import { ScanLine, Loader, CheckCircle } from 'lucide-react'
import FileUpload from '../components/FileUpload'
import { ocrAPI } from '../services/api'
import toast from 'react-hot-toast'

const DOC_TYPES = [
  { value: 'auto', label: 'Auto Detect' },
  { value: 'aadhaar', label: 'Aadhaar Card' },
  { value: 'pan', label: 'PAN Card' },
  { value: 'voter_id', label: 'Voter ID' },
  { value: 'land_record', label: 'Land Record' },
  { value: 'bank_passbook', label: 'Bank Passbook' },
]

export default function DocumentOCR() {
  const [file, setFile] = useState(null)
  const [docType, setDocType] = useState('auto')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const handleUpload = async () => {
    if (!file) { toast.error('Please select an image'); return }
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('doc_type', docType)
      const res = await ocrAPI.upload(fd)
      setResult(res.data)
      toast.success('Document scanned and stored securely!')
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'OCR failed — check Tesseract installation')
    }
    setLoading(false)
  }

  return (
    <div className="page-container">
      <h1 className="section-title" style={{ marginBottom: '0.35rem' }}>Document Scanner (OCR)</h1>
      <p className="section-sub" style={{ marginBottom: '2rem' }}>Scan Aadhaar, land records, PAN, passbook — AI extracts all fields automatically</p>

      <div style={{ display: 'grid', gridTemplateColumns: result ? '1fr 1.4fr' : '1fr', gap: '1.5rem', maxWidth: result ? '100%' : 600, margin: result ? '0' : '0 auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '0.5rem' }}>Document Type</label>
              <select className="glass-input" value={docType} onChange={e => setDocType(e.target.value)}>
                {DOC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <FileUpload
              onFile={setFile} file={file} onClear={() => { setFile(null); setResult(null) }}
              accept={{ 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] }}
              maxSize={10}
              label="Upload Document Photo"
              hint="Clear photo works best — supported: JPG, PNG, WEBP"
            />
            <button onClick={handleUpload} disabled={!file || loading} className="glass-btn btn-white" style={{ width: '100%', marginTop: '1rem', padding: '0.875rem', opacity: !file || loading ? 0.6 : 1 }}>
              {loading ? <><Loader size={16} className="animate-spin-slow" /> Scanning...</> : <><ScanLine size={16} /> Scan & Extract</>}
            </button>
          </div>

          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'white', marginBottom: '0.75rem' }}>Supported Documents</div>
            {['Aadhaar Card', 'PAN Card', 'Voter ID', 'Land Record / Khasra', 'Bank Passbook'].map(d => (
              <div key={d} style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.55)', padding: '0.3rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#86efac' }} /> {d}
              </div>
            ))}
          </div>
        </div>

        {result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} className="animate-slide-up">
            <div className="glass-card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <CheckCircle size={16} color="#86efac" />
                <span style={{ fontWeight: 700, color: 'white' }}>Extracted Successfully</span>
                <span className="badge badge-white" style={{ marginLeft: 'auto' }}>{result.doc_type?.replace('_', ' ')?.toUpperCase()}</span>
              </div>
              {Object.keys(result.extracted_fields || {}).length > 0 ? (
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  {Object.entries(result.extracted_fields).map(([k, v]) => (
                    <div key={k} style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '1rem', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', textTransform: 'capitalize' }}>{k.replace(/_/g, ' ')}</div>
                      <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>{v}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>No structured fields extracted. See raw text below.</p>
              )}
            </div>

            {result.raw_text && (
              <div className="glass-card" style={{ padding: '1.25rem' }}>
                <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Raw OCR Text</div>
                <pre style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, whiteSpace: 'pre-wrap', fontFamily: 'JetBrains Mono, monospace', maxHeight: 200, overflowY: 'auto' }}>
                  {result.raw_text.slice(0, 1000)}
                </pre>
              </div>
            )}
            <div className="glass-card" style={{ padding: '1rem', background: 'rgba(34,197,94,0.06)', borderColor: 'rgba(34,197,94,0.15)' }}>
              <div style={{ fontSize: '0.82rem', color: '#86efac' }}>🔐 Document stored encrypted in your vault (Document #{result.document_id})</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
