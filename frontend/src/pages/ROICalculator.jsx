import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Calculator } from 'lucide-react'

const SCHEMES_ROI = [
  { name:'PM Kusum Solar', subsidy: 80, typicalCost: 350000 },
  { name:'PMKSY Drip Irrigation', subsidy: 55, typicalCost: 120000 },
  { name:'SMAM Tractor', subsidy: 40, typicalCost: 600000 },
  { name:'NHM Greenhouse', subsidy: 50, typicalCost: 800000 },
  { name:'Custom', subsidy: 0, typicalCost: 0 },
]

export default function ROICalculator() {
  const [totalCost, setTotalCost] = useState(100000)
  const [subsidyPct, setSubsidyPct] = useState(80)
  const [selectedPreset, setSelectedPreset] = useState(0)

  const farmerPays = Math.round(totalCost * (1 - subsidyPct / 100))
  const savings = totalCost - farmerPays
  const savingsPct = Math.round((savings / totalCost) * 100)

  const barData = [
    { name: 'Total Cost', value: totalCost },
    { name: 'Govt Pays', value: savings },
    { name: 'You Pay', value: farmerPays },
  ]

  const pieData = [
    { name: 'Govt Subsidy', value: savings },
    { name: 'Farmer\'s Share', value: farmerPays },
  ]

  const selectPreset = (i) => {
    setSelectedPreset(i)
    const p = SCHEMES_ROI[i]
    if (p.typicalCost > 0) { setTotalCost(p.typicalCost); setSubsidyPct(p.subsidy) }
  }

  return (
    <div className="page-container" style={{ maxWidth: 900 }}>
      <h1 className="section-title" style={{ marginBottom:'0.35rem' }}>ROI & Savings Calculator</h1>
      <p className="section-sub" style={{ marginBottom:'2rem' }}>Calculate exactly how much the government will fund for your investment</p>

      {/* Preset schemes */}
      <div style={{ display:'flex', flexWrap:'wrap', gap:'0.5rem', marginBottom:'1.5rem' }}>
        {SCHEMES_ROI.map((s,i) => (
          <button key={i} onClick={() => selectPreset(i)} style={{
            padding:'0.4rem 0.9rem', borderRadius:99, fontSize:'0.8rem', fontWeight:600, cursor:'pointer', transition:'all 0.15s',
            background: selectedPreset===i ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${selectedPreset===i ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.08)'}`,
            color: selectedPreset===i ? 'white' : 'rgba(255,255,255,0.5)',
          }}>
            {s.name}
          </button>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'360px 1fr', gap:'1.5rem', alignItems:'start' }}>
        {/* Inputs */}
        <div className="glass-card" style={{ padding:'1.75rem' }}>
          <div style={{ marginBottom:'1.5rem' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.5rem' }}>
              <label style={{ fontSize:'0.85rem', fontWeight:600, color:'white' }}>Total Project Cost</label>
              <span style={{ fontSize:'1rem', fontWeight:800, color:'white' }}>₹{totalCost.toLocaleString('en-IN')}</span>
            </div>
            <input type="range" min={10000} max={2000000} step={10000} value={totalCost} onChange={e => setTotalCost(Number(e.target.value))} />
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.72rem', color:'rgba(255,255,255,0.3)', marginTop:'0.25rem' }}>
              <span>₹10K</span><span>₹20L</span>
            </div>
          </div>

          <div style={{ marginBottom:'2rem' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.5rem' }}>
              <label style={{ fontSize:'0.85rem', fontWeight:600, color:'white' }}>Government Subsidy</label>
              <span style={{ fontSize:'1rem', fontWeight:800, color:'white' }}>{subsidyPct}%</span>
            </div>
            <input type="range" min={0} max={100} step={5} value={subsidyPct} onChange={e => setSubsidyPct(Number(e.target.value))} />
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.72rem', color:'rgba(255,255,255,0.3)', marginTop:'0.25rem' }}>
              <span>0%</span><span>100%</span>
            </div>
          </div>

          {/* Summary boxes */}
          <div style={{ display:'grid', gap:'0.75rem' }}>
            {[
              { label:'Total Cost', value:`₹${totalCost.toLocaleString('en-IN')}`, sub:'Your investment' },
              { label:'Government Pays', value:`₹${savings.toLocaleString('en-IN')}`, sub:`${savingsPct}% of total`, highlight:true },
              { label:'You Pay Only', value:`₹${farmerPays.toLocaleString('en-IN')}`, sub:`${100-savingsPct}% of total` },
            ].map(({ label, value, sub, highlight }) => (
              <div key={label} style={{ padding:'1rem', borderRadius:12, background: highlight ? 'rgba(134,239,172,0.08)' : 'rgba(255,255,255,0.04)', border:`1px solid ${highlight ? 'rgba(134,239,172,0.2)' : 'rgba(255,255,255,0.07)'}` }}>
                <div style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.45)', marginBottom:'0.2rem' }}>{label}</div>
                <div style={{ fontSize:'1.3rem', fontWeight:800, color: highlight ? '#86efac' : 'white' }}>{value}</div>
                <div style={{ fontSize:'0.72rem', color:'rgba(255,255,255,0.35)' }}>{sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Charts */}
        <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
          <div className="glass-card" style={{ padding:'1.5rem' }}>
            <div style={{ fontSize:'0.8rem', color:'rgba(255,255,255,0.4)', marginBottom:'1rem' }}>Cost Breakdown (₹)</div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={barData} margin={{ left:0, right:0 }}>
                <XAxis dataKey="name" tick={{ fill:'rgba(255,255,255,0.5)', fontSize:11 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip formatter={(v) => [`₹${v.toLocaleString('en-IN')}`, '']} contentStyle={{ background:'rgba(10,10,10,0.95)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'white', fontSize:12 }} />
                <Bar dataKey="value" radius={[6,6,0,0]}>
                  {barData.map((_, i) => <Cell key={i} fill={['rgba(255,255,255,0.3)','rgba(134,239,172,0.7)','rgba(255,255,255,0.85)'][i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-card" style={{ padding:'1.5rem' }}>
            <div style={{ fontSize:'0.8rem', color:'rgba(255,255,255,0.4)', marginBottom:'1rem' }}>Funding Split</div>
            <div style={{ display:'flex', alignItems:'center', gap:'2rem' }}>
              <ResponsiveContainer width={140} height={140}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} dataKey="value" strokeWidth={0}>
                    <Cell fill="rgba(134,239,172,0.8)" />
                    <Cell fill="rgba(255,255,255,0.25)" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
                {pieData.map((d,i) => (
                  <div key={d.name} style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                    <div style={{ width:10, height:10, borderRadius:'50%', background: i===0 ? 'rgba(134,239,172,0.8)' : 'rgba(255,255,255,0.25)', flexShrink:0 }} />
                    <div>
                      <div style={{ fontSize:'0.82rem', color:'white', fontWeight:600 }}>{d.name}</div>
                      <div style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.4)' }}>₹{d.value.toLocaleString('en-IN')}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="glass-card" style={{ padding:'1.25rem', background:'rgba(255,255,255,0.04)', borderColor:'rgba(255,255,255,0.1)' }}>
            <Calculator size={16} color="rgba(255,255,255,0.5)" style={{ marginBottom:'0.5rem' }} />
            <p style={{ fontSize:'0.85rem', color:'rgba(255,255,255,0.7)', lineHeight:1.6 }}>
              With a <strong style={{ color:'white' }}>{subsidyPct}% subsidy</strong>, you save <strong style={{ color:'#86efac' }}>₹{savings.toLocaleString('en-IN')}</strong> and only pay <strong style={{ color:'white' }}>₹{farmerPays.toLocaleString('en-IN')}</strong> out of pocket for a ₹{totalCost.toLocaleString('en-IN')} investment.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
