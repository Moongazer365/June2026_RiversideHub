import { useMemo } from 'react'
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { KPICard, SectionHeader } from '../components/UI'
import { calcCapitalWave } from '../lib/finance'

const WILLOW_DEFERRED_CAPITAL = 823000

export default function CapitalWave({ b4Lhi, data, inputs }) {
  const hubAnnual = (data?.operations?.debtService || 0) + (data?.operations?.expenses || 0)
  const wave = calcCapitalWave(b4Lhi, hubAnnual)
  console.log('CAPITAL WAVE DIAGNOSTIC')
  console.log('b4Lhi raw:', JSON.stringify(b4Lhi, null, 2))
  console.log('wave.perPartner:', JSON.stringify(wave.perPartner, null, 2))
  const fmtCAD = v => new Intl.NumberFormat('en-CA', {
    style: 'currency', currency: 'CAD', maximumFractionDigits: 0
  }).format(v)
  const fmtCompact = v => `$${(v / 1000000).toFixed(0)}M`

  const partnerRows = useMemo(() => {
    return wave.perPartner.map(p => ({
      ...p,
      notes: p.partner.toLowerCase().includes('willowbridge')
        ? 'Owns 54 Brant Ave — $823K additional urgent deferred capital'
        : 'Lease-based — end of useful life within 3-5 years',
    }))
  }, [wave.perPartner])

  const totals = useMemo(
    () => partnerRows.reduce((acc, p) => ({
      sf: acc.sf + p.sf,
      year1Rent: acc.year1Rent + p.year1Rent,
      total25YrRent: acc.total25YrRent + p.total25YrRent,
      totalLhi: acc.totalLhi + p.totalLhi,
    }), { sf: 0, year1Rent: 0, total25YrRent: 0, totalLhi: 0 }),
    [partnerRows]
  )

  return (
    <div className="space-y-6">
      <SectionHeader
        title="The Capital Wave — 25-Year Cost of the Status Quo"
        sub="Every partner's current facility is at or near end of life. Without the Hub, partners face independent capital events plus escalating rent on newly-fit-up leased space. Over 25 years, this fragmented spending substantially exceeds the cost of the consolidated Hub."
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard title="Year 1 Rent (Fragmented)" value={fmtCAD(wave.year1Rent)} warn mono />
        <KPICard title="25-Year Rent Total" value={fmtCAD(wave.total25YrRent)} warn mono />
        <KPICard title="LHI Wave (One-Time)" value={fmtCAD(wave.totalLhi)} warn mono />
        <div className="glass-card rounded-xl p-4 border border-rose-500/40 bg-rose-500/10">
          <div className="text-xs text-rose-300 font-medium uppercase tracking-wider">25-Yr Fragmented Total</div>
          <div className="text-3xl font-bold metric-mono text-rose-200 mt-2">{fmtCAD(wave.combined25Yr)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <KPICard title="25-Yr Hub Total" value={fmtCAD(wave.hub25Yr)} accent mono />
        <div className="glass-card rounded-xl p-4 border border-emerald-500/40 bg-emerald-500/10">
          <div className="text-xs text-emerald-300 font-medium uppercase tracking-wider">25-Yr Savings (Hub vs Status Quo)</div>
          <div className="text-3xl font-bold metric-mono text-emerald-200 mt-2">{fmtCAD(wave.savings25Yr)}</div>
        </div>
      </div>

      <div className="glass-card rounded-xl p-6">
        <div className="text-sm font-semibold text-slate-300 mb-4">Per-Partner 25-Year Capital Event Summary</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-2 px-3 text-slate-400">Partner</th>
                <th className="text-right py-2 px-3 text-slate-400">Space (sf)</th>
                <th className="text-right py-2 px-3 text-slate-400">Year 1 Rent</th>
                <th className="text-right py-2 px-3 text-slate-400">25-Yr Rent</th>
                <th className="text-right py-2 px-3 text-slate-400">LHI One-Time</th>
                <th className="text-left py-2 px-3 text-slate-400">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {partnerRows.map(r => (
                <tr key={r.partner} className="hover:bg-slate-800/30">
                  <td className="py-3 px-3 text-white font-medium">{r.partner}</td>
                  <td className="py-3 px-3 text-right metric-mono text-slate-300">{r.sf.toLocaleString('en-CA')}</td>
                  <td className="py-3 px-3 text-right metric-mono text-amber-300">{fmtCAD(r.year1Rent)}</td>
                  <td className="py-3 px-3 text-right metric-mono text-amber-300">{fmtCAD(r.total25YrRent)}</td>
                  <td className="py-3 px-3 text-right metric-mono text-amber-200">{fmtCAD(r.totalLhi)}</td>
                  <td className="py-3 px-3 text-slate-300">{r.notes}</td>
                </tr>
              ))}
              <tr className="border-t border-indigo-500/40 bg-slate-900/60 font-bold">
                <td className="py-3 px-3 text-white">TOTAL</td>
                <td className="py-3 px-3 text-right metric-mono text-white">{totals.sf.toLocaleString('en-CA')}</td>
                <td className="py-3 px-3 text-right metric-mono text-white">{fmtCAD(totals.year1Rent)}</td>
                <td className="py-3 px-3 text-right metric-mono text-white">{fmtCAD(totals.total25YrRent)}</td>
                <td className="py-3 px-3 text-right metric-mono text-white">{fmtCAD(totals.totalLhi)}</td>
                <td className="py-3 px-3" />
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="glass-card rounded-xl p-6">
        <div className="text-sm font-semibold text-slate-300 mb-4">25-Year Cumulative Cost Trajectory</div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={wave.yearByYear}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="year" interval={4} tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis tickFormatter={fmtCompact} tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <Tooltip
                formatter={v => fmtCAD(v)}
                contentStyle={{ backgroundColor:'#0f172a', border:'1px solid #334155', borderRadius:'8px', color:'#fff' }}
              />
              <Legend />
              <Line type="monotone" dataKey="cumFragmented" name="Fragmented Status Quo" stroke="#f59e0b" strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="cumHub" name="Hub Model" stroke="#10b981" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-card rounded-xl p-6 border border-amber-500/40 bg-amber-500/5 space-y-3">
        <div className="text-amber-200 font-semibold text-base">The status quo is not a zero-capital option.</div>
        <p className="text-sm text-slate-300">
          Even if every partner stays in place today, they collectively spend $2.2 million annually on duplicated overhead. Willowbridge alone faces $823,000 in urgent capital repairs that cannot be deferred.
        </p>
        <p className="text-sm text-slate-300">
          But staying in place is not an option. Every partner's current facility is reaching the end of its useful life. Over the next 25 years, fragmented capital and lease spending across the consortium will total approximately {fmtCAD(wave.combined25Yr)} — provincial funding spread across five disconnected projects delivering five fragmented solutions.
        </p>
        <div className="text-amber-200 font-semibold">
          The Hub consolidates this into a single purpose-built facility. Over the same 25 years, the Hub costs {fmtCAD(wave.hub25Yr)} — a net saving of {fmtCAD(wave.savings25Yr)} to the healthcare system.
        </div>
      </div>

      <div className="text-xs italic text-slate-500">
        Assumes 5% lease escalation every 5 years (industry standard), 2.5% Hub operating cost inflation, and partner space requirements as configured in the B4 LHI tab. Willowbridge's $823K urgent capital is separate from the lease/LHI trajectory. BCHCS excluded pending data confirmation.
      </div>
    </div>
  )
}
