import { useState } from 'react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useFmScenarios } from '../hooks/useSupabase'
import { FM_BASE_CATEGORIES, FM_PRESETS, COLORS } from '../data/constants'
import { KPICard, SectionHeader, SaveBar, Icons, fmtCAD, fmtNum } from '../components/UI'

export default function FmBenchmark({ user }) {
  const [gfa, setGfa] = useState(57800)
  const PARKING_AREA = 25000
  const FM_BUFFER_PCT = 0.05
  const { data: scenarios, setData: setScenarios, save, saving } = useFmScenarios(user.id)
  const [activeId, setActiveId]     = useState(1)
  const [editingLabel, setEditing]  = useState(false)
  const [unsaved, setUnsaved]       = useState(false)

  const active = scenarios.find(s => s.id === activeId) || scenarios[0]

  const updateRate = (key, val) => {
    const num = parseFloat(val)
    setScenarios(prev => prev.map(s =>
      s.id === activeId ? { ...s, rates: { ...s.rates, [key]: isNaN(num) ? 0 : num } } : s
    ))
    setUnsaved(true)
  }

  const updateLabel = val => {
    setScenarios(prev => prev.map(s => s.id === activeId ? { ...s, label: val } : s))
    setUnsaved(true)
  }

  const addScenario = () => {
    const newId = Date.now()
    setScenarios(prev => [...prev, { id:newId, label:`Scenario ${prev.length+1}`, color:COLORS[prev.length%COLORS.length], rates:{ ...active.rates } }])
    setActiveId(newId)
    setUnsaved(true)
  }

  const deleteScenario = id => {
    if (scenarios.length <= 1) return
    setScenarios(prev => { const next = prev.filter(s=>s.id!==id); if(activeId===id) setActiveId(next[0].id); return next })
    setUnsaved(true)
  }

  const resetToPreset = key => {
    setScenarios(prev => prev.map(s => s.id===activeId ? { ...s, rates:{ ...FM_PRESETS[key].rates } } : s))
    setUnsaved(true)
  }

  const handleSave = async () => { await save(scenarios); setUnsaved(false) }

  const annualCost = (rate, key) => (key === 'parking' ? PARKING_AREA : gfa) * (+rate || 0)
  const scenarioSubtotal = s => FM_BASE_CATEGORIES.reduce((sum, c) => sum + annualCost(s.rates[c.key], c.key), 0)
  const scenarioTotalWithBuffer = s => scenarioSubtotal(s) * (1 + FM_BUFFER_PCT)
  const activeSubtotal = scenarioSubtotal(active)
  const activeBuffer = activeSubtotal * FM_BUFFER_PCT
  const activeCost = activeSubtotal + activeBuffer
  const activeRateEq = gfa > 0 ? activeCost / gfa : 0
  const benchmarkSubtotal = FM_BASE_CATEGORIES.reduce((s, c) => s + annualCost(c.baseRate, c.key), 0)
  const benchmarkRateEq = gfa > 0 ? (benchmarkSubtotal * (1 + FM_BUFFER_PCT)) / gfa : 0

  const pieData = FM_BASE_CATEGORIES.map(c => ({
    name:   c.label,
    value:  +(active.rates[c.key]||0),
    amount: annualCost(active.rates[c.key], c.key),
  })).filter(d => d.value > 0)

  const summaryData = scenarios.map(s => ({
    name:      s.label.length > 22 ? s.label.slice(0,20)+'…' : s.label,
    total:     scenarioTotalWithBuffer(s),
    rateTotal: gfa > 0 ? scenarioTotalWithBuffer(s) / gfa : 0,
    color:     s.color,
  }))

  return (
    <div className="space-y-6">
      <SectionHeader title="FM Operating Cost Benchmark" sub="Edit per-category $/sf · Build and compare scenarios" />

      {/* GFA + scenario total cards */}
      <div className="flex flex-wrap gap-4 items-end">
        <div className="glass-card rounded-xl p-4 flex-shrink-0">
          <label className="text-xs text-indigo-400 font-semibold uppercase tracking-wider block mb-2">Building GFA (sq ft)</label>
          <input type="number" value={gfa} onChange={e=>setGfa(+e.target.value||0)}
            className="w-40 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-indigo-500 focus:outline-none metric-mono" />
        </div>
        {scenarios.map(s => {
          const isActive = s.id === activeId
          return (
            <div key={s.id} onClick={()=>setActiveId(s.id)}
              className={`glass-card rounded-xl p-4 cursor-pointer transition-all flex-shrink-0 ${isActive?'ring-2':'opacity-70 hover:opacity-100'}`}
              style={isActive?{boxShadow:`0 0 0 2px ${s.color}`}:{}}>
              <div className="text-xs font-semibold mb-1 truncate max-w-[160px]" style={{color:s.color}}>{s.label}</div>
              <div className="metric-mono text-lg font-bold text-white">{fmtCAD(scenarioTotalWithBuffer(s))}</div>
              <div className="text-xs text-slate-400 mt-0.5">${(gfa > 0 ? scenarioTotalWithBuffer(s) / gfa : 0).toFixed(2)}/sf (incl. 5% buffer)</div>
            </div>
          )
        })}
      </div>

      {/* Scenario tab strip */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-slate-500">Scenarios:</span>
        {scenarios.map(s => (
          <div key={s.id} className="flex items-center gap-1">
            <button onClick={()=>setActiveId(s.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeId===s.id?'text-white':'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'}`}
              style={activeId===s.id?{background:s.color}:{}}>
              {s.label}
            </button>
            {scenarios.length > 1 && (
              <button onClick={()=>deleteScenario(s.id)} className="text-slate-600 hover:text-rose-400 transition-colors" title="Delete">
                <Icons.X className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
        <button onClick={addScenario} className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 border border-dashed border-slate-600 hover:border-indigo-500 text-slate-400 hover:text-indigo-400 rounded-lg text-xs font-medium transition-all">
          <Icons.Plus className="w-3 h-3" /> Add scenario
        </button>
        <div className="ml-auto">
          <SaveBar saving={saving} unsaved={unsaved} onSave={handleSave} />
        </div>
      </div>

      {/* Active scenario editor */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-700 flex items-center gap-3 flex-wrap">
          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{background:active.color}}></div>
          {editingLabel
            ? <input autoFocus value={active.label} onChange={e=>updateLabel(e.target.value)} onBlur={()=>setEditing(false)} onKeyDown={e=>{if(e.key==='Enter'||e.key==='Escape')setEditing(false)}}
                className="bg-slate-900 border border-indigo-500 rounded px-2 py-0.5 text-white text-sm focus:outline-none" />
            : <span className="text-sm font-semibold text-white cursor-pointer hover:text-indigo-300" onClick={()=>setEditing(true)} title="Click to rename">{active.label} ✎</span>
          }
          <div className="ml-auto flex gap-2 flex-wrap">
            <span className="text-xs text-slate-500">Reset to preset:</span>
            {Object.entries(FM_PRESETS).map(([k,p]) => (
              <button key={k} onClick={()=>resetToPreset(k)}
                className="px-2 py-1 bg-slate-800 border border-slate-700 hover:border-slate-500 text-slate-400 hover:text-white rounded text-xs transition-all">
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700 bg-slate-900/50">
              <th className="text-left py-3 px-5 text-slate-400">Category</th>
              <th className="text-right py-3 px-4 text-slate-400">Benchmark $/sf</th>
              <th className="text-right py-3 px-4 text-indigo-400 font-semibold">Active $/sf</th>
              <th className="text-right py-3 px-5 text-slate-400">Annual Cost</th>
              <th className="text-right py-3 px-4 text-slate-400 hidden md:table-cell">% of Total</th>
              <th className="text-left py-3 px-4 text-slate-500 hidden lg:table-cell">Source</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {FM_BASE_CATEGORIES.map((cat,i) => {
              const activeRate = +(active.rates[cat.key]||0)
              const annualAmt  = annualCost(activeRate, cat.key)
              const pct        = activeSubtotal > 0 ? (annualAmt/activeSubtotal)*100 : 0
              const delta      = activeRate - cat.baseRate
              const isParking  = cat.key === 'parking'
              return (
                <tr key={cat.key} className={`hover:bg-slate-800/30 transition-colors ${isParking ? 'bg-violet-500/5' : ''}`}>
                  <td className="py-3 px-5">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{background:isParking ? '#8B5CF6' : (cat.color || COLORS[i%COLORS.length])}}></div>
                      <span className={isParking ? 'text-violet-300' : 'text-slate-200'}>{cat.label}</span>
                      {isParking && <span className="text-[10px] text-violet-400">25,000 sf parking</span>}
                    </div>
                    {isParking && <div className="text-[10px] text-violet-300/90 mt-1">Parking area: 25,000 sf (separate from building GFA)</div>}
                  </td>
                  <td className="py-3 px-4 text-right metric-mono text-slate-500 text-xs">${cat.baseRate.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {delta !== 0 && <span className={`text-xs metric-mono ${delta>0?'text-rose-400':'text-emerald-400'}`}>{delta>0?'+':''}{delta.toFixed(2)}</span>}
                      <input type="number" step="0.05" min="0" value={activeRate===0?'':activeRate} placeholder="0.00"
                        onChange={e=>updateRate(cat.key,e.target.value)}
                        className="w-20 text-right bg-slate-900 border border-slate-700 hover:border-indigo-500/60 focus:border-indigo-500 rounded-lg px-2 py-1 text-white text-xs metric-mono focus:outline-none transition-colors" />
                    </div>
                  </td>
                  <td className="py-3 px-5 text-right metric-mono text-sm">
                    <span className={annualAmt>0?'text-white':'text-slate-600'}>{annualAmt>0?fmtCAD(annualAmt):'—'}</span>
                  </td>
                  <td className="py-3 px-4 text-right hidden md:table-cell">
                    {pct>0&&<div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div className="h-full rounded-full" style={{width:`${Math.min(pct,100)}%`,background:isParking ? '#8B5CF6' : (cat.color || COLORS[i%COLORS.length])}}></div>
                      </div>
                      <span className="text-xs text-slate-400 w-10 text-right">{pct.toFixed(1)}%</span>
                    </div>}
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-600 hidden lg:table-cell">{cat.source}</td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-indigo-500/40 bg-slate-900/60">
              <td className="py-3 px-5 font-bold text-white">FM Subtotal</td>
              <td className="py-3 px-4 text-right metric-mono text-slate-500 text-xs">${(gfa > 0 ? benchmarkSubtotal / gfa : 0).toFixed(2)}</td>
              <td className="py-3 px-4 text-right metric-mono font-bold" style={{color:active.color}}>${(gfa > 0 ? activeSubtotal / gfa : 0).toFixed(2)}/sf</td>
              <td className="py-3 px-5 text-right metric-mono font-bold text-indigo-300 text-sm">{fmtCAD(activeSubtotal)}</td>
              <td className="hidden md:table-cell"></td><td className="hidden lg:table-cell"></td>
            </tr>
            <tr className="bg-amber-500/10 italic" title="5% buffer added to FM costs to account for unforeseen maintenance, cost escalation, and operational variance">
              <td className="py-3 px-5 text-amber-300">Operations Buffer (5%)</td>
              <td className="py-3 px-4 text-right metric-mono text-amber-300 text-xs">${(benchmarkRateEq * FM_BUFFER_PCT).toFixed(2)}</td>
              <td className="py-3 px-4 text-right metric-mono text-amber-300">${(gfa > 0 ? activeBuffer / gfa : 0).toFixed(2)}/sf</td>
              <td className="py-3 px-5 text-right metric-mono text-amber-300">{fmtCAD(activeBuffer)}</td>
              <td className="hidden md:table-cell"></td><td className="hidden lg:table-cell"></td>
            </tr>
            <tr className="border-t border-indigo-500/40 bg-slate-900">
              <td className="py-3 px-5 font-bold text-white">TOTAL FM OPERATING COST</td>
              <td className="py-3 px-4 text-right metric-mono text-slate-300 text-xs">${benchmarkRateEq.toFixed(2)}</td>
              <td className="py-3 px-4 text-right metric-mono font-bold" style={{color:active.color}}>${activeRateEq.toFixed(2)}/sf</td>
              <td className="py-3 px-5 text-right metric-mono font-bold text-indigo-300 text-sm">{fmtCAD(activeCost)}</td>
              <td className="hidden md:table-cell"></td><td className="hidden lg:table-cell"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-xl p-6">
          <div className="text-sm font-semibold text-slate-300 mb-1">Active Scenario — Category Mix</div>
          <div className="text-xs text-slate-500 mb-4">{active.label} · {fmtNum(gfa)} sf</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={85} dataKey="value"
                  label={({percent})=>percent>0.04?`${(percent*100).toFixed(0)}%`:''} labelLine={false}>
                  {pieData.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                </Pie>
                <Tooltip formatter={(v,_,p)=>[`$${(+v).toFixed(2)}/sf = ${fmtCAD(p.payload.amount)}/yr`,p.payload.name]}
                  contentStyle={{backgroundColor:'#0f172a',border:'1px solid #334155',borderRadius:'8px',color:'#fff',fontSize:'11px'}}/>
                <Legend wrapperStyle={{fontSize:'10px'}}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="glass-card rounded-xl p-6">
          <div className="text-sm font-semibold text-slate-300 mb-1">Scenario Comparison</div>
          <div className="text-xs text-slate-500 mb-4">{fmtNum(gfa)} sq ft building</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summaryData} margin={{left:10,right:20,top:4,bottom:4}}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b"/>
                <XAxis dataKey="name" tick={{fontSize:9,fill:'#94a3b8'}} interval={0}/>
                <YAxis tickFormatter={v=>`$${(v/1000).toFixed(0)}K`} tick={{fontSize:10,fill:'#94a3b8'}}/>
                <Tooltip formatter={v=>[fmtCAD(v),'Annual Cost']} contentStyle={{backgroundColor:'#0f172a',border:'1px solid #334155',borderRadius:'8px',color:'#fff'}}/>
                <Bar dataKey="total" radius={[4,4,0,0]} barSize={40}>
                  {summaryData.map((d,i)=><Cell key={i} fill={d.color}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 space-y-1 border-t border-slate-700 pt-3">
            {summaryData.map((s,i)=>(
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{background:s.color}}></div><span className="text-slate-400">{s.name}</span></div>
                <div className="flex items-center gap-3"><span className="metric-mono text-slate-400">${s.rateTotal.toFixed(2)}/sf</span><span className="metric-mono font-semibold text-white">{fmtCAD(s.total)}</span></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-card rounded-xl p-4 text-xs text-slate-400 space-y-1">
        <div>· Property tax: $0 — Non-profit exemption under Ontario Municipal Act s.3(1)</div>
        <div>· <span className="text-indigo-400">✎ Edit any $/sf field</span> · Delta vs benchmark shown in <span className="text-rose-400">red (+)</span> / <span className="text-emerald-400">green (−)</span></div>
        <div>· All scenarios saved per user to Supabase</div>
      </div>
    </div>
  )
}
