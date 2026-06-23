import { useState } from 'react'

export default function AuthPage({ onAuth }) {
  const [mode, setMode]       = useState('signin') // signin | signup | reset
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]     = useState('')
  const [msg, setMsg]         = useState('')
  const [loading, setLoading] = useState(false)

  const handle = async (e) => {
    e.preventDefault()
    setError(''); setMsg(''); setLoading(true)
    const result = mode === 'signin'
      ? await onAuth.signIn(email, password)
      : mode === 'signup'
      ? await onAuth.signUp(email, password)
      : await onAuth.resetPassword(email)

    if (result.error) setError(result.error.message)
    else if (mode === 'reset') setMsg('Password reset email sent — check your inbox.')
    else if (mode === 'signup') setMsg('Check your email to confirm your account.')
    setLoading(false)
  }

  return (
    <div className="min-h-screen riverside-gradient flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
            style={{background:'linear-gradient(135deg,#4f46e5,#06b6d4)'}}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/>
              <path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Riverside Hub</h1>
          <p className="text-cyan-400 text-sm mt-1 font-medium">Meta MUSH Platform</p>
          <p className="text-slate-500 text-xs mt-1">54 Brant Ave, Brantford ON · Willowbridge Community Services</p>
        </div>

        {/* Card */}
        <div className="glass-card rounded-2xl p-8 space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-white">
              {mode === 'signin' ? 'Sign in to your account' : mode === 'signup' ? 'Create an account' : 'Reset password'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {mode === 'signin' ? 'Access your saved scenarios and data.' : mode === 'signup' ? 'Get access to the platform.' : 'We\'ll send a reset link to your email.'}
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm">{error}</div>
          )}
          {msg && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm">{msg}</div>
          )}

          <form onSubmit={handle} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1.5">Email</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm
                  focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition-colors"
                placeholder="you@organisation.ca" />
            </div>

            {mode !== 'reset' && (
              <div>
                <label className="block text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1.5">Password</label>
                <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required
                  minLength={6}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm
                    focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition-colors"
                  placeholder="••••••••" />
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{background: loading ? '#334155' : 'linear-gradient(135deg,#4f46e5,#6366f1)'}}>
              {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" style={{animation:'spin .8s linear infinite'}}></div>}
              {loading ? 'Please wait…' : mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Email'}
            </button>
          </form>

          <div className="space-y-2 pt-2 border-t border-slate-700 text-center text-xs text-slate-500">
            {mode === 'signin' && <>
              <button onClick={()=>setMode('signup')} className="block w-full hover:text-indigo-400 transition-colors py-1">
                Don't have an account? <span className="text-indigo-400 font-medium">Sign up</span>
              </button>
              <button onClick={()=>setMode('reset')} className="block w-full hover:text-slate-300 transition-colors py-1">
                Forgot password?
              </button>
            </>}
            {mode !== 'signin' && (
              <button onClick={()=>setMode('signin')} className="block w-full hover:text-indigo-400 transition-colors py-1">
                <span className="text-indigo-400 font-medium">← Back to sign in</span>
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          Internal planning tool only · Not for financial decision reliance
        </p>
      </div>
    </div>
  )
}
