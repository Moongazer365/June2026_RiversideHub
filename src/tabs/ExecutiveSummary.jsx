import { useState, useMemo } from 'react'
import { RIVERSIDE } from '../data/constants'
import { formatDscrDisplay, calcCapitalWave } from '../lib/finance'
import { fmtCAD, fmtPct, InfoTooltip } from '../components/UI'

const DSCR_INFO_TEXT = 'Debt Service Coverage Ratio — measures ability to cover debt payments from operating income. Formula: NOI ÷ Annual Debt Service. A DSCR of 1.25x means the project generates $1.25 for every $1.00 of debt owed. Minimum threshold: ≥1.20x'

const SIMPLE_PAYBACK_INFO_TEXT =
  'Simple Payback is the number of years required for cumulative savings to equal the total project cost. Formula: Total Project Cost ÷ Annual Saving. This is a simplified metric that does not account for inflation or the time value of money. It is useful as a first-pass indicator of investment scale, not as a return analysis.'

const STATUS_STYLE = {
  STABLE: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10',
  'AT-RISK': 'text-rose-400 border-rose-500/40 bg-rose-500/10',
  WATCH: 'text-amber-400 border-amber-500/40 bg-amber-500/10',
}

function bucketSelectionLabel(selectedBuckets) {
  const s = new Set(selectedBuckets || [])
  const b = k => s.has(k)
  if (b('b1') && b('b2') && b('b3') && b('b4')) return 'Full Liability (All Buckets)'
  if (b('b1') && b('b2') && b('b3') && !b('b4')) return 'Moderate (B1+B2+B3)'
  if (b('b1') && b('b2') && b('b4') && !b('b3')) return 'Likely (B1+B2+B4)'
  if (b('b1') && b('b2') && !b('b3') && !b('b4')) return 'Conservative (B1+B2)'
  return 'Custom bucket mix'
}

export default function ExecutiveSummary({ data, inputs, partners, fundability, statusQuoTotal, selectedBuckets, b4Lhi }) {
  const [exporting, setExporting] = useState(false)
  const now = new Date()
  const dateLabel = now.toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })
  const fileDate = now.toISOString().slice(0, 10)
  const grantPct = data.capital.totalCost > 0 ? Math.round(((+inputs.grants || 0) / data.capital.totalCost) * 100) : 0
  const hubModelCost = (+data.operations.debtService || 0) + (+data.operations.expenses || 0)
  const hubAnnual = (+data?.operations?.debtService || 0) + (+data?.operations?.expenses || 0)
  const wave = calcCapitalWave(b4Lhi, hubAnnual)
  const annualSaving = statusQuoTotal - hubModelCost
  const saving25yr = annualSaving * 25
  const costReduction = statusQuoTotal > 0 ? ((annualSaving / statusQuoTotal) * 100).toFixed(1) : '0.0'
  const simplePayback = annualSaving > 0 ? (data.capital.totalCost / annualSaving).toFixed(1) : null
  const gfa = +inputs.buildingSize || 57800
  const scenarioName = inputs.name || 'Current Scenario'
  const bucketLabel = bucketSelectionLabel(selectedBuckets)
  const hardBase = +(inputs?.hardBaseCost || 0)
  const designContPct = +(inputs?.designContingencyPct || 0)
  const escalRatePct = +(inputs?.escalationRatePct || 0)
  const escalMonths = +(inputs?.escalationMonths || 0)
  const softPct = +(inputs?.softCostsPct || 0)
  const constContPct = +(inputs?.constructionContingencyPct || 0)
  const preDev = +(inputs?.landCost || 0)
  const hardSubtotal = hardBase * (1 + designContPct / 100) * (1 + escalRatePct / 100 * escalMonths / 12)
  const softAmt = hardSubtotal * (softPct / 100)
  const constContAmt = hardSubtotal * (constContPct / 100)
  const totalConst = hardSubtotal + softAmt + constContAmt
  const totalProject = totalConst + preDev

  const partnerSource = data?.partners?.length ? data.partners : (partners || [])
  const partnerRows = partnerSource.map(p => {
    const current = +p.currentRent || 0
    const proposed = (+p.lease || 0) + (+p.tax || 0)
    const saving = current - proposed
    const savingPct = current > 0 ? ((saving / current) * 100) : 0
    return { ...p, current, proposed, saving, savingPct }
  })
  const partnerTotals = partnerRows.reduce((acc, p) => ({
    share: acc.share + p.share,
    current: acc.current + p.current,
    proposed: acc.proposed + p.proposed,
    saving: acc.saving + p.saving,
  }), { share: 0, current: 0, proposed: 0, saving: 0 })
  partnerTotals.savingPct = partnerTotals.current > 0 ? ((partnerTotals.saving / partnerTotals.current) * 100).toFixed(1) : '—'

  const waveTableTotals = useMemo(() => wave.perPartner.reduce((acc, p) => ({
    sf: acc.sf + p.sf,
    year1Rent: acc.year1Rent + p.year1Rent,
    total25YrRent: acc.total25YrRent + p.total25YrRent,
    totalLhi: acc.totalLhi + p.totalLhi,
  }), { sf: 0, year1Rent: 0, total25YrRent: 0, totalLhi: 0 }), [wave.perPartner])

  const handlePDF = () => {
    setExporting(true)
    
    const paybackDisplay = simplePayback != null ? `${simplePayback} years` : 'N/A'
    const fmt = v => new Intl.NumberFormat('en-CA', {style:'currency',currency:'CAD',maximumFractionDigits:0}).format(v)

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Riverside Hub Executive Summary</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; font-size: 11px; color: #111; background: #fff; padding: 20px; }
  h1 { font-size: 22px; color: #1e3a8a; margin-bottom: 4px; }
  h2 { font-size: 13px; color: #1e3a8a; text-transform: uppercase; letter-spacing: .05em; border-bottom: 2px solid #1e3a8a; padding-bottom: 4px; margin: 20px 0 10px 0; }
  .subtitle { color: #6b7280; font-size: 11px; margin-bottom: 4px; }
  .header-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px; }
  .status { display: inline-block; padding: 3px 12px; border-radius: 12px; font-weight: 700; font-size: 11px; background: #dcfce7; color: #166534; border: 1px solid #166534; }
  .status.watch { background: #fef9c3; color: #854d0e; border-color: #854d0e; }
  .status.risk { background: #fee2e2; color: #991b1b; border-color: #991b1b; }
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 12px; }
  .grid4 { display: grid; grid-template-columns: repeat(4,1fr); gap: 10px; margin-bottom: 12px; }
  .grid3 { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; margin-bottom: 12px; }
  .card { border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px; }
  .card-label { font-size: 9px; color: #6b7280; text-transform: uppercase; letter-spacing: .05em; margin-bottom: 4px; }
  .card-value { font-size: 18px; font-weight: 700; color: #111; }
  .card-value.green { color: #166534; }
  .card-value.amber { color: #92400e; }
  .card-value.blue { color: #1e3a8a; }
  .opportunity { background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 6px; padding: 14px; font-size: 11px; line-height: 1.6; color: #374151; }
  table { width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 8px; }
  th { background: #1e3a8a; color: #fff; padding: 7px 10px; text-align: left; font-weight: 600; }
  td { padding: 6px 10px; border-bottom: 1px solid #e5e7eb; }
  tr:nth-child(even) td { background: #f9fafb; }
  .total-row td { font-weight: 700; background: #eff6ff; border-top: 2px solid #1e3a8a; }
  .pass { color: #166534; font-weight: 700; }
  .fail { color: #991b1b; font-weight: 700; }
  .disclaimer { font-size: 9px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 10px; margin-top: 20px; line-height: 1.5; }
  .footer { text-align: center; font-size: 9px; color: #9ca3af; margin-top: 16px; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>

<div class="header-row">
  <div>
    <h1>Riverside Hub — Executive Summary</h1>
    <p class="subtitle">54 Brant Ave, Brantford ON | Willowbridge Community Services | Q1 2026</p>
    <p class="subtitle">Scenario: ${scenarioName}</p>
    <p class="subtitle">${bucketLabel} · Status Quo: ${fmt(statusQuoTotal)}</p>
    <p class="subtitle">Generated ${new Date().toLocaleDateString('en-CA', {year:'numeric',month:'long',day:'numeric'})}</p>
  </div>
  <span class="status ${fundability.status === 'AT-RISK' ? 'risk' : fundability.status === 'WATCH' ? 'watch' : ''}">${fundability.status}</span>
</div>

<h2>Project Overview</h2>
<div class="grid2">
  <div class="opportunity">
    <strong>The Opportunity</strong><br><br>
    The Riverside Hub is a proposed multi-use shared hub (MUSH) facility that will consolidate five health and social service organizations into a single purpose-built facility at 54 Brant Ave, Brantford ON. The Hub model eliminates duplicated overhead, deferred capital liability, and fragmented service delivery across consortium partners.
  </div>
  <table>
    <tr><td>Total Project Cost</td><td style="text-align:right;font-weight:700;">${fmt(data.capital.totalCost)}</td></tr>
    <tr><td>Provincial Grant (${grantPct}%)</td><td style="text-align:right;">${fmt(+inputs.grants||0)}</td></tr>
    <tr><td>Net Financing Required</td><td style="text-align:right;">${fmt(data.capital.mortgage)}</td></tr>
    <tr><td>Annual Debt Service</td><td style="text-align:right;">${fmt(data.operations.debtService)}</td></tr>
    <tr><td>Building GFA</td><td style="text-align:right;">${gfa.toLocaleString('en-CA')} sf</td></tr>
    <tr><td>Construction Start</td><td style="text-align:right;">2028 (estimated)</td></tr>
  </table>
</div>

<h2>The Business Case</h2>
<div class="grid4">
  <div class="card"><div class="card-label">Status Quo Annual Cost (${bucketLabel})</div><div class="card-value amber">${fmt(statusQuoTotal)}</div></div>
  <div class="card"><div class="card-label">Hub Model Annual Cost</div><div class="card-value green">${fmt(hubModelCost)}</div></div>
  <div class="card"><div class="card-label">Annual Saving</div><div class="card-value green">${fmt(annualSaving)}</div></div>
  <div class="card"><div class="card-label">25-Year Cumulative Saving</div><div class="card-value green">${fmt(saving25yr)}</div></div>
</div>
<div class="grid3">
  <div class="card"><div class="card-label">Cost Reduction</div><div class="card-value blue">${costReduction}%</div></div>
  <div class="card"><div class="card-label">Simple Payback</div><div class="card-value">${paybackDisplay}</div></div>
  <div class="card"><div class="card-label">DSCR</div><div class="card-value ${data.metrics.dscr >= 1.2 ? 'green' : 'amber'}">${formatDscrDisplay(data.metrics.dscr)}</div></div>
</div>

<h2>The Capital Wave — 25-Year Status Quo</h2>
<p style="font-size: 11px; line-height: 1.6; color: #374151; margin-bottom: 12px;">
  Every partner's current facility is at or near end of life. Without the Hub, partners face independent capital events plus escalating rent on newly fit-up leased space. Over 25 years, this fragmented spending substantially exceeds the cost of the consolidated Hub.
</p>
<div class="grid3">
  <div class="card">
    <div class="card-label">25-Yr Fragmented Status Quo</div>
    <div class="card-value amber">${fmt(wave.combined25Yr)}</div>
  </div>
  <div class="card">
    <div class="card-label">25-Yr Hub Model</div>
    <div class="card-value green">${fmt(wave.hub25Yr)}</div>
  </div>
  <div class="card">
    <div class="card-label">25-Yr Net Savings</div>
    <div class="card-value green" style="font-size: 22px;">${fmt(wave.savings25Yr)}</div>
  </div>
</div>
<table>
  <thead>
    <tr><th>Partner</th><th>Space (sf)</th><th>Year 1 Rent</th>
      <th>25-Yr Rent</th><th>LHI One-Time</th><th>Notes</th></tr>
  </thead>
  <tbody>
    ${wave.perPartner.map(p => `<tr>
      <td>${p.partner}</td>
      <td style="text-align:right;">${p.sf.toLocaleString('en-CA')}</td>
      <td style="text-align:right;">${fmt(p.year1Rent)}</td>
      <td style="text-align:right;">${fmt(p.total25YrRent)}</td>
      <td style="text-align:right;">${fmt(p.totalLhi)}</td>
      <td style="font-size: 9px; color: #4b5563;">${p.partner.toLowerCase().includes('willowbridge')
        ? 'Owns 54 Brant Ave — $823K additional urgent deferred capital'
        : 'Lease-based — end of useful life within 3-5 years'}</td>
    </tr>`).join('')}
    <tr class="total-row">
      <td>TOTAL</td>
      <td style="text-align:right;">${wave.perPartner.reduce((s, p) => s + p.sf, 0).toLocaleString('en-CA')}</td>
      <td style="text-align:right;">${fmt(wave.perPartner.reduce((s, p) => s + p.year1Rent, 0))}</td>
      <td style="text-align:right;">${fmt(wave.perPartner.reduce((s, p) => s + p.total25YrRent, 0))}</td>
      <td style="text-align:right;">${fmt(wave.perPartner.reduce((s, p) => s + p.totalLhi, 0))}</td>
      <td></td>
    </tr>
  </tbody>
</table>
<p style="font-size: 10px; font-style: italic; color: #6b7280; margin-top: 8px;">
  Assumes 5% lease escalation every 5 years, 2.5% Hub operating cost inflation. Willowbridge's $823K urgent capital is separate. BCHCS excluded pending data confirmation.
</p>

<h2>Consortium Partners</h2>
<table>
  <thead><tr><th>Partner</th><th>Share %</th><th>Current Annual Cost</th><th>Proposed Hub Cost</th><th>Annual Saving</th><th>Saving %</th></tr></thead>
  <tbody>
    ${partnerRows.map(p => {
      return `<tr>
        <td>${p.name}</td>
        <td style="text-align:center;">${p.share}%</td>
        <td style="text-align:right;">${fmt(p.current)}</td>
        <td style="text-align:right;">${fmt(p.proposed)}</td>
        <td style="text-align:right;color:${p.saving>=0?'#166534':'#991b1b'};font-weight:600;">${fmt(p.saving)}</td>
        <td style="text-align:center;">${p.current > 0 ? p.savingPct.toFixed(1) + '%' : '—'}</td>
      </tr>`
    }).join('')}
    <tr class="total-row">
      <td>TOTAL</td>
      <td style="text-align:center;">${partnerTotals.share}%</td>
      <td style="text-align:right;">${fmt(partnerTotals.current)}</td>
      <td style="text-align:right;">${fmt(partnerTotals.proposed)}</td>
      <td style="text-align:right;color:#166534;">${fmt(partnerTotals.saving)}</td>
      <td></td>
    </tr>
  </tbody>
</table>

<h2>Sensitivity Analysis</h2>
<table>
  <thead><tr><th>Scenario</th><th>Status Quo Cost</th><th>Hub Model Cost</th><th>Annual Saving</th><th>Comment</th></tr></thead>
  <tbody>
    ${RIVERSIDE.sensitivity.map(s => `<tr>
      <td>${s.scenario.replace('\n',' ')}</td>
      <td style="text-align:right;">${fmt(s.statusQuoCost)}</td>
      <td style="text-align:right;">${fmt(s.hubModelCost)}</td>
      <td style="text-align:right;color:#166534;font-weight:600;">${fmt(s.saving)}</td>
      <td style="color:#6b7280;">${s.comment}</td>
    </tr>`).join('')}
  </tbody>
</table>

<h2>Readiness Assessment</h2>
<table>
  <thead><tr><th>Check</th><th>Target</th><th>Actual</th><th>Status</th></tr></thead>
  <tbody>
    ${fundability.rules.map(r => `<tr>
      <td>${r.name}</td>
      <td style="text-align:center;">${r.comparator==='lte'?'≤':'≥'}${r.target}${r.unit}</td>
      <td style="text-align:center;font-weight:700;">${r.value}${r.unit}</td>
      <td style="text-align:center;" class="${r.pass?'pass':'fail'}">${r.pass?'✓ PASS':'✗ FAIL'}</td>
    </tr>`).join('')}
  </tbody>
</table>

<h2>Cost Structure</h2>
<div class="grid2">
  <table>
    <thead><tr><th>Construction Budget</th><th style="text-align:right;">Amount</th></tr></thead>
    <tbody>
      <tr><td>Hard Construction Costs (Base)</td><td style="text-align:right;">${fmt(hardBase)}</td></tr>
      <tr><td>Class C Hard Subtotal</td><td style="text-align:right;">${fmt(hardSubtotal)}</td></tr>
      <tr><td>Soft Costs (${softPct}%)</td><td style="text-align:right;">${fmt(softAmt)}</td></tr>
      <tr><td>Construction Contingency (${constContPct}%)</td><td style="text-align:right;">${fmt(constContAmt)}</td></tr>
      <tr><td>Total Construction Cost</td><td style="text-align:right;">${fmt(totalConst)}</td></tr>
      <tr><td>Pre-Development Costs</td><td style="text-align:right;">${fmt(preDev)}</td></tr>
      <tr class="total-row"><td>TOTAL PROJECT COST</td><td style="text-align:right;">${fmt(totalProject)}</td></tr>
    </tbody>
  </table>
  <table>
    <thead><tr><th>Financing Stack</th><th style="text-align:right;">Amount</th></tr></thead>
    <tbody>
      <tr><td>Provincial Grant (${grantPct}%)</td><td style="text-align:right;">${fmt(+inputs.grants || 0)}</td></tr>
      <tr><td>Donations & In-Kind</td><td style="text-align:right;">${fmt(+inputs.donations || 0)}</td></tr>
      <tr><td>Net Financing Required</td><td style="text-align:right;">${fmt(+data.capital.mortgage || 0)}</td></tr>
      <tr><td>Annual Debt Service</td><td style="text-align:right;">${fmt(+data.operations.debtService || 0)}</td></tr>
    </tbody>
  </table>
</div>

<p class="disclaimer">This document is an internal capital planning tool only. All figures are based on modelled assumptions and require independent professional verification before use in funding applications, lending decisions, or board approvals. Riverside Hub Meta MUSH Platform · Policy NP-1.0</p>

<p class="footer">Generated by Riverside Hub Meta MUSH Platform · ${new Date().toLocaleDateString('en-CA')}</p>

</body>
</html>`

    const printWindow = window.open('', '_blank', 'width=900,height=700')
    printWindow.document.write(html)
    printWindow.document.close()
    
    setTimeout(() => {
      printWindow.focus()
      printWindow.print()
      setExporting(false)
    }, 800)
  }

  const handleWord = () => {
    try {
      const element = document.getElementById('executive-summary-content')
      if (!element) { alert('Content not found'); return }
      
      const styles = `
        <style>
          body { font-family: Arial, sans-serif; color: #000; margin: 20px; }
          h1 { color: #1e3a8a; font-size: 24px; }
          h2 { color: #1e3a8a; font-size: 16px; border-bottom: 2px solid #1e3a8a; padding-bottom: 4px; margin-top: 20px; }
          h3 { color: #374151; font-size: 14px; }
          table { border-collapse: collapse; width: 100%; margin: 12px 0; }
          th { background: #1e3a8a; color: white; padding: 8px 12px; text-align: left; font-size: 12px; }
          td { border: 1px solid #d1d5db; padding: 8px 12px; font-size: 12px; }
          tr:nth-child(even) td { background: #f9fafb; }
          .kpi { display: inline-block; border: 2px solid #1e3a8a; padding: 12px; margin: 8px; min-width: 150px; }
          .kpi-label { font-size: 10px; color: #6b7280; text-transform: uppercase; }
          .kpi-value { font-size: 20px; font-weight: bold; color: #1e3a8a; }
          p { font-size: 12px; line-height: 1.6; color: #374151; }
          .disclaimer { font-size: 10px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 12px; margin-top: 24px; }
        </style>
      `
      
      const content = element.innerHTML
      const fullHTML = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" 
              xmlns:w="urn:schemas-microsoft-com:office:word"
              xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          <title>Riverside Hub Executive Summary</title>
          ${styles}
        </head>
        <body>${content}</body>
        </html>
      `
      
      const blob = new Blob(['\ufeff', fullHTML], { 
        type: 'application/msword' 
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `Riverside_Hub_Executive_Summary_${new Date().toISOString().slice(0,10)}.doc`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch(err) {
      console.error('Word error:', err)
      alert('Word export failed: ' + err.message)
    }
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
      <div className="xl:col-span-9">
        <div id="executive-summary-content" className="glass-card rounded-xl p-6 space-y-6">
          <div className="border-b border-slate-700 pb-4">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-2xl font-bold text-white">Riverside Hub — Executive Summary</h1>
                <div className="text-sm text-slate-400 mt-1">54 Brant Ave, Brantford ON | Willowbridge Community Services | Q1 2026</div>
                <div className="text-xs text-cyan-300 mt-1">Scenario: {scenarioName}</div>
                <div className="text-xs text-slate-400 mt-1">{bucketLabel} · Status Quo: {fmtCAD(statusQuoTotal)}</div>
              </div>
              <div className="text-right">
                <span className={`text-xs font-bold px-3 py-1 rounded-full border ${STATUS_STYLE[fundability.status]}`}>{fundability.status}</span>
                <div className="text-xs text-slate-500 mt-2">Generated {dateLabel}</div>
              </div>
            </div>
          </div>

          <section className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-400">Project Overview</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-lg border border-slate-700 bg-slate-900/40 p-4 text-sm text-slate-300">
                <div className="text-xs font-semibold text-slate-200 mb-2">The Opportunity</div>
                The Riverside Hub is a proposed multi-use shared hub (MUSH) facility that will consolidate five health and social service organizations into a single purpose-built facility at 54 Brant Ave, Brantford ON. The Hub model eliminates duplicated overhead, deferred capital liability, and fragmented service delivery across consortium partners.
              </div>
              <div className="rounded-lg border border-slate-700 overflow-hidden">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-slate-800">
                    {[
                      ['Total Project Cost', fmtCAD(data.capital.totalCost)],
                      ['Provincial Grant (' + grantPct + '%)', fmtCAD(inputs.grants)],
                      ['Net Financing Required', fmtCAD(data.capital.mortgage)],
                      ['Annual Debt Service', fmtCAD(data.operations.debtService)],
                      ['Building GFA', `${gfa.toLocaleString('en-CA')} sf`],
                      ['Construction Start', '2028 (estimated)'],
                    ].map(([l, v]) => (
                      <tr key={l}>
                        <td className="py-2 px-3 text-slate-400">{l}</td>
                        <td className="py-2 px-3 text-right metric-mono text-white font-semibold">{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-400">The Business Case</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3"><div className="text-xs text-slate-400 uppercase">Status Quo Annual Cost</div><div className="text-[10px] text-cyan-300 mt-0.5 font-medium">{bucketLabel}</div><div className="metric-mono text-lg font-bold text-amber-300">{fmtCAD(statusQuoTotal)}</div></div>
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3"><div className="text-xs text-slate-400 uppercase">Hub Model Annual Cost</div><div className="metric-mono text-lg font-bold text-emerald-300">{fmtCAD(hubModelCost)}</div></div>
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3"><div className="text-xs text-slate-400 uppercase">Annual Saving</div><div className="metric-mono text-lg font-extrabold text-emerald-300">{fmtCAD(annualSaving)}</div></div>
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3"><div className="text-xs text-slate-400 uppercase">25-Year Cumulative Saving</div><div className="metric-mono text-lg font-bold text-emerald-300">{fmtCAD(saving25yr)}</div></div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
              {[
                { key:'B1', label:'Operations', desc:'Day-to-day facility costs — utilities, admin, IT, staffing', color:'text-indigo-400', active: selectedBuckets.includes('b1') },
                { key:'B2', label:'Deferred Capital', desc:'Urgent repairs that cannot be deferred — roof, HVAC, accessibility', color:'text-amber-400', active: selectedBuckets.includes('b2') },
                { key:'B3', label:'Capital Expansion', desc:'Cost to independently build or expand space to meet program needs', color:'text-emerald-400', active: selectedBuckets.includes('b3') },
                { key:'B4', label:'Leasehold Improvements', desc:'Fit-up costs if partners independently lease new space', color:'text-cyan-400', active: selectedBuckets.includes('b4') },
              ].map(b => (
                <div key={b.key} className={`p-2 rounded-lg border text-xs ${b.active ? 'border-slate-600 bg-slate-800/50' : 'border-slate-800 opacity-40'}`}>
                  <div className="flex items-center gap-1 mb-1">
                    <span className={`font-bold ${b.color}`}>{b.key}</span>
                    <span className="text-slate-300 font-semibold">{b.label}</span>
                    {b.active && <span className="ml-auto text-emerald-400 text-xs">✓</span>}
                  </div>
                  <div className="text-slate-500 leading-relaxed">{b.desc}</div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-3"><div className="text-xs text-slate-400">Cost Reduction %</div><div className="metric-mono text-xl font-bold text-white">{costReduction}%</div></div>
              <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-3"><div className="text-xs text-slate-400 flex items-center">Simple Payback <InfoTooltip text={SIMPLE_PAYBACK_INFO_TEXT} /></div><div className="metric-mono text-xl font-bold text-white">{simplePayback ? `${simplePayback} years` : 'N/A'}</div></div>
              <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-3"><div className="text-xs text-slate-400 flex items-center">DSCR <InfoTooltip text={DSCR_INFO_TEXT} /></div><div className="metric-mono text-xl font-bold text-white">{formatDscrDisplay(data.metrics.dscr)}</div></div>
            </div>
          </section>

          <section className="glass-card rounded-xl p-6 space-y-4 border border-slate-700/80 bg-slate-900/30">
            <h2 className="text-xl font-semibold text-white">The Capital Wave — 25-Year Status Quo</h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Every partner&apos;s current facility is at or near end of life. Without the Hub, partners face independent capital events
              plus escalating rent on newly fit-up leased space. Over 25 years, this fragmented spending substantially exceeds the
              cost of the consolidated Hub.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
                <div className="text-xs text-amber-200/80 uppercase tracking-wider mb-1">25-Yr Fragmented Status Quo</div>
                <div className="metric-mono text-2xl font-bold text-amber-200">{fmtCAD(wave.combined25Yr)}</div>
              </div>
              <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4">
                <div className="text-xs text-emerald-200/80 uppercase tracking-wider mb-1">25-Yr Hub Model</div>
                <div className="metric-mono text-2xl font-bold text-emerald-200">{fmtCAD(wave.hub25Yr)}</div>
              </div>
              <div className="rounded-xl border border-emerald-500/50 bg-emerald-500/15 p-4">
                <div className="text-xs text-emerald-200/80 uppercase tracking-wider mb-1">25-Yr Net Savings</div>
                <div className="metric-mono text-3xl font-extrabold text-emerald-300">{fmtCAD(wave.savings25Yr)}</div>
              </div>
            </div>
            <div className="rounded-lg border border-slate-700 overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-900/60 border-b border-slate-700">
                    <th className="text-left py-2 px-3 text-slate-400">Partner</th>
                    <th className="text-right py-2 px-3 text-slate-400">Space (sf)</th>
                    <th className="text-right py-2 px-3 text-slate-400">Year 1 Rent</th>
                    <th className="text-right py-2 px-3 text-slate-400">25-Yr Rent</th>
                    <th className="text-right py-2 px-3 text-slate-400">LHI One-Time</th>
                    <th className="text-left py-2 px-3 text-slate-400">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {wave.perPartner.map((p, i) => (
                    <tr key={`${p.partner}-${i}`}>
                      <td className="py-2 px-3 text-slate-200 font-medium">{p.partner}</td>
                      <td className="py-2 px-3 text-right metric-mono text-slate-300">{p.sf.toLocaleString('en-CA')}</td>
                      <td className="py-2 px-3 text-right metric-mono text-amber-300">{fmtCAD(p.year1Rent)}</td>
                      <td className="py-2 px-3 text-right metric-mono text-amber-300">{fmtCAD(p.total25YrRent)}</td>
                      <td className="py-2 px-3 text-right metric-mono text-amber-300">{fmtCAD(p.totalLhi)}</td>
                      <td className="py-2 px-3 text-slate-400 text-[11px] leading-snug">
                        {p.partner.toLowerCase().includes('willowbridge')
                          ? 'Owns 54 Brant Ave — $823K additional urgent deferred capital'
                          : 'Lease-based — end of useful life within 3-5 years'}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-900/70 border-t border-slate-600 font-bold">
                    <td className="py-2 px-3 text-white">TOTAL</td>
                    <td className="py-2 px-3 text-right metric-mono text-white">{waveTableTotals.sf.toLocaleString('en-CA')}</td>
                    <td className="py-2 px-3 text-right metric-mono text-amber-200">{fmtCAD(waveTableTotals.year1Rent)}</td>
                    <td className="py-2 px-3 text-right metric-mono text-amber-200">{fmtCAD(waveTableTotals.total25YrRent)}</td>
                    <td className="py-2 px-3 text-right metric-mono text-amber-200">{fmtCAD(waveTableTotals.totalLhi)}</td>
                    <td className="py-2 px-3" />
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs italic text-slate-500">
              Assumes 5% lease escalation every 5 years, 2.5% Hub operating cost inflation. Willowbridge&apos;s $823K urgent capital is separate.
              BCHCS excluded pending data confirmation.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-400">Consortium Partners</h2>
            <div className="rounded-lg border border-slate-700 overflow-hidden">
              <table className="w-full text-xs">
                <thead><tr className="bg-slate-900/60 border-b border-slate-700"><th className="text-left py-2 px-3 text-slate-400">Partner</th><th className="text-right py-2 px-3 text-slate-400">Share %</th><th className="text-right py-2 px-3 text-slate-400">Current Annual Cost</th><th className="text-right py-2 px-3 text-slate-400">Proposed Hub Cost</th><th className="text-right py-2 px-3 text-slate-400">Annual Saving</th><th className="text-right py-2 px-3 text-slate-400">Saving %</th></tr></thead>
                <tbody className="divide-y divide-slate-800">
                  {partnerRows.map(r=>(
                    <tr key={r.name}>
                      <td className="py-2 px-3 text-slate-200">{r.name}</td>
                      <td className="py-2 px-3 text-right metric-mono text-slate-300">{r.share}%</td>
                      <td className="py-2 px-3 text-right metric-mono text-slate-200">{fmtCAD(r.current)}</td>
                      <td className="py-2 px-3 text-right metric-mono text-indigo-300">{fmtCAD(r.proposed)}</td>
                      <td className={`py-2 px-3 text-right metric-mono font-semibold ${r.saving>=0?'text-emerald-400':'text-rose-400'}`}>{fmtCAD(r.saving)}</td>
                      <td className={`py-2 px-3 text-right metric-mono ${r.saving>=0?'text-emerald-400':'text-rose-400'}`}>{r.current > 0 ? `${r.savingPct.toFixed(1)}%` : '—'}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-900/60 border-t border-indigo-500/40 font-bold">
                    <td className="py-2 px-3 text-white">TOTAL</td>
                    <td className="py-2 px-3 text-right metric-mono text-white">{partnerTotals.share}%</td>
                    <td className="py-2 px-3 text-right metric-mono text-white">{fmtCAD(partnerTotals.current)}</td>
                    <td className="py-2 px-3 text-right metric-mono text-white">{fmtCAD(partnerTotals.proposed)}</td>
                    <td className={`py-2 px-3 text-right metric-mono ${partnerTotals.saving>=0?'text-emerald-400':'text-rose-400'}`}>{fmtCAD(partnerTotals.saving)}</td>
                    <td className={`py-2 px-3 text-right metric-mono ${partnerTotals.saving>=0?'text-emerald-400':'text-rose-400'}`}>{partnerTotals.savingPct === '—' ? '—' : `${partnerTotals.savingPct}%`}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-400">Cost Structure</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-lg border border-slate-700 overflow-hidden">
                <div className="px-3 py-2 text-xs font-semibold text-slate-300 bg-slate-900/60 border-b border-slate-700">Construction Budget Breakdown</div>
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-slate-800">
                    {[
                      ['Hard Construction Costs (Base)', fmtCAD(hardBase)],
                      ['Class C Hard Subtotal', fmtCAD(hardSubtotal)],
                      [`Soft Costs (${softPct}%)`, fmtCAD(softAmt)],
                      [`Construction Contingency (${constContPct}%)`, fmtCAD(constContAmt)],
                      ['Total Construction Cost', fmtCAD(totalConst)],
                      ['Pre-Development Costs', fmtCAD(preDev)],
                      ['TOTAL PROJECT COST', fmtCAD(totalProject)],
                    ].map(([l, v]) => (
                      <tr key={l}><td className="py-2 px-3 text-slate-400">{l}</td><td className="py-2 px-3 text-right metric-mono text-white font-semibold">{v}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="rounded-lg border border-slate-700 overflow-hidden">
                <div className="px-3 py-2 text-xs font-semibold text-slate-300 bg-slate-900/60 border-b border-slate-700">Financing Stack</div>
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-slate-800">
                    {[
                      [`Provincial Grant (${grantPct}%)`, fmtCAD(inputs.grants)],
                      ['Donations & In-Kind', fmtCAD(inputs.donations)],
                      ['Net Financing Required', fmtCAD(data.capital.mortgage)],
                      ['Annual Debt Service', fmtCAD(data.operations.debtService)],
                    ].map(([l, v]) => (
                      <tr key={l}><td className="py-2 px-3 text-slate-400">{l}</td><td className="py-2 px-3 text-right metric-mono text-white font-semibold">{v}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-400">Sensitivity Analysis</h2>
            <div className="rounded-lg border border-slate-700 overflow-hidden">
              <table className="w-full text-xs">
                <thead><tr className="bg-slate-900/60 border-b border-slate-700"><th className="text-left py-2 px-3 text-slate-400">Scenario</th><th className="text-right py-2 px-3 text-slate-400">Status Quo Cost</th><th className="text-right py-2 px-3 text-slate-400">Hub model</th><th className="text-right py-2 px-3 text-slate-400">Annual Saving</th><th className="text-left py-2 px-3 text-slate-400">Comment</th></tr></thead>
                <tbody className="divide-y divide-slate-800">
                  {RIVERSIDE.sensitivity.map((s, i) => (
                    <tr key={i}>
                      <td className="py-2 px-3 text-slate-200 whitespace-pre-line">{s.scenario}</td>
                      <td className="py-2 px-3 text-right metric-mono text-slate-300">{fmtCAD(s.statusQuoCost)}</td>
                      <td className="py-2 px-3 text-right metric-mono text-slate-300">{fmtCAD(s.hubModelCost)}</td>
                      <td className="py-2 px-3 text-right metric-mono text-emerald-400 font-semibold">{fmtCAD(s.saving)}</td>
                      <td className="py-2 px-3 text-slate-500">{s.comment}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-400">Readiness Assessment</h2>
            <div className="rounded-lg border border-slate-700 overflow-hidden">
              <table className="w-full text-xs">
                <thead><tr className="bg-slate-900/60 border-b border-slate-700"><th className="text-left py-2 px-3 text-slate-400">Rule</th><th className="text-center py-2 px-3 text-slate-400">Target</th><th className="text-center py-2 px-3 text-slate-400">Actual</th><th className="text-center py-2 px-3 text-slate-400">Status</th></tr></thead>
                <tbody className="divide-y divide-slate-800">
                  {fundability.rules.map((r, i) => (
                    <tr key={i}>
                      <td className="py-2 px-3 text-slate-200">{r.name}</td>
                      <td className="py-2 px-3 text-center metric-mono text-slate-400">{r.comparator === 'lte' ? '≤' : '≥'}{r.target}{r.unit}</td>
                      <td className={`py-2 px-3 text-center metric-mono font-semibold ${r.pass ? 'text-emerald-400' : 'text-rose-400'}`}>{r.value}{r.unit}</td>
                      <td className={`py-2 px-3 text-center font-semibold ${r.pass ? 'text-emerald-400' : 'text-rose-400'}`}>{r.pass ? 'PASS' : 'FAIL'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-200">
            This document is an internal capital planning tool only. All figures are based on modelled assumptions and require independent professional verification before use in funding applications, lending decisions, or board approvals.
          </section>
        </div>
      </div>

      <div className="xl:col-span-3">
        <div className="glass-card rounded-xl p-4 space-y-3 sticky top-24">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Export</div>
          <button onClick={handlePDF} disabled={exporting} className="w-full py-2.5 rounded-lg text-sm font-semibold text-white bg-rose-600 hover:bg-rose-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed">{exporting ? 'Generating...' : 'Export PDF'}</button>
          <button onClick={handleWord} className="w-full py-2.5 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors">Export Word</button>
        </div>
      </div>

    </div>
  )
}
