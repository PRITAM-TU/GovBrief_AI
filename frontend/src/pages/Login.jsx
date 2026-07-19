import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Leaf, Eye, EyeOff } from 'lucide-react'
import useStore from '../store/useStore'
import toast from 'react-hot-toast'

const STATES = ['Andhra Pradesh','Assam','Bihar','Gujarat','Haryana','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Odisha','Punjab','Rajasthan','Tamil Nadu','Telangana','Uttar Pradesh','West Bengal','Jharkhand','Chhattisgarh','Uttarakhand','Himachal Pradesh']

export default function Login() {
  const [isRegister, setIsRegister] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { login, register } = useStore()
  const [form, setForm] = useState({ name:'', phone:'', password:'', state:'', district:'', land_size:'', income:'', crop_types:'', farmer_category:'general' })
  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.phone || !form.password) { toast.error('Phone and password required'); return }
    setLoading(true)
    try {
      if (isRegister) {
        await register({ ...form, land_size: form.land_size ? parseFloat(form.land_size) : null, income: form.income ? parseFloat(form.income) : null })
        toast.success('Welcome to GovBrief AI!')
      } else {
        await login(form.phone, form.password)
        toast.success('Welcome back!')
      }
      navigate('/dashboard')
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Something went wrong')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)', padding:'1rem' }}>
      <div style={{ width:'100%', maxWidth:460 }}>
        <div style={{ textAlign:'center', marginBottom:'2rem' }}>
          <Link to="/" style={{ display:'inline-flex', alignItems:'center', gap:'0.5rem', textDecoration:'none', marginBottom:'1.5rem' }}>
            <div style={{ width:38, height:38, background:'white', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center' }}><Leaf size={18} color="black" /></div>
            <span style={{ fontWeight:800, fontSize:'1rem', color:'white' }}>GovBrief AI</span>
          </Link>
          <h1 style={{ fontSize:'1.75rem', fontWeight:800, color:'white', marginBottom:'0.4rem' }}>{isRegister ? 'Create Account' : 'Welcome Back'}</h1>
          <p style={{ fontSize:'0.85rem', color:'rgba(255,255,255,0.4)' }}>{isRegister ? 'Join farmers discovering government schemes' : 'Sign in to your account'}</p>
        </div>

        <div className="glass-card" style={{ padding:'2rem' }}>
          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'0.9rem' }}>
            {isRegister && (
              <div>
                <label style={{ fontSize:'0.78rem', color:'rgba(255,255,255,0.45)', display:'block', marginBottom:'0.35rem' }}>Full Name *</label>
                <input className="glass-input" placeholder="Your full name" value={form.name} onChange={e => upd('name', e.target.value)} />
              </div>
            )}
            <div>
              <label style={{ fontSize:'0.78rem', color:'rgba(255,255,255,0.45)', display:'block', marginBottom:'0.35rem' }}>Mobile Number *</label>
              <input className="glass-input" placeholder="10-digit mobile" value={form.phone} onChange={e => upd('phone', e.target.value)} type="tel" />
            </div>
            <div>
              <label style={{ fontSize:'0.78rem', color:'rgba(255,255,255,0.45)', display:'block', marginBottom:'0.35rem' }}>Password *</label>
              <div style={{ position:'relative' }}>
                <input className="glass-input" placeholder="Password" value={form.password} onChange={e => upd('password', e.target.value)} type={showPass ? 'text' : 'password'} style={{ paddingRight:'2.5rem' }} />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{ position:'absolute', right:'0.75rem', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.4)' }}>
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            {isRegister && (
              <>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
                  <div>
                    <label style={{ fontSize:'0.78rem', color:'rgba(255,255,255,0.45)', display:'block', marginBottom:'0.35rem' }}>State</label>
                    <select className="glass-input" value={form.state} onChange={e => upd('state', e.target.value)}>
                      <option value="">Select state</option>
                      {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize:'0.78rem', color:'rgba(255,255,255,0.45)', display:'block', marginBottom:'0.35rem' }}>District</label>
                    <input className="glass-input" placeholder="District" value={form.district} onChange={e => upd('district', e.target.value)} />
                  </div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
                  <div>
                    <label style={{ fontSize:'0.78rem', color:'rgba(255,255,255,0.45)', display:'block', marginBottom:'0.35rem' }}>Land (acres)</label>
                    <input className="glass-input" placeholder="e.g. 2.5" value={form.land_size} onChange={e => upd('land_size', e.target.value)} type="number" step="0.1" />
                  </div>
                  <div>
                    <label style={{ fontSize:'0.78rem', color:'rgba(255,255,255,0.45)', display:'block', marginBottom:'0.35rem' }}>Annual Income (₹)</label>
                    <input className="glass-input" placeholder="e.g. 150000" value={form.income} onChange={e => upd('income', e.target.value)} type="number" />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize:'0.78rem', color:'rgba(255,255,255,0.45)', display:'block', marginBottom:'0.35rem' }}>Main Crops</label>
                  <input className="glass-input" placeholder="e.g. Rice, Wheat, Cotton" value={form.crop_types} onChange={e => upd('crop_types', e.target.value)} />
                </div>
              </>
            )}
            <button type="submit" disabled={loading} className="glass-btn btn-white" style={{ marginTop:'0.5rem', padding:'0.875rem', fontSize:'0.95rem', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In'}
            </button>
          </form>
          <div style={{ textAlign:'center', marginTop:'1.25rem', fontSize:'0.83rem', color:'rgba(255,255,255,0.4)' }}>
            {isRegister ? 'Already have an account? ' : "Don't have an account? "}
            <button onClick={() => setIsRegister(!isRegister)} style={{ background:'none', border:'none', color:'white', fontWeight:600, cursor:'pointer', fontSize:'0.83rem' }}>
              {isRegister ? 'Sign In' : 'Register Free'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
