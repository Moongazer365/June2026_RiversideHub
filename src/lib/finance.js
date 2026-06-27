// ─── FINANCIAL ENGINES ───────────────────────────────────────────────────────

export function formatDscrDisplay(dscr) {
  if (!isFinite(dscr)) return 'N/A (no debt)'
  if (dscr <= 0) return '—'
  return `${dscr.toFixed(2)}x`
}

const getRuleStatus = ({ pass, value, target, comparator = 'gte' }) => {
  if (!pass) return 'fail'
  if (!isFinite(value) || !isFinite(target) || target === 0) return 'pass'
  if (comparator === 'lte') return value > target * 0.9 ? 'watch' : 'pass'
  return value < target * 1.1 ? 'watch' : 'pass'
}

export const calcAmort = (principal, annualRate, years) => {
  if (!principal || principal <= 0 || !years || years <= 0) {
    return { schedule: [], monthlyPayment: 0, totalInterest: 0 }
  }
  const monthlyRate = annualRate / 100 / 12
  const n = years * 12
  const mp = annualRate > 0
    ? (principal * monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1)
    : principal / n
  let bal = principal, totalInterest = 0
  const schedule = []
  for (let yr = 1; yr <= years; yr++) {
    let iYear = 0, pYear = 0
    for (let m = 0; m < 12; m++) {
      if (bal <= 0) break
      const iPay = bal * monthlyRate
      const pPay = mp - iPay
      iYear += iPay; pYear += pPay; bal -= pPay
    }
    totalInterest += iYear
    schedule.push({ year: yr, payment: mp * 12, interest: iYear, principal: pYear, balance: Math.max(0, bal) })
  }
  return { schedule, monthlyPayment: mp, totalInterest }
}

export const calcFinancials = (inputs, partnersInput, sectorId = 'HEALTHCARE', fmScenarios = null) => {
  const preDev = +inputs.landCost || 0
  const swingSpace = +inputs.swingSpaceCost || 0
  const hardSubtotal = +inputs.buildingCost || 0
  const softCosts = +inputs.softCosts || 0
  const contingency = +inputs.contingency || 0
  const totalCost = hardSubtotal + softCosts + contingency + preDev + swingSpace

  const grants     = +inputs.grants || 0
  const donations  = +inputs.donations || 0
  const otherCap   = +inputs.otherCapital || 0
  const vacLoss    = (+inputs.vacancyRate || 0) / 100 + (+inputs.badDebtRate || 0) / 100
  const partnerCap = partnersInput.reduce((s, p) => s + (+p.capitalContrib || 0), 0)
  const totalRaised = grants + donations + otherCap + partnerCap
  const mortgage   = Math.max(0, totalCost - totalRaised)

  const amort    = calcAmort(mortgage, +inputs.interestRate || 0, +inputs.amortization || 25)
  const annualDS = amort.monthlyPayment * 12

  const gfa = +inputs.buildingSize || 57800
  const rates = fmScenarios?.[0]?.rates || {}
  const parkingCost = (fmScenarios?.[0]?.rates?.parking || 1.20) * 25000
  const fmBase = Object.entries(rates)
    .filter(([k]) => k !== 'parking')
    .reduce((s, [, v]) => s + (+v || 0) * gfa, 0)
  const fmTotal = (fmBase + parkingCost) * 1.05
  const usesScenarioRates = Object.keys(rates).length > 0
  const additionalExpKeys = ['security','waste','legal','marketing','internet']
  const additionalOpex = additionalExpKeys.reduce((s, k) => s + (+inputs[k] || 0), 0)
  const expKeys = ['utilities','maintenance','insurance','admin','propMgmt','security','cleaning','landscaping','waste','legal','marketing','internet']
  let totalOpex = usesScenarioRates
    ? fmTotal + additionalOpex
    : expKeys.reduce((s, k) => s + (+inputs[k] || 0), 0)
  let munReserve = 0
  if (sectorId === 'MUNICIPAL') { munReserve = totalCost * 0.02; totalOpex += munReserve }

  const payingShare = partnersInput.reduce((s, p) => p.isMortgageExempt ? s : s + (+p.share || 0), 0)

  const enriched = partnersInput.map(p => {
    const share = +p.share || 0
    const shareD = share / 100
    const cam = totalOpex * shareD
    let base = 0, mortShare = 0, opFund = 0
    if (p.isMortgageExempt) {
      opFund = cam * 0.05; base = cam + opFund
    } else if (payingShare > 0) {
      mortShare = annualDS * (share / payingShare)
      opFund = (mortShare + cam) * 0.05
      const net = mortShare + cam + opFund
      base = net
    }
    return { ...p, lease: base, tax: cam, mortgagePrincipal: mortShare, operatingFund: opFund }
  })

  const totalShares = partnersInput.reduce((s, p) => s + (+p.share || 0), 0)
  const warnings = []
  if (Math.abs(totalShares - 100) > 0.1) {
    warnings.push({
      code: 'PARTNER_SHARES_MISMATCH',
      severity: 'error',
      message: `Partner shares total ${totalShares.toFixed(1)}% — must equal 100%. Mortgage apportionment is distorted until corrected.`,
    })
  }

  const leaseRev = enriched.reduce((s, p) => s + p.lease, 0)
  const camRev   = enriched.reduce((s, p) => s + p.tax, 0)
  const parkRev  = enriched.reduce((s, p) => s + (+p.parking || 0), 0)
  const otherRev = enriched.reduce((s, p) => s + (+p.other || 0), 0)
  const ds       = +inputs.dscrSupport || 0
  const potGross = leaseRev + parkRev + otherRev + ds
  const effGross = potGross * (1 - vacLoss)
  const noi      = effGross - totalOpex
  const surplus  = noi - annualDS
  const dscr     = annualDS > 0 ? noi / annualDS : (noi > 0 ? Infinity : 0)
  const dscrGap  = Math.max(0, annualDS * 1.2 - noi)

  return {
    capital: {
      totalCost, raised: totalRaised, mortgage, partnerCapital: partnerCap,
      equityPct: totalCost > 0 ? (totalRaised / totalCost) * 100 : 0,
    },
    operations: {
      revenue: effGross, potRev: potGross, expenses: totalOpex,
      noi, debtService: annualDS, surplus, leaseRev, camRev,
      vacancyLoss: potGross - effGross, munReserve,
    },
    metrics: {
      dscr, dscrGap,
      costPerUnit: totalCost / (+inputs.unitCount || 1),
      leaseCoverage: annualDS > 0 ? (leaseRev / annualDS) * 100 : 0,
      roi: totalRaised > 0 ? (surplus / totalRaised) * 100 : 0,
    },
    partners: enriched,
    warnings,
    amortization: amort,
  }
}

export const analyzeFundability = (data, inputs, partners) => {
  const rules = []
  const dscr = data.metrics.dscr
  const dscrPass = !isFinite(dscr) || dscr >= 1.2
  const dscrStatus = getRuleStatus({ pass: dscrPass, value: dscr, target: 1.2 })
  rules.push({
    name: 'Base Coverage Ratio',
    value: !isFinite(dscr) ? 'N/A (no debt)' : dscr.toFixed(2),
    unit: !isFinite(dscr) ? '' : 'x',
    target: 1.2,
    pass: dscrPass,
    status: dscrStatus,
    critical: true,
    levers: ['Increase Revenue', 'Extend Amortization', 'Increase Down Payment'],
  })

  const sRate  = +inputs.interestRate + 2
  const sAmort = calcAmort(data.capital.mortgage, sRate, +inputs.amortization || 25)
  const sDS    = sAmort.monthlyPayment * 12
  const sDSCR = sDS > 0 ? data.operations.noi / sDS : (data.operations.noi > 0 ? Infinity : 0)
  const sDSCRPass = !isFinite(sDSCR) || sDSCR >= 1.05
  const sDSCRStatus = getRuleStatus({ pass: sDSCRPass, value: sDSCR, target: 1.05 })
  rules.push({
    name: 'Stress Coverage (+2% Rate)',
    value: !isFinite(sDSCR) ? 'N/A (no debt)' : sDSCR.toFixed(2),
    unit: !isFinite(sDSCR) ? '' : 'x',
    target: 1.05,
    pass: sDSCRPass,
    status: sDSCRStatus,
    critical: true,
    levers: ['Lock in Lower Rate', 'Reduce Loan', 'Increase Reserves'],
  })

  const eq = data.capital.equityPct
  const eqPass = eq >= 35
  rules.push({
    name: 'Capital Contribution',
    value: eq.toFixed(1),
    unit: '%',
    target: 35,
    pass: eqPass,
    status: getRuleStatus({ pass: eqPass, value: eq, target: 35 }),
    critical: false,
    levers: ['Seek Capital Grants', 'Fundraising Campaign'],
  })

  const contPct = data.capital.totalCost > 0 ? (+inputs.contingency / data.capital.totalCost) * 100 : 0
  const contPass = contPct >= 10
  rules.push({
    name: 'Risk Buffer Envelope',
    value: contPct.toFixed(1),
    unit: '%',
    target: 10,
    pass: contPass,
    status: getRuleStatus({ pass: contPass, value: contPct, target: 10 }),
    critical: false,
    levers: ['Increase Contingency'],
  })

  const partnerRevenues = partners.map(p => p.lease + p.tax + (+p.parking || 0) + (+p.other || 0))
  const maxP = partnerRevenues.length > 0 ? Math.max(...partnerRevenues) : 0
  const conc  = data.operations.revenue > 0 ? (maxP / data.operations.revenue) * 100 : 0
  const concPass = conc <= 45
  rules.push({
    name: 'Revenue Concentration',
    value: conc.toFixed(1),
    unit: '%',
    target: 45,
    pass: concPass,
    status: getRuleStatus({ pass: concPass, value: conc, target: 45, comparator: 'lte' }),
    comparator: 'lte',
    critical: false,
    levers: ['Diversify Partner Mix'],
  })

  const breaks = data.operations.revenue > 0 ? ((data.operations.expenses + data.operations.debtService) / data.operations.revenue) * 100 : 100
  const breaksPass = breaks <= 96
  rules.push({
    name: 'Cost Recovery Envelope',
    value: breaks.toFixed(1),
    unit: '%',
    target: 96,
    pass: breaksPass,
    status: getRuleStatus({ pass: breaksPass, value: breaks, target: 90, comparator: 'lte' }),
    comparator: 'lte',
    critical: true,
    levers: ['Reduce Opex', 'Increase Revenue'],
  })

  const fails     = rules.filter(r => !r.pass).length
  const critFails = rules.filter(r => !r.pass && r.critical).length
  let status = 'STABLE'
  if (critFails > 0) status = 'AT-RISK'
  else if (fails > 0) status = 'WATCH'

  return { status, rules, failedCount: fails, criticalFails: critFails }
}

export function calcCapitalWave(b4Lhi, hubAnnualCost = 959100,
                                 hubInflation = 0.025,
                                 leaseEscalation = 0.05,
                                 escalationInterval = 5) {
  // Defensive: return zero state if no data
  if (!Array.isArray(b4Lhi) || b4Lhi.length === 0) {
    return {
      year1Rent: 0, total25YrRent: 0, totalLhi: 0,
      combined25Yr: 0, hub25Yr: 0, savings25Yr: 0,
      yearByYear: [], perPartner: []
    }
  }

  // Exclude BCHCS and any row with no sf
  const activeRows = b4Lhi.filter(r =>
    (+r.sf || 0) > 0 &&
    !(r.partner || '').toLowerCase().includes('bchcs')
  )

  // B4 LHI: Scenario Planner uses ratePerSf as the canonical LHI $/sf; lhiPerSf is a legacy alias
  // that can drift (e.g. old computed gross). Prefer ratePerSf, same as App.jsx b4LiveTotal.
  const lhiDollarPerSf = r => +(r?.ratePerSf ?? r?.lhiPerSf ?? 0) || 0
  const leaseDollarPerSf = r => +(r?.leasePerSf ?? r?.leaseSf ?? 0) || 0

  // Year 1 rent + total LHI
  const year1Rent = activeRows.reduce((sum, r) =>
    sum + (+r.sf || 0) * leaseDollarPerSf(r), 0)
  const totalLhi = activeRows.reduce((sum, r) =>
    sum + (+r.sf || 0) * lhiDollarPerSf(r), 0)

  // Per-partner breakdown (for the table)
  const perPartner = activeRows.map(r => {
    const sf = +r.sf || 0
    const lease = leaseDollarPerSf(r)
    const lhi = lhiDollarPerSf(r)
    return {
      partner: r.partner || 'Unknown',
      sf,
      year1Rent: sf * lease,
      totalLhi: sf * lhi,
      total25YrRent: calc25YrRent(sf * lease, leaseEscalation, escalationInterval)
    }
  })

  // Year-by-year trajectory (25 years)
  const yearByYear = []
  let cumFragmented = totalLhi  // LHI paid up front
  let cumHub = 0
  for (let y = 1; y <= 25; y++) {
    const cyclesComplete = Math.floor((y - 1) / escalationInterval)
    const yearlyRent = year1Rent * Math.pow(1 + leaseEscalation, cyclesComplete)
    const yearlyHub = hubAnnualCost * Math.pow(1 + hubInflation, y - 1)
    cumFragmented += yearlyRent
    cumHub += yearlyHub
    yearByYear.push({
      year: y,
      yearlyRent: Math.round(yearlyRent),
      yearlyHub: Math.round(yearlyHub),
      cumFragmented: Math.round(cumFragmented),
      cumHub: Math.round(cumHub)
    })
  }

  const total25YrRent = yearByYear.reduce((s, y) => s + y.yearlyRent, 0)
  const combined25Yr = total25YrRent + totalLhi
  const hub25Yr = yearByYear[yearByYear.length - 1].cumHub
  const savings25Yr = combined25Yr - hub25Yr

  return {
    year1Rent, totalLhi, total25YrRent, combined25Yr, hub25Yr, savings25Yr,
    yearByYear, perPartner
  }
}

function calc25YrRent(year1, escalation, interval) {
  let total = 0
  for (let y = 1; y <= 25; y++) {
    const cyclesComplete = Math.floor((y - 1) / interval)
    total += year1 * Math.pow(1 + escalation, cyclesComplete)
  }
  return total
}
