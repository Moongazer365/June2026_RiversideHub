import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import {
  INITIAL_OPEX, DEFAULT_SCENARIO_INPUTS, DEFAULT_PLANNER_PARTNERS,
  DEFAULT_BUCKETS, DEFAULT_B4_LHI, FM_BASE_CATEGORIES, makeFmRates,
} from '../data/constants'

const TEAM_ID = 'riverside-hub-team-shared'

// ─── AUTH HOOK ────────────────────────────────────────────────────────────────

export function useAuth() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session); setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  const signIn = (email, password) => supabase.auth.signInWithPassword({ email, password })
  const signUp = (email, password) => supabase.auth.signUp({ email, password })
  const signOut = () => supabase.auth.signOut()
  const resetPassword = (email) => supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })

  return { session, user: session?.user ?? null, loading, signIn, signUp, signOut, resetPassword }
}

// ─── GENERIC SHARED DATA HOOK ─────────────────────────────────────────────────
// Reads/writes a single JSON blob per team per key in the `user_data` table.

function useSharedData(key, defaultValue) {
  const [data, setData]     = useState(defaultValue)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]  = useState(false)
  const [hasSavedRow, setHasSavedRow] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    const { data: row } = await supabase
      .from('user_data')
      .select('value')
      .eq('user_id', TEAM_ID)
      .eq('key', key)
      .maybeSingle()
    if (row?.value) {
      setData(row.value)
      setHasSavedRow(true)
    } else {
      setHasSavedRow(false)
    }
    setLoading(false)
  }, [key])

  useEffect(() => { load() }, [load])

  const save = useCallback(async (value) => {
    setSaving(true)
    await supabase.from('user_data').upsert(
      { user_id: TEAM_ID, key, value, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,key' }
    )
    setData(value)
    setHasSavedRow(true)
    setSaving(false)
  }, [key])

  return { data, setData, save, loading, saving, hasSavedRow }
}

// ─── SPECIALISED HOOKS ────────────────────────────────────────────────────────

export function useOpexData() {
  return useSharedData('opex_data', INITIAL_OPEX)
}

export function useScenarioInputs() {
  return useSharedData('scenario_inputs', DEFAULT_SCENARIO_INPUTS)
}

export function usePlannerPartners() {
  return useSharedData('planner_partners', DEFAULT_PLANNER_PARTNERS)
}

export function useBuckets() {
  return useSharedData('buckets', DEFAULT_BUCKETS)
}

export function useB4Lhi() {
  return useSharedData('b4_lhi', DEFAULT_B4_LHI)
}

export function useFmScenarios() {
  const defaultScenarios = [
    { id:1, label:'Benchmark (ASHE/BOMA)', color:'#6366f1', rates: makeFmRates(FM_BASE_CATEGORIES) },
    { id:2, label:'Conservative (+20%)',   color:'#f59e0b', rates: Object.fromEntries(FM_BASE_CATEGORIES.map(c=>[c.key,+(c.baseRate*1.2).toFixed(2)])) },
    { id:3, label:'Optimistic (−15%)',     color:'#10b981', rates: Object.fromEntries(FM_BASE_CATEGORIES.map(c=>[c.key,+(c.baseRate*0.85).toFixed(2)])) },
  ]
  return useSharedData('fm_scenarios', defaultScenarios)
}

// ─── SAVED SCENARIOS HOOK ─────────────────────────────────────────────────────
// Named scenario snapshots stored as an array in one blob.

export function useSavedScenarios() {
  return useSharedData('saved_scenarios', [])
}

// ─── PROFILE HOOK ─────────────────────────────────────────────────────────────

export function useProfile(userId) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) { setLoading(false); return }
    supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
      .then(({ data }) => { setProfile(data); setLoading(false) })
  }, [userId])

  const updateProfile = async (updates) => {
    const { data, error } = await supabase.from('profiles')
      .upsert({ id: userId, ...updates, updated_at: new Date().toISOString() })
      .select().single()
    if (!error) setProfile(data)
    return { data, error }
  }

  return { profile, loading, updateProfile }
}
