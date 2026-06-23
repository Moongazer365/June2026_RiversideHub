import * as React from 'react'

// ─── SHARED UI COMPONENTS ─────────────────────────────────────────────────────

export const Icon = ({ path, className = 'w-5 h-5' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    className={className}>{path}</svg>
)

export const Icons = {
  Building:   p => <Icon {...p} path={<><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></>} />,
  Dashboard:  p => <Icon {...p} path={<><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></>} />,
  Partners:   p => <Icon {...p} path={<><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>} />,
  Capital:    p => <Icon {...p} path={<><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></>} />,
  Scenario:   p => <Icon {...p} path={<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></>} />,
  Opex:       p => <Icon {...p} path={<><line x1="18" x2="18" y1="20" y2="10"/><line x1="12" x2="12" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="14"/></>} />,
  Report:     p => <Icon {...p} path={<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><polyline points="10 9 9 9 8 9"/></>} />,
  Excel:      p => <Icon {...p} path={<><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/><path d="m6 12 3 3-3 3"/><path d="m15 12-3 3 3 3"/></>} />,
  Print:      p => <Icon {...p} path={<><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></>} />,
  Save:       p => <Icon {...p} path={<><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></>} />,
  Plus:       p => <Icon {...p} path={<><path d="M5 12h14"/><path d="M12 5v14"/></>} />,
  Trash:      p => <Icon {...p} path={<><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></>} />,
  Check:      p => <Icon {...p} path={<><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>} />,
  Alert:      p => <Icon {...p} path={<><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>} />,
  Menu:       p => <Icon {...p} path={<><line x1="3" x2="21" y1="6" y2="6"/><line x1="3" x2="21" y1="12" y2="12"/><line x1="3" x2="21" y1="18" y2="18"/></>} />,
  X:          p => <Icon {...p} path={<><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></>} />,
  LogOut:     p => <Icon {...p} path={<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></>} />,
  User:       p => <Icon {...p} path={<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>} />,
  Activity:   p => <Icon {...p} path={<><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></>} />,
}

export function InfoTooltip({ text }) {
  const [show, setShow] = React.useState(false)
  return (
    <span className="relative inline-block ml-1">
      <span
        className="text-cyan-400 cursor-help text-xs select-none"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
      >
        ⓘ
      </span>
      {show && (
        <div className="absolute z-50 bottom-full left-0 mb-2 w-72 p-3 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-300 leading-relaxed shadow-xl whitespace-normal">
          {text}
        </div>
      )}
    </span>
  )
}

export const KPICard = ({ title, value, sub, accent, warn, danger, mono, infoTooltip, subInfoTooltip }) => (
  <div className={`glass-card rounded-xl p-4 kpi-glow flex flex-col justify-between gap-2 ${accent ? 'border-l-2 border-l-indigo-500' : ''}`}>
    <div className="text-xs text-slate-400 font-medium uppercase tracking-wider flex items-center">{title}{infoTooltip ? <InfoTooltip text={infoTooltip} /> : null}</div>
    <div className={`text-2xl font-bold ${mono ? 'metric-mono' : ''} ${danger ? 'text-rose-400' : warn ? 'text-amber-400' : 'text-white'}`}>{value}</div>
    {sub && (
      <div className="text-xs text-slate-500 flex items-center flex-wrap gap-x-1">
        {sub}
        {subInfoTooltip ? <InfoTooltip text={subInfoTooltip} /> : null}
      </div>
    )}
  </div>
)

export const SectionHeader = ({ title, sub }) => (
  <div className="mb-6">
    <h2 className="text-xl font-bold text-white flex items-center gap-3">
      <span className="w-1 h-6 rounded-full bg-indigo-500 block"></span>
      {title}
    </h2>
    {sub && <p className="text-sm text-slate-400 mt-1 ml-4">{sub}</p>}
  </div>
)

export const InputField = ({ label, value, onChange, type = 'number', prefix, suffix, step = '1' }) => (
  <div>
    <label className="block text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">{label}</label>
    <div className="relative">
      {prefix && <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none"><span className="text-slate-400 text-sm">{prefix}</span></div>}
      <input type={type} step={step} value={value} onChange={e => onChange(e.target.value)}
        className={`w-full rounded-lg bg-slate-900 border border-slate-700 text-white text-sm py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 ${prefix ? 'pl-8' : 'pl-3'} ${suffix ? 'pr-8' : 'pr-3'} transition-colors`} />
      {suffix && <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none"><span className="text-slate-400 text-sm">{suffix}</span></div>}
    </div>
  </div>
)

export const SaveBar = ({ saving, unsaved, onSave, label = 'Save changes' }) => (
  <div className="flex items-center gap-3">
    {unsaved && <span className="text-xs text-amber-400 animate-pulse-slow">● Unsaved changes</span>}
    {saving  && <span className="text-xs text-indigo-400">Saving…</span>}
    <button onClick={onSave} disabled={saving}
      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 border border-emerald-500/40 hover:bg-emerald-600/40 text-emerald-400 rounded-lg text-xs font-medium transition-all disabled:opacity-50">
      <Icons.Save className="w-3 h-3" /> {label}
    </button>
  </div>
)

export const fmtCAD = v => new Intl.NumberFormat('en-CA', { style:'currency', currency:'CAD', maximumFractionDigits:0 }).format(v)
export const fmtNum = v => new Intl.NumberFormat('en-CA', { maximumFractionDigits:0 }).format(v)
export const fmtPct = (v, d=1) => `${(+v).toFixed(d)}%`

export function statusToColor(status) {
  switch (status) {
    case 'pass': return 'emerald'
    case 'watch': return 'amber'
    case 'fail': return 'rose'
    default: return 'slate'
  }
}

export function overallStatusToColor(status) {
  switch (status) {
    case 'STABLE': return 'emerald'
    case 'WATCH': return 'amber'
    case 'AT-RISK': return 'rose'
    default: return 'slate'
  }
}
