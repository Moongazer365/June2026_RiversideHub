import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { RIVERSIDE } from '../data/constants'
import { KPICard, SectionHeader, fmtCAD, fmtNum, fmtPct } from '../components/UI'

export default function Capital({ data, inputs }) {
  const fm = RIVERSIDE.fmOpex

  const totalProject = data?.capital?.totalCost || 0
  const netFinancing = data?.capital?.mortgage || 0
  const debtService = data?.operations?.debtService || 0

  const hardBase = +(inputs?.hardBaseCost || 0)
  const designContPct = +(inputs?.designContingencyPct || 0)
  const escalRatePct = +(inputs?.escalationRatePct || 0)
  const escalMonths = +(inputs?.escalationMonths || 0)
  const softPct = +(inputs?.softCostsPct || 0)
  const constContPct = +(inputs?.constructionContingencyPct || 0)
  const preDev = +(inputs?.landCost || 0)

  const designContAmt = hardBase * (designContPct / 100)
  const escalBase = hardBase * (1 + designContPct / 100)
  const escalAmt = escalBase * (escalRatePct / 100) * (escalMonths / 12)
  const hardSubtotal = escalBase + escalAmt
  const softAmt = hardSubtotal * (softPct / 100)
  const constContAmt = hardSubtotal * (constContPct / 100)
  const totalConst = hardSubtotal + softAmt + constContAmt

  const grant = +(inputs?.grants || 0)
  const donations = +(inputs?.donations || 0)

  const financingStack = [
    { name: 'Provincial Grant', value: grant, color: '#6366f1' },
    { name: 'Donations & In-Kind', value: donations, color: '#10b981' },
    { name: 'Net Financing Required', value: Math.max(0, netFinancing), color: '#f59e0b' },
  ].filter(d => d.value > 0)

  const budget = [
    { label: 'Hard Construction Costs (Base)', value: hardBase, bold: false, total: false },
    { label: `Design Contingency (${designContPct.toFixed(1)}%)`, value: designContAmt, bold: false, total: false },
    { label: `Escalation (${escalRatePct.toFixed(1)}%/yr × ${escalMonths}mo)`, value: escalAmt, bold: false, total: false },
    { label: 'Class C Hard Subtotal', value: hardSubtotal, bold: true, total: false },
    { label: `Soft Costs (${softPct.toFixed(1)}%)`, value: softAmt, bold: false, total: false },
    { label: `Construction Contingency (${constContPct.toFixed(1)}%)`, value: constContAmt, bold: false, total: false },
    { label: 'Total Construction Cost', value: totalConst, bold: true, total: false },
    { label: 'Pre-Development Costs', value: preDev, bold: false, total: false },
    { label: 'TOTAL PROJECT COST', value: totalProject, bold: true, total: true },
  ]

  const budgetLineSumMismatch = Math.abs(totalConst + preDev - totalProject) > 1

  return (
    <div className="space-y-6">
      <SectionHeader title="Capital Structure" sub="Construction budget and financing model — Class C Estimate" />
      <div className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 text-xs text-indigo-300">
        Values reflect current Scenario Planner inputs. Adjust assumptions in Scenario Planner → Project Inputs.
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-xl p-6">
          <div className="text-sm font-semibold text-slate-300 mb-4">Construction Budget</div>
          <div className="space-y-1">
            {budget.map((row, i) => (
              <div key={i} className={`flex justify-between items-center py-2 px-3 rounded ${row.total ? 'bg-indigo-600/20 border border-indigo-500/30' : row.bold ? 'bg-slate-800/50' : 'hover:bg-slate-800/30'}`}>
                <div className={`text-sm ${row.total ? 'font-bold text-white' : row.bold ? 'font-semibold text-slate-200' : 'text-slate-400'}`}>{row.label}</div>
                <div className={`metric-mono text-sm ${row.total ? 'text-indigo-300 font-bold' : row.bold ? 'text-white font-semibold' : 'text-slate-300'}`}>{fmtCAD(row.value)}</div>
              </div>
            ))}
          </div>
          {budgetLineSumMismatch && (
            <div className="text-xs text-amber-400 mt-2 italic">
              ⚠ Line items do not sum exactly to total — check input consistency.
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="glass-card rounded-xl p-6">
            <div className="text-sm font-semibold text-slate-300 mb-4">Financing Stack</div>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={financingStack} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value" stroke="none">
                    {financingStack.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip formatter={v => fmtCAD(v)} contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '11px' }} />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 border-t border-slate-700 pt-4 mt-2">
              {[
                { l: 'Provincial Grant', v: grant, color: 'text-indigo-300' },
                { l: 'Donations & In-Kind', v: donations, color: 'text-emerald-400' },
                { l: 'Net Financing Required', v: netFinancing, color: 'text-amber-400', bold: true },
                { l: 'Annual Debt Service (25yr)', v: debtService, color: 'text-slate-200' },
              ].map(({ l, v, color, bold }, i) => (
                <div key={i} className={`flex justify-between text-sm ${bold ? 'font-bold border-t border-slate-700 pt-2 mt-1' : ''}`}>
                  <span className="text-slate-400">{l}</span>
                  <span className={`metric-mono ${color}`}>{v < 0 ? '- ' : ''}{fmtCAD(Math.abs(v))}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-xl p-6">
        <div className="text-sm font-semibold text-slate-300 mb-2">FM Operating Cost Benchmark</div>
        <div className="text-xs text-slate-500 mb-4">High-performance new build · Non-profit · No property tax · Source: ASHE/BOMA/IFMA/Altus 2025</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
          <KPICard title="FM Rate" value="$13.00/sf" sub="Best-in-class new build" accent mono />
          <KPICard title="Above-Grade GFA" value={`${fmtNum(+(inputs?.buildingSize || 0))} sf`} sub="Total above-grade area" mono />
          <KPICard title="Annual Hub Opex" value={fmtCAD(fm.annualCost)} sub="Year 1 baseline" mono />
          <KPICard title="Property Tax" value="$0" sub="Non-profit exemption (OMA s.3)" mono />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {fm.breakdown.filter(b => b.rate > 0).map((b, i) => (
            <div key={i} className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
              <div className="text-xs text-slate-400 mb-1">{b.name}</div>
              <div className="metric-mono text-white font-semibold">${b.rate.toFixed(2)}<span className="text-xs text-slate-500">/sf</span></div>
              <div className="text-xs text-slate-500 mt-1">{fmtPct((b.rate / 13) * 100)} of OPEX</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
