import { useDropzone } from 'react-dropzone'
import { Upload, File, X } from 'lucide-react'

export default function FileUpload({ onFile, accept = { 'image/*': [] }, maxSize = 10, label = 'Upload File', hint = '', file, onClear }) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => files[0] && onFile(files[0]),
    accept,
    maxSize: maxSize * 1024 * 1024,
    multiple: false,
  })

  if (file) {
    return (
      <div style={{
        padding: '1rem 1.25rem',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: '12px',
        display: 'flex', alignItems: 'center', gap: '1rem',
      }}>
        <File size={20} color="rgba(255,255,255,0.7)" />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'white' }}>{file.name}</div>
          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
            {(file.size / 1024).toFixed(1)} KB
          </div>
        </div>
        {onClear && (
          <button onClick={onClear} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: '0.25rem' }}
            onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.8)'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}>
            <X size={16} />
          </button>
        )}
      </div>
    )
  }

  return (
    <div
      {...getRootProps()}
      style={{
        padding: '2.5rem',
        border: `2px dashed ${isDragActive ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.12)'}`,
        borderRadius: '16px',
        textAlign: 'center',
        cursor: 'pointer',
        background: isDragActive ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.02)',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)' }}
      onMouseLeave={e => { if (!isDragActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)' } }}
    >
      <input {...getInputProps()} />
      <Upload size={28} color="rgba(255,255,255,0.4)" style={{ margin: '0 auto 0.75rem' }} />
      <div style={{ fontSize: '0.9rem', fontWeight: 500, color: isDragActive ? 'white' : 'rgba(255,255,255,0.7)', marginBottom: '0.25rem' }}>
        {isDragActive ? 'Drop it here!' : label}
      </div>
      <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)' }}>
        {hint || `Drag & drop or click — Max ${maxSize}MB`}
      </div>
    </div>
  )
}
