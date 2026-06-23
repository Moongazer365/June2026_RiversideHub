import { Icons } from '../components/UI'

const GUIDE = [
  {
    icon: Icons.Dashboard,
    title: 'ROI Dashboard',
    desc: 'View the baseline business case and savings profile.',
    bullets: [
      'View the 4-bucket status quo cost breakdown',
      'Toggle buckets on/off to see conservative vs full cost scenarios',
      'B1 Operations is always included (locked)',
      'Use the sensitivity table to see best/worst case savings',
    ],
  },
  {
    icon: Icons.Partners,
    title: 'Partners',
    desc: 'Manage partner-level cost inputs and allocations.',
    bullets: [
      'View and edit all 33 operating expense categories per partner',
      'Click any cell to edit the value',
      'Switch between Operating Costs, Capital Buckets, and Space Planning views',
      'Changes are saved automatically to your account',
    ],
  },
  {
    icon: Icons.Capital,
    title: 'Capital Structure',
    desc: 'Review construction assumptions and financing composition.',
    bullets: [
      'View the full construction budget breakdown',
      'See the financing stack (grant, donations, debt)',
      'Review FM benchmark operating cost rates',
    ],
  },
  {
    icon: Icons.Opex,
    title: 'FM Benchmark',
    desc: 'Tune FM rates and compare facilities cost scenarios.',
    bullets: [
      'Edit per-category $/sf operating cost rates',
      'Create and compare multiple FM scenarios',
      'Adjust building GFA to see total annual costs',
    ],
  },
  {
    icon: Icons.Scenario,
    title: 'Scenario Planner',
    desc: 'Model funding, partner, and stress-case outcomes.',
    bullets: [
      'Funding Scenarios: Adjust grant percentage with a slider',
      'Project Inputs: Change construction costs and financing terms',
      'Partners: Set partner share percentages (must total 100%)',
      'B1-B4 tabs: Edit individual bucket data',
      'Stress Test: See how the model performs under worst-case conditions',
      'Saved Scenarios: Snapshot and compare different scenarios',
    ],
  },
  {
    icon: Icons.Report,
    title: 'Executive Summary',
    desc: 'Produce a polished one-page leadership snapshot.',
    bullets: [
      'One-page overview of the entire project',
      'Export to PDF using the browser print dialog',
      'Export to Word document for editing',
    ],
  },
  {
    icon: Icons.Excel,
    title: 'Reports & Export',
    desc: 'Generate distribution-ready outputs from current model state.',
    bullets: [
      'Generate a full PDF report with section toggles',
      'Export a multi-sheet Excel workbook with all data',
    ],
  },
]

const CONCEPTS = [
  ['DSCR (Debt Service Coverage Ratio)', 'How many times your revenue covers your debt payments. Target is 1.2x or higher — meaning for every $1 of debt you owe, you earn $1.20.'],
  ['Status Quo Cost', 'What the 5 partners collectively spend today across all 4 cost buckets if the Hub does NOT proceed.'],
  ['Hub Model Cost', 'What the consortium would pay annually if the Hub proceeds — operating expenses plus debt service.'],
  ['The 4 Buckets', 'B1 = current operating costs, B2 = deferred capital repairs, B3 = cost to expand existing spaces, B4 = leasehold improvements for new leased space.'],
  ['Capital Reserve Fund', 'A buffer of funds set aside to cover unexpected deficits. Used in stress testing to calculate how long the project can survive worst-case scenarios.'],
  ['FM Benchmark', 'Facility Management cost rate in dollars per square foot per year. Industry standard for a new healthcare hub in Ontario is $13/sf/yr.'],
]

export default function HowToUse() {
  return (
    <div className="space-y-6">
      <div className="glass-card rounded-xl p-6">
        <h1 className="text-2xl md:text-3xl font-bold text-white">Welcome to Riverside Hub Meta MUSH Platform</h1>
        <p className="text-sm text-slate-400 mt-2">A capital planning and ROI analysis tool for the Riverside Hub consortium</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          ['Step 1: Review ROI Dashboard', 'See the baseline savings case', Icons.Dashboard],
          ['Step 2: Explore Scenarios', 'Adjust funding and inputs', Icons.Scenario],
          ['Step 3: Review Partners', 'Check partner costs and savings', Icons.Partners],
          ['Step 4: Export Reports', 'Generate PDF or Excel reports', Icons.Report],
        ].map(([title, sub, Icon]) => (
          <div key={title} className="glass-card rounded-xl p-4 border border-indigo-500/20">
            <div className="flex items-center gap-2 mb-2"><Icon className="w-4 h-4 text-indigo-400" /><div className="text-xs uppercase tracking-wider text-indigo-400 font-semibold">{title}</div></div>
            <div className="text-sm text-slate-300">{sub}</div>
          </div>
        ))}
      </div>

      <div className="glass-card rounded-xl p-6 space-y-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-400">Tab By Tab Guide</h2>
        {GUIDE.map(({ icon: Icon, title, desc, bullets }) => (
          <div key={title} className="rounded-lg border border-slate-700 bg-slate-900/40 p-4">
            <div className="flex items-center gap-2 mb-1"><Icon className="w-4 h-4 text-cyan-400" /><div className="font-semibold text-white">{title}</div></div>
            <div className="text-xs text-slate-400 mb-2">{desc}</div>
            <ul className="list-disc pl-5 space-y-1 text-sm text-slate-300">
              {bullets.map(b => <li key={b}>{b}</li>)}
            </ul>
          </div>
        ))}
      </div>

      <div className="glass-card rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-400">Key Concepts</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {CONCEPTS.map(([term, def]) => (
            <div key={term} className="rounded-lg border border-slate-700 bg-slate-900/40 p-4">
              <div className="text-sm font-semibold text-white mb-1">{term}</div>
              <div className="text-sm text-slate-300">{def}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card rounded-xl p-6 space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-400">Tips & Best Practices</h2>
        <ul className="list-disc pl-5 space-y-1 text-sm text-slate-300">
          <li>Always ensure partner shares total 100% in the Partners tab</li>
          <li>Save your scenarios before making major changes so you can revert</li>
          <li>Use the Conservative bucket toggle (B1+B2 only) for the most defensible savings case</li>
          <li>The stress test assumes worst case simultaneously — real risk is lower</li>
          <li>Export the Executive Summary before board meetings for a clean one-pager</li>
        </ul>
      </div>

      <div className="glass-card rounded-xl p-5 border border-amber-500/30 bg-amber-500/10">
        <div className="text-sm text-amber-200">This platform was built for internal planning purposes by Willowbridge Community Services. All figures require independent professional verification. For questions contact abali@willowbridge.ca</div>
      </div>
    </div>
  )
}
