import { useMemo } from 'react'
import { PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { RIVERSIDE } from '../data/constants'
import { calcCapitalWave, formatDscrDisplay } from '../lib/finance'
import { KPICard, fmtCAD, fmtPct, InfoTooltip, overallStatusToColor } from '../components/UI'

const DSCR_INFO_TEXT = 'Debt Service Coverage Ratio — measures ability to cover debt payments from operating income. Formula: NOI ÷ Annual Debt Service. A DSCR of 1.25x means the project generates $1.25 for every $1.00 of debt owed. Minimum threshold: ≥1.20x'

const SIMPLE_PAYBACK_INFO_TEXT =
  'Simple Payback is the number of years required for cumulative savings to equal the total project cost. Formula: Total Project Cost ÷ Annual Saving. This is a simplified metric that does not account for inflation or the time value of money. It is useful as a first-pass indicator of investment scale, not as a return analysis.'
const OVERALL_BADGE_STYLE_BY_COLOR = {
  emerald: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10',
  amber: 'text-amber-400 border-amber-500/40 bg-amber-500/10',
  rose: 'text-rose-400 border-rose-500/40 bg-rose-500/10',
  slate: 'text-slate-300 border-slate-500/40 bg-slate-500/10',
}
export default function RiversideDashboard({ data, inputs, fundability, b1LiveTotal, b4Lhi, selectedBuckets, setSelectedBuckets, statusQuoTotal, setActiveTab }) {
  const BUCKET_CONFIG = [
    { key:'b1', label:'B1 · Operations', value: b1LiveTotal || RIVERSIDE.statusQuo.buckets.b1Operations, color:'#6366f1', locked:true },
    { key:'b2', label:'B2 · Deferred Capital', value: RIVERSIDE.statusQuo.buckets.b2DeferredCapital, color:'#f59e0b', locked:false },
  ]
  const bucketOrder = BUCKET_CONFIG.map(b => b.key)
  const bucketMap = Object.fromEntries(BUCKET_CONFIG.map(b => [b.key, { id:b.key, ...b }]))

  const toggleBucket = id => {
    if (id === 'b1') return
    setSelectedBuckets(prev => prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id])
  }

  const hubModelCost = data.partners.reduce((sum, p) => sum + (p.lease || 0), 0)
  const annualSaving = statusQuoTotal - hubModelCost
  const saving25yr = annualSaving * 25
  const costReduction = statusQuoTotal > 0 ? (annualSaving / statusQuoTotal) * 100 : 0
  const simplePayback = annualSaving > 0 ? data.capital.totalCost / annualSaving : null

  const bucketData = bucketOrder.map(id => ({
    name: bucketMap[id].label.replace(' · ', ': '),
    value: bucketMap[id].value,
    color: bucketMap[id].color,
  }))
  const hubAnnual = (data?.operations?.debtService || 0) + (data?.operations?.expenses || 0)
  const wave = calcCapitalWave(b4Lhi, hubAnnual)

  const timeline = useMemo(() => {
    const INFLATION_RATE = 0.025
    const pts = []
    let cumStatusQuo = 0
    let cumHub = 0
    for (let i = 0; i < 25; i++) {
      cumStatusQuo += statusQuoTotal * Math.pow(1 + INFLATION_RATE, i)
      cumHub += hubModelCost * Math.pow(1 + INFLATION_RATE, i)
      if (i % 4 === 0 || i === 24) {
        pts.push({
          year: `Y${i + 1}`,
          statusQuo: Math.round(cumStatusQuo),
          hub: Math.round(cumHub),
        })
      }
    }
    return pts
  }, [statusQuoTotal, hubModelCost])

  return (
    <div className="space-y-6">
      <div className="river-badge rounded-xl p-4 flex flex-wrap gap-4 items-center justify-between">
        <div>
          <div className="text-xs text-cyan-400 font-semibold uppercase tracking-widest mb-1">Riverside Hub — ROI Model 2026</div>
          <div className="text-white font-bold text-lg">{inputs?.name || 'Current Scenario'}</div>
          <div className="text-slate-400 text-sm">{RIVERSIDE.project.address} · {RIVERSIDE.project.operator}</div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <span className={`text-xs px-3 py-1 rounded-full border ${OVERALL_BADGE_STYLE_BY_COLOR[overallStatusToColor(fundability?.status || 'STABLE')]}`}>{fundability?.status || 'STABLE'}</span>
          <span className="text-xs px-3 py-1 rounded-full border border-slate-700 text-slate-300">Policy: {RIVERSIDE.project.policyVersion}</span>
        </div>
      </div>

      <div className="glass-card rounded-xl p-4 space-y-3">
        <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Status quo cost buckets (B1 + B2)</div>
        <div className="flex flex-wrap gap-2">
          {bucketOrder.map(id => {
            const b = bucketMap[id]
            const selected = selectedBuckets.includes(id)
            return (
              <button key={id} onClick={() => toggleBucket(id)} disabled={b.locked}
                className={`px-3 py-2 rounded-lg border text-left transition-all ${selected ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-200' : 'bg-slate-800 border-slate-700 text-slate-400'} ${b.locked ? 'cursor-default' : 'cursor-pointer hover:text-white'}`}>
                <div className="text-xs font-semibold flex items-center gap-1.5">
                  {b.locked && <span>🔒</span>}
                  <span>{b.label}</span>
                </div>
                <div className={`text-xs metric-mono ${selected ? 'text-indigo-300' : 'text-slate-500'}`}>{fmtCAD(b.value)}</div>
                {id === 'b1' && <div className="text-[10px] text-cyan-300 mt-1">Live from Partners tab</div>}
              </button>
            )
          })}
        </div>
        <div className="text-xs text-slate-400 mt-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
          <span className="text-amber-400 font-semibold">Note: </span>
          Status Quo shows confirmed costs occurring today (B1 + B2). For 25-year fragmented spending analysis including partner leasehold improvements and escalating rent, see the Capital Wave tab.
        </div>
        <div className="mt-3 rounded-lg border border-amber-500/40 bg-amber-500/5 px-4 py-3 flex items-center justify-between gap-4">
          <div className="text-sm">
            <span className="font-semibold text-amber-300">
              ⚠ The status quo is not zero-capital.
            </span>
            <span className="text-slate-300 ml-2">
              25-year fragmented spending: {fmtCAD(wave.combined25Yr)}
              {' '}vs Hub {fmtCAD(wave.hub25Yr)}.
              {' '}Savings: <span className="text-emerald-400 font-semibold">{fmtCAD(wave.savings25Yr)}</span>
            </span>
          </div>
          <button
            onClick={() => setActiveTab?.('capitalwave')}
            className="text-xs font-semibold text-amber-300 hover:text-amber-200 border border-amber-500/40 rounded px-3 py-1.5 whitespace-nowrap">
            See Capital Wave →
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard title="Total Project Cost" value={fmtCAD(data.capital.totalCost)} sub="All-in incl. pre-dev" accent mono />
        <KPICard title="Provincial Grant" value={fmtCAD(+inputs.grants || 0)} sub="Current input" mono />
        <KPICard title="Net Financing Required" value={fmtCAD(data.capital.mortgage)} sub="Gap after available capital" mono />
        <KPICard title="Annual Debt Service" value={fmtCAD(data.operations.debtService)} sub="From current financing terms" mono />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard title="Status Quo Annual Cost" value={fmtCAD(statusQuoTotal)} warn mono />
        <KPICard title="Hub Model Annual Cost" value={fmtCAD(hubModelCost)} accent mono />
        <KPICard title="Annual Saving" value={fmtCAD(annualSaving)} mono />
        <KPICard title="25-Yr Cumulative Saving" value={fmtCAD(saving25yr)} mono />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard title="Cost Reduction" value={fmtPct(costReduction)} accent mono />
        <KPICard title="Simple Payback" value={simplePayback ? `${simplePayback.toFixed(1)} Years` : 'N/A'} warn mono sub="Years to recover capital from annual savings" subInfoTooltip={SIMPLE_PAYBACK_INFO_TEXT} />
        <KPICard title={<span className="inline-flex items-center">DSCR <InfoTooltip text={DSCR_INFO_TEXT} /></span>} value={formatDscrDisplay(data.metrics.dscr)} danger={data.metrics.dscr<1.2} warn={data.metrics.dscr>=1.2&&data.metrics.dscr<1.35} mono />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-xl p-6">
          <div className="text-sm font-semibold text-slate-300 mb-4">Status Quo — B1 + B2 Breakdown</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={bucketData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {bucketData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip formatter={v => fmtCAD(v)} contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card rounded-xl p-6">
          <div className="text-sm font-semibold text-slate-300 mb-4">25-Year Cumulative Cost: Hub vs Status Quo</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeline}>
                <defs>
                  <linearGradient id="gSQ" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} /><stop offset="95%" stopColor="#f43f5e" stopOpacity={0} /></linearGradient>
                  <linearGradient id="gHub" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} /><stop offset="95%" stopColor="#6366f1" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="year" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis tickFormatter={v => `$${(v / 1e6).toFixed(0)}M`} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip formatter={v => fmtCAD(v)} contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} />
                <Area type="monotone" dataKey="statusQuo" name="Status Quo" stroke="#f43f5e" fill="url(#gSQ)" strokeWidth={2} />
                <Area type="monotone" dataKey="hub" name="Hub Model" stroke="#6366f1" fill="url(#gHub)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="text-xs text-slate-500 mt-2 italic">
            Both scenarios inflated at 2.5% per year. Cumulative costs shown in nominal dollars.
          </div>
        </div>
      </div>

      <div className="glass-card rounded-xl p-6">
        <div className="text-sm font-semibold text-slate-300 mb-4">Sensitivity Scenarios</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-2 px-3 text-slate-400">Scenario</th>
                <th className="text-right py-2 px-3 text-slate-400">Status Quo</th>
                <th className="text-right py-2 px-3 text-slate-400">Hub model</th>
                <th className="text-right py-2 px-3 text-slate-400">Annual Saving</th>
                <th className="text-left py-2 px-3 text-slate-400 hidden md:table-cell">Comment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {RIVERSIDE.sensitivity.map((s, i) => (
                <tr key={i} className="hover:bg-slate-800/30">
                  <td className="py-3 px-3 text-white whitespace-pre-line text-xs font-medium">{s.scenario}</td>
                  <td className="py-3 px-3 text-right metric-mono text-slate-300 text-xs">{fmtCAD(s.statusQuoCost)}</td>
                  <td className="py-3 px-3 text-right metric-mono text-slate-300 text-xs">{fmtCAD(s.hubModelCost)}</td>
                  <td className="py-3 px-3 text-right metric-mono text-emerald-400 font-bold text-xs">{fmtCAD(s.saving)}</td>
                  <td className="py-3 px-3 text-slate-400 text-xs hidden md:table-cell">{s.comment}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
