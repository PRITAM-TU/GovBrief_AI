import { useState, useEffect } from 'react'
import { Shield, Upload, Download, Trash2, Loader, Lock, File } from 'lucide-react'
import { vaultAPI } from '../services/api'
import FileUpload from '../components/FileUpload'
import toast from 'react-hot-toast'

const DOC_TYPES = ['aadhaar','pan','voter_id','land_record','bank_passbook','income_certificate','other']

export default function DocumentVault() {
  const [docs, setDocs] = useState([])
  const [file, setFile] = useState(null)
  const [docType, setDocType] = useState('other')
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadDocs() }, [])

  const loadDocs = async () => {
    try {
      const res = await vaultAPI.list()
      setDocs(res.data || [])
    } catch { toast.error('Could not load vault') }
    setLoading(false)
  }

  const handleUpload = async () => {
    if (!file) { toast.error('Select a file'); return }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('doc_type', docType)
      await vaultAPI.upload(fd)
      toast.success('Document encrypted & stored!')
      setFile(null)
      loadDocs()
    } catch { toast.error('Upload failed') }
    setUploading(false)
  }

  const handleDownload = async (doc) => {
    try {
      const res = await vaultAPI.download(doc.id)
      const url = URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url; a.download = doc.filename; a.click()
      URL.revokeObjectURL(url)
    } catch { toast.error('Download failed') }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this document permanently?')) return
    try {
      await vaultAPI.delete(id)
      toast.success('Document deleted')
      setDocs(d => d.filter(x => x.id !== id))
    } catch { toast.error('Delete failed') }
  }

  return (
    <div className="page-container">
      <h1 className="section-title" style={{ marginBottom:'0.35rem' }}>Secure Document Vault</h1>
      <p className="section-sub" style={{ marginBottom:'2rem' }}>All documents encrypted with AES-256. Only you can access them.</p>

      <div style={{ display:'grid', gridTemplateColumns:'380px 1fr', gap:'1.5rem', alignItems:'start' }}>
        {/* Upload */}
        <div className="glass-card" style={{ padding:'1.5rem' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'1.25rem' }}>
            <Lock size={16} color="rgba(255,255,255,0.6)" />
            <span style={{ fontWeight:700, color:'white' }}>Add Document</span>
          </div>
          <div style={{ marginBottom:'1rem' }}>
            <label style={{ fontSize:'0.8rem', color:'rgba(255,255,255,0.45)', display:'block', marginBottom:'0.4rem' }}>Document Type</label>
            <select className="glass-input" value={docType} onChange={e => setDocType(e.target.value)}>
              {DOC_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g,' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
            </select>
          </div>
          <FileUpload onFile={setFile} file={file} onClear={() => setFile(null)} maxSize={20} label="Upload Document" hint="PDF, JPG, PNG, DOCX — Max 20MB" />
          <button onClick={handleUpload} disabled={uploading || !file} className="glass-btn btn-white" style={{ width:'100%', marginTop:'1rem', padding:'0.875rem', opacity: !file || uploading ? 0.6 : 1 }}>
            {uploading ? <><Loader size={15} className="animate-spin-slow" /> Encrypting...</> : <><Shield size={15} /> Encrypt & Store</>}
          </button>
          <div style={{ marginTop:'1rem', padding:'0.875rem', background:'rgba(255,255,255,0.03)', borderRadius:10, border:'1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.45)', display:'flex', flexDirection:'column', gap:'0.3rem' }}>
              <div>🔐 AES-256-CBC encryption</div>
              <div>🔑 Only accessible with your account</div>
              <div>💾 Stored on your local server</div>
            </div>
          </div>
        </div>

        {/* Document List */}
        <div>
          <div style={{ fontWeight:700, color:'white', marginBottom:'1rem', fontSize:'0.95rem' }}>
            My Documents ({docs.length})
          </div>
          {loading ? (
            <div style={{ textAlign:'center', padding:'3rem', color:'rgba(255,255,255,0.3)' }}><Loader size={24} className="animate-spin-slow" /></div>
          ) : docs.length === 0 ? (
            <div className="glass-card" style={{ padding:'3rem', textAlign:'center' }}>
              <Shield size={36} color="rgba(255,255,255,0.15)" style={{ marginBottom:'1rem', display:'block', margin:'0 auto 1rem' }} />
              <div style={{ color:'rgba(255,255,255,0.4)', fontSize:'0.9rem' }}>No documents in vault yet</div>
              <div style={{ color:'rgba(255,255,255,0.25)', fontSize:'0.8rem', marginTop:'0.25rem' }}>Upload your first document</div>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
              {docs.map(doc => (
                <div key={doc.id} className="glass-card" style={{ padding:'1rem 1.25rem', display:'flex', alignItems:'center', gap:'1rem' }}>
                  <div style={{ width:40, height:40, borderRadius:10, background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.1)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <File size={18} color="rgba(255,255,255,0.6)" />
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:'0.875rem', fontWeight:600, color:'white', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{doc.filename}</div>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginTop:'0.2rem' }}>
                      <span className="badge badge-white" style={{ fontSize:'0.65rem' }}>{doc.doc_type?.replace(/_/g,' ')}</span>
                      <span style={{ fontSize:'0.72rem', color:'rgba(255,255,255,0.35)' }}>{doc.file_size_kb} KB</span>
                      <span style={{ fontSize:'0.72rem', color:'rgba(255,255,255,0.35)' }}>{new Date(doc.uploaded_at).toLocaleDateString('en-IN')}</span>
                      {doc.is_encrypted && <Lock size={10} color="rgba(134,239,172,0.8)" />}
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:'0.5rem', flexShrink:0 }}>
                    <button onClick={() => handleDownload(doc)} className="glass-btn btn-ghost" style={{ padding:'0.4rem 0.7rem', fontSize:'0.78rem' }}>
                      <Download size={13} />
                    </button>
                    <button onClick={() => handleDelete(doc.id)} className="glass-btn btn-danger" style={{ padding:'0.4rem 0.7rem', fontSize:'0.78rem' }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
