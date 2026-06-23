import { useState, useMemo, useEffect, useRef } from 'react'
import { PieChart, Pie, Cell, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, ResponsiveContainer } from 'recharts'
import { useSavedScenarios, useBuckets } from '../hooks/useSupabase'
import { calcAmort, formatDscrDisplay } from '../lib/finance'
import { DEFAULT_BUCKETS, COLORS } from '../data/constants'
import { KPICard, SectionHeader, InputField, SaveBar, Icons, fmtCAD, InfoTooltip, statusToColor, overallStatusToColor } from '../components/UI'

const BADGE_STYLE_BY_COLOR = {
  emerald: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10',
  amber: 'text-amber-400 border-amber-500/40 bg-amber-500/10',
  rose: 'text-rose-400 border-rose-500/40 bg-rose-500/10',
  slate: 'text-slate-300 border-slate-500/40 bg-slate-500/10',
}
const TEXT_STYLE_BY_COLOR = {
  emerald: 'text-emerald-400',
  amber: 'text-amber-400',
  rose: 'text-rose-400',
  slate: 'text-slate-300',
}

const DSCR_INFO_TEXT = 'Debt Service Coverage Ratio — measures ability to cover debt payments from operating income. Formula: NOI ÷ Annual Debt Service. A DSCR of 1.25x means the project generates $1.25 for every $1.00 of debt owed. Minimum threshold: ≥1.20x'
const NOI_INFO_TEXT = 'Net Operating Income (NOI) is the income remaining after paying all operating expenses — but before debt payments. Formula: Total Partner Revenue − Total Operating Expenses. Example: $1,966,155 revenue − $959,100 expenses = $1,007,055 NOI. A higher NOI means more capacity to service debt and build reserves.'

export default function ScenarioPlanner({ user, inputs, setInputs, saveInputs, savingInputs, scenarioInputsLoading, scenarioInputsHasSaved, partners, setPartners, savePartners, savingPartners, b4Lhi, setB4Lhi, saveB4Lhi, setB4LhiDirty, data, fundability, fmScenarios }) {
  const [activeTab, setActiveTab] = useState('funding')
  const [govPct, setGovPct]       = useState(() => {
    const tc = (+inputs.buildingCost||0)+(+inputs.landCost||0)+(+inputs.softCosts||0)+(+inputs.contingency||0)
    if (!tc || !inputs.grants) return 90
    const pct = Math.round((+inputs.grants/tc)*100)
    return pct > 0 ? pct : 90
  })
  const govPctAutoAppliedRef = useRef(false)
  useEffect(() => { govPctAutoAppliedRef.current = false }, [user.id])
  useEffect(() => {
    if (scenarioInputsLoading || scenarioInputsHasSaved !== false || govPctAutoAppliedRef.current) return
    const tc = data.capital?.totalCost
    if (!tc) return
    govPctAutoAppliedRef.current = true
    setGovPct(90)
    setInputs(prev => ({ ...prev, grants: Math.round(tc * 0.9) }))
  }, [scenarioInputsLoading, scenarioInputsHasSaved, data.capital.totalCost, setInputs])
  const [scenarioName, setScenarioName] = useState('')
  const [fmSynced, setFmSynced] = useState(false)
  const [lastFmSync, setLastFmSync] = useState(null)
  const { data: saved, setData: setSaved, save: saveSaved } = useSavedScenarios(user.id)
  const { data: buckets, setData: setBuckets, save: saveBuckets, saving: savingBuckets } = useBuckets(user.id)
  const [bucketsUnsaved, setBucketsUnsaved] = useState(false)
  const fmt  = v => fmtCAD(v)
  const hi   = (k,v) => { setInputs(prev=>({...prev,[k]:v})) }
  const calcCapitalAssumptions = src => {
    const hardCosts = src.hardBaseCost!=null ? (+src.hardBaseCost || 0) : (src.hardConstructionBase!=null ? (+src.hardConstructionBase || 0) : 38215165.5)
    const preDevCosts = src.landCost != null ? (+src.landCost || 0) : 625670
    const swingSpaceCost = +(src.swingSpaceCost || 0)
    const designContingencyPct = src.designContingencyPct==null ? 15 : (+src.designContingencyPct || 0)
    const escalationRatePct = src.escalationRatePct==null ? 2.5 : (+src.escalationRatePct || 0)
    const escalationMonths = src.escalationMonths==null ? 18 : (+src.escalationMonths || 0)
    const softCostsPct = src.softCostsPct==null ? 22 : (+src.softCostsPct || 0)
    const constructionContingencyPct = src.constructionContingencyPct==null ? 15 : (+src.constructionContingencyPct || 0)

    const classCHardSubtotal = hardCosts
      * (1 + designContingencyPct / 100)
      * (1 + (escalationRatePct / 100) * (escalationMonths / 12))
    const softCostsAmount = classCHardSubtotal * (softCostsPct / 100)
    const constructionContingencyAmount = classCHardSubtotal * (constructionContingencyPct / 100)
    const totalConstructionCost = classCHardSubtotal + softCostsAmount + constructionContingencyAmount
    const totalProjectCost = totalConstructionCost + preDevCosts + swingSpaceCost

    return {
      hardCosts,
      preDevCosts,
      swingSpaceCost,
      designContingencyPct,
      escalationRatePct,
      escalationMonths,
      softCostsPct,
      constructionContingencyPct,
      classCHardSubtotal,
      softCostsAmount,
      constructionContingencyAmount,
      totalConstructionCost,
      totalProjectCost,
    }
  }
  const updateCapitalAssumption = (key, value) => {
    setInputs(prev => {
      const next = { ...prev, [key]: value }
      const calc = calcCapitalAssumptions(next)
      return {
        ...next,
        designContingencyPct: calc.designContingencyPct,
        escalationRatePct: calc.escalationRatePct,
        escalationMonths: calc.escalationMonths,
        softCostsPct: calc.softCostsPct,
        constructionContingencyPct: calc.constructionContingencyPct,
        hardBaseCost: +calc.hardCosts.toFixed(2),
        buildingCost: +calc.classCHardSubtotal.toFixed(2),
        softCosts: +calc.softCostsAmount.toFixed(2),
        contingency: +calc.constructionContingencyAmount.toFixed(2),
      }
    })
  }
  const capitalCalc = useMemo(() => calcCapitalAssumptions(inputs), [inputs])
  useEffect(() => {
    const calc = calcCapitalAssumptions(inputs)
    setInputs(prev => {
      const synced = {
        ...prev,
        designContingencyPct: calc.designContingencyPct,
        escalationRatePct: calc.escalationRatePct,
        escalationMonths: calc.escalationMonths,
        softCostsPct: calc.softCostsPct,
        constructionContingencyPct: calc.constructionContingencyPct,
        hardBaseCost: +calc.hardCosts.toFixed(2),
        buildingCost: +calc.classCHardSubtotal.toFixed(2),
        softCosts: +calc.softCostsAmount.toFixed(2),
        contingency: +calc.constructionContingencyAmount.toFixed(2),
      }
      if (
        +prev.hardBaseCost === synced.hardBaseCost &&
        +prev.buildingCost === synced.buildingCost &&
        +prev.softCosts === synced.softCosts &&
        +prev.contingency === synced.contingency &&
        +prev.designContingencyPct === synced.designContingencyPct &&
        +prev.escalationRatePct === synced.escalationRatePct &&
        +prev.escalationMonths === synced.escalationMonths &&
        +prev.softCostsPct === synced.softCostsPct &&
        +prev.constructionContingencyPct === synced.constructionContingencyPct
      ) return prev
      return synced
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputs.designContingencyPct, inputs.escalationRatePct, inputs.escalationMonths, inputs.softCostsPct, inputs.constructionContingencyPct, inputs.hardBaseCost, inputs.hardConstructionBase])
  const hp   = (id,f,v) => setPartners(prev=>prev.map(p=>p.id===id?{...p,[f]:v}:p))
  const addP = () => setPartners(prev=>[...prev,{id:Date.now(),name:'New Partner',share:0,lease:0,parking:0,other:0,tax:0,currentRent:0,capitalContrib:0,isMortgageExempt:false}])
  const delP = id => setPartners(prev=>prev.filter(p=>p.id!==id))

  const applyGovPct = pct => { setGovPct(pct); hi('grants', Math.round(data.capital.totalCost*pct/100)) }
  const syncFromFM = () => {
    if (!fmScenarios || !fmScenarios[0]) return
    const scenario = fmScenarios[0]
    const rates = scenario.rates || {}
    const gfa = +(inputs.buildingSize || 57800)
    const parkingCost = (+(rates.parking || 1.2)) * 25000
    const fmBase = Object.entries(rates)
      .filter(([k]) => k !== 'parking')
      .reduce((s, [, v]) => s + (+v || 0) * gfa, 0)
    const fmTotal = (fmBase + parkingCost) * 1.05

    hi('utilities', Math.round((rates.electricity || 0) * gfa))
    hi('maintenance', Math.round((rates.repairs || 0) * gfa))
    hi('insurance', Math.round((rates.insurance || 0) * gfa))
    hi('admin', Math.round((rates.admin || 0) * gfa))
    hi('propMgmt', Math.round((rates.services || 0) * gfa))
    hi('cleaning', Math.round((rates.housekeeping || 0) * gfa))
    hi('landscaping', Math.round((rates.grounds || 0) * gfa))
    hi('capitalReserve', Math.round((rates.contingency || 0) * gfa))
    const totalRate = gfa > 0 ? fmTotal / gfa : 0
    const annualTotal = Math.round(fmTotal)
    setLastFmSync({
      name: scenario.label || scenario.name || 'Benchmark scenario',
      totalRate,
      annualTotal,
      fmBase,
      parkingCost,
      parkingRate: +(rates.parking || 1.2),
      fmTotal,
    })
    setFmSynced(true)
    window.setTimeout(() => setFmSynced(false), 2000)
  }

  const saveScenario = async () => {
    const name = scenarioName.trim() || `Scenario ${saved.length+1}`
    const snap = { id:Date.now(), name, inputs:{...inputs}, partners:[...partners], govPct, savedAt:new Date().toLocaleDateString(), summary:{ totalCost:data.capital.totalCost, mortgage:data.capital.mortgage, dscr:data.metrics.dscr, surplus:data.operations.surplus, status:fundability.status } }
    const next = [...saved, snap]
    setSaved(next); await saveSaved(next); setScenarioName('')
  }

  const loadScenario = snap => { setInputs(snap.inputs); setPartners(snap.partners); setGovPct(snap.govPct||90); setActiveTab('funding') }
  const delScenario  = async id => { const next=saved.filter(s=>s.id!==id); setSaved(next); await saveSaved(next) }

  // Bucket helpers
  const b1Total = buckets.b1.reduce((s,r)=>s+r.amount,0)
  const b2Total = buckets.b2.reduce((s,r)=>s+(r.oneTime/(r.amortYears||1)),0)
  const b3Row   = r => { const sf=Math.max(0,(r.requiredSf||0)-(r.currentSf||0)); return (sf*(r.ratePerSf||0))*(1+(r.softCostPct||0)/100)*(1+(r.escalationPct||0)/100)/(r.amortYears||1) }
  const b3Total = buckets.b3.reduce((s,r)=>s+b3Row(r),0)
  const b4Rows = Array.isArray(b4Lhi) ? b4Lhi : []
  const b4NetLHI= r => Math.max(0,(r.sf||0)*(r.ratePerSf||0)-(r.sf||0)*(r.tiAllowance||0))
  const b4Lease = r => (r.sf||0)*(r.leaseSf||0)
  const b4Total = b4Rows.reduce((s,r)=>s+(b4NetLHI(r)/(r.amortYears||1)),0)
  const sqTotal = b1Total+b2Total+b3Total+b4Total
  const hubModelCost = (data?.operations?.debtService || 0) + (data?.operations?.expenses || 0)

  const updB = (bucket,id,field,val) => {
    if (bucket === 'b4') {
      const numFields = ['sf','ratePerSf','tiAllowance','leaseSf','leaseTerm','amortYears']
      const num = numFields.includes(field) ? +val||0 : val
      setB4Lhi(prev => (Array.isArray(prev) ? prev : []).map(r => r.id===id ? { ...r, [field]: num } : r))
      setB4LhiDirty(true)
      return
    }
    const numFields = { b1:['amount'], b2:['amortYears','oneTime'], b3:['currentSf','requiredSf','ratePerSf','softCostPct','escalationPct','amortYears'], b4:['sf','ratePerSf','tiAllowance','leaseSf','leaseTerm','amortYears'] }
    const num = numFields[bucket].includes(field) ? +val||0 : val
    setBuckets(prev=>({...prev,[bucket]:prev[bucket].map(r=>r.id===id?{...r,[field]:num}:r)}))
    setBucketsUnsaved(true)
  }
  const addB = bucket => {
    const newRow = {id:Date.now(),partner:'',amount:0,item:'New item',amortYears:10,oneTime:0,currentSf:0,requiredSf:0,ratePerSf:185,softCostPct:22,escalationPct:3.75,sf:0,useType:'Office',tiAllowance:25,leaseSf:18,leaseTerm:5,note:''}
    if (bucket === 'b4') {
      setB4Lhi(prev => [...(Array.isArray(prev) ? prev : []), newRow])
      setB4LhiDirty(true)
      return
    }
    setBuckets(prev=>({...prev,[bucket]:[...prev[bucket],newRow]})); setBucketsUnsaved(true)
  }
  const delB = (bucket,id) => {
    if (bucket === 'b4') {
      setB4Lhi(prev => (Array.isArray(prev) ? prev : []).filter(r => r.id!==id))
      setB4LhiDirty(true)
      return
    }
    setBuckets(prev=>({...prev,[bucket]:prev[bucket].filter(r=>r.id!==id)})); setBucketsUnsaved(true)
  }
  const saveBucketData = async () => { await saveBuckets(buckets); await saveB4Lhi(b4Rows); setBucketsUnsaved(false); setB4LhiDirty(false) }

  const numIn = (val,onChange,opts={}) => <input type="number" value={val||''} placeholder="0" onChange={e=>onChange(e.target.value)} className="w-full text-right bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-xs metric-mono focus:border-indigo-500 focus:outline-none" step={opts.step||'1'} min="0"/>
  const txtIn = (val,onChange) => <input type="text" value={val||''} onChange={e=>onChange(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-xs focus:border-indigo-500 focus:outline-none"/>

  // Charts
  const stackData = [
    {name:'Gov / Grant',    value:+inputs.grants||0,               color:'#6366f1'},
    {name:'Donations',      value:+inputs.donations||0,            color:'#10b981'},
    {name:'Partner Equity', value:data.capital.partnerCapital,     color:'#06b6d4'},
    {name:'Other Capital',  value:+inputs.otherCapital||0,         color:'#f59e0b'},
    {name:'Financing Gap',  value:data.capital.mortgage,           color:'#f43f5e'},
  ].filter(d=>d.value>0)

  const proForma = Array.from({length:10},(_,i)=>({ year:`Y${i+1}`, Revenue:data.operations.revenue*Math.pow(1.025,i), Expenses:data.operations.expenses*Math.pow(1.02,i), Debt:data.operations.debtService }))

  const stress = useMemo(()=>{
    const base = {name:'Base Case',   dscr:data.metrics.dscr,        surplus:data.operations.surplus}
    const rate  = (()=>{ const r=calcAmort(data.capital.mortgage,+inputs.interestRate+1.5,+inputs.amortization); const ds=r.monthlyPayment*12; return {name:'Rate +1.5%',dscr:ds>0?data.operations.noi/ds:(data.operations.noi>0?Infinity:0),surplus:data.operations.noi-ds} })()
    const cost  = (()=>{ const extra=((+inputs.buildingCost)+(+inputs.softCosts))*0.15; const r=calcAmort(data.capital.mortgage+extra,+inputs.interestRate,+inputs.amortization); const ds=r.monthlyPayment*12; return {name:'Cost +15%',dscr:ds>0?data.operations.noi/ds:(data.operations.noi>0?Infinity:0),surplus:data.operations.noi-ds} })()
    const rev   = (()=>{ const noi=data.operations.revenue*0.9-data.operations.expenses; return {name:'Revenue −10%',dscr:data.operations.debtService>0?noi/data.operations.debtService:(noi>0?Infinity:0),surplus:noi-data.operations.debtService} })()
    return [base,rate,cost,rev]
  },[data,inputs])
  const partnerTotals = useMemo(() => {
    return data.partners.reduce((acc, p) => {
      const proposed = (+p.lease || 0) + (+p.tax || 0)
      const contingency = proposed * 0.05
      const totalWithContingency = proposed + contingency
      const savings = (+p.currentRent || 0) - proposed
      acc.share += (+p.share || 0)
      acc.currentCost += (+p.currentRent || 0)
      acc.capContrib += (+p.capitalContrib || 0)
      acc.calcLease += proposed
      acc.contingency += contingency
      acc.totalWithContingency += totalWithContingency
      acc.savings += savings
      return acc
    }, { share:0, currentCost:0, capContrib:0, calcLease:0, contingency:0, totalWithContingency:0, savings:0 })
  }, [data.partners])
  const shareGap = 100 - partnerTotals.share

  const TABS = [
    {id:'funding',label:'Funding Scenarios'},{id:'inputs',label:'Project Inputs'},{id:'partners',label:'Partners'},
    {id:'b1',label:'B1 · Operations'},{id:'b2',label:'B2 · Deferred Capital'},{id:'b3',label:'B3 · Expansion'},{id:'b4',label:'B4 · LHI'},
    {id:'stress',label:'Stress Test'},{id:'saved',label:`Saved (${saved.length})`},
  ]

  return (
    <div className="space-y-4">
      {/* Status bar */}
      <div className="glass-card rounded-xl px-5 py-3 flex flex-wrap items-center gap-4">
        <span className={`text-sm font-bold px-3 py-1 rounded-full border ${BADGE_STYLE_BY_COLOR[overallStatusToColor(fundability.status)]}`}>{fundability.status}</span>
        <div className="h-8 w-px bg-slate-700 hidden md:block"></div>
        {[{l:'Total Cost',v:fmt(data.capital.totalCost)},{l:'Gap',v:fmt(data.capital.mortgage),warn:data.capital.mortgage>0},{l:'DSCR',v:formatDscrDisplay(data.metrics.dscr),danger:data.metrics.dscr<1.2},{l:'Surplus',v:fmt(data.operations.surplus),danger:data.operations.surplus<0}].map(({l,v,warn,danger})=>(
          <div key={l}><div className="text-xs text-slate-500 flex items-center">{l}{l==='DSCR'?<InfoTooltip text={DSCR_INFO_TEXT}/>:null}</div><div className={`text-sm font-bold metric-mono ${danger?'text-rose-400':warn?'text-amber-400':'text-white'}`}>{v}</div></div>
        ))}
        <div className="ml-auto flex items-center gap-2 flex-wrap">
          <input value={scenarioName} onChange={e=>setScenarioName(e.target.value)} placeholder="Name this scenario…"
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-xs focus:border-indigo-500 focus:outline-none w-40"/>
          <button onClick={saveScenario} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/30 border border-indigo-500/40 hover:bg-indigo-600/50 text-indigo-300 rounded-lg text-xs font-medium transition-all">
            <Icons.Save className="w-3 h-3"/> Save Scenario
          </button>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setActiveTab(t.id)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${activeTab===t.id?'tab-active':'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── FUNDING ── */}
      {activeTab==='funding'&&(
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-4">
            <div className="mb-4 rounded-lg border border-cyan-500/30 bg-cyan-500/5 px-4 py-3">
              <div className="flex items-start gap-2">
                <span className="text-cyan-400 text-sm font-bold">ⓘ</span>
                <div className="text-xs text-cyan-100 leading-relaxed">
                  <div className="font-semibold text-cyan-300 mb-1">
                    Grant Assumption: {govPct}% of Total Project Cost
                  </div>
                  <div className="text-slate-400">
                    This reflects the project's provincial grant <span className="italic">ask</span>,
                    not a confirmed commitment. Adjust the slider below to model
                    alternative funding scenarios (e.g. 70%, 80%).
                  </div>
                </div>
              </div>
            </div>
            <div className="glass-card rounded-xl p-5 space-y-5">
              <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Funding Mix</div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm text-slate-300 font-medium">Government / Grant %</label>
                  <span className="text-lg font-bold text-emerald-400 metric-mono">{govPct}%</span>
                </div>
                <input type="range" min="0" max="100" step="1" value={govPct} onChange={e=>applyGovPct(+e.target.value)} className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-slate-700 accent-emerald-500"/>
                <div className="flex justify-between text-xs text-slate-500 mt-1"><span>0%</span><span>50%</span><span>100%</span></div>
                <div className="mt-2 text-center text-sm text-slate-400">= <span className="font-bold text-emerald-400 metric-mono">{fmt(+inputs.grants||0)}</span></div>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[70,80,90,100].map(p=>(
                  <button key={p} onClick={()=>applyGovPct(p)} className={`py-1.5 rounded-lg text-xs font-bold transition-all ${govPct===p?'bg-emerald-600 text-white':'bg-slate-800 text-slate-400 border border-slate-700 hover:border-emerald-500/50 hover:text-emerald-400'}`}>{p}%</button>
                ))}
              </div>
              <div className="border-t border-slate-700 pt-4 space-y-3">
                <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Other Sources</div>
                <InputField label="Donations & In-Kind" value={inputs.donations} onChange={v=>hi('donations',v)} prefix="$"/>
                <InputField label="Other Capital" value={inputs.otherCapital||0} onChange={v=>hi('otherCapital',v)} prefix="$"/>
              </div>
              <div className="border-t border-slate-700 pt-4 space-y-3">
                <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Financing Terms</div>
                <div className="grid grid-cols-2 gap-3">
                  <InputField label="Interest Rate" value={inputs.interestRate} onChange={v=>hi('interestRate',v)} suffix="%" step="0.125"/>
                  <InputField label="Amortization" value={inputs.amortization} onChange={v=>hi('amortization',v)} suffix="Yrs"/>
                </div>
              </div>
            </div>
            <div className="glass-card rounded-xl p-5 space-y-2">
              <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-3">Capital Stack</div>
              {stackData.map((d,i)=>(
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full" style={{background:d.color}}></div><span className="text-slate-400">{d.name}</span></div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500">{data.capital.totalCost>0?((d.value/data.capital.totalCost)*100).toFixed(1):0}%</span>
                    <span className={`metric-mono font-semibold text-xs ${d.name==='Financing Gap'?'text-rose-400':'text-white'}`}>{fmt(d.value)}</span>
                  </div>
                </div>
              ))}
              {data.capital.mortgage===0&&<div className="mt-2 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">Fully funded — no financing gap</div>}
              {data.capital.mortgage>0&&<div className="mt-2 p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">Gap of {fmt(data.capital.mortgage)} → {fmt(data.operations.debtService)}/yr</div>}
            </div>
          </div>
          <div className="lg:col-span-8 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <KPICard title="Financing Gap" value={fmt(data.capital.mortgage)} danger={data.capital.mortgage>data.capital.totalCost*0.3} warn={data.capital.mortgage>0&&data.capital.mortgage<=data.capital.totalCost*0.3} mono/>
              <KPICard title="NOI" value={fmt(data.operations.noi)} mono infoTooltip={NOI_INFO_TEXT}/>
              <KPICard title="Annual Surplus" value={fmt(data.operations.surplus)} danger={data.operations.surplus<0} mono/>
              <KPICard title="DSCR" value={formatDscrDisplay(data.metrics.dscr)} danger={data.metrics.dscr<1.2} warn={data.metrics.dscr>=1.2&&data.metrics.dscr<1.35} mono infoTooltip={DSCR_INFO_TEXT}/>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass-card rounded-xl p-5">
                <div className="text-sm font-semibold text-slate-300 mb-4">Capital Stack</div>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart><Pie data={stackData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value" stroke="none">{stackData.map((d,i)=><Cell key={i} fill={d.color}/>)}</Pie><Tooltip formatter={v=>fmt(v)} contentStyle={{backgroundColor:'#0f172a',border:'1px solid #334155',borderRadius:'8px',color:'#fff',fontSize:'11px'}}/><Legend wrapperStyle={{fontSize:'10px'}}/></PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="glass-card rounded-xl p-5">
                <div className="text-sm font-semibold text-slate-300 mb-4">10-Year Pro Forma</div>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={proForma} margin={{top:4,right:8,left:-20,bottom:0}}>
                      <defs><linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.35}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/></linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b"/>
                      <XAxis dataKey="year" tick={{fontSize:9,fill:'#94a3b8'}}/><YAxis tickFormatter={v=>`$${(v/1000).toFixed(0)}K`} tick={{fontSize:9,fill:'#94a3b8'}}/>
                      <Tooltip formatter={v=>fmt(v)} contentStyle={{backgroundColor:'#0f172a',border:'1px solid #334155',borderRadius:'8px',color:'#fff',fontSize:'11px'}}/>
                      <Area type="monotone" dataKey="Revenue" stroke="#6366f1" fill="url(#gRev)" strokeWidth={2}/>
                      <Area type="monotone" dataKey="Expenses" stroke="#ec4899" fill="#ec4899" fillOpacity={0.15} strokeWidth={2}/>
                      <Area type="monotone" dataKey="Debt" stroke="#f97316" fill="#f97316" fillOpacity={0.2} strokeWidth={2}/>
                      <Legend wrapperStyle={{fontSize:'10px'}}/>
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            <div className="glass-card rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-700 flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-300">Readiness Matrix</div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full border ${BADGE_STYLE_BY_COLOR[overallStatusToColor(fundability.status)]}`}>{fundability.status} · {fundability.failedCount} failing</span>
              </div>
              <table className="w-full text-sm">
                <thead><tr className="border-b border-slate-700 bg-slate-900/50"><th className="text-left py-2 px-5 text-slate-400">Rule</th><th className="text-center py-2 px-3 text-slate-400">Target</th><th className="text-center py-2 px-3 text-slate-400">Actual</th><th className="text-center py-2 px-3 text-slate-400">Status</th><th className="text-left py-2 px-4 text-slate-400 hidden lg:table-cell">Levers</th></tr></thead>
                <tbody className="divide-y divide-slate-800/60">
                  {fundability.rules.map((r,i)=>(
                    <tr key={i} className={`transition-colors ${r.status === 'fail' && r.critical ? 'bg-rose-900/10' : 'hover:bg-slate-800/30'}`}>
                      <td className="py-3 px-5 font-medium text-slate-200">{r.name}</td>
                      <td className="py-3 px-3 text-center"><span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-xs metric-mono">{r.comparator==='lte'?'≤':'≥'}{r.target}{r.unit}</span></td>
                      <td className="py-3 px-3 text-center"><span className={`font-bold metric-mono text-sm ${TEXT_STYLE_BY_COLOR[statusToColor(r.status)]}`}>{r.value}{r.unit}</span></td>
                      <td className="py-3 px-3 text-center"><span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${BADGE_STYLE_BY_COLOR[statusToColor(r.status)]}`}>{r.status === 'pass' ? 'PASS' : r.status === 'watch' ? 'WATCH' : r.critical ? '⚠ CRITICAL' : 'FAIL'}</span></td>
                      <td className="py-3 px-4 text-xs text-slate-500 hidden lg:table-cell">{r.status === 'pass' ? '—' : r.levers.join(' · ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── PROJECT INPUTS ── */}
      {activeTab==='inputs'&&(
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card rounded-xl p-6 space-y-4">
            <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Project Details</div>
            <InputField label="Project Name" type="text" value={inputs.name} onChange={v=>hi('name',v)}/>
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Building Size (sf)" value={inputs.buildingSize} onChange={v=>hi('buildingSize',v)}/>
              <InputField label="Partner Count" value={inputs.unitCount} onChange={v=>hi('unitCount',v)}/>
            </div>
            <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest pt-2">Construction Budget</div>
            <div className="space-y-4">
              <InputField label="Hard Construction Costs (Base)" value={capitalCalc.hardCosts} onChange={v=>hi('hardBaseCost',v)} prefix="$"/>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-sm text-slate-300">Design Contingency %</label>
                  <span className="text-sm font-semibold text-emerald-400 metric-mono">{capitalCalc.designContingencyPct.toFixed(1)}%</span>
                </div>
                <input type="range" min="0" max="30" step="0.1" value={capitalCalc.designContingencyPct} onChange={e=>hi('designContingencyPct',e.target.value)} className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-slate-700 accent-emerald-500"/>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-sm text-slate-300">Escalation Rate %</label>
                  <span className="text-sm font-semibold text-emerald-400 metric-mono">{capitalCalc.escalationRatePct.toFixed(2)}%</span>
                </div>
                <input type="range" min="0" max="10" step="0.1" value={capitalCalc.escalationRatePct} onChange={e=>hi('escalationRatePct',e.target.value)} className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-slate-700 accent-emerald-500"/>
              </div>
              <InputField label="Escalation Period (months)" value={capitalCalc.escalationMonths} onChange={v=>hi('escalationMonths',v)}/>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-sm text-slate-300">Soft Costs %</label>
                  <span className="text-sm font-semibold text-emerald-400 metric-mono">{capitalCalc.softCostsPct.toFixed(1)}%</span>
                </div>
                <input type="range" min="0" max="40" step="0.1" value={capitalCalc.softCostsPct} onChange={e=>hi('softCostsPct',e.target.value)} className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-slate-700 accent-emerald-500"/>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-sm text-slate-300">Construction Contingency %</label>
                  <span className="text-sm font-semibold text-emerald-400 metric-mono">{capitalCalc.constructionContingencyPct.toFixed(1)}%</span>
                </div>
                <input type="range" min="0" max="25" step="0.1" value={capitalCalc.constructionContingencyPct} onChange={e=>hi('constructionContingencyPct',e.target.value)} className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-slate-700 accent-emerald-500"/>
              </div>
              <InputField label="Pre-Development Costs" value={inputs.landCost ?? 625670} onChange={v=>hi('landCost',v)} prefix="$"/>
              <div className="text-xs text-slate-500 -mt-2">Planning, approvals, surveys, environmental assessments</div>
              <InputField label="Swing Space / Transition Costs" value={inputs.swingSpaceCost ?? 0} onChange={v=>hi('swingSpaceCost',v)} prefix="$"/>
              <div className="text-xs text-slate-500 -mt-2">Temporary relocation costs for partners during construction</div>
              <div className="rounded-lg border border-slate-700 overflow-hidden">
                <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-slate-900/60 text-[11px] uppercase tracking-wide text-slate-400">
                  <div className="col-span-4">Calculation</div>
                  <div className="col-span-5">Formula</div>
                  <div className="col-span-3 text-right">Value</div>
                </div>
                {[
                  { label:'Class C Hard Subtotal', formula:'Hard Costs × (1 + Design Contingency%) × (1 + Escalation Rate% × Escalation Months / 12)', value:capitalCalc.classCHardSubtotal },
                  { label:'Soft Costs Amount', formula:'Class C Hard Subtotal × Soft Costs%', value:capitalCalc.softCostsAmount },
                  { label:'Construction Contingency Amount', formula:'Class C Hard Subtotal × Construction Contingency%', value:capitalCalc.constructionContingencyAmount },
                  { label:'Total Construction Cost', formula:'Hard Subtotal + Soft Costs + Construction Contingency', value:capitalCalc.totalConstructionCost },
                  { label:'Pre-Development Costs', formula:'Planning, approvals, surveys, environmental assessments', value:capitalCalc.preDevCosts },
                  ...(capitalCalc.swingSpaceCost > 0 ? [{ label:'Swing Space / Transition Costs', formula:'Temporary relocation costs for partners during construction', value:capitalCalc.swingSpaceCost }] : []),
                  { label:'TOTAL PROJECT COST', formula:capitalCalc.swingSpaceCost > 0 ? 'Total Construction Cost + Pre-Development + Swing Space' : 'Total Construction Cost + Pre-Development Costs', value:capitalCalc.totalProjectCost, strong:true },
                ].map(row=>(
                  <div key={row.label} className="grid grid-cols-12 gap-2 px-3 py-2 border-t border-slate-800 text-xs">
                    <div className={`col-span-4 ${row.strong?'font-bold text-white':'text-slate-200'}`}>{row.label}</div>
                    <div className="col-span-5 text-slate-500">{row.formula}</div>
                    <div className={`col-span-3 text-right metric-mono ${row.strong?'font-bold text-emerald-400':'text-indigo-300'}`}>{fmt(row.value)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="glass-card rounded-xl p-6 space-y-4">
            <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Financing & Risk</div>
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Grants / Government" value={inputs.grants} onChange={v=>hi('grants',v)} prefix="$"/>
              <InputField label="Donations" value={inputs.donations} onChange={v=>hi('donations',v)} prefix="$"/>
              <InputField label="Interest Rate" value={inputs.interestRate} onChange={v=>hi('interestRate',v)} suffix="%" step="0.125"/>
              <InputField label="Amortization (yrs)" value={inputs.amortization} onChange={v=>hi('amortization',v)}/>
              <InputField label="Vacancy %" value={inputs.vacancyRate} onChange={v=>hi('vacancyRate',v)} suffix="%" step="0.5"/>
              <InputField label="Bad Debt %" value={inputs.badDebtRate} onChange={v=>hi('badDebtRate',v)} suffix="%" step="0.5"/>
<InputField label="Capital Reserve Fund ($)" value={inputs.capitalReserve||0} onChange={v=>hi('capitalReserve',v)} prefix="$"/>
            <div className="text-xs text-slate-500 mt-1">
              Held for unexpected deficits. Funded from opening capital.
              Not included in annual operating expenses.
            </div>
            </div>
            <div className="border-t border-slate-700 pt-4 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Operating Expenses</div>
                <button
                  onClick={syncFromFM}
                  title="Automatically populate operating expenses from your FM Benchmark rates"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 border border-emerald-500/40 hover:bg-emerald-600/35 text-emerald-300 text-xs font-semibold transition-all"
                >
                  <Icons.Activity className="w-3.5 h-3.5" />
                  {fmSynced ? 'Synced! ✓' : 'Sync from FM Benchmark'}
                </button>
              </div>
              {lastFmSync && (
                <div className="text-xs text-slate-400">
                  Last synced from: <span className="text-cyan-300">{lastFmSync.name}</span> ·
                  {' '}<span className="metric-mono">${lastFmSync.totalRate.toFixed(2)}/sf</span> ·
                  {' '}<span className="metric-mono">
                    ${lastFmSync.parkingRate.toFixed(2)}/sf · {fmtCAD(lastFmSync.fmBase)} building + {fmtCAD(lastFmSync.parkingCost)} parking + 5% buffer = {fmtCAD(lastFmSync.fmTotal)}/yr total
                  </span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Utilities" value={inputs.utilities||0} onChange={v=>hi('utilities',v)} prefix="$"/>
                <InputField label="Maintenance" value={inputs.maintenance||0} onChange={v=>hi('maintenance',v)} prefix="$"/>
                <InputField label="Insurance" value={inputs.insurance||0} onChange={v=>hi('insurance',v)} prefix="$"/>
                <InputField label="Admin" value={inputs.admin||0} onChange={v=>hi('admin',v)} prefix="$"/>
                <InputField label="Property Mgmt" value={inputs.propMgmt||0} onChange={v=>hi('propMgmt',v)} prefix="$"/>
                <InputField label="Cleaning" value={inputs.cleaning||0} onChange={v=>hi('cleaning',v)} prefix="$"/>
                <InputField label="Landscaping" value={inputs.landscaping||0} onChange={v=>hi('landscaping',v)} prefix="$"/>
              </div>
            </div>
            <div className="space-y-1.5 border-t border-slate-700 pt-4 text-xs">
              {[{l:'Total Equity Raised',v:fmt(data.capital.raised)},{l:'Financing Gap',v:fmt(data.capital.mortgage),warn:data.capital.mortgage>0},{l:'Annual Debt Service',v:fmt(data.operations.debtService)},{l:'Annual Surplus',v:fmt(data.operations.surplus),bad:data.operations.surplus<0,good:data.operations.surplus>=0},{l:'DSCR',v:formatDscrDisplay(data.metrics.dscr),bad:data.metrics.dscr<1.2,good:data.metrics.dscr>=1.2}].map(({l,v,warn,good,bad})=>(
                <div key={l} className="flex justify-between"><span className="text-slate-400 flex items-center">{l}{l==='DSCR'?<InfoTooltip text={DSCR_INFO_TEXT}/>:null}</span><span className={`metric-mono font-semibold ${bad?'text-rose-400':warn?'text-amber-400':good?'text-emerald-400':'text-white'}`}>{v}</span></div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── PARTNERS ── */}
      {activeTab==='partners'&&(
        <div className="space-y-4">
          {partnerTotals.share!==100&&(
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-300">
              {`⚠ Partner shares total ${partnerTotals.share}% — must equal 100%`}
            </div>
          )}
          <div className="overflow-x-auto glass-card rounded-xl">
            <table className="w-full text-xs">
              <thead><tr className="border-b border-slate-700"><th className="text-left py-3 px-3 text-slate-400">Partner</th><th className="text-right py-3 px-3 text-slate-400">Share %</th><th className="text-right py-3 px-3 text-slate-400">Current Cost</th><th className="text-right py-3 px-3 text-slate-400">Cap Contrib</th><th className="text-right py-3 px-3 text-slate-400">Calc. Lease</th><th className="text-right py-3 px-3 text-slate-400">5% Contingency</th><th className="text-right py-3 px-3 text-slate-400">Total w/ Contingency</th><th className="text-right py-3 px-3 text-slate-400">Savings</th><th className="py-3 px-3"></th></tr></thead>
              <tbody className="divide-y divide-slate-800">
                {data.partners.map(p=>{const proposed=p.lease+p.tax,contingency=proposed*0.05,totalWithContingency=proposed+contingency,savings=(+p.currentRent||0)-proposed;const isBchcs=p.id===5||String(p.name||'').toUpperCase().includes('BCHCS');return(
                  <tr key={p.id} className="hover:bg-slate-800/30">
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        <input value={p.name} onChange={e=>hp(p.id,'name',e.target.value)} className="bg-transparent border-b border-slate-600 text-white text-xs w-36 focus:border-indigo-500 focus:outline-none"/>
                        {isBchcs && (
                          <span
                            title="Minor partner — ~1,156 sf. Operating data not yet available."
                            className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-[10px] font-semibold text-amber-300 whitespace-nowrap"
                          >
                            ⚠ 2% · Data pending
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-3 text-right"><input type="number" value={p.share} onChange={e=>hp(p.id,'share',e.target.value)} className="w-14 text-right bg-slate-900 border border-slate-700 rounded px-1 text-white focus:border-indigo-500 focus:outline-none"/></td>
                    <td className="py-2 px-3 text-right"><input type="number" value={p.currentRent||0} onChange={e=>hp(p.id,'currentRent',e.target.value)} className="w-24 text-right bg-slate-900 border border-slate-700 rounded px-1 text-white focus:border-indigo-500 focus:outline-none"/></td>
                    <td className="py-2 px-3 text-right"><input type="number" value={p.capitalContrib||0} onChange={e=>hp(p.id,'capitalContrib',e.target.value)} className="w-24 text-right bg-slate-900 border border-slate-700 rounded px-1 text-white focus:border-indigo-500 focus:outline-none"/></td>
                    <td className="py-2 px-3 text-right metric-mono text-indigo-300">{fmt(proposed)}</td>
                    <td className="py-2 px-3 text-right metric-mono text-amber-400">{fmt(contingency)}</td>
                    <td className="py-2 px-3 text-right metric-mono font-bold text-white">{fmt(totalWithContingency)}</td>
                    <td className={`py-2 px-3 text-right metric-mono font-bold ${savings>=0?'text-emerald-400':'text-rose-400'}`}>{fmt(savings)}</td>
                    <td className="py-2 px-3"><button onClick={()=>delP(p.id)} className="text-slate-600 hover:text-rose-400 transition-colors"><Icons.Trash className="w-3 h-3"/></button></td>
                  </tr>
                )})}
                <tr className="border-t-2 border-indigo-500/40 bg-slate-900/60">
                  <td className="py-2 px-3 font-bold text-white">TOTAL</td>
                  <td className={`py-2 px-3 text-right metric-mono font-bold ${partnerTotals.share===100?'text-emerald-400':'text-rose-400'}`}>
                    <div>{partnerTotals.share}%</div>
                    {partnerTotals.share!==100&&(
                      <div className="text-[10px] font-medium text-amber-400">
                        {shareGap>0?`+${shareGap} needed`:`${Math.abs(shareGap)} over`}
                      </div>
                    )}
                  </td>
                  <td className="py-2 px-3 text-right metric-mono font-semibold text-slate-200">{fmt(partnerTotals.currentCost)}</td>
                  <td className="py-2 px-3 text-right metric-mono font-semibold text-slate-200">{fmt(partnerTotals.capContrib)}</td>
                  <td className="py-2 px-3 text-right metric-mono font-semibold text-indigo-300">{fmt(partnerTotals.calcLease)}</td>
                  <td className="py-2 px-3 text-right metric-mono font-semibold text-amber-400">{fmt(partnerTotals.contingency)}</td>
                  <td className="py-2 px-3 text-right metric-mono font-bold text-white">{fmt(partnerTotals.totalWithContingency)}</td>
                  <td className={`py-2 px-3 text-right metric-mono font-bold ${partnerTotals.savings>=0?'text-emerald-400':'text-rose-400'}`}>{fmt(partnerTotals.savings)}</td>
                  <td className="py-2 px-3"></td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={addP} className="flex items-center gap-1.5 text-sm text-indigo-400 hover:text-white transition-colors"><Icons.Plus className="w-4 h-4"/>Add Partner</button>
            <SaveBar saving={savingPartners} unsaved={false} onSave={()=>savePartners(partners)} label="Save partners"/>
          </div>
          <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
            ⚠ BCHCS occupies approximately 2% of the Hub (est. 1,156 sf of 57,800 sf). As a minor consortium partner, operating expense data has not been provided and is excluded from model calculations. Contact BCHCS administration to obtain actual figures before finalizing the model.
          </div>
        </div>
      )}

      {/* ── B1 ── */}
      {activeTab==='b1'&&(
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div><div className="text-xs text-slate-500 uppercase tracking-wider">Bucket 1 — Annual Operating Expenses (Status Quo)</div></div>
            <SaveBar saving={savingBuckets} unsaved={bucketsUnsaved} onSave={saveBucketData}/>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <KPICard title="B1 Total" value={fmtCAD(b1Total)} sub="Annual status quo opex" accent mono/>
            <KPICard title="Hub Model" value={fmtCAD(hubModelCost)} sub="Op + Debt Service" mono/>
            <KPICard title="B1 Saving" value={fmtCAD(Math.max(0,b1Total-hubModelCost))} sub="vs Hub model" mono/>
          </div>
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="overflow-x-auto"><table className="w-full text-sm" style={{minWidth:'500px'}}>
              <thead><tr className="border-b border-slate-700 bg-slate-900/60"><th className="text-left py-3 px-4 text-slate-400">Partner</th><th className="text-right py-3 px-4 text-slate-400">Annual Opex ($)</th><th className="text-left py-3 px-4 text-slate-400 hidden md:table-cell">Note</th><th className="py-3 px-3 w-8"></th></tr></thead>
              <tbody className="divide-y divide-slate-800">
                {buckets.b1.map(r=>(
                  <tr key={r.id} className="hover:bg-slate-800/30">
                    <td className="py-2 px-4">{txtIn(r.partner,v=>updB('b1',r.id,'partner',v))}</td>
                    <td className="py-2 px-4">{numIn(r.amount,v=>updB('b1',r.id,'amount',v))}</td>
                    <td className="py-2 px-4 hidden md:table-cell">{txtIn(r.note,v=>updB('b1',r.id,'note',v))}</td>
                    <td className="py-2 px-3"><button onClick={()=>delB('b1',r.id)} className="text-slate-600 hover:text-rose-400 transition-colors"><Icons.Trash className="w-3 h-3"/></button></td>
                  </tr>
                ))}
              </tbody>
              <tfoot><tr className="border-t-2 border-indigo-500/40 bg-slate-900/60"><td className="py-3 px-4 font-bold text-white">TOTAL</td><td className="py-3 px-4 text-right metric-mono font-bold text-indigo-300">{fmtCAD(b1Total)}</td><td className="hidden md:table-cell"></td><td></td></tr></tfoot>
            </table></div>
            <div className="px-4 py-2 border-t border-slate-800"><button onClick={()=>addB('b1')} className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-white transition-colors"><Icons.Plus className="w-3 h-3"/>Add partner row</button></div>
          </div>
        </div>
      )}

      {/* ── B2 ── */}
      {activeTab==='b2'&&(
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div><div className="text-xs text-slate-500 uppercase tracking-wider">Bucket 2 — Deferred Capital (One-time ÷ Amortization years)</div></div>
            <SaveBar saving={savingBuckets} unsaved={bucketsUnsaved} onSave={saveBucketData}/>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <KPICard title="B2 Annual Total" value={fmtCAD(b2Total)} sub="Amortized rows" warn mono/>
            <KPICard title="One-Time Total" value={fmtCAD(buckets.b2.reduce((s,r)=>s+r.oneTime,0))} sub="Raw capital" mono/>
            <KPICard title="Items" value={buckets.b2.length} sub="tracked" mono/>
          </div>
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="overflow-x-auto"><table className="w-full text-xs" style={{minWidth:'700px'}}>
              <thead><tr className="border-b border-slate-700 bg-slate-900/60"><th className="text-left py-3 px-3 text-slate-400">Partner</th><th className="text-left py-3 px-3 text-slate-400">Capital Work Item</th><th className="text-right py-3 px-3 text-slate-400">One-Time ($)</th><th className="text-right py-3 px-3 text-slate-400">Amort. Yrs</th><th className="text-right py-3 px-3 text-indigo-400 font-semibold">Annual Cost</th><th className="text-left py-3 px-3 text-slate-400 hidden md:table-cell">Note</th><th className="py-3 px-2 w-8"></th></tr></thead>
              <tbody className="divide-y divide-slate-800">
                {buckets.b2.map(r=>(
                  <tr key={r.id} className="hover:bg-slate-800/30">
                    <td className="py-1.5 px-3">{txtIn(r.partner,v=>updB('b2',r.id,'partner',v))}</td>
                    <td className="py-1.5 px-3">{txtIn(r.item,v=>updB('b2',r.id,'item',v))}</td>
                    <td className="py-1.5 px-3">{numIn(r.oneTime,v=>updB('b2',r.id,'oneTime',v))}</td>
                    <td className="py-1.5 px-3">{numIn(r.amortYears,v=>updB('b2',r.id,'amortYears',v))}</td>
                    <td className="py-1.5 px-3 text-right metric-mono text-amber-400 font-semibold">{fmtCAD(r.oneTime/(r.amortYears||1))}</td>
                    <td className="py-1.5 px-3 hidden md:table-cell">{txtIn(r.note,v=>updB('b2',r.id,'note',v))}</td>
                    <td className="py-1.5 px-2"><button onClick={()=>delB('b2',r.id)} className="text-slate-600 hover:text-rose-400"><Icons.Trash className="w-3 h-3"/></button></td>
                  </tr>
                ))}
              </tbody>
              <tfoot><tr className="border-t-2 border-indigo-500/40 bg-slate-900/60"><td colSpan={2} className="py-3 px-3 font-bold text-white">TOTAL ANNUAL</td><td className="py-3 px-3 text-right metric-mono text-slate-400 font-semibold">{fmtCAD(buckets.b2.reduce((s,r)=>s+r.oneTime,0))}</td><td></td><td className="py-3 px-3 text-right metric-mono font-bold text-indigo-300">{fmtCAD(b2Total)}</td><td className="hidden md:table-cell"></td><td></td></tr></tfoot>
            </table></div>
            <div className="px-4 py-2 border-t border-slate-800"><button onClick={()=>addB('b2')} className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-white transition-colors"><Icons.Plus className="w-3 h-3"/>Add item</button></div>
          </div>
        </div>
      )}

      {/* ── B3 ── */}
      {activeTab==='b3'&&(
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div><div className="text-xs text-slate-500 uppercase tracking-wider">Bucket 3 — Capital Expansion (shortfall sf × $/sf × (1+soft%) × (1+esc%) ÷ years)</div></div>
            <SaveBar saving={savingBuckets} unsaved={bucketsUnsaved} onSave={saveBucketData}/>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <KPICard title="B3 Annual Total" value={fmtCAD(b3Total)} sub="All partners amortized" mono/>
            <KPICard title="Partners" value={buckets.b3.length} sub="tracked" mono/>
          </div>
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="overflow-x-auto"><table className="w-full text-xs" style={{minWidth:'800px'}}>
              <thead><tr className="border-b border-slate-700 bg-slate-900/60"><th className="text-left py-3 px-3 text-slate-400">Partner</th><th className="text-right py-3 px-3 text-slate-400">Current sf</th><th className="text-right py-3 px-3 text-slate-400">Required sf</th><th className="text-right py-3 px-3 text-slate-400">$/sf</th><th className="text-right py-3 px-3 text-slate-400">Soft %</th><th className="text-right py-3 px-3 text-slate-400">Esc %</th><th className="text-right py-3 px-3 text-slate-400">Yrs</th><th className="text-right py-3 px-3 text-indigo-400 font-semibold">Annual Cost</th><th className="py-3 px-2 w-8"></th></tr></thead>
              <tbody className="divide-y divide-slate-800">
                {buckets.b3.map(r=>{const annual=b3Row(r),sf=Math.max(0,(r.requiredSf||0)-(r.currentSf||0));return(
                  <tr key={r.id} className="hover:bg-slate-800/30">
                    <td className="py-1.5 px-3">{txtIn(r.partner,v=>updB('b3',r.id,'partner',v))}</td>
                    <td className="py-1.5 px-3">{numIn(r.currentSf,v=>updB('b3',r.id,'currentSf',v))}</td>
                    <td className="py-1.5 px-3">{numIn(r.requiredSf,v=>updB('b3',r.id,'requiredSf',v))}</td>
                    <td className="py-1.5 px-3">{numIn(r.ratePerSf,v=>updB('b3',r.id,'ratePerSf',v))}</td>
                    <td className="py-1.5 px-3">{numIn(r.softCostPct,v=>updB('b3',r.id,'softCostPct',v))}</td>
                    <td className="py-1.5 px-3">{numIn(r.escalationPct,v=>updB('b3',r.id,'escalationPct',v))}</td>
                    <td className="py-1.5 px-3">{numIn(r.amortYears,v=>updB('b3',r.id,'amortYears',v))}</td>
                    <td className="py-1.5 px-3 text-right">{sf>0?<span className="metric-mono text-emerald-400 font-semibold">{fmtCAD(annual)}</span>:<span className="text-slate-600 text-xs">— no shortfall</span>}</td>
                    <td className="py-1.5 px-2"><button onClick={()=>delB('b3',r.id)} className="text-slate-600 hover:text-rose-400"><Icons.Trash className="w-3 h-3"/></button></td>
                  </tr>
                )})}
              </tbody>
              <tfoot><tr className="border-t-2 border-indigo-500/40 bg-slate-900/60"><td colSpan={7} className="py-3 px-3 font-bold text-white">TOTAL ANNUAL</td><td className="py-3 px-3 text-right metric-mono font-bold text-indigo-300">{fmtCAD(b3Total)}</td><td></td></tr></tfoot>
            </table></div>
            <div className="px-4 py-2 border-t border-slate-800"><button onClick={()=>addB('b3')} className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-white transition-colors"><Icons.Plus className="w-3 h-3"/>Add partner row</button></div>
          </div>
        </div>
      )}

      {/* ── B4 ── */}
      {activeTab==='b4'&&(
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div><div className="text-xs text-slate-500 uppercase tracking-wider">Bucket 4 — Leasehold Improvements (Net LHI ÷ amort years + annual lease)</div></div>
            <SaveBar saving={savingBuckets} unsaved={bucketsUnsaved} onSave={saveBucketData}/>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KPICard title="B4 LHI Annual" value={fmtCAD(b4Total)} sub="Amortized LHI" mono/>
            <KPICard title="Annual Lease Total" value={fmtCAD(b4Rows.reduce((s,r)=>s+b4Lease(r),0))} sub="All partners" warn mono/>
            <KPICard title="Net LHI One-Time" value={fmtCAD(b4Rows.reduce((s,r)=>s+b4NetLHI(r),0))} sub="After TI allowance" mono/>
          </div>
          {/* All-bucket summary chart */}
          <div className="glass-card rounded-xl p-5">
            <div className="text-sm font-semibold text-slate-300 mb-4">All-Bucket Status Quo vs Hub Model</div>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[{name:'B1 Operations',value:b1Total,fill:'#6366f1'},{name:'B2 Deferred',value:b2Total,fill:'#f59e0b'},{name:'B3 Expansion',value:b3Total,fill:'#10b981'},{name:'B4 LHI',value:b4Total,fill:'#06b6d4'},{name:'Hub Model',value:hubModelCost,fill:'#ec4899'}]} margin={{left:10,right:40,top:4,bottom:4}}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b"/>
                  <XAxis dataKey="name" tick={{fontSize:9,fill:'#94a3b8'}} interval={0}/>
                  <YAxis tickFormatter={v=>`$${(v/1000).toFixed(0)}K`} tick={{fontSize:10,fill:'#94a3b8'}}/>
                  <Tooltip formatter={v=>fmtCAD(v)} contentStyle={{backgroundColor:'#0f172a',border:'1px solid #334155',borderRadius:'8px',color:'#fff',fontSize:'11px'}}/>
                  <Bar dataKey="value" radius={[4,4,0,0]} barSize={40}>{[0,1,2,3,4].map(i=><Cell key={i} fill={['#6366f1','#f59e0b','#10b981','#06b6d4','#ec4899'][i]}/>)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between text-sm flex-wrap gap-2">
              <span className="text-slate-300">Status Quo Total: <span className="metric-mono font-bold text-white">{fmtCAD(sqTotal)}</span></span>
              <span className="metric-mono font-bold text-emerald-400">{fmtCAD(Math.max(0,sqTotal-hubModelCost))}/yr saving</span>
            </div>
          </div>
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="overflow-x-auto"><table className="w-full text-xs" style={{minWidth:'900px'}}>
              <thead><tr className="border-b border-slate-700 bg-slate-900/60"><th className="text-left py-3 px-3 text-slate-400">Partner</th><th className="text-right py-3 px-3 text-slate-400">sf</th><th className="text-left py-3 px-3 text-slate-400">Use</th><th className="text-right py-3 px-3 text-slate-400">LHI $/sf</th><th className="text-right py-3 px-3 text-slate-400">TI $/sf</th><th className="text-right py-3 px-3 text-slate-400">Lease $/sf</th><th className="text-right py-3 px-3 text-slate-400">Amort yrs</th><th className="text-right py-3 px-3 text-slate-400">Net LHI</th><th className="text-right py-3 px-3 text-slate-400">Ann. Lease</th><th className="text-right py-3 px-3 text-indigo-400 font-semibold">LHI Annual</th><th className="py-3 px-2 w-8"></th></tr></thead>
              <tbody className="divide-y divide-slate-800">
                {b4Rows.map(r=>{const net=b4NetLHI(r),lease=b4Lease(r),ann=net/(r.amortYears||1);return(
                  <tr key={r.id} className="hover:bg-slate-800/30">
                    <td className="py-1.5 px-3">{txtIn(r.partner,v=>updB('b4',r.id,'partner',v))}</td>
                    <td className="py-1.5 px-3">{numIn(r.sf,v=>updB('b4',r.id,'sf',v))}</td>
                    <td className="py-1.5 px-3"><select value={r.useType} onChange={e=>updB('b4',r.id,'useType',e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-xs focus:border-indigo-500 focus:outline-none"><option>Office</option><option>Clinical</option><option>Mixed</option></select></td>
                    <td className="py-1.5 px-3">{numIn(r.ratePerSf,v=>updB('b4',r.id,'ratePerSf',v))}</td>
                    <td className="py-1.5 px-3">{numIn(r.tiAllowance,v=>updB('b4',r.id,'tiAllowance',v))}</td>
                    <td className="py-1.5 px-3">{numIn(r.leaseSf,v=>updB('b4',r.id,'leaseSf',v))}</td>
                    <td className="py-1.5 px-3">{numIn(r.amortYears,v=>updB('b4',r.id,'amortYears',v))}</td>
                    <td className="py-1.5 px-3 text-right metric-mono text-slate-300">{net>0?fmtCAD(net):'—'}</td>
                    <td className="py-1.5 px-3 text-right metric-mono text-amber-400">{lease>0?fmtCAD(lease):'—'}</td>
                    <td className="py-1.5 px-3 text-right metric-mono text-emerald-400 font-semibold">{ann>0?fmtCAD(ann):'—'}</td>
                    <td className="py-1.5 px-2"><button onClick={()=>delB('b4',r.id)} className="text-slate-600 hover:text-rose-400"><Icons.Trash className="w-3 h-3"/></button></td>
                  </tr>
                )})}
              </tbody>
              <tfoot><tr className="border-t-2 border-indigo-500/40 bg-slate-900/60"><td colSpan={7} className="py-3 px-3 font-bold text-white">TOTAL</td><td className="py-3 px-3 text-right metric-mono text-slate-300 font-semibold">{fmtCAD(b4Rows.reduce((s,r)=>s+b4NetLHI(r),0))}</td><td className="py-3 px-3 text-right metric-mono text-amber-400 font-semibold">{fmtCAD(b4Rows.reduce((s,r)=>s+b4Lease(r),0))}</td><td className="py-3 px-3 text-right metric-mono font-bold text-indigo-300">{fmtCAD(b4Total)}</td><td></td></tr></tfoot>
            </table></div>
            <div className="px-4 py-2 border-t border-slate-800"><button onClick={()=>addB('b4')} className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-white transition-colors"><Icons.Plus className="w-3 h-3"/>Add partner row</button></div>
          </div>
        </div>
      )}

      {/* ── STRESS TEST ── */}
      {activeTab==='stress'&&(
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stress.map((s,i)=>(
              <div key={i} className={`glass-card rounded-xl p-4 ${i===0?'ring-1 ring-indigo-500/30':''}`}>
                <div className="text-xs text-slate-400 mb-2 font-medium">{s.name}</div>
                <div className={`text-xl font-bold metric-mono mb-1 ${s.dscr<1.0?'text-rose-400':s.dscr<1.2?'text-amber-400':'text-emerald-400'}`}>{formatDscrDisplay(s.dscr)}</div>
                <div className={`text-xs metric-mono ${s.surplus<0?'text-rose-400':'text-slate-300'}`}>{fmt(s.surplus)}/yr</div>
                <span className={`text-xs px-2 py-0.5 rounded-full border mt-2 inline-block ${s.dscr>=1.2?'border-emerald-500/30 bg-emerald-500/10 text-emerald-400':s.dscr>=1.0?'border-amber-500/30 bg-amber-500/10 text-amber-400':'border-rose-500/30 bg-rose-500/10 text-rose-400'}`}>{s.dscr>=1.2?'STABLE':s.dscr>=1.0?'WATCH':'AT-RISK'}</span>
              </div>
            ))}
          </div>
<div className="glass-card rounded-xl p-5 border border-amber-500/20">
  <div className="text-sm font-semibold text-slate-300 mb-4">Capital Reserve Fund — Depletion Analysis</div>
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
      <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Reserve Balance</div>
      <div className="metric-mono text-2xl font-bold text-white">{fmtCAD(+inputs.capitalReserve||0)}</div>
      <div className="text-xs text-slate-500 mt-1">Available capital buffer</div>
    </div>
    <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
      <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Worst-Case Monthly Deficit</div>
      {(()=>{
        const worst = stress.reduce((p,c)=>p.surplus<c.surplus?p:c)
        const monthly = worst.surplus < 0 ? Math.abs(worst.surplus)/12 : 0
        return <div className={`metric-mono text-2xl font-bold ${monthly>0?'text-rose-400':'text-emerald-400'}`}>{monthly>0?fmtCAD(monthly):'No deficit'}</div>
      })()}
      <div className="text-xs text-slate-500 mt-1">Under {stress.reduce((p,c)=>p.surplus<c.surplus?p:c).name}</div>
    </div>
    <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
      <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Capital Depletion Horizon</div>
      {(()=>{
        const worst = stress.reduce((p,c)=>p.surplus<c.surplus?p:c)
        const monthly = worst.surplus < 0 ? Math.abs(worst.surplus)/12 : 0
        const reserve = +inputs.capitalReserve||0
        const months = monthly > 0 ? (reserve/monthly) : null
        return (
          <div className={`metric-mono text-2xl font-bold ${!months?'text-emerald-400':months<6?'text-rose-400':months<12?'text-amber-400':'text-emerald-400'}`}>
            {!months ? 'Stable' : `${months.toFixed(1)} months`}
          </div>
        )
      })()}
      <div className="text-xs text-slate-500 mt-1">Before reserve exhausted</div>
    </div>
  </div>
  {(+inputs.capitalReserve||0)===0&&(
    <div className="mt-3 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
      ⚠ No capital reserve set — add a reserve balance in Project Inputs tab
    </div>
  )}
</div>
          <div className="glass-card rounded-xl p-6">
            <div className="text-sm font-semibold text-slate-300 mb-4 flex items-center">DSCR Across Scenarios <InfoTooltip text={DSCR_INFO_TEXT} /></div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stress} margin={{left:10,right:20}}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b"/>
                  <XAxis dataKey="name" tick={{fontSize:10,fill:'#94a3b8'}}/>
                  <YAxis tickFormatter={v=>`${v.toFixed(1)}x`} tick={{fontSize:10,fill:'#94a3b8'}} domain={[0,'auto']}/>
                  <Tooltip formatter={v=>[formatDscrDisplay(v),'DSCR']} contentStyle={{backgroundColor:'#0f172a',border:'1px solid #334155',borderRadius:'8px',color:'#fff'}}/>
                  <ReferenceLine y={1.2} stroke="#6366f1" strokeDasharray="6 3" label={{value:'1.20x',fill:'#818cf8',fontSize:10,position:'insideTopRight'}}/>
                  <ReferenceLine y={1.0} stroke="#f43f5e" strokeDasharray="6 3" label={{value:'1.0x',fill:'#fb7185',fontSize:10,position:'insideTopRight'}}/>
                  <Bar dataKey="dscr" radius={[4,4,0,0]} barSize={50}>{stress.map((s,i)=><Cell key={i} fill={s.dscr>=1.2?'#10b981':s.dscr>=1.0?'#f59e0b':'#f43f5e'}/>)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ── SAVED SCENARIOS ── */}
      {activeTab==='saved'&&(
        <div className="space-y-4">
          {saved.length===0
            ? <div className="glass-card rounded-xl p-12 text-center"><div className="text-slate-500 text-sm">No saved scenarios yet.</div><div className="text-slate-600 text-xs mt-1">Use "Save Scenario" above to snapshot the current state.</div></div>
            : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {saved.map(s=>(
                  <div key={s.id} className="glass-card rounded-xl p-5 space-y-3">
                    <div className="flex items-start justify-between">
                      <div><div className="font-semibold text-white text-sm">{s.name}</div><div className="text-xs text-slate-500 mt-0.5">Saved {s.savedAt}</div></div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${BADGE_STYLE_BY_COLOR[overallStatusToColor(s.summary.status)]}`}>{s.summary.status}</span>
                    </div>
                    <div className="space-y-1 text-xs">
                      {[{l:'Total Cost',v:fmt(s.summary.totalCost)},{l:'Financing Gap',v:fmt(s.summary.mortgage),warn:s.summary.mortgage>0},{l:'DSCR',v:formatDscrDisplay(s.summary.dscr),bad:s.summary.dscr<1.2},{l:'Surplus',v:fmt(s.summary.surplus),bad:s.summary.surplus<0}].map(({l,v,warn,bad})=>(
                        <div key={l} className="flex justify-between"><span className="text-slate-400 flex items-center">{l}{l==='DSCR'?<InfoTooltip text={DSCR_INFO_TEXT}/>:null}</span><span className={`metric-mono ${bad?'text-rose-400':warn?'text-amber-400':'text-white'}`}>{v}</span></div>
                      ))}
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button onClick={()=>loadScenario(s)} className="flex-1 py-1.5 bg-indigo-600/20 border border-indigo-500/30 hover:bg-indigo-600/40 text-indigo-300 rounded-lg text-xs font-medium transition-all">Load</button>
                      <button onClick={()=>delScenario(s.id)} className="px-3 py-1.5 bg-slate-800 border border-slate-700 hover:border-rose-500/40 hover:text-rose-400 text-slate-400 rounded-lg text-xs transition-all"><Icons.Trash className="w-3 h-3"/></button>
                    </div>
                  </div>
                ))}
              </div>
          }
        </div>
      )}
    </div>
  )
}

