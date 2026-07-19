import { useState } from 'react'
import { FileText, Loader, CheckCircle, Calendar, FileCheck } from 'lucide-react'
import FileUpload from '../components/FileUpload'
import { pdfAPI } from '../services/api'
import toast from 'react-hot-toast'

export default function PolicySummarizer() {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const handleSubmit = async () => {
    if (!file) { toast.error('Please upload a PDF'); return }
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await pdfAPI.summarize(fd)
      setResult(res.data)
      toast.success('PDF summarized successfully!')
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Could not process PDF')
    }
    setLoading(false)
  }

  return (
    <div className="page-container">
      <h1 className="section-title" style={{ marginBottom: '0.35rem' }}>Policy PDF Summarizer</h1>
      <p className="section-sub" style={{ marginBottom: '2rem' }}>Upload any government scheme PDF — get a simple summary instantly</p>

      <div style={{ display: 'grid', gridTemplateColumns: result ? '1fr 1.5fr' : '1fr', gap: '1.5rem', maxWidth: result ? '100%' : 600, margin: result ? '0' : '0 auto' }}>
        {/* Upload Panel */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <FileUpload
            onFile={setFile} file={file} onClear={() => { setFile(null); setResult(null) }}
            accept={{ 'application/pdf': ['.pdf'] }}
            maxSize={20}
            label="Drop Government PDF here"
            hint="PM-KISAN, PMFBY, state schemes, circulars — Max 20MB"
          />
          <button onClick={handleSubmit} disabled={!file || loading} className="glass-btn btn-white" style={{ width: '100%', marginTop: '1rem', padding: '0.875rem', opacity: !file || loading ? 0.6 : 1 }}>
            {loading ? <><Loader size={16} className="animate-spin-slow" /> Analyzing PDF...</> : <><FileText size={16} /> Summarize with AI</>}
          </button>
          <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginTop: '0.75rem' }}>
            Powered by Google Gemini 1.5 Flash
          </p>
        </div>

        {/* Results */}
        {result?.summary && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} className="animate-slide-up">
            {/* Header */}
            <div className="glass-card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <CheckCircle size={16} color="#86efac" />
                <span style={{ fontWeight: 700, fontSize: '1rem', color: 'white' }}>{result.summary.scheme_name || 'Policy Document'}</span>
              </div>
              {result.summary.ministry && <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>{result.summary.ministry}</div>}
              {result.metadata && <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', marginTop: '0.3rem' }}>{result.metadata.page_count} pages • {result.metadata.file_size_kb} KB</div>}
            </div>

            {/* Summary */}
            <div className="glass-card" style={{ padding: '1.25rem' }}>
              <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Summary</div>
              <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.65 }}>{result.summary.summary}</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {/* Benefits */}
              <div className="glass-card" style={{ padding: '1.25rem' }}>
                <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Benefits</div>
                <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.5 }}>{result.summary.benefits}</p>
                {result.summary.subsidy_percentage && <div style={{ marginTop: '0.5rem', fontWeight: 700, color: 'white', fontSize: '0.9rem' }}>{result.summary.subsidy_percentage}</div>}
              </div>

              {/* Deadline */}
              <div className="glass-card" style={{ padding: '1.25rem' }}>
                <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Deadline</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Calendar size={14} color="rgba(255,255,255,0.5)" />
                  <span style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.75)' }}>{result.summary.deadline}</span>
                </div>
                {result.summary.helpline && <div style={{ marginTop: '0.5rem', fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)' }}>Helpline: {result.summary.helpline}</div>}
              </div>
            </div>

            {/* Documents */}
            {result.summary.documents_needed && (
              <div className="glass-card" style={{ padding: '1.25rem' }}>
                <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                  <FileCheck size={12} style={{ display: 'inline', marginRight: '0.3rem' }} />Documents Needed
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {(Array.isArray(result.summary.documents_needed) ? result.summary.documents_needed : result.summary.documents_needed?.split(','))?.map((doc, i) => (
                    <span key={i} className="badge badge-white">{doc.trim()}</span>
                  ))}
                </div>
              </div>
            )}

            {/* How to apply */}
            {result.summary.how_to_apply && (
              <div className="glass-card" style={{ padding: '1.25rem' }}>
                <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>How to Apply</div>
                <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>{result.summary.how_to_apply}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
