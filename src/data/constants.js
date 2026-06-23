// ─── RIVERSIDE HUB STATIC DATA ──────────────────────────────────────────────

export const RIVERSIDE = {
  project: {
    name: 'Riverside Hub — 54 Brant Ave, Brantford ON',
    address: '54 Brant Ave, Brantford, ON',
    operator: 'Willowbridge Community Services',
    gfa: 57800, parkingArea: 26600,
    constructionStart: 2028, analysisHorizon: 25,
    policyVersion: 'NP-1.0',
  },
  capital: {
    hardCosts: 38215165.5, designContingency: 0.15,
    escalationRate: 0.025, escalationMonths: 18,
    hardSubtotal: 44902819.46, softCostPct: 0.22,
    constructionContingency: 0.15,
    totalConstructionCost: 59042430.7, preDevCosts: 625669.56,
    totalProjectCost: 60293769.82, donations: 3500000,
    provincialGrantPct: 0.90, provincialGrant: 54264392.838,
    municipalContribution: 0, partnerDebtGross: 6029376.982,
    netFinancingRequired: 2529376.982, yearlyDebt: 170578.72521,
  },
  fmOpex: {
    ratePerSf: 13, annualCost: 820470,
    breakdown: [
      { name: 'Electricity',              rate: 2.25 },
      { name: 'Nat Gas / Heating',        rate: 1.25 },
      { name: 'Water & Sewer',            rate: 0.75 },
      { name: 'Repairs & Maintenance',    rate: 2.50 },
      { name: 'Housekeeping / Env.',      rate: 2.00 },
      { name: 'Grounds & Snow',           rate: 0.50 },
      { name: 'Building Services',        rate: 1.75 },
      { name: 'FM Admin & Management',    rate: 1.00 },
      { name: 'Insurance',               rate: 0.50 },
      { name: 'Contingency & Misc.',      rate: 0.50 },
      { name: 'Property Tax (Exempt)',    rate: 0    },
    ],
  },
  statusQuo: {
    totalAnnual: 3075245.99, hubModelCost: 921978.73,
    annualSaving: 2153267.27, saving25yr: 53831681.68,
    simplePayback: 28.0, roi25yr: -10.72,
    netCostReductionPct: 70.02,
    buckets: {
      b1Operations: 2216442.78, b2DeferredCapital: 82300.4,
      b3CapitalExpansion: 226252.81, b4LeaseholdImprovements: 550250,
    },
  },
  partners: [
    { id:1, name:'Willowbridge Community Services', shortName:'WBCS',   sqft:11000, requiredSqft:14500, statusQuoOpex:370238,     deferredCapital:82300,  capExpansion:143979.06, lhi:101500, annualLease:0,      color:'#6366f1' },
    { id:2, name:'Grand River CHC',                 shortName:'GRCHC',  sqft:null,  requiredSqft:14500, statusQuoOpex:1010346.26, deferredCapital:0,      capExpansion:0,         lhi:326250, annualLease:261000, color:'#10b981' },
    { id:3, name:'CMHA/HOPE Brant',                 shortName:'CMHA/HOPE', sqft:null, requiredSqft:12000, statusQuoOpex:719590.52, deferredCapital:0, capExpansion:0, lhi:84000, annualLease:216000, color:'#06b6d4' },
    { id:4, name:'Contact Brant',                   shortName:'CB',     sqft:3500,  requiredSqft:5500,  statusQuoOpex:116268,     deferredCapital:0,      capExpansion:82273.75,  lhi:38500,  annualLease:99000,  color:'#f59e0b' },
    { id:5, name:'Brant Community Health System',   shortName:'BCHCS',  sqft:null,  requiredSqft:null,  statusQuoOpex:0,          deferredCapital:0,      capExpansion:0,         lhi:0,      annualLease:0,      color:'#ec4899', dataStatus:'pending', spaceSharePct:2, estSf:1156, note:'Minor partner — operating data not available' },
  ],
  capitalReplacement: [
    { item:'General Capital Replacements', priority:'Urgent', low:201000,  median:332300, high:466600 },
    { item:'Sound Insulation & Flooring',  priority:'High',   low:207690,  median:335698, high:458520 },
    { item:'Accessible Rear Entrance',     priority:'High',   low:84985,   median:139238, high:210240 },
    { item:'Building Exterior & Facade',   priority:'Medium', low:8363,    median:15768,  high:26800  },
  ],
  sensitivity: [
    {
      scenario: 'Conservative\n(B1 + B2 confirmed costs only)',
      statusQuoCost: 2298743,
      hubModelCost: 959100,
      saving: 1339643,
      comment: 'Only costs already occurring today — fully defensible',
    },
    {
      scenario: 'Base Case\n(B1 + B2 + B4 most likely path)',
      statusQuoCost: 2849000,
      hubModelCost: 959100,
      saving: 1889900,
      comment: 'Partners lease new space — most probable scenario',
    },
    {
      scenario: 'Full Liability\n(all 4 buckets — system ceiling)',
      statusQuoCost: 3075246,
      hubModelCost: 959100,
      saving: 2116146,
      comment: 'Complete status quo liability if Hub does not proceed',
    },
  ],
}

// ─── OPEX CATEGORIES ─────────────────────────────────────────────────────────

export const OPEX_CATEGORIES = [
  { key:'utilities_heat',  label:'Utilities (Heating/Cooling)',      group:'Facilities' },
  { key:'utilities_water', label:'Water/Hydro Bill',                 group:'Facilities' },
  { key:'maintenance',     label:'Maintenance incl. Salaries',       group:'Facilities' },
  { key:'repairs_rm',      label:'Repairs & Building R&M',           group:'Facilities' },
  { key:'snow_removal',    label:'Snow Removal',                     group:'Facilities' },
  { key:'elevator',        label:'Annual Elevator Maintenance',      group:'Facilities' },
  { key:'groundskeeping',  label:'Groundskeeping',                   group:'Facilities' },
  { key:'cleaning',        label:'Cleaning & Janitorial',            group:'Facilities' },
  { key:'pest_control',    label:'Pest Control',                     group:'Facilities' },
  { key:'garbage',         label:'Garbage Removal / Disposal',       group:'Facilities' },
  { key:'fire_safety',     label:'Fire Safety & Inspections',        group:'Facilities' },
  { key:'health_safety',   label:'Health & Safety',                  group:'Facilities' },
  { key:'insurance',       label:'Insurance (Building/Contents)',    group:'Facilities' },
  { key:'lease_tax',       label:'Lease / Property Taxes',           group:'Occupancy'  },
  { key:'parking',         label:'Parking',                          group:'Occupancy'  },
  { key:'ext_rental',      label:'External Facility Rental',         group:'Occupancy'  },
  { key:'receptionist',    label:'Receptionist / Admin Salary',      group:'Staffing'   },
  { key:'security_staff',  label:'Security Staff Salary',            group:'Staffing'   },
  { key:'facility_mgr',    label:'Facility Manager Salary',          group:'Staffing'   },
  { key:'finance_staff',   label:'Finance Staff Salary',             group:'Staffing'   },
  { key:'hr_staff',        label:'HR Staff Salary',                  group:'Staffing'   },
  { key:'other_staff',     label:'Other FT Staff Salaries/Benefits', group:'Staffing'   },
  { key:'it_security',     label:'IT & Security Systems',            group:'Technology' },
  { key:'phone_internet',  label:'Phone & Internet',                 group:'Technology' },
  { key:'client_mgmt',     label:'Client Management System',         group:'Technology' },
  { key:'room_booking',    label:'Room-Booking System',              group:'Technology' },
  { key:'photocopiers',    label:'Photocopiers / Printers',          group:'Technology' },
  { key:'office_supplies', label:'Office Supplies & Expenses',       group:'Admin'      },
  { key:'legal',           label:'Legal & Compliance',               group:'Admin'      },
  { key:'licences_audit',  label:'Licences/Audit',                   group:'Admin'      },
  { key:'postage',         label:'Postage (Pitney Bowes etc.)',       group:'Admin'      },
  { key:'culligan',        label:'Culligan Water',                   group:'Admin'      },
  { key:'furniture',       label:'Furniture',                        group:'Admin'      },
]

export const PARTNER_COLS = [
  { id:'willowbridge',  label:'Willowbridge',    short:'WBCS',  color:'#6366f1' },
  { id:'contact_brant', label:'Contact Brant',   short:'CB',    color:'#f59e0b' },
  { id:'cmha',          label:'CMHA/HOPE Brant', short:'CMHA/HOPE', color:'#06b6d4' },
  { id:'grchc',         label:'Grand River CHC', short:'GRCHC', color:'#10b981' },
  { id:'bchcs',         label:'BCHCS',           short:'BCHCS', color:'#ec4899' },
]

export const INITIAL_OPEX = {
  willowbridge:  { utilities_heat:14841,utilities_water:1200,maintenance:41254,repairs_rm:53813,snow_removal:0,elevator:0,groundskeeping:0,cleaning:22923,pest_control:0,garbage:0,fire_safety:0,health_safety:0,insurance:53625,lease_tax:0,parking:0,ext_rental:0,receptionist:23969,security_staff:0,facility_mgr:0,finance_staff:0,hr_staff:0,other_staff:3216,it_security:129299,phone_internet:13671,client_mgmt:0,room_booking:0,photocopiers:0,office_supplies:11955,legal:0,licences_audit:0,postage:0,culligan:0,furniture:472 },
  contact_brant: { utilities_heat:1863,utilities_water:2277,maintenance:1000,repairs_rm:1000,snow_removal:0,elevator:0,groundskeeping:0,cleaning:11229,pest_control:168,garbage:0,fire_safety:0,health_safety:0,insurance:11000,lease_tax:35364,parking:0,ext_rental:1073,receptionist:0,security_staff:0,facility_mgr:0,finance_staff:0,hr_staff:0,other_staff:0,it_security:36274,phone_internet:4795,client_mgmt:0,room_booking:0,photocopiers:2315,office_supplies:6000,legal:774,licences_audit:0,postage:700,culligan:436,furniture:0 },
  cmha:          { utilities_heat:10852.44,utilities_water:1617.46,maintenance:0,repairs_rm:13567.33,snow_removal:0,elevator:0,groundskeeping:0,cleaning:6874.67,pest_control:0,garbage:0,fire_safety:0,health_safety:0,insurance:81828.48,lease_tax:321144.61,parking:24663.37,ext_rental:0,receptionist:47285.27,security_staff:11690,facility_mgr:0,finance_staff:88856.94,hr_staff:0,other_staff:0,it_security:72406.11,phone_internet:35045.03,client_mgmt:0,room_booking:0,photocopiers:17996.75,office_supplies:15083.33,legal:0,licences_audit:17964,postage:0,culligan:0,furniture:0 },
  grchc:         { utilities_heat:46645.02,utilities_water:1315,maintenance:0,repairs_rm:0,snow_removal:0,elevator:0,groundskeeping:0,cleaning:104654.55,pest_control:3955,garbage:14291.74,fire_safety:0,health_safety:0,insurance:58517.5,lease_tax:356549.32,parking:0,ext_rental:0,receptionist:0,security_staff:0,facility_mgr:0,finance_staff:0,hr_staff:0,other_staff:0,it_security:97765.01,phone_internet:83034.88,client_mgmt:12719.28,room_booking:0,photocopiers:0,office_supplies:18448.44,legal:16990.24,licences_audit:195460.28,postage:0,culligan:0,furniture:0 },
  bchcs:         { utilities_heat:0,utilities_water:0,maintenance:0,repairs_rm:0,snow_removal:0,elevator:0,groundskeeping:0,cleaning:0,pest_control:0,garbage:0,fire_safety:0,health_safety:0,insurance:0,lease_tax:0,parking:0,ext_rental:0,receptionist:0,security_staff:0,facility_mgr:0,finance_staff:0,hr_staff:0,other_staff:0,it_security:0,phone_internet:0,client_mgmt:0,room_booking:0,photocopiers:0,office_supplies:0,legal:0,licences_audit:0,postage:0,culligan:0,furniture:0 },
}

// ─── FM BENCHMARK ─────────────────────────────────────────────────────────────

export const FM_BASE_CATEGORIES = [
  { key:'electricity',  label:'Electricity',                 baseRate:2.25, source:'ASHE/IFMA' },
  { key:'gas',          label:'Natural Gas / Heating',       baseRate:1.25, source:'ASHE/IFMA' },
  { key:'water',        label:'Water & Sewer',               baseRate:0.75, source:'ASHE'      },
  { key:'repairs',      label:'Repairs & Maintenance',       baseRate:2.50, source:'BOMA'      },
  { key:'housekeeping', label:'Housekeeping / Env.',         baseRate:2.00, source:'ASHE/IFMA' },
  { key:'grounds',      label:'Grounds, Snow & Landscaping', baseRate:0.50, source:'ASHE/IFMA' },
  { key:'services',     label:'Building Services Contracts', baseRate:1.75, source:'BOMA'      },
  { key:'admin',        label:'FM Admin & Management',       baseRate:1.00, source:'IFMA'      },
  { key:'insurance',    label:'Insurance (Building Ops)',    baseRate:0.50, source:'BOMA'      },
  { key:'contingency',  label:'Contingency & Misc.',         baseRate:0.50, source:'IFMA'      },
  { key:'parking',      label:'Parking Lot Maintenance',     baseRate:1.20, benchmarkRate:1.20, source:'BOMA', color:'#8B5CF6', group:'Facilities', description:'Snow removal, line painting, lighting, asphalt maintenance', parkingArea:25000, note:'Based on 25,000 sf surface parking area' },
]

export const makeFmRates = (cats) => Object.fromEntries(cats.map(c => [c.key, c.baseRate]))

export const FM_PRESETS = {
  benchmark:    { label:'ASHE/BOMA Benchmark', color:'#6366f1', rates: makeFmRates(FM_BASE_CATEGORIES) },
  conservative: { label:'Conservative (+20%)', color:'#f59e0b', rates: Object.fromEntries(FM_BASE_CATEGORIES.map(c => [c.key, +(c.baseRate*1.2).toFixed(2)])) },
  optimistic:   { label:'Optimistic (−15%)',   color:'#10b981', rates: Object.fromEntries(FM_BASE_CATEGORIES.map(c => [c.key, +(c.baseRate*0.85).toFixed(2)])) },
}

// ─── SCENARIO DEFAULTS ────────────────────────────────────────────────────────

export const DEFAULT_SCENARIO_INPUTS = {
  name:'Riverside 90% Grant',
  hardBaseCost:38215165.5, buildingCost:44902819.46, softCosts:8407336.41, contingency:5732274.83, landCost:625670, swingSpaceCost:0,
  buildingSize:57800, parkingSf:26600, parkingFmRatePerSf:3.50, fmBufferPct:2.5, unitCount:5,
  grants:54264393, donations:3500000, otherCapital:0,
  interestRate:3.65, amortization:25,
  designContingencyPct:15, escalationRatePct:0, escalationMonths:0, softCostsPct:22, constructionContingencyPct:15,
  utilities:199120, maintenance:144500, insurance:43350, admin:28900,
  propMgmt:173400, capitalReserve:50000, security:72250, cleaning:115600,
  landscaping:28900, waste:8680, legal:5770, marketing:0, internet:0,
  dscrSupport:0, vacancyRate:0, badDebtRate:0,
}

export const DEFAULT_PLANNER_PARTNERS = [
  { id:1, name:'Willowbridge (WBCS)', share:28, lease:0, tax:0, parking:0, other:0, currentRent:370238,  capitalContrib:0, isMortgageExempt:false },
  { id:2, name:'Grand River CHC',     share:34, lease:0, tax:0, parking:0, other:0, currentRent:1010346, capitalContrib:0, isMortgageExempt:false },
  { id:3, name:'CMHA/HOPE Brant',     share:24, lease:0, tax:0, parking:0, other:0, currentRent:719591,  capitalContrib:0, isMortgageExempt:false },
  { id:4, name:'Contact Brant',       share:14, lease:0, tax:0, parking:0, other:0, currentRent:116268,  capitalContrib:0, isMortgageExempt:false },
  { id:5, name:'BCHCS',               share:0,  lease:0, tax:0, parking:0, other:0, currentRent:0,       capitalContrib:0, isMortgageExempt:false },
]

export const DEFAULT_B4_LHI = [
  { id:1, partner:'Willowbridge',    sf:21000, useType:'Office',   ratePerSf:95,  lhiPerSf:95, tiAllowance:25, leaseSf:18, leasePerSf:18, leaseTerm:5, amortYears:10, amortYrs:10, note:'' },
  { id:2, partner:'Contact Brant',   sf:8500,  useType:'Office',   ratePerSf:95,  lhiPerSf:95, tiAllowance:25, leaseSf:18, leasePerSf:18, leaseTerm:5, amortYears:10, amortYrs:10, note:'' },
  { id:3, partner:'CMHA/HOPE Brant', sf:18000, useType:'Office',   ratePerSf:95,  lhiPerSf:95, tiAllowance:25, leaseSf:18, leasePerSf:18, leaseTerm:5, amortYears:10, amortYrs:10, note:'' },
  { id:4, partner:'Grand River CHC', sf:24000, useType:'Clinical', ratePerSf:250, lhiPerSf:250, tiAllowance:25, leaseSf:18, leasePerSf:18, leaseTerm:5, amortYears:10, amortYrs:10, note:'' },
  { id:5, partner:'BCHCS',           sf:0,     useType:'Clinical', ratePerSf:145, lhiPerSf:145, tiAllowance:25, leaseSf:18, leasePerSf:18, leaseTerm:5, amortYears:10, amortYrs:10, note:'⚠ sf needed' },
]

export const DEFAULT_BUCKETS = {
  b1: [
    { id:1, partner:'Willowbridge',    amount:370238,     note:'2025 actual' },
    { id:2, partner:'Grand River CHC', amount:1010346.26, note:'2025 actual' },
    { id:3, partner:'CMHA/HOPE Brant', amount:719590.52,  note:'2025 actual' },
    { id:4, partner:'Contact Brant',   amount:116268,     note:'2025 actual' },
    { id:5, partner:'BCHCS',           amount:0,          note:'⚠ data needed' },
  ],
  b2: [
    { id:1, partner:'Willowbridge', item:'Roof, HVAC, Fixtures (Urgent)',      amortYears:10, oneTime:332300, note:'Median estimate' },
    { id:2, partner:'Willowbridge', item:'Sound Insulation & Flooring (High)', amortYears:10, oneTime:335698, note:'Median estimate' },
    { id:3, partner:'Willowbridge', item:'Accessible Rear Entrance (High)',    amortYears:10, oneTime:139238, note:'Median estimate' },
    { id:4, partner:'Willowbridge', item:'Building Exterior & Facade',         amortYears:10, oneTime:15768,  note:'Median estimate' },
  ],
  b3: [
    { id:1, partner:'Willowbridge',    currentSf:11000, requiredSf:14500, ratePerSf:650, softCostPct:22, escalationPct:3.75, amortYears:20, note:'New construction' },
    { id:2, partner:'Contact Brant',   currentSf:3500,  requiredSf:5500,  ratePerSf:650, softCostPct:22, escalationPct:3.75, amortYears:20, note:'New construction' },
    { id:3, partner:'CMHA/HOPE Brant', currentSf:0,     requiredSf:0,     ratePerSf:185, softCostPct:22, escalationPct:3.75, amortYears:20, note:'⚠ sf needed' },
    { id:4, partner:'Grand River CHC', currentSf:0,     requiredSf:0,     ratePerSf:185, softCostPct:22, escalationPct:3.75, amortYears:20, note:'⚠ sf needed' },
    { id:5, partner:'BCHCS',           currentSf:0,     requiredSf:0,     ratePerSf:250, softCostPct:22, escalationPct:3.75, amortYears:20, note:'⚠ sf needed' },
  ],
  b4: DEFAULT_B4_LHI.map(r => ({ ...r })),
}

export const COLORS = ['#6366f1','#10b981','#06b6d4','#f59e0b','#ec4899','#8b5cf6','#ef4444']
