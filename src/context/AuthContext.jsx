import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase, isMisconfigured } from '@/lib/supabase'
import i18n, { isRTL } from '@/i18n'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [configError, setConfigError] = useState(isMisconfigured)

  // ─── Apply language + RTL from user profile ───────────────────
  const applyLanguage = useCallback((lang) => {
    if (!lang) return
    // Normalize: 'en-GB' → 'en'
    const normalized = lang.split('-')[0]
    const supported = ['en', 'ar', 'hi', 'ur', 'tl']
    const final = supported.includes(normalized) ? normalized : 'en'

    i18n.changeLanguage(final)
    const dir = isRTL(final) ? 'rtl' : 'ltr'
    document.documentElement.setAttribute('dir', dir)
    document.documentElement.setAttribute('lang', final)
    localStorage.setItem('rlco-lang', final)
  }, [])

  // ─── Load user profile from DB ────────────────────────────────
  const fetchProfile = useCallback(
    async (userId) => {
      try {
        const { data, error: dbErr } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single()

        if (dbErr) throw dbErr
        setProfile(data)

        // Language priority:
        // 1. localStorage (user's explicit choice in this browser)
        // 2. DB value (synced across devices)
        // 3. Fallback to 'en'
        const storedLang = localStorage.getItem('rlco-lang')
        const supported = ['en', 'ar', 'hi', 'ur', 'tl']
        const langToUse =
          storedLang && supported.includes(storedLang) ? storedLang : data?.language || 'en'

        applyLanguage(langToUse)

        // Sync DB if localStorage differs from what DB has stored
        if (storedLang && supported.includes(storedLang) && storedLang !== data?.language) {
          supabase
            .from('users')
            .update({ language: storedLang })
            .eq('id', userId)
            .then(() => {})
            .catch(() => {})
        }

        return data
      } catch (err) {
        console.error('[AuthContext] fetchProfile error:', err.message)
        return null
      }
    },
    [applyLanguage],
  )

  // ─── Init auth ────────────────────────────────────────────────
  useEffect(() => {
    if (isMisconfigured) {
      setLoading(false)
      return
    }

    let isMounted = true
    let didResolve = false

    // Helper — called once when we know the auth state
    const resolve = (authUser) => {
      if (!isMounted || didResolve) return
      didResolve = true
      if (authUser) {
        setUser(authUser)
        fetchProfile(authUser.id).finally(() => {
          if (isMounted) setLoading(false)
        })
      } else {
        setLoading(false)
      }
    }

    // PRIMARY: onAuthStateChange fires almost immediately on page load
    // with INITIAL_SESSION event — use this as the main source of truth
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return

      if (event === 'INITIAL_SESSION') {
        // This fires within ~100ms — resolves the loading state
        resolve(session?.user || null)
      } else if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user)
        fetchProfile(session.user.id)
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setProfile(null)
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        setUser(session.user)
      }
    })

    // FALLBACK: if INITIAL_SESSION never fires (rare edge case),
    // try getSession() after 2s — then force-unblock after 6s
    const fallbackTimer = setTimeout(async () => {
      if (didResolve || !isMounted) return
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        resolve(session?.user || null)
      } catch {
        resolve(null)
      }
    }, 2000)

    const safetyTimer = setTimeout(() => {
      if (!didResolve && isMounted) {
        console.warn('[AuthContext] Safety timeout — unblocking UI')
        didResolve = true
        setLoading(false)
      }
    }, 6000)

    return () => {
      isMounted = false
      clearTimeout(fallbackTimer)
      clearTimeout(safetyTimer)
      subscription.unsubscribe()
    }
  }, [fetchProfile])

  // ─── Sign Up ──────────────────────────────────────────────────
  // SECURITY: `role` is intentionally NOT accepted as a parameter.
  // The handle_new_user() DB trigger hardcodes role='client' for every
  // new signup. Admin/partner roles are granted ONLY by an existing
  // admin via the set_user_role() RPC. This prevents self-service
  // privilege escalation. See supabase/migration_phase0_security.sql.
  const signUp = useCallback(async ({ email, password, fullName }) => {
    setError(null)
    try {
      const currentLang = i18n.language || 'en'
      const { data, error: authErr } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            language: currentLang, // ← read by trigger to set user.language
            // NOTE: no `role` here — trigger ignores it anyway
          },
        },
      })
      if (authErr) throw authErr
      // Profile row is created by the handle_new_user() trigger.
      // No client-side upsert needed (and attempting one would fail
      // because the row already exists with role='client' and the new
      // users_update_own_safe policy forbids role changes).
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
  // scope: 'local'  (default) — sign out only this session/device
  // scope: 'global'            — sign out ALL sessions across all devices
  const signOut = useCallback(async ({ scope = 'local' } = {}) => {
    setError(null)
    try {
      await supabase.auth.signOut({ scope })
    } catch (err) {
      console.error('[signOut]', err.message)
    }
    document.documentElement.setAttribute('dir', 'ltr')
    document.documentElement.setAttribute('lang', 'en')
  }, [])

  // ─── Update Language Preference ───────────────────────────────
  const updateLanguage = useCallback(
    async (lang) => {
      applyLanguage(lang)
      if (user) {
        await supabase.from('users').update({ language: lang }).eq('id', user.id)
        setProfile((prev) => (prev ? { ...prev, language: lang } : prev))
      }
    },
    [user, applyLanguage],
  )

  const role = profile?.role || null
  const isAdmin = role === 'admin'
  const isPartner = role === 'partner'
  const isClient = role === 'client'

  const value = {
    user,
    profile,
    role,
    isAdmin,
    isPartner,
    isClient,
    loading,
    error,
    configError,
    signUp,
    signIn,
    signOut,
    updateLanguage,
    fetchProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}

export default AuthContext
