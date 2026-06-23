import { useState } from 'react'
import { RIVERSIDE, OPEX_CATEGORIES, PARTNER_COLS, FM_BASE_CATEGORIES, INITIAL_OPEX } from '../data/constants'
import { KPICard, SectionHeader, Icons, fmtCAD, fmtPct } from '../components/UI'
import { calcAmort, formatDscrDisplay, calcCapitalWave } from '../lib/finance'

const GFA_DEFAULT = 57800

const getConstructionBudgetRows = (inputs, totalProject) => {
  const hardCosts = +inputs?.hardBaseCost || +inputs?.buildingCost || 0
  const classCHardSubtotal = +inputs?.buildingCost || 0
  const softCostsAmount = +inputs?.softCosts || 0
  const constructionContingency = +inputs?.contingency || 0
  const totalConstructionCost = classCHardSubtotal + softCostsAmount + constructionContingency
  const preDevCosts = +inputs?.landCost || 0
  const designContingency = +inputs?.designContingencyPct || 0
  const escalationAmount = Math.max(0, classCHardSubtotal - hardCosts - hardCosts * (designContingency / 100))

  return [
    ['Hard Construction Costs', hardCosts],
    ['Design Contingency', hardCosts * (designContingency / 100)],
    ['Escalation', escalationAmount],
    ['Class C Hard Subtotal', classCHardSubtotal],
    ['Soft Costs', softCostsAmount],
    ['Construction Contingency', constructionContingency],
    ['Total Construction Cost', totalConstructionCost],
    ['Pre-Dev Costs', preDevCosts],
    ['TOTAL PROJECT COST', totalProject],
  ]
}

export default function Reports({ data, inputs, fundability, partners, statusQuoTotal, selectedBuckets, b4Lhi }) {
  const [generating, setGenerating] = useState(false)
  const [exporting,  setExporting]  = useState(false)
  const [status,     setStatus]     = useState('')
  const [sections, setSections] = useState({ executive:true, capital:true, roi:true, includeCapitalWave:true, fundability:true, stress:true })

  const fmt  = v => fmtCAD(v)
  const now  = new Date().toLocaleDateString('en-CA', { year:'numeric', month:'long', day:'numeric' })
  const totalProject = data?.capital?.totalCost || 0
  const grant = +(inputs?.grants || 0)
  const grantPct = totalProject > 0 ? Math.round((grant / totalProject) * 100) : 0
  const netFinancing = data?.capital?.mortgage || 0
  const debtService = data?.operations?.debtService || 0
  const opex = data?.operations?.expenses || 0
  const hubModelCost = debtService + opex
  const hubAnnual = (data?.operations?.debtService || 0) + (data?.operations?.expenses || 0)
  const wave = calcCapitalWave(b4Lhi, hubAnnual)
  const statusQuoAnnual = statusQuoTotal || 0
  const annualSaving = statusQuoAnnual - hubModelCost
  const saving25yr = annualSaving * 25
  const costReduction = statusQuoAnnual > 0 ? ((annualSaving / statusQuoAnnual) * 100) : 0
  const simplePayback = annualSaving > 0 ? (totalProject / annualSaving) : 0
  const sq = RIVERSIDE.statusQuo
  const constructionBudgetRows = getConstructionBudgetRows(inputs, totalProject)

  // ── PDF ──────────────────────────────────────────────────────────────────
  const generatePDF = async () => {
    setGenerating(true); setStatus('Building report…')
    const statusBg = { STABLE:'#dcfce7','AT-RISK':'#fee2e2', WATCH:'#fef9c3' }
    const statusFg = { STABLE:'#166534','AT-RISK':'#991b1b', WATCH:'#854d0e' }
    const s2 = 'margin-bottom:24px;'
    const h2 = 'font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#1e3a8a;border-bottom:2px solid #e2e8f0;padding-bottom:6px;margin:0 0 12px 0;'
    const tbl = 'width:100%;border-collapse:collapse;font-size:11px;margin-bottom:8px;'
    const th  = 'background:#f1f5f9;padding:7px 10px;text-align:left;font-weight:600;color:#475569;border-bottom:2px solid #cbd5e1;'
    const td  = 'padding:7px 10px;border-bottom:1px solid #e2e8f0;color:#0f172a;'
    const tdr = 'padding:7px 10px;border-bottom:1px solid #e2e8f0;color:#0f172a;text-align:right;font-family:monospace;'
    const kpiG = 'display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px;'
    const kpiC = 'background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px;'
    const kpi = (label,value,hl=false) => `<div style="${kpiC}${hl?'border-left:3px solid #4f46e5;':''}"><div style="font-size:9px;color:#64748b;font-weight:600;text-transform:uppercase;margin-bottom:4px;">${label}</div><div style="font-size:15px;font-weight:700;color:${hl?'#4f46e5':'#0f172a'};font-family:monospace;">${value}</div></div>`
    const pass = p => p?'<span style="color:#16a34a;font-weight:700;">✓ PASS</span>':'<span style="color:#dc2626;font-weight:700;">✗ FAIL</span>'

    let html = `<div style="font-family:'Segoe UI',Arial,sans-serif;color:#0f172a;max-width:900px;margin:0 auto;padding:0;">
    <div style="background:linear-gradient(135deg,#1e3a8a,#0f172a);color:white;padding:44px 40px;margin-bottom:0;">
      <div style="font-size:10px;letter-spacing:.15em;text-transform:uppercase;color:#93c5fd;margin-bottom:10px;">Riverside Hub — Capital Planning Report</div>
      <div style="font-size:28px;font-weight:800;margin-bottom:6px;">${inputs.name||'Riverside Hub'}</div>
      <div style="font-size:13px;color:#cbd5e1;margin-bottom:20px;">${RIVERSIDE.project.address} · ${RIVERSIDE.project.operator}</div>
      <div style="display:flex;gap:20px;flex-wrap:wrap;">
        <div><div style="font-size:9px;color:#94a3b8;">Report Date</div><div style="font-weight:600;">${now}</div></div>
        <div><div style="font-size:9px;color:#94a3b8;">Policy</div><div style="font-weight:600;">${RIVERSIDE.project.policyVersion}</div></div>
        <div><div style="font-size:9px;color:#94a3b8;">Status</div><div style="font-weight:800;color:${statusFg[fundability.status]};background:${statusBg[fundability.status]};padding:2px 10px;border-radius:20px;display:inline-block;">${fundability.status}</div></div>
      </div>
    </div>
    <div style="padding:28px 40px;">
    <div style="background:#fef9c3;border:1px solid #fde047;border-radius:6px;padding:8px 12px;font-size:9px;color:#713f12;margin-bottom:24px;">
      <strong>Disclaimer:</strong> Internal capital planning and scenario analysis only. Not financial, lending, or legal advice. All figures require independent professional verification.
    </div>`

    if (sections.executive) {
      html += `<div style="${s2}"><h2 style="${h2}">1. Executive Summary</h2>
      <div style="${kpiG}">${kpi('Total Project Cost',fmt(totalProject),true)}${kpi(`Provincial Grant (${grantPct}%)`,fmt(grant))}${kpi('Net Financing Required',fmt(netFinancing))}${kpi('Annual Debt Service',fmt(debtService))}</div>
      <div style="${kpiG}">${kpi('Status Quo Annual Cost',fmt(statusQuoAnnual))}${kpi('Hub Model Annual Cost',fmt(hubModelCost))}${kpi('Annual Saving',fmt(annualSaving),true)}${kpi('25-Yr Saving',fmt(saving25yr))}</div>
      <div style="${kpiG}">${kpi('Cost Reduction',fmtPct(costReduction))}${kpi('Simple Payback',simplePayback.toFixed(1)+' Yrs')}${kpi('DSCR',formatDscrDisplay(data.metrics.dscr))}${kpi('Annual Surplus',fmt(data.operations.surplus))}</div></div>`
    }

    if (sections.capital) {
      html += `<div style="${s2}"><h2 style="${h2}">2. Capital Structure</h2>
      <table style="${tbl}"><thead><tr><th style="${th}">Cost Component</th><th style="${th};text-align:right;">Amount (CAD)</th><th style="${th};text-align:right;">$/sf</th></tr></thead><tbody>
      ${constructionBudgetRows.map(([l,v])=>`<tr style="${l.startsWith('TOTAL')||l.startsWith('Class')||l.startsWith('Total C')?'background:#f1f5f9;font-weight:700;':''}"><td style="${td}">${l}</td><td style="${tdr}">${fmt(v)}</td><td style="${tdr}">$${(v/GFA_DEFAULT).toFixed(2)}</td></tr>`).join('')}
      </tbody></table></div>`
    }

    if (sections.roi) {
      html += `<div style="${s2}"><h2 style="${h2}">3. ROI Summary — 4-Bucket Analysis</h2>
      <table style="${tbl}"><thead><tr><th style="${th}">Metric</th><th style="${th};text-align:right;">Status Quo</th><th style="${th};text-align:right;">Hub Model</th><th style="${th};text-align:right;">Annual Saving</th></tr></thead><tbody>
      <tr><td style="${td}">B1 Operations</td><td style="${tdr}">${fmt(sq.buckets.b1Operations)}</td><td style="${tdr}">—</td><td style="${tdr}">—</td></tr>
      <tr><td style="${td}">B2 Deferred Capital</td><td style="${tdr}">${fmt(sq.buckets.b2DeferredCapital)}</td><td style="${tdr}">—</td><td style="${tdr}">—</td></tr>
      <tr><td style="${td}">B3 Capital Expansion</td><td style="${tdr}">${fmt(sq.buckets.b3CapitalExpansion)}</td><td style="${tdr}">—</td><td style="${tdr}">—</td></tr>
      <tr><td style="${td}">B4 LHI</td><td style="${tdr}">${fmt(sq.buckets.b4LeaseholdImprovements)}</td><td style="${tdr}">—</td><td style="${tdr}">—</td></tr>
      <tr style="background:#dbeafe;font-weight:700;"><td style="${td}">TOTAL</td><td style="${tdr};color:#1e3a8a;">${fmt(statusQuoAnnual)}</td><td style="${tdr};color:#166534;">${fmt(hubModelCost)}</td><td style="${tdr};color:#166534;">${fmt(annualSaving)}</td></tr>
      </tbody></table>
      <table style="${tbl};margin-top:14px;"><thead><tr><th style="${th}">Sensitivity Scenario</th><th style="${th};text-align:right;">Status Quo</th><th style="${th};text-align:right;">Annual Saving</th><th style="${th}">Comment</th></tr></thead><tbody>
      ${RIVERSIDE.sensitivity.map(s=>`<tr><td style="${td}">${s.scenario.replace('\n',' ')}</td><td style="${tdr}">${fmt(s.statusQuoCost)}</td><td style="${tdr};color:#166534;font-weight:700;">${fmt(s.saving)}</td><td style="${td};color:#64748b;">${s.comment}</td></tr>`).join('')}
      </tbody></table></div>`
    }

    if (sections.includeCapitalWave) {
      const cwGrid = 'display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:14px 0;'
      const cwCard = 'background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;'
      const cwLbl = 'font-size:9px;color:#64748b;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px;'
      const cwAmber = 'font-size:18px;font-weight:700;color:#92400e;font-family:monospace;'
      const cwGreen = 'font-size:18px;font-weight:700;color:#166534;font-family:monospace;'
      const h2cw = h2 + 'page-break-before:always;'
      html += `<div style="${s2}"><h2 style="${h2cw}">The Capital Wave — 25-Year Status Quo</h2>
    <p style="font-size:11px;line-height:1.6;color:#374151;">
      Every partner's current facility is at or near end of life. Without the Hub, partners face independent capital events plus escalating rent on newly fit-up leased space. Over 25 years, this fragmented spending substantially exceeds the cost of the consolidated Hub.
    </p>
    <div style="${cwGrid}">
      <div style="${cwCard}"><div style="${cwLbl}">25-Yr Fragmented Status Quo</div><div style="${cwAmber}">${fmt(wave.combined25Yr)}</div></div>
      <div style="${cwCard}"><div style="${cwLbl}">25-Yr Hub Model</div><div style="${cwGreen}">${fmt(wave.hub25Yr)}</div></div>
      <div style="${cwCard}"><div style="${cwLbl}">25-Yr Net Savings</div><div style="${cwGreen}">${fmt(wave.savings25Yr)}</div></div>
    </div>
    <h3 style="font-size:12px;font-weight:700;color:#1e3a8a;margin:16px 0 8px 0;">Per-Partner 25-Year Capital Event Summary</h3>
    <table style="${tbl}"><thead><tr>
      <th style="${th}">Partner</th><th style="${th};text-align:right;">Space (sf)</th><th style="${th};text-align:right;">Year 1 Rent</th>
      <th style="${th};text-align:right;">25-Yr Rent</th><th style="${th};text-align:right;">LHI One-Time</th><th style="${th}">Notes</th>
    </tr></thead><tbody>
    ${wave.perPartner.map(p => `<tr>
      <td style="${td}">${p.partner}</td>
      <td style="${tdr}">${p.sf.toLocaleString('en-CA')}</td>
      <td style="${tdr}">${fmt(p.year1Rent)}</td>
      <td style="${tdr}">${fmt(p.total25YrRent)}</td>
      <td style="${tdr}">${fmt(p.totalLhi)}</td>
      <td style="${td};font-size:9px;color:#4b5563;">${p.partner.toLowerCase().includes('willowbridge')
        ? 'Owns 54 Brant Ave — $823K additional urgent deferred capital'
        : 'Lease-based — end of useful life within 3-5 years'}</td>
    </tr>`).join('')}
    <tr style="background:#eff6ff;font-weight:700;border-top:2px solid #1e3a8a;">
      <td style="${td}">TOTAL</td>
      <td style="${tdr}">${wave.perPartner.reduce((s, p) => s + p.sf, 0).toLocaleString('en-CA')}</td>
      <td style="${tdr}">${fmt(wave.perPartner.reduce((s, p) => s + p.year1Rent, 0))}</td>
      <td style="${tdr}">${fmt(wave.perPartner.reduce((s, p) => s + p.total25YrRent, 0))}</td>
      <td style="${tdr}">${fmt(wave.perPartner.reduce((s, p) => s + p.totalLhi, 0))}</td>
      <td style="${td}"></td>
    </tr>
    </tbody></table>
    <p style="font-size:10px;font-style:italic;color:#6b7280;margin-top:8px;">
      Assumes 5% lease escalation every 5 years, 2.5% Hub operating cost inflation. Willowbridge's $823K urgent capital is separate. BCHCS excluded pending data confirmation.
    </p>
    </div>`
    }

    if (sections.fundability) {
      html += `<div style="${s2}"><h2 style="${h2}">4. Scenario Readiness Matrix</h2>
      <div style="background:${statusBg[fundability.status]};border-radius:8px;padding:10px 14px;margin-bottom:12px;display:flex;align-items:center;justify-content:space-between;">
        <div><div style="font-size:10px;color:#64748b;text-transform:uppercase;font-weight:600;">Overall Status</div><div style="font-size:20px;font-weight:800;color:${statusFg[fundability.status]};">${fundability.status}</div></div>
        <div style="text-align:right;font-size:10px;color:#64748b;">${fundability.failedCount} check(s) failing · ${fundability.criticalFails} critical</div>
      </div>
      <table style="${tbl}"><thead><tr><th style="${th}">Rule</th><th style="${th};text-align:center;">Target</th><th style="${th};text-align:center;">Actual</th><th style="${th};text-align:center;">Result</th><th style="${th}">Levers</th></tr></thead><tbody>
      ${fundability.rules.map(r=>`<tr style="${!r.pass&&r.critical?'background:#fef2f2;':''}"><td style="${td}"><strong>${r.name}</strong></td><td style="${td};text-align:center;">${r.comparator==='lte'?'≤':'≥'}${r.target}${r.unit}</td><td style="${td};text-align:center;font-weight:700;font-family:monospace;color:${r.pass?'#16a34a':'#dc2626'};">${r.value}${r.unit}</td><td style="${td};text-align:center;">${pass(r.pass)}</td><td style="${td};font-size:9px;color:#64748b;">${r.pass?'—':r.levers.join(', ')}</td></tr>`).join('')}
      </tbody></table></div>`
    }

    if (sections.stress) {
      const base = {name:'Base Case',    dscr:data.metrics.dscr,       surplus:data.operations.surplus}
      const rate  = (()=>{ const r=calcAmort(data.capital.mortgage,+inputs.interestRate+1.5,+inputs.amortization); const ds=r.monthlyPayment*12; return {name:'Rate +1.5%',dscr:ds>0?data.operations.noi/ds:(data.operations.noi>0?Infinity:0),surplus:data.operations.noi-ds} })()
      const cost  = (()=>{ const extra=((+inputs.buildingCost)+(+inputs.softCosts))*.15; const r=calcAmort(data.capital.mortgage+extra,+inputs.interestRate,+inputs.amortization); const ds=r.monthlyPayment*12; return {name:'Cost +15%',dscr:ds>0?data.operations.noi/ds:(data.operations.noi>0?Infinity:0),surplus:data.operations.noi-ds} })()
      const rev   = (()=>{ const noi=data.operations.revenue*.9-data.operations.expenses; return {name:'Revenue −10%',dscr:data.operations.debtService>0?noi/data.operations.debtService:(noi>0?Infinity:0),surplus:noi-data.operations.debtService} })()
      html += `<div style="${s2}"><h2 style="${h2}">5. Sensitivity / Stress Test</h2>
      <table style="${tbl}"><thead><tr><th style="${th}">Scenario</th><th style="${th};text-align:right;">DSCR</th><th style="${th};text-align:right;">Annual Surplus</th><th style="${th};text-align:center;">Assessment</th></tr></thead><tbody>
      ${[base,rate,cost,rev].map(s=>`<tr ${s.name==='Base Case'?'style="background:#f0f9ff;"':''}><td style="${td}">${s.name}</td><td style="${tdr};font-weight:700;color:${s.dscr>=1.2?'#166534':s.dscr>=1.0?'#92400e':'#991b1b'};">${formatDscrDisplay(s.dscr)}</td><td style="${tdr};color:${s.surplus>=0?'#166534':'#991b1b'};">${fmt(s.surplus)}</td><td style="${td};text-align:center;"><span style="padding:2px 8px;border-radius:12px;font-size:9px;font-weight:700;background:${s.dscr>=1.2?'#dcfce7':s.dscr>=1.0?'#fef9c3':'#fee2e2'};color:${s.dscr>=1.2?'#166534':s.dscr>=1.0?'#854d0e':'#991b1b'};">${s.dscr>=1.2?'STABLE':s.dscr>=1.0?'WATCH':'AT-RISK'}</span></td></tr>`).join('')}
      </tbody></table></div>`
    }

    html += `<div style="border-top:1px solid #e2e8f0;padding-top:14px;margin-top:28px;text-align:center;font-size:9px;color:#94a3b8;">
      <p>Generated by Riverside Hub Meta MUSH Platform · ${now} · Policy ${RIVERSIDE.project.policyVersion}</p>
      <p>Internal capital planning only. Not for lending, approval, or financial decision reliance. All outputs require independent professional verification.</p>
    </div></div></div>`

    const el = document.createElement('div')
    el.innerHTML = html
    document.body.appendChild(el)
    setStatus('Rendering PDF…')
    await window.html2pdf().set({
      margin:[8,8,8,8], filename:`Riverside_Hub_Report_${new Date().toISOString().slice(0,10)}.pdf`,
      image:{type:'jpeg',quality:0.97}, html2canvas:{scale:2,useCORS:true,logging:false},
      jsPDF:{unit:'mm',format:'a4',orientation:'portrait'}, pagebreak:{mode:['avoid-all','css']}
    }).from(el).save()
    document.body.removeChild(el)
    setGenerating(false); setStatus('')
  }

  // ── EXCEL ─────────────────────────────────────────────────────────────────
  const exportExcel = () => {
    setExporting(true); setStatus('Building workbook…')
    try {
      const WB  = window.XLSX.utils.book_new()
      const add = (name, rows) => { window.XLSX.utils.book_append_sheet(WB, window.XLSX.utils.aoa_to_sheet(rows), name) }
      const m   = v => +v||0

      add('ROI Summary', [
        ['Riverside Hub — ROI Summary'],[], ['Metric','Status Quo','Hub Model','Annual Saving','25-Yr Saving'],
        ['Total Annual Cost (4 Buckets)',m(statusQuoAnnual),m(hubModelCost),m(annualSaving),m(saving25yr)],[],
        ['Bucket','Annual Cost'],['B1 Operations',selectedBuckets?.includes('b1') ? m(sq.buckets.b1Operations) : 0],['B2 Deferred Capital',selectedBuckets?.includes('b2') ? m(sq.buckets.b2DeferredCapital) : 0],['B3 Capital Expansion',selectedBuckets?.includes('b3') ? m(sq.buckets.b3CapitalExpansion) : 0],['B4 LHI',selectedBuckets?.includes('b4') ? m(sq.buckets.b4LeaseholdImprovements) : 0],['TOTAL',m(statusQuoAnnual)],[],
        ['ROI Metrics','Value'],['Total Hub Investment',m(totalProject)],['Annual Net Saving',m(annualSaving)],['Simple Payback (years)',simplePayback],['25-Year Cumulative Saving',m(saving25yr)],['Cost Reduction %',costReduction/100],[],
        ['Sensitivity Analysis'],['Scenario','Status Quo Cost','Annual Saving','Comment'],
        ...RIVERSIDE.sensitivity.map(s=>[s.scenario.replace('\n',' '),m(s.statusQuoCost),m(s.saving),s.comment]),
      ])

      const capitalWaveSheet = [
        ['CAPITAL WAVE — 25-YEAR STATUS QUO ANALYSIS', '', '', '', '', ''],
        ['', '', '', '', '', ''],
        ['HEADLINE COMPARISON', '', '', '', '', ''],
        ['Metric', 'Value', '', '', '', ''],
        ['Year 1 Rent (Fragmented)', wave.year1Rent, '', '', '', ''],
        ['25-Year Rent Total', wave.total25YrRent, '', '', '', ''],
        ['LHI Wave (One-Time)', wave.totalLhi, '', '', '', ''],
        ['25-Yr Fragmented Status Quo', wave.combined25Yr, '', '', '', ''],
        ['25-Yr Hub Model', wave.hub25Yr, '', '', '', ''],
        ['25-Yr Net Savings', wave.savings25Yr, '', '', '', ''],
        ['', '', '', '', '', ''],
        ['PER-PARTNER SUMMARY', '', '', '', '', ''],
        ['Partner', 'Space (sf)', 'Year 1 Rent', '25-Yr Rent', 'LHI One-Time', 'Notes'],
        ...wave.perPartner.map(p => [
          p.partner,
          p.sf,
          p.year1Rent,
          p.total25YrRent,
          p.totalLhi,
          p.partner.toLowerCase().includes('willowbridge')
            ? 'Owns 54 Brant Ave — $823K additional urgent deferred capital'
            : 'Lease-based — end of useful life within 3-5 years',
        ]),
        [
          'TOTAL',
          wave.perPartner.reduce((s, p) => s + p.sf, 0),
          wave.perPartner.reduce((s, p) => s + p.year1Rent, 0),
          wave.perPartner.reduce((s, p) => s + p.total25YrRent, 0),
          wave.perPartner.reduce((s, p) => s + p.totalLhi, 0),
          '',
        ],
        ['', '', '', '', '', ''],
        ['YEAR-BY-YEAR TRAJECTORY', '', '', '', '', ''],
        ['Year', 'Fragmented Annual', 'Hub Annual', 'Fragmented Cumulative', 'Hub Cumulative', ''],
        ...wave.yearByYear.map(y => [y.year, y.yearlyRent, y.yearlyHub, y.cumFragmented, y.cumHub, '']),
        ['', '', '', '', '', ''],
        ['ASSUMPTIONS', '', '', '', '', ''],
        ['Lease escalation', '5% every 5 years', '', '', '', ''],
        ['Hub operating inflation', '2.5% annually', '', '', '', ''],
        ['BCHCS', 'Excluded pending data confirmation', '', '', '', ''],
        ['Willowbridge $823K urgent capital', 'Separate from lease/LHI trajectory', '', '', '', ''],
      ]
      add('Capital Wave', capitalWaveSheet)

      add('Capital Structure', [
        ['Riverside Hub — Capital Structure'],[],['Cost Component','Amount (CAD)','CAD/sf'],
        ...constructionBudgetRows.map(([label, value]) => [label, m(value), +((m(value)) / GFA_DEFAULT).toFixed(2)]),[],
        ['Financing Source','Amount','% of Total'],
        [`Provincial Grant (${grantPct}%)`,m(grant),totalProject>0?grant/totalProject:0],
        ['Donations & In-Kind',m(inputs.donations),totalProject>0?m(inputs.donations)/totalProject:0],
        ['Partner/Debt (Net)',m(netFinancing),totalProject>0?netFinancing/totalProject:0],
        ['Annual Debt Service',m(debtService),''],
      ])

      const opexRows = [['Partner Operating Expenses — Status Quo (Annual, CAD)'],[],['Expense Category',...PARTNER_COLS.map(p=>p.label),'Total']]
      OPEX_CATEGORIES.forEach(cat => {
        const vals = PARTNER_COLS.map(p => INITIAL_OPEX[p.id]?.[cat.key]||0)
        opexRows.push([cat.label,...vals,vals.reduce((s,v)=>s+v,0)])
      })
      const totals = PARTNER_COLS.map(p=>OPEX_CATEGORIES.reduce((s,c)=>s+(INITIAL_OPEX[p.id]?.[c.key]||0),0))
      opexRows.push(['TOTAL',...totals,totals.reduce((s,v)=>s+v,0)])
      add('B1 Partner Op Expenses', opexRows)

      add('Scenario Planner', [
        ['MUSH Capital Planner — Scenario Inputs'],[],
        ['Project',inputs.name||''],['Building Size (sf)',m(inputs.buildingSize)],
        ['Hard Costs',m(inputs.buildingCost)],['Soft Costs',m(inputs.softCosts)],['Land Cost',m(inputs.landCost)],['Contingency',m(inputs.contingency)],
        ['Total Project Cost',m(data.capital.totalCost)],[],
        ['Grants',m(inputs.grants)],['Donations',m(inputs.donations)],['Total Raised',m(data.capital.raised)],
        ['Financing Gap',m(data.capital.mortgage)],['Interest Rate (%)',m(inputs.interestRate)],['Amortization (yrs)',m(inputs.amortization)],['Annual Debt Service',m(data.operations.debtService)],[],
        ['Effective Revenue',m(data.operations.revenue)],['Total Opex',m(data.operations.expenses)],['NOI',m(data.operations.noi)],['Annual Surplus',m(data.operations.surplus)],['DSCR',+data.metrics.dscr.toFixed(4)],[],
        ['Scenario Status',fundability.status],['Checks Failing',fundability.failedCount],[],
        ['Readiness Checks','Target','Actual','Pass?'],
        ...fundability.rules.map(r=>[r.name,`${r.comparator==='lte'?'≤':'≥'}${r.target}${r.unit}`,`${r.value}${r.unit}`,r.pass?'PASS':'FAIL']),
      ])

      add('FM Benchmark', [
        ['FM Operating Cost Benchmark'],[],['Category','Benchmark $/sf','Source'],
        ...FM_BASE_CATEGORIES.map(c=>[c.label,c.baseRate,c.source]),
        ['TOTAL',FM_BASE_CATEGORIES.reduce((s,c)=>s+c.baseRate,0),''],
      ])

      window.XLSX.writeFile(WB, `Riverside_Hub_Model_${new Date().toISOString().slice(0,10)}.xlsx`)
      setStatus('')
    } catch(e) { console.error(e); setStatus('Export failed — check console') }
    setExporting(false)
  }

  const Toggle = ({ id, label, sub }) => (
    <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-700 hover:border-indigo-500/50 cursor-pointer transition-all group">
      <input type="checkbox" checked={sections[id]} onChange={e=>setSections(p=>({...p,[id]:e.target.checked}))} className="mt-0.5 w-4 h-4 accent-indigo-500 flex-shrink-0"/>
      <div><div className="text-sm font-medium text-slate-200 group-hover:text-white">{label}</div>{sub&&<div className="text-xs text-slate-500 mt-0.5">{sub}</div>}</div>
    </label>
  )

  return (
    <div className="space-y-6">
      <SectionHeader title="Reports & Export" sub="Generate a PDF briefing or export the full model to Excel"/>

      {status&&(
        <div className="glass-card rounded-xl px-5 py-3 flex items-center gap-3 border-indigo-500/30">
          <div className="w-4 h-4 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full flex-shrink-0" style={{animation:'spin .8s linear infinite'}}></div>
          <span className="text-sm text-indigo-300">{status}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* PDF */}
        <div className="glass-card rounded-xl p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/20"><Icons.Print className="w-5 h-5 text-rose-400"/></div>
            <div><div className="font-semibold text-white">PDF Scenario Briefing</div><div className="text-xs text-slate-400">A4 report · Professional layout · Ready to share</div></div>
          </div>
          <div className="space-y-2">
            <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-3">Include Sections</div>
            <Toggle id="executive"   label="Executive Summary"        sub="KPIs, total cost, savings, payback"/>
            <Toggle id="capital"     label="Capital Structure"         sub="Construction budget & financing stack"/>
            <Toggle id="roi"         label="ROI Analysis"              sub="4-bucket comparison & sensitivity"/>
            <Toggle id="includeCapitalWave" label="Capital Wave (25-Year Trajectory)" sub="Fragmented vs consolidated 25-yr analysis"/>
            <Toggle id="fundability" label="Scenario Readiness Matrix" sub="All 6 underwriting checks"/>
            <Toggle id="stress"      label="Stress Test"               sub="Rate shock, cost overrun, revenue drop"/>
          </div>
          <div className="border-t border-slate-700 pt-4 space-y-3">
            <div className="text-xs text-slate-500 space-y-1">
              <div>· A4 portrait PDF · Includes disclaimer · Live data from current state</div>
              <div>· Project name pulled from Scenario Planner inputs</div>
            </div>
            <button onClick={generatePDF} disabled={generating}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{background:generating?'#334155':'linear-gradient(135deg,#dc2626,#be123c)'}}>
              {generating?<><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" style={{animation:'spin .8s linear infinite'}}></div>Generating…</>:<><Icons.Print className="w-4 h-4"/>Generate PDF Report</>}
            </button>
          </div>
        </div>

        {/* Excel */}
        <div className="glass-card rounded-xl p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/20"><Icons.Excel className="w-5 h-5 text-emerald-400"/></div>
            <div><div className="font-semibold text-white">Excel Workbook</div><div className="text-xs text-slate-400">Multi-sheet .xlsx · All data · Editable</div></div>
          </div>
          <div className="space-y-2">
            <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-3">Sheets Included</div>
            {[
              {s:'ROI Summary',           d:'4-bucket totals, sensitivity, key metrics'},
              {s:'Capital Wave',          d:'25-yr fragmented vs hub, per-partner, year-by-year'},
              {s:'Capital Structure',      d:'Full construction budget & financing'},
              {s:'B1 Partner Op Expenses', d:'All 33 categories per partner'},
              {s:'Scenario Planner',       d:'Inputs, financials, readiness checks'},
              {s:'FM Benchmark',           d:'Category $/sf rates'},
            ].map(({s,d})=>(
              <div key={s} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-900/40 border border-slate-800">
                <div className="w-2 h-2 rounded-sm bg-emerald-500 flex-shrink-0 mt-1"></div>
                <div><div className="text-xs font-semibold text-slate-200">{s}</div><div className="text-xs text-slate-500">{d}</div></div>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-700 pt-4">
            <button onClick={exportExcel} disabled={exporting}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{background:exporting?'#334155':'linear-gradient(135deg,#059669,#047857)'}}>
              {exporting?<><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" style={{animation:'spin .8s linear infinite'}}></div>Exporting…</>:<><Icons.Excel className="w-4 h-4"/>Export to Excel (.xlsx)</>}
            </button>
          </div>
        </div>
      </div>

      {/* Snapshot */}
      <div className="glass-card rounded-xl p-5">
        <div className="text-sm font-semibold text-slate-300 mb-4">Current Data Snapshot</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KPICard title="Total Project Cost" value={fmtCAD(totalProject)} mono/>
          <KPICard title="Annual Saving"      value={fmtCAD(annualSaving)} mono/>
          <KPICard title="DSCR (Planner)"     value={formatDscrDisplay(data.metrics.dscr)} danger={data.metrics.dscr<1.2} mono/>
          <KPICard title="Scenario Status"    value={fundability.status} danger={fundability.status==='AT-RISK'} warn={fundability.status==='WATCH'} mono/>
        </div>
      </div>
    </div>
  )
}

