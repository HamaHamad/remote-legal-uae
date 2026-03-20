import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase, isMisconfigured } from '@/lib/supabase'
import i18n, { isRTL } from '@/i18n'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const [configError, setConfigError] = useState(isMisconfigured)

  // ─── Apply language + RTL from user profile ───────────────────
  const applyLanguage = useCallback((lang) => {
    if (!lang) return
    i18n.changeLanguage(lang)
    const dir = isRTL(lang) ? 'rtl' : 'ltr'
    document.documentElement.setAttribute('dir', dir)
    document.documentElement.setAttribute('lang', lang)
    localStorage.setItem('rlco-lang', lang)
  }, [])

  // ─── Load user profile from DB ────────────────────────────────
  const fetchProfile = useCallback(async (userId) => {
    try {
      const { data, error: dbErr } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (dbErr) throw dbErr
      setProfile(data)
      if (data?.language) applyLanguage(data.language)
      return data
    } catch (err) {
      console.error('[AuthContext] fetchProfile error:', err.message)
      return null
    }
  }, [applyLanguage])

  // ─── Init auth ────────────────────────────────────────────────
  useEffect(() => {
    // If env vars are missing, unblock immediately — show config error UI
    if (isMisconfigured) {
      setLoading(false)
      return
    }

    let isMounted = true

    // Safety timeout — if nothing resolves in 8s, unblock the UI
    // so users don't see an infinite spinner
    const safetyTimer = setTimeout(() => {
      if (isMounted) {
        console.warn('[AuthContext] Auth init timed out — unblocking UI')
        setLoading(false)
      }
    }, 12000)

    const initAuth = async () => {
      try {
        const { data: { session }, error: sessionErr } = await supabase.auth.getSession()

        if (sessionErr) {
          console.error('[AuthContext] getSession error:', sessionErr.message)
        }

        if (!isMounted) return

        if (session?.user) {
          setUser(session.user)
          await fetchProfile(session.user.id)
        }
      } catch (err) {
        // Network error, CORS, bad URL, etc.
        console.error('[AuthContext] initAuth error:', err.message)
      } finally {
        if (isMounted) {
          clearTimeout(safetyTimer)
          setLoading(false)
        }
      }
    }

    // Listen to auth state changes BEFORE calling initAuth
    // so we don't miss events that fire during init
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return

        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user)
          await fetchProfile(session.user.id)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setProfile(null)
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          setUser(session.user)
        }
        // NOTE: we intentionally do NOT call setLoading(false) here
        // because initAuth's finally block handles that authoritatively
      }
    )

    initAuth()

    return () => {
      isMounted = false
      clearTimeout(safetyTimer)
      subscription.unsubscribe()
    }
  }, [fetchProfile])

  // ─── Sign Up ──────────────────────────────────────────────────
  const signUp = useCallback(async ({ email, password, fullName, role = 'client' }) => {
    setError(null)
    try {
      const currentLang = i18n.language || 'en'
      const { data, error: authErr } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, role } },
      })
      if (authErr) throw authErr
      if (data.user) {
        const { error: profileErr } = await supabase.from('users').upsert({
          id: data.user.id,
          email,
          role,
          language: currentLang,
        })
        if (profileErr) console.warn('[signUp] Profile upsert warn:', profileErr.message)
      }
      return { data, error: null }
    } catch (err) {
      setError(err.message)
      return { data: null, error: err }
    }
  }, [])

  // ─── Sign In ──────────────────────────────────────────────────
  const signIn = useCallback(async ({ email, password }) => {
    setError(null)
    try {
      const { data, error: authErr } = await supabase.auth.signInWithPassword({ email, password })
      if (authErr) throw authErr
      return { data, error: null }
    } catch (err) {
      setError(err.message)
      return { data: null, error: err }
    }
  }, [])

  // ─── Sign Out ─────────────────────────────────────────────────
  const signOut = useCallback(async () => {
    setError(null)
    try {
      await supabase.auth.signOut()
    } catch (err) {
      console.error('[signOut]', err.message)
    }
    document.documentElement.setAttribute('dir', 'ltr')
    document.documentElement.setAttribute('lang', 'en')
  }, [])

  // ─── Update Language Preference ───────────────────────────────
  const updateLanguage = useCallback(async (lang) => {
    applyLanguage(lang)
    if (user) {
      await supabase.from('users').update({ language: lang }).eq('id', user.id)
      setProfile(prev => prev ? { ...prev, language: lang } : prev)
    }
  }, [user, applyLanguage])

  const role      = profile?.role || null
  const isAdmin   = role === 'admin'
  const isPartner = role === 'partner'
  const isClient  = role === 'client'

  const value = {
    user, profile, role,
    isAdmin, isPartner, isClient,
    loading, error, configError,
    signUp, signIn, signOut,
    updateLanguage, fetchProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}

export default AuthContext

