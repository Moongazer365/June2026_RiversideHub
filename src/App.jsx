import { useState, useMemo, lazy, Suspense } from 'react'
import { useAuth, useScenarioInputs, usePlannerPartners, useOpexData, useFmScenarios, useB4Lhi } from './hooks/useSupabase'
import { calcFinancials, analyzeFundability } from './lib/finance'
import { OPEX_CATEGORIES, INITIAL_OPEX, RIVERSIDE, DEFAULT_B4_LHI } from './data/constants'
import { Icons } from './components/UI'
import AuthPage from './pages/AuthPage'
import './index.css'

const RiversideDashboardTab = lazy(() => import('./tabs/RiversideDashboard'))
const CapitalWaveTab         = lazy(() => import('./tabs/CapitalWave'))
const PartnersTab            = lazy(() => import('./tabs/Partners'))
const CapitalTab             = lazy(() => import('./tabs/Capital'))
const OpexBenchmarkTab       = lazy(() => import('./tabs/FmBenchmark'))
const ScenarioPlannerTab     = lazy(() => import('./tabs/ScenarioPlanner'))
const ExecutiveSummaryTab    = lazy(() => import('./tabs/ExecutiveSummary'))
const BriefingNoteTab         = lazy(() => import('./tabs/BriefingNote'))
const HowToUseTab            = lazy(() => import('./tabs/HowToUse'))
const ReportsTab             = lazy(() => import('./tabs/Reports'))

const STATUS_STYLES = {
  STABLE:'text-emerald-400 border-emerald-500/40 bg-emerald-500/10',
  'AT-RISK':'text-rose-400 border-rose-500/40 bg-rose-500/10',
  WATCH:'text-amber-400 border-amber-500/40 bg-amber-500/10',
}
const TABS = [
  { id:'riverside', label:'ROI Dashboard',    Icon:Icons.Dashboard },
  { id:'capitalwave', label:'Capital Wave',   Icon:Icons.Alert },
  { id:'partners',  label:'Partners',          Icon:Icons.Partners  },
  { id:'capital',   label:'Capital Structure', Icon:Icons.Capital   },
  { id:'opex',      label:'FM Benchmark',      Icon:Icons.Opex      },
  { id:'planner',   label:'Scenario Planner',  Icon:Icons.Scenario  },
  { id:'executive', label:'Detailed Summary', Icon:Icons.Report    },
  { id:'briefing',  label:'Briefing Note',     Icon:Icons.Report    },
  { id:'help',      label:'How to Use',        Icon:Icons.Activity  },
  { id:'reports',   label:'Reports & Export',  Icon:Icons.Report    },
]
function Spinner(){return(<div className="flex items-center justify-center py-24"><div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full" style={{animation:'spin .8s linear infinite'}}></div></div>)}

function AppShell({user,signOut}){
  const [activeTab,setActiveTab]=useState('riverside')
  const [mobileOpen,setMobileOpen]=useState(false)
  const [showProfile,setShowProfile]=useState(false)
  const [inputsDirty,setInputsDirty]=useState(false)
  const [partnersDirty,setPartnersDirty]=useState(false)
  const [opexDirty,setOpexDirty]=useState(false)
  const [b4LhiDirty, setB4LhiDirty] = useState(false)
  const [excludedGroups, setExcludedGroups] = useState([])
  const [excludedItems, setExcludedItems] = useState([])
  const [selectedBuckets, setSelectedBuckets] = useState(['b1', 'b2'])
  const [saveAllMessage,setSaveAllMessage]=useState('')
  const {data:inputs,setData:setInputs,save:saveInputs,saving:savingInputs,loading:scenarioInputsLoading,hasSavedRow:scenarioInputsHasSaved}=useScenarioInputs(user.id)
  const {data:partners,setData:setPartners,save:savePartners,saving:savingPartners}=usePlannerPartners(user.id)
  const {data:opexData,setData:setOpexData,save:saveOpex,saving:savingOpex}=useOpexData(user.id)
  const {data:b4Lhi,setData:setB4Lhi,save:saveB4Lhi,saving:savingB4Lhi,loading:b4LhiLoading}=useB4Lhi(user.id)
  const {data:fmScenarios}=useFmScenarios(user.id)
  const setInputsTracked = updater => { setInputs(updater); setInputsDirty(true) }
  const setPartnersTracked = updater => { setPartners(updater); setPartnersDirty(true) }
  const hasUnsavedChanges = inputsDirty || partnersDirty || opexDirty || b4LhiDirty
  const data=useMemo(()=>calcFinancials(inputs,partners,'HEALTHCARE',fmScenarios),[inputs,partners,fmScenarios])
  const OPEX_GROUPS_ALL = ['Facilities','Occupancy','Staffing','Technology','Admin']
  const b1LiveTotal = useMemo(() => {
    const sourceData = opexData || INITIAL_OPEX
    return Object.values(sourceData).reduce((partnerSum, partnerData) => {
      return partnerSum + Object.entries(partnerData || {}).reduce((catSum, [key, val]) => {
        const cat = OPEX_CATEGORIES.find(c => c.key === key)
        if (!cat) return catSum
        if (!OPEX_GROUPS_ALL.includes(cat.group)) return catSum
        if (excludedGroups.includes(cat.group)) return catSum
        if (excludedItems.includes(key)) return catSum
        return catSum + (Number(val) || 0)
      }, 0)
    }, 0)
  }, [opexData, excludedGroups, excludedItems])
  const b4LiveTotal = useMemo(() => {
    const rows = Array.isArray(b4Lhi) && b4Lhi.length ? b4Lhi : DEFAULT_B4_LHI
    return rows.reduce((sum, row) => {
      const sf = +(row?.sf || 0)
      const lhiPerSf = +(row?.ratePerSf ?? row?.lhiPerSf ?? 0)
      const leasePerSf = +(row?.leasePerSf ?? row?.leaseSf ?? 0)
      const amortYrs = +(row?.amortYrs ?? row?.amortYears ?? 1) || 1
      const amortized = (sf * lhiPerSf) / amortYrs
      const annualLease = sf * leasePerSf
      return sum + amortized + annualLease
    }, 0)
  }, [b4Lhi])

  const statusQuoTotal = useMemo(() => {
    const BUCKET_VALUES = {
      b1: b1LiveTotal || RIVERSIDE.statusQuo.buckets.b1Operations,
      b2: RIVERSIDE.statusQuo.buckets.b2DeferredCapital,
      b3: RIVERSIDE.statusQuo.buckets.b3CapitalExpansion,
      b4: b4LiveTotal || RIVERSIDE.statusQuo.buckets.b4LeaseholdImprovements,
    }
    return selectedBuckets.reduce((sum, key) => sum + (BUCKET_VALUES[key] || 0), 0)
  }, [selectedBuckets, b1LiveTotal, b4LiveTotal])
  const fundability=useMemo(()=>analyzeFundability(data,inputs,partners),[data,inputs,partners])
  const saveOpexWithLog = async value => {
    console.log('Saving opex:', value)
    await saveOpex(value)
  }
  const handleSaveAll = async () => {
    await saveInputs(inputs)
    await savePartners(partners)
    await saveOpexWithLog(opexData)
    await saveB4Lhi(b4Lhi)
    setInputsDirty(false)
    setPartnersDirty(false)
    setOpexDirty(false)
    setB4LhiDirty(false)
    setSaveAllMessage('Saved!')
    window.setTimeout(()=>setSaveAllMessage(''), 2000)
  }
  const tabProps={user,inputs,setInputs:setInputsTracked,saveInputs,savingInputs,scenarioInputsLoading,scenarioInputsHasSaved,partners,setPartners:setPartnersTracked,savePartners,savingPartners,opexData,setOpexData,saveOpex:saveOpexWithLog,savingOpex,opexDirty,setOpexDirty,b4Lhi,setB4Lhi,saveB4Lhi,savingB4Lhi,b4LhiLoading,b4LhiDirty,setB4LhiDirty,data,fundability,b1LiveTotal,b4LiveTotal,statusQuoTotal,selectedBuckets,setSelectedBuckets,excludedGroups,setExcludedGroups,excludedItems,setExcludedItems,fmScenarios,activeTab,setActiveTab}
  const renderTab=()=>{switch(activeTab){case'riverside':return<RiversideDashboardTab {...tabProps}/>;case'capitalwave':return<CapitalWaveTab {...tabProps}/>;case'partners':return<PartnersTab {...tabProps}/>;case'capital':return<CapitalTab {...tabProps}/>;case'opex':return<OpexBenchmarkTab {...tabProps}/>;case'planner':return<ScenarioPlannerTab {...tabProps}/>;case'executive':return<ExecutiveSummaryTab {...tabProps}/>;case'briefing':return<BriefingNoteTab {...tabProps}/>;case'help':return<HowToUseTab {...tabProps}/>;case'reports':return<ReportsTab {...tabProps}/>;default:return null}}
  return(
    <div className="min-h-screen riverside-gradient pb-20">
      <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/80 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{background:'linear-gradient(135deg,#4f46e5,#06b6d4)'}}>
                <Icons.Building className="w-5 h-5 text-white"/>
              </div>
              <div>
                <div className="text-white font-bold text-sm">Riverside Hub</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-cyan-400 font-medium">Meta MUSH Platform</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_STYLES[fundability.status]}`}>{fundability.status}</span>
                </div>
              </div>
            </div>
            <nav className="hidden lg:flex items-center gap-1">
              {TABS.map(t=>(<button key={t.id} onClick={()=>setActiveTab(t.id)} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${activeTab===t.id?'tab-active':'text-slate-400 hover:text-white hover:bg-slate-800'}`}><t.Icon className="w-3.5 h-3.5"/>{t.label}</button>))}
            </nav>
            <div className="flex items-center gap-2">
              {hasUnsavedChanges && (
                <button onClick={handleSaveAll} disabled={savingInputs||savingPartners||savingOpex} className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-600/20 border border-emerald-500/40 hover:bg-emerald-600/40 text-emerald-400 text-xs font-medium transition-all disabled:opacity-50">
                  <Icons.Save className="w-3.5 h-3.5"/>Save All
                </button>
              )}
              {saveAllMessage && <span className="hidden md:inline text-xs text-emerald-400 font-medium">{saveAllMessage}</span>}
              <div className="relative hidden md:block">
                <button onClick={()=>setShowProfile(p=>!p)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:border-indigo-500/50 text-slate-300 text-xs transition-all">
                  <Icons.User className="w-3.5 h-3.5"/><span className="max-w-[120px] truncate">{user.email}</span>
                </button>
                {showProfile&&(<div className="absolute right-0 top-full mt-2 w-48 glass-card rounded-xl p-2 z-50 shadow-xl">
                  <div className="px-3 py-2 text-xs text-slate-500 border-b border-slate-700 mb-1 truncate">{user.email}</div>
                  <button onClick={signOut} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-700 transition-all"><Icons.LogOut className="w-4 h-4"/>Sign out</button>
                </div>)}
              </div>
              <button className="lg:hidden p-2 text-slate-400" onClick={()=>setMobileOpen(v=>!v)}>{mobileOpen?<Icons.X className="w-5 h-5"/>:<Icons.Menu className="w-5 h-5"/>}</button>
            </div>
          </div>
          {mobileOpen&&(<div className="lg:hidden mt-3 pb-2 grid grid-cols-3 gap-2 border-t border-slate-800 pt-3">
            {TABS.map(t=>(<button key={t.id} onClick={()=>{setActiveTab(t.id);setMobileOpen(false)}} className={`flex flex-col items-center gap-1 p-2 rounded-lg text-xs transition-all ${activeTab===t.id?'tab-active':'bg-slate-900 text-slate-400'}`}><t.Icon className="w-4 h-4"/>{t.label.split(' ')[0]}</button>))}
            <button onClick={signOut} className="flex flex-col items-center gap-1 p-2 rounded-lg text-xs bg-slate-900 text-slate-400"><Icons.LogOut className="w-4 h-4"/>Sign out</button>
          </div>)}
        </div>
      </header>
      {data?.warnings?.length > 0 && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg px-4 py-2 mx-4 mt-2 text-xs text-rose-300">
          {data.warnings.map((w, i) => (
            <div key={i}>⚠ {w.message}</div>
          ))}
        </div>
      )}
      <main className="max-w-7xl mx-auto p-4 md:p-6"><Suspense fallback={<Spinner/>}>{renderTab()}</Suspense></main>
      <footer className="fixed bottom-0 left-0 right-0 bg-slate-950/90 backdrop-blur-md border-t border-slate-800 py-2 px-4 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-slate-500">
          <span>Riverside Hub · 54 Brant Ave, Brantford ON · Willowbridge Community Services</span>
          <span className="hidden md:inline">ROI Model 2026 · NP-1.0 · Internal planning only</span>
        </div>
      </footer>
    </div>
  )
}

export default function App(){
  const {session,user,loading,signIn,signUp,signOut,resetPassword}=useAuth()
  if(loading)return(<div className="min-h-screen riverside-gradient flex items-center justify-center"><div className="w-10 h-10 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full" style={{animation:'spin .8s linear infinite'}}></div></div>)
  if(!session)return<AuthPage onAuth={{signIn,signUp,resetPassword}}/>
  return<AppShell user={user} signOut={signOut}/>
}
