import { Fragment, useState } from 'react'
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { OPEX_CATEGORIES, PARTNER_COLS, RIVERSIDE, COLORS } from '../data/constants'
import { KPICard, SectionHeader, SaveBar, Icons, fmtCAD, fmtNum } from '../components/UI'

const OPEX_GROUPS = ['Facilities','Occupancy','Staffing','Technology','Admin']
const BCHCS_ID = 'bchcs'
export default function Partners({ data, opexData, setOpexData, saveOpex, savingOpex, opexDirty, setOpexDirty, excludedGroups, setExcludedGroups, excludedItems, setExcludedItems }) {
  const [view, setView]           = useState('opex')
  const [filterGroup, setFilter]  = useState('All')
  const [editingCell, setEditing] = useState(null)

  const toggleGroup = group => {
    setExcludedGroups(prev => prev.includes(group) ? prev.filter(g => g !== group) : [...prev, group])
  }
  const isGroupExcluded = group => excludedGroups.includes(group)
  const toggleItem = key => {
    setExcludedItems(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key])
  }
  const isItemExcluded = key => excludedItems.includes(key)

  const updateCell = (pid, key, val) => {
    const num = parseFloat(val) || 0
    setOpexData(prev => ({ ...prev, [pid]: { ...prev[pid], [key]: num } }))
    setOpexDirty(true)
  }

  const handleSave = async () => { await saveOpex(opexData); setOpexDirty(false) }

  const groupForCategory = key => OPEX_CATEGORIES.find(c => c.key === key)?.group
  const itemIncluded = key => {
    const group = groupForCategory(key)
    return !isGroupExcluded(group) && !isItemExcluded(key)
  }
  const partnerTotalRaw = pid => OPEX_CATEGORIES.reduce((s,c) => s + (opexData[pid]?.[c.key] || 0), 0)
  const partnerTotal = pid => OPEX_CATEGORIES
    .filter(c => itemIncluded(c.key))
    .reduce((s,c) => s + (opexData[pid]?.[c.key] || 0), 0)
  const partnerExcluded = pid => partnerTotalRaw(pid) - partnerTotal(pid)
  const activePartners = PARTNER_COLS.filter(p => p.id !== BCHCS_ID)
  const catRawTotal  = key => activePartners.reduce((s,p) => s + (opexData[p.id]?.[key] || 0), 0)
  const catTotal     = key => itemIncluded(key) ? catRawTotal(key) : 0
  const grandRawTotal = () => activePartners.reduce((s,p) => s + partnerTotalRaw(p.id), 0)
  const grandTotal   = () => activePartners.reduce((s,p) => s + partnerTotal(p.id), 0)
  const includedTotal = grandTotal()
  const excludedTotal = grandRawTotal() - includedTotal
  const excludedPct = grandRawTotal() > 0 ? (excludedTotal / grandRawTotal()) * 100 : 0
  const excludedItemRows = OPEX_CATEGORIES.filter(c => isItemExcluded(c.key))
  const excludedItemsTotal = excludedItemRows.reduce((s, c) => s + catRawTotal(c.key), 0)

  const barData = activePartners.map(p => ({ name: p.short, total: partnerTotal(p.id), color: p.color }))
  const visibleCats = filterGroup === 'All' ? OPEX_CATEGORIES : OPEX_CATEGORIES.filter(c => c.group === filterGroup)

  const CellInput = ({ pid, catKey, rowExcluded }) => {
    const val = opexData[pid]?.[catKey] || 0
    const isEditing = editingCell?.row === catKey && editingCell?.col === pid
    const [local, setLocal] = useState(val)

    if (isEditing) return (
      <input type="number" autoFocus value={local === 0 ? '' : local}
        onChange={e => setLocal(e.target.value)}
        onBlur={() => { updateCell(pid, catKey, local); setEditing(null) }}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Tab') { updateCell(pid, catKey, local); setEditing(null) } if (e.key === 'Escape') setEditing(null) }}
        className="w-full text-right bg-indigo-900/60 border border-indigo-500 rounded px-1 py-0.5 text-white text-xs focus:outline-none metric-mono"
        style={{minWidth:'80px'}} />
    )
    return (
      <div onClick={() => { setLocal(val); setEditing({ row: catKey, col: pid }) }}
        className={`text-right cursor-pointer rounded px-1 py-0.5 hover:bg-indigo-900/40 transition-colors metric-mono text-xs ${rowExcluded ? 'text-slate-500 line-through' : val > 0 ? 'text-slate-200' : 'text-slate-600'}`}
        title="Click to edit">
        {val > 0 ? `$${val.toLocaleString('en-CA', { maximumFractionDigits:0 })}` : '—'}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <SectionHeader title="Partner Operating Costs" sub="All 33 expense categories · Click any cell to edit" />
      {data?.warnings?.length > 0 && (
        <div className="mb-4 rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {data.warnings.map((w, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-rose-400 font-bold">⚠</span>
              <span>{w.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Sub-nav */}
      <div className="flex gap-2 flex-wrap">
        {['opex','capital','space'].map(v => (
          <button key={v} onClick={() => setView(v)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${view===v ? 'tab-active' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'}`}>
            {v==='opex' ? 'Operating Costs' : v==='capital' ? 'Capital Buckets' : 'Space Planning'}
          </button>
        ))}
      </div>

      {/* ── OPEX TABLE ─────────────────────────────────────── */}
      {view === 'opex' && (
        <div className="space-y-4">
          {/* Bar chart */}
          <div className="glass-card rounded-xl p-5">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div className="text-sm font-semibold text-slate-300">Annual Operating Costs by Partner</div>
              <SaveBar saving={savingOpex} unsaved={opexDirty} onSave={handleSave} />
            </div>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} layout="vertical" margin={{left:10,right:50,top:4,bottom:4}}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#1e293b" />
                  <XAxis type="number" tickFormatter={v=>`$${(v/1000).toFixed(0)}K`} tick={{fontSize:10,fill:'#94a3b8'}} />
                  <YAxis dataKey="name" type="category" tick={{fontSize:11,fill:'#94a3b8'}} width={50} />
                  <Tooltip formatter={v=>fmtCAD(v)} contentStyle={{backgroundColor:'#0f172a',border:'1px solid #334155',borderRadius:'8px',color:'#fff'}} />
                  <Bar dataKey="total" radius={[0,4,4,0]} barSize={24}>
                    {barData.map((d,i) => <Cell key={i} fill={d.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Per-partner KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {PARTNER_COLS.map(p => (
              <div key={p.id} className="glass-card rounded-xl p-3" style={{borderLeftColor:p.color,borderLeftWidth:'3px'}}>
                <div className="text-xs text-slate-400 mb-1">{p.short}</div>
                {p.id === BCHCS_ID ? (
                  <>
                    <div className="text-sm font-bold text-amber-400">Data Pending</div>
                    <div className="text-[10px] mt-1 text-slate-400">~2% space share</div>
                    <div className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300">⚠ Excluded from model</div>
                  </>
                ) : (
                  <>
                    <div className="metric-mono text-sm font-bold text-white">{fmtCAD(partnerTotal(p.id))}</div>
                    {partnerExcluded(p.id) > 0 && <div className="text-[10px] mt-1 text-slate-400">excl. <span className="metric-mono line-through">{fmtCAD(partnerExcluded(p.id))}</span></div>}
                    {partnerTotal(p.id) === 0 && <div className="text-xs text-amber-400 mt-0.5">⚠ data needed</div>}
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Group filter */}
          <div className="space-y-2">
            <div className="text-xs text-slate-500">Toggle groups to include/exclude from totals</div>
            <div className="flex gap-2 flex-wrap items-center">
              <span className="text-xs text-slate-500 mr-1">Filter:</span>
              {['All',...OPEX_GROUPS].map(g => (
                <button key={g} onClick={() => setFilter(g)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${filterGroup===g ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'}`}>
                  {g}
                </button>
              ))}
              <button onClick={() => setExcludedGroups([])} className="px-3 py-1 rounded-lg text-xs font-medium bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-600/30">
                Include All
              </button>
              <button onClick={() => { setExcludedGroups([]); setExcludedItems([]) }} className="px-3 py-1 rounded-lg text-xs font-medium bg-amber-600/20 border border-amber-500/40 text-amber-300 hover:bg-amber-600/30">
                Reset All
              </button>
            </div>
            <div className="flex gap-2 flex-wrap">
              {OPEX_GROUPS.map(g => {
                const excluded = isGroupExcluded(g)
                return (
                  <button key={g} onClick={() => toggleGroup(g)} className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 ${excluded ? 'bg-slate-700 text-slate-500 border-slate-600' : 'bg-indigo-600 text-white border-indigo-500'}`}>
                    <span>{excluded ? '☐' : '☑'}</span>
                    <span className={excluded ? 'line-through' : ''}>{g}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="glass-card rounded-xl p-3 border border-emerald-500/30">
              <div className="text-xs text-slate-400">Included in Model</div>
              <div className="metric-mono text-lg font-bold text-emerald-400">{fmtCAD(includedTotal)}</div>
            </div>
            <div className="glass-card rounded-xl p-3 border border-slate-600/50">
              <div className="text-xs text-slate-500">Excluded from Model</div>
              <div className="metric-mono text-lg font-bold text-slate-500 line-through">{fmtCAD(excludedTotal)}</div>
            </div>
            <div className="glass-card rounded-xl p-3 border border-indigo-500/30">
              <div className="text-xs text-slate-400">Impact</div>
              <div className="metric-mono text-lg font-bold text-indigo-300">{excludedPct.toFixed(1)}% <span className="text-sm text-slate-400">net impact</span></div>
            </div>
          </div>

          {/* Main editable grid */}
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="mx-3 mt-3 mb-1 p-3 rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-200 text-xs leading-relaxed">
              ⚠ BCHCS Data Unavailable — BCHCS occupies approximately 2% of the Hub's total space (est. 1,156 sf of 57,800 sf). As a minor consortium partner, their operating expense data has not been provided. BCHCS costs are excluded from status quo totals pending data confirmation. Contact BCHCS administration to obtain actual figures.
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs" style={{minWidth:'700px'}}>
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-900/60">
                    <th className="text-center py-3 px-2 text-slate-400 font-semibold w-10">In</th>
                    <th className="text-left py-3 px-3 text-slate-400 font-semibold sticky left-0 bg-slate-900/90 z-10" style={{minWidth:'200px'}}>Expense Category</th>
                    <th className="text-xs text-slate-500 py-3 px-2 text-center w-20">Group</th>
                    {PARTNER_COLS.map(p => (
                      <th
                        key={p.id}
                        className="text-right py-3 px-3 font-semibold"
                        style={{color:p.color,minWidth:'90px'}}
                        title={p.id === BCHCS_ID ? 'BCHCS is a minor partner occupying ~2% of the Hub. Operating expense data not yet available. Excluded from all model calculations.' : undefined}
                      >
                        {p.short} {p.id === BCHCS_ID ? <span className="text-amber-400">⚠</span> : null}
                      </th>
                    ))}
                    <th className="text-right py-3 px-3 text-slate-300 font-semibold" style={{minWidth:'100px'}}>Row Total</th>
                  </tr>
                </thead>
                <tbody>
                  {OPEX_GROUPS.filter(g => filterGroup==='All' || filterGroup===g).map(group => {
                    const groupExcluded = isGroupExcluded(group)
                    return (
                    <Fragment key={group}>
                      <tr className={`bg-slate-800/60 border-y border-slate-700/60 ${groupExcluded ? 'opacity-40' : ''}`}>
                        <td colSpan={3+PARTNER_COLS.length+1} className="py-1.5 px-3 text-xs font-bold uppercase tracking-widest">
                          <label className="inline-flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={!groupExcluded} onChange={() => toggleGroup(group)} className="accent-emerald-500" />
                            <span className={`${groupExcluded ? 'text-slate-500 line-through' : 'text-indigo-400'}`}>
                              {group}
                              <span className="ml-2 text-[10px] font-medium text-slate-500">
                                ({OPEX_CATEGORIES.filter(c => c.group === group && isItemExcluded(c.key)).length} excluded)
                              </span>
                            </span>
                          </label>
                        </td>
                      </tr>
                      {visibleCats.filter(c => c.group===group).map(cat => {
                        const rowTot = catTotal(cat.key)
                        const rawTot = catRawTotal(cat.key)
                        const itemExcluded = isItemExcluded(cat.key)
                        const rowExcluded = groupExcluded || itemExcluded
                        return (
                          <tr key={cat.key} className={`border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors ${rowExcluded ? 'opacity-30' : ''}`}>
                            <td className="py-2 px-2 text-center">
                              <button onClick={() => toggleItem(cat.key)} className={`w-4 h-4 rounded-sm border text-[10px] leading-none ${itemExcluded ? 'bg-slate-700 border-slate-600 text-slate-500' : 'bg-emerald-600/30 border-emerald-500/50 text-emerald-300'}`}>
                                {itemExcluded ? '' : '✓'}
                              </button>
                            </td>
                            <td className={`py-2 px-3 sticky left-0 bg-slate-900/80 z-10 ${rowExcluded ? 'text-slate-500 line-through' : 'text-slate-300'}`}>{cat.label}</td>
                            <td className={`py-2 px-2 text-center text-xs ${rowExcluded ? 'text-slate-600 line-through' : 'text-slate-500'}`}>{cat.group.slice(0,4)}</td>
                            {PARTNER_COLS.map(p => (
                              <td key={p.id} className="py-1 px-2">
                                <CellInput pid={p.id} catKey={cat.key} rowExcluded={rowExcluded} />
                              </td>
                            ))}
                            <td className={`py-2 px-3 text-right metric-mono font-semibold ${rowExcluded ? 'text-slate-500 line-through' : rowTot>0?'text-slate-200':'text-slate-600'}`}>
                              {rowExcluded ? (rawTot>0 ? fmtCAD(rawTot) : '—') : (rowTot>0 ? fmtCAD(rowTot) : '—')}
                            </td>
                          </tr>
                        )
                      })}
                      {filterGroup==='All' && (
                        <tr className={`bg-slate-800/40 border-b border-slate-700 ${groupExcluded ? 'opacity-50' : ''}`}>
                          <td className={`py-2 px-3 font-semibold italic sticky left-0 bg-slate-800/80 z-10 ${groupExcluded ? 'text-slate-500 line-through' : 'text-slate-400'}`}>{group} subtotal</td>
                          <td></td><td></td>
                          {PARTNER_COLS.map(p => {
                            const groupCats = OPEX_CATEGORIES.filter(c=>c.group===group)
                            const rawSub = groupCats.reduce((s,c)=>s+(opexData[p.id]?.[c.key]||0),0)
                            const sub = groupCats
                              .filter(c => itemIncluded(c.key))
                              .reduce((s,c)=>s+(opexData[p.id]?.[c.key]||0),0)
                            return <td key={p.id} className={`py-2 px-3 text-right metric-mono font-semibold ${groupExcluded ? 'text-slate-500 line-through' : 'text-slate-300'}`}>{(groupExcluded ? rawSub : sub)>0?fmtCAD(groupExcluded ? rawSub : sub):'—'}</td>
                          })}
                          <td className={`py-2 px-3 text-right metric-mono font-semibold ${groupExcluded ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                            {fmtCAD(OPEX_CATEGORIES.filter(c=>c.group===group).reduce((s,c)=>s+(groupExcluded ? catRawTotal(c.key) : (itemIncluded(c.key) ? catRawTotal(c.key) : 0)),0))}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )})}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-indigo-500/40 bg-slate-900/80">
                    <td></td>
                    <td className="py-3 px-3 font-bold text-white sticky left-0 bg-slate-900/90 z-10">TOTAL ANNUAL OPEX</td>
                    <td></td>
                    {PARTNER_COLS.map(p => (
                      <td key={p.id} className="py-3 px-3 text-right metric-mono font-bold" style={{color:p.color}}>{fmtCAD(partnerTotal(p.id))}</td>
                    ))}
                    <td className="py-3 px-3 text-right metric-mono font-bold text-indigo-300 text-sm">{fmtCAD(includedTotal)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div className="px-4 py-2 bg-slate-900/40 border-t border-slate-800 text-xs text-slate-500 flex items-center gap-2">
              <span className="text-indigo-400">✎</span> Click any cell to edit · Tab or Enter to confirm · Esc to cancel
            </div>
            <div className="px-4 py-2 text-[11px] text-amber-300 border-t border-slate-800 bg-slate-900/30">
              * Excludes BCHCS — data pending confirmation
            </div>
          </div>
          <div className="glass-card rounded-xl p-4 border border-slate-700/60">
            <div className="flex items-center justify-between mb-3 gap-3">
              <div className="text-sm font-semibold text-slate-300">Excluded Items</div>
              {excludedItems.length > 0 && (
                <button onClick={() => setExcludedItems([])} className="px-3 py-1 rounded-lg text-xs font-medium bg-slate-700 text-slate-300 border border-slate-600 hover:text-white">
                  Clear all exclusions
                </button>
              )}
            </div>
            {excludedItemRows.length === 0 ? (
              <div className="text-xs text-slate-500">No individual expense items excluded.</div>
            ) : (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {excludedItemRows.map(item => (
                    <span key={item.key} className="text-[11px] px-2 py-1 rounded-md bg-slate-800 text-slate-400 border border-slate-700 line-through">
                      {item.label}
                    </span>
                  ))}
                </div>
                <div className="text-xs text-slate-400">
                  Total excluded amount: <span className="metric-mono text-slate-500 line-through">{fmtCAD(excludedItemsTotal)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── CAPITAL BUCKETS ────────────────────────────────── */}
      {view === 'capital' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPICard title="B1: Operations"       value={fmtCAD(RIVERSIDE.statusQuo.buckets.b1Operations)}           sub="Annual total"  mono />
            <KPICard title="B2: Deferred Capital" value={fmtCAD(RIVERSIDE.statusQuo.buckets.b2DeferredCapital)}      sub="Annual amortized" warn mono />
            <KPICard title="B3: Cap Expansion"    value={fmtCAD(RIVERSIDE.statusQuo.buckets.b3CapitalExpansion)}     sub="Annual (÷20yr)" mono />
            <KPICard title="B4: LHI"              value={fmtCAD(RIVERSIDE.statusQuo.buckets.b4LeaseholdImprovements)} sub="Annual (÷10yr)" mono />
          </div>
          <div className="glass-card rounded-xl p-6">
            <div className="text-sm font-semibold text-slate-300 mb-2">Willowbridge Capital Replacement Liability</div>
            <div className="text-xs text-slate-500 mb-4">Required if Riverside Hub does NOT proceed — 54 Brant Ave</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-2 px-3 text-slate-400">Capital Work Item</th>
                    <th className="text-center py-2 px-3 text-slate-400">Priority</th>
                    <th className="text-right py-2 px-3 text-slate-400">Low</th>
                    <th className="text-right py-2 px-3 text-slate-400">Median</th>
                    <th className="text-right py-2 px-3 text-slate-400">High</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {RIVERSIDE.capitalReplacement.map((r,i) => (
                    <tr key={i} className="hover:bg-slate-800/30">
                      <td className="py-3 px-3 text-slate-200">{r.item}</td>
                      <td className="py-3 px-3 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${r.priority==='Urgent'?'status-risk':r.priority==='High'?'status-watch':'border-slate-600 text-slate-400'}`}>{r.priority}</span>
                      </td>
                      <td className="py-3 px-3 text-right metric-mono text-slate-400">{fmtCAD(r.low)}</td>
                      <td className="py-3 px-3 text-right metric-mono text-white font-medium">{fmtCAD(r.median)}</td>
                      <td className="py-3 px-3 text-right metric-mono text-slate-400">{fmtCAD(r.high)}</td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-slate-600 bg-slate-800/40">
                    <td className="py-3 px-3 font-bold text-white">TOTAL</td><td></td>
                    <td className="py-3 px-3 text-right metric-mono text-emerald-400 font-bold">{fmtCAD(502038)}</td>
                    <td className="py-3 px-3 text-right metric-mono text-amber-400 font-bold">{fmtCAD(823004)}</td>
                    <td className="py-3 px-3 text-right metric-mono text-rose-400 font-bold">{fmtCAD(1162160)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
              Annual deferred liability (median ÷ 10-yr): <strong className="text-white">{fmtCAD(82300.4)}/yr</strong>
            </div>
          </div>
        </div>
      )}

      {/* ── SPACE PLANNING ─────────────────────────────────── */}
      {view === 'space' && (
        <div className="space-y-4">
          <div className="glass-card rounded-xl p-6">
            <div className="text-sm font-semibold text-slate-300 mb-4">Space Requirements by Partner</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 text-slate-400">Partner</th>
                    <th className="text-right py-3 px-4 text-slate-400">Current (sf)</th>
                    <th className="text-right py-3 px-4 text-slate-400">Required (sf)</th>
                    <th className="text-right py-3 px-4 text-slate-400">Shortfall</th>
                    <th className="text-right py-3 px-4 text-slate-400 hidden md:table-cell">LHI Rate</th>
                    <th className="text-right py-3 px-4 text-slate-400 hidden md:table-cell">Net LHI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {[
                    { n:'Willowbridge',    cur:11000, req:14500, rate:'$650/sf (new)',    lhi:1015000  },
                    { n:'Contact Brant',   cur:3500,  req:5500,  rate:'$650/sf (new)',    lhi:385000   },
                    { n:'CMHA/HOPE Brant', cur:null,  req:12000, rate:'$95/sf (office)',  lhi:840000   },
                    { n:'Grand River CHC', cur:null,  req:14500, rate:'$250/sf (clinical)',lhi:3262500 },
                    { n:'BCHCS',           cur:null,  req:null,  rate:'$145/sf (clinical)',lhi:null    },
                  ].map((p,i) => (
                    <tr key={i} className="hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-medium text-white">{p.n}</td>
                      <td className="py-3 px-4 text-right metric-mono text-slate-300">{p.cur ? fmtNum(p.cur) : <span className="text-amber-400 text-xs">⚠ needed</span>}</td>
                      <td className="py-3 px-4 text-right metric-mono text-slate-300">{p.req ? fmtNum(p.req) : <span className="text-amber-400 text-xs">⚠ needed</span>}</td>
                      <td className="py-3 px-4 text-right metric-mono text-rose-400">{p.cur&&p.req ? fmtNum(p.req-p.cur) : '—'}</td>
                      <td className="py-3 px-4 text-right text-slate-400 text-xs hidden md:table-cell">{p.rate}</td>
                      <td className="py-3 px-4 text-right metric-mono text-indigo-300 hidden md:table-cell">{p.lhi ? fmtCAD(p.lhi) : <span className="text-amber-400 text-xs">⚠ needed</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-700 text-xs text-slate-400 space-y-1">
            <div>· New Construction $650/sf · Reno/Office $185/sf · Clinical $250/sf (Altus Ontario Q1 2026)</div>
            <div>· TI allowance $25/sf · Brantford market lease rate $18/sf/yr (Class B)</div>
            <div>· <span className="text-amber-400">⚠ Yellow</span> = data required from CMHA/HOPE, GRCHC, BCHCS</div>
          </div>
        </div>
      )}
    </div>
  )
}
