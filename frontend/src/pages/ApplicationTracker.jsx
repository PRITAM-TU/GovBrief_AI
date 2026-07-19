import { useState, useEffect } from 'react'
import { Plus, Check, Loader, FileText, ChevronDown } from 'lucide-react'
import { applicationsAPI, schemesAPI } from '../services/api'
import toast from 'react-hot-toast'

export default function ApplicationTracker() {
  const [apps, setApps] = useState([])
  const [schemes, setSchemes] = useState([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState({ scheme_id: '', application_ref_id: '' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [appsRes, schemesRes] = await Promise.all([
        applicationsAPI.list(),
        schemesAPI.list({ limit: 100 }) // fetch all schemes for dropdown
      ])
      setApps(appsRes.data)
      setSchemes(schemesRes.data.schemes || [])
    } catch (err) {
      toast.error('Failed to load applications')
    }
    setLoading(false)
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!form.scheme_id || !form.application_ref_id) return toast.error('Please fill all fields')
    
    setSubmitting(true)
    try {
      await applicationsAPI.create({ 
        scheme_id: parseInt(form.scheme_id), 
        application_ref_id: form.application_ref_id 
      })
      toast.success('Application added to tracker')
      setFormOpen(false)
      setForm({ scheme_id: '', application_ref_id: '' })
      loadData()
    } catch (err) {
      toast.error('Failed to add application')
    }
    setSubmitting(false)
  }

  const handleStatusChange = async (id, newStatus) => {
    try {
      await applicationsAPI.updateStatus(id, newStatus)
      toast.success('Status updated')
      setApps(apps.map(a => a.id === id ? { ...a, status: newStatus } : a))
    } catch {
      toast.error('Update failed')
    }
  }

  const statusColors = {
    'Pending': '#fde047',
    'Approved': '#86efac',
    'Rejected': '#fca5a5',
    'Disbursed': '#60a5fa'
  }

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 className="section-title" style={{ marginBottom: '0.35rem' }}>Application Tracker</h1>
          <p className="section-sub">Manually track and update your submitted scheme applications.</p>
        </div>
        <button className="glass-btn btn-white" onClick={() => setFormOpen(!formOpen)}>
          <Plus size={16} /> Add Application
        </button>
      </div>

      {formOpen && (
        <form onSubmit={handleAdd} className="glass-card" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
          <h3 style={{ color: 'white', marginBottom: '1rem', fontSize: '1.1rem' }}>Track New Application</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', marginBottom: '0.4rem' }}>Select Scheme</label>
              <select 
                className="glass-input" 
                value={form.scheme_id} 
                onChange={e => setForm({ ...form, scheme_id: e.target.value })}
                required
                style={{ width: '100%' }}
              >
                <option value="">-- Choose Scheme --</option>
                {schemes.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', marginBottom: '0.4rem' }}>Application / Reference ID</label>
              <input 
                className="glass-input" 
                placeholder="e.g. MH-2026-9921"
                value={form.application_ref_id} 
                onChange={e => setForm({ ...form, application_ref_id: e.target.value })}
                required
                style={{ width: '100%' }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button type="button" className="glass-btn" onClick={() => setFormOpen(false)}>Cancel</button>
            <button type="submit" className="glass-btn btn-white" disabled={submitting}>
              {submitting ? <Loader size={16} className="animate-spin-slow" /> : <Check size={16} />} Save Application
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <Loader size={32} className="animate-spin-slow" color="white" />
        </div>
      ) : apps.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <FileText size={48} color="rgba(255,255,255,0.2)" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ color: 'white', marginBottom: '0.5rem' }}>No Applications Tracked</h3>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>Click "Add Application" above to start tracking your submitted forms.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {apps.map(app => (
            <div key={app.id} className="glass-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  ID: {app.application_ref_id}
                </div>
                <h3 style={{ color: 'white', fontSize: '1.1rem', margin: 0 }}>{app.scheme_name}</h3>
                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.4rem' }}>
                  Added: {new Date(app.created_at).toLocaleDateString()}
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusColors[app.status] || 'white' }} />
                  <span style={{ color: statusColors[app.status] || 'white', fontWeight: 600, fontSize: '0.9rem' }}>{app.status}</span>
                </div>
                
                <div style={{ position: 'relative', marginLeft: '1rem' }}>
                  <select 
                    className="glass-input" 
                    value={app.status}
                    onChange={(e) => handleStatusChange(app.id, e.target.value)}
                    style={{ 
                      appearance: 'none', 
                      padding: '0.4rem 2rem 0.4rem 1rem', 
                      background: 'rgba(255,255,255,0.05)',
                      fontSize: '0.8rem',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="Pending">Mark Pending</option>
                    <option value="Approved">Mark Approved</option>
                    <option value="Rejected">Mark Rejected</option>
                    <option value="Disbursed">Mark Disbursed</option>
                  </select>
                  <ChevronDown size={14} color="rgba(255,255,255,0.5)" style={{ position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
