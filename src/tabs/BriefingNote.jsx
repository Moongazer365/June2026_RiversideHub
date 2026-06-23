import { useState } from 'react'
import { RIVERSIDE } from '../data/constants'
import { calcCapitalWave } from '../lib/finance'

const WILLOW_DEFERRED = 823000

export default function BriefingNote({ data, inputs, fundability, partners, statusQuoTotal, b4Lhi }) {
  const [exporting, setExporting] = useState(false)

  const fmtCompact = v => {
    if (v >= 1000000) return `$${(v / 1000000).toFixed(2)}M`
    if (v >= 1000) return `$${(v / 1000).toFixed(0)}K`
    return `$${v}`
  }

  const fmtCompactShort = v => {
    if (v >= 1000000) {
      const n = v / 1000000
      return n >= 10 ? `$${Math.round(n)}M` : `$${n.toFixed(1)}M`
    }
    if (v >= 1000) return `$${Math.round(v / 1000)}K`
    return `$${v}`
  }

  const totalCost = data?.capital?.totalCost || 0
  const grant = +(inputs?.grants || 0)
  const grantPct = totalCost > 0 ? Math.round((grant / totalCost) * 100) : 0
  const donations = +(inputs?.donations || 0)
  const mortgage = data?.capital?.mortgage || 0
  const debtService = data?.operations?.debtService || 0
  const expenses = data?.operations?.expenses || 0
  const hubModelCost = debtService + expenses
  const annualSaving = (statusQuoTotal || 0) - hubModelCost
  const saving25yr = annualSaving * 25
  const costReductionPct = statusQuoTotal > 0
    ? Math.round((annualSaving / statusQuoTotal) * 100)
    : 0
  const buildingGFA = +(inputs?.buildingSize) || 57800
  const activePartnerCount = (partners || []).filter(p =>
    !(p.name || '').toLowerCase().includes('bchcs') &&
    (+p.share || 0) > 0
  ).length || 4

  const hubAnnual = hubModelCost
  const wave = calcCapitalWave(b4Lhi, hubAnnual)
  const impendingCapital = wave.totalLhi + WILLOW_DEFERRED

  const dateStr = new Date().toLocaleDateString('en-CA')
  const fileDate = new Date().toISOString().slice(0, 10)

  const buildPrintHtml = () => {
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Riverside Hub — Briefing Note</title>
<style>
  * { box-sizing: border-box; }
  @page { margin: 10mm; size: letter; }
  body { font-family: Georgia, 'Times New Roman', serif; font-size: 11pt; line-height: 1.45; color: #111; background: #fff; margin: 0; padding: 16px; }
  h1 { font-family: 'Segoe UI', Arial, sans-serif; font-size: 18pt; color: #0f172a; margin: 0 0 4px 0; font-weight: 800; }
  .sub { font-size: 9pt; color: #4b5563; margin: 0 0 2px 0; }
  .date { font-size: 8pt; color: #6b7280; margin-bottom: 16px; }
  h2 { font-family: 'Segoe UI', Arial, sans-serif; font-size: 9pt; text-transform: uppercase; letter-spacing: 0.1em; color: #3730a3; margin: 16px 0 8px 0; border-bottom: 1px solid #e5e7eb; padding-bottom: 3px; }
  p { margin: 0 0 8px 0; max-width: 70ch; }
  .grid3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin: 8px 0; }
  .grid4 { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 8px; margin: 8px 0; }
  .kpi { border: 1px solid #e5e7eb; border-radius: 4px; padding: 8px 10px; text-align: center; }
  .kpi .n { font-size: 15pt; font-weight: 700; color: #0f172a; font-family: 'Segoe UI', Arial, sans-serif; }
  .kpi .l { font-size: 7pt; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 2px; }
  .kpi-hero { max-width: 360px; margin: 8px auto; }
  .kpi-hero .n { font-size: 20pt; }
  .footer { font-size: 8pt; color: #9ca3af; margin-top: 12px; }
</style>
</head>
<body>
  <h1>Riverside Hub — Briefing Note</h1>
  <p class="sub">${RIVERSIDE.project.address} · ${RIVERSIDE.project.operator}</p>
  <p class="date">Generated ${dateStr}</p>

  <h2>The Opportunity</h2>
  <p>${activePartnerCount} community health and social service organizations in Brantford currently spend ${fmtCompact(statusQuoTotal || 0)} each year on separate overhead — duplicated rent, utilities, admin, and deferred capital that never reaches a client. The Riverside Hub consolidates them into one purpose-built facility, redirecting ${fmtCompact(annualSaving)} annually to frontline care.</p>

  <h2>The Project</h2>
  <div class="grid3">
    <div class="kpi"><div class="n">${fmtCompact(totalCost)}</div><div class="l">Total Cost</div></div>
    <div class="kpi"><div class="n">${buildingGFA.toLocaleString('en-CA')} sq ft</div><div class="l">Gross Floor Area</div></div>
    <div class="kpi"><div class="n">${activePartnerCount}</div><div class="l">Partners</div></div>
  </div>

  <h2>The Return to Taxpayers</h2>
  <div class="grid4">
    <div class="kpi"><div class="n">${fmtCompact(annualSaving)}</div><div class="l">Per Year</div></div>
    <div class="kpi"><div class="n">${fmtCompactShort(saving25yr)}</div><div class="l">Over 25 Years</div></div>
    <div class="kpi"><div class="n">${costReductionPct}%</div><div class="l">Cost Reduction</div></div>
    <div class="kpi"><div class="n">100%</div><div class="l">Back to Frontline</div></div>
  </div>

  <h2>The Ask</h2>
  <div class="kpi kpi-hero">
    <div class="n">${fmtCompact(grant)}</div>
    <div class="l">One-Time Provincial Capital Grant (${grantPct}%)</div>
  </div>
  <p>A one-time investment. Partners contribute ${fmtCompact(donations)} in donations and in-kind support, plus ${fmtCompact(mortgage)} serviced through partner lease payments. No ongoing operating subsidy. No recurring ask.</p>

  <h2>Why Now</h2>
  <p>Without this investment, these ${activePartnerCount} organizations will each independently face separate leasehold improvement costs and capital events totaling roughly ${fmtCompact(impendingCapital)} — ${fmtCompact(impendingCapital)} of provincial funding scattered across ${activePartnerCount} disconnected projects. Willowbridge alone faces $823K in urgent repairs at 54 Brant Ave that cannot be deferred further. This is not a question of whether provincial dollars will be spent — it is a question of whether they are spent once, strategically, or many times over, fragmented.</p>

  <h2>Shovel-Ready</h2>
  <p>Willowbridge owns 54 Brant Ave. Class C construction estimates complete. Partner agreements in place. Ready to proceed upon funding confirmation.</p>

  <p class="footer">Scenario status: ${fundability?.status || '—'} · Internal model output — not a commitment. Policy ${RIVERSIDE.project.policyVersion}</p>
</body>
</html>`
  }

  const handlePDF = () => {
    setExporting(true)
    const html = buildPrintHtml()
    const w = window.open('', '_blank', 'width=900,height=700')
    w.document.write(html)
    w.document.close()
    setTimeout(() => {
      w.focus()
      w.print()
      setExporting(false)
    }, 400)
  }

  const handleWord = () => {
    const html = buildPrintHtml()
    const blob = new Blob(['\ufeff', html], { type: 'application/msword' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Riverside_Hub_Briefing_Note_${fileDate}.doc`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const kpi = (value, label) => (
    <div className="rounded-lg border border-slate-700/80 bg-slate-900/30 px-4 py-3 text-center">
      <div className="text-lg md:text-xl font-bold text-white font-[system-ui] tracking-tight">{value}</div>
      <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-1 font-medium">{label}</div>
    </div>
  )

  return (
    <div className="glass-card rounded-xl p-6 md:p-8 border border-slate-800/80 max-w-3xl mx-auto space-y-8 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Riverside Hub — Briefing Note</h1>
          <p className="text-sm text-slate-400 mt-1">{RIVERSIDE.project.address} · {RIVERSIDE.project.operator}</p>
          <p className="text-xs text-slate-500 mt-2">Generated {dateStr}</p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <button
            type="button"
            onClick={handlePDF}
            disabled={exporting}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-slate-700 hover:bg-slate-600 border border-slate-600 disabled:opacity-50"
          >
            {exporting ? 'Preparing…' : 'Export PDF'}
          </button>
          <button
            type="button"
            onClick={handleWord}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-slate-700 hover:bg-slate-600 border border-slate-600"
          >
            Export Word
          </button>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-400">The Opportunity</h2>
        <p className="text-[15px] text-slate-200 leading-relaxed max-w-[70ch]">
          {activePartnerCount} community health and social service organizations in Brantford currently spend {fmtCompact(statusQuoTotal || 0)} each year
          on separate overhead — duplicated rent, utilities, admin, and deferred capital that never reaches a client. The Riverside Hub
          consolidates them into one purpose-built facility, redirecting {fmtCompact(annualSaving)} annually to frontline care.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-400">The Project</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {kpi(fmtCompact(totalCost), 'Total Cost')}
          {kpi(`${buildingGFA.toLocaleString('en-CA')} sq ft`, 'Gross Floor Area')}
          {kpi(String(activePartnerCount), 'Partners')}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-400">The Return to Taxpayers</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {kpi(fmtCompact(annualSaving), 'Per Year')}
          {kpi(fmtCompactShort(saving25yr), 'Over 25 Years')}
          {kpi(`${costReductionPct}%`, 'Cost Reduction')}
          {kpi('100%', 'Back to Frontline')}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-400">The Ask</h2>
        <div className="max-w-md mx-auto">
          {kpi(fmtCompact(grant), `One-Time Provincial Capital Grant (${grantPct}%)`)}
        </div>
        <p className="text-[15px] text-slate-200 leading-relaxed max-w-[70ch]">
          A one-time investment. Partners contribute {fmtCompact(donations)} in donations and in-kind support, plus {fmtCompact(mortgage)} serviced
          through partner lease payments. No ongoing operating subsidy. No recurring ask.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-400">Why Now</h2>
        <p className="text-[15px] text-slate-200 leading-relaxed max-w-[70ch]">
          Without this investment, these {activePartnerCount} organizations will each independently face separate leasehold improvement costs and capital events totaling roughly{' '}
          {fmtCompact(impendingCapital)} — {fmtCompact(impendingCapital)} of provincial funding scattered across {activePartnerCount} disconnected projects. Willowbridge alone faces
          $823K in urgent repairs at 54 Brant Ave that cannot be deferred further. This is not a question of whether provincial dollars will be spent — it is a question
          of whether they are spent once, strategically, or many times over, fragmented.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-400">Shovel-Ready</h2>
        <p className="text-[15px] text-slate-200 leading-relaxed max-w-[70ch]">
          Willowbridge owns 54 Brant Ave. Class C construction estimates complete. Partner agreements in place. Ready to proceed upon funding confirmation.
        </p>
      </section>

      <p className="text-xs text-slate-500 max-w-[70ch]">
        Scenario status: {fundability?.status || '—'} · Internal model output — not a commitment. Policy {RIVERSIDE.project.policyVersion}
      </p>
    </div>
  )
}
