import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase env vars missing. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
}

// Clear any stale auth locks that might be blocking getSession()
// This runs once on page load and removes orphaned lock entries
try {
  const staleKeys = Object.keys(localStorage).filter(
    (k) => k.includes('rlco-auth') || k.includes('supabase.auth'),
  )
  // Only clear lock entries, not the session itself
  staleKeys.filter((k) => k.includes('-lock')).forEach((k) => localStorage.removeItem(k))
} catch {
  /* ignore if localStorage unavailable */
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      // detectSessionInUrl must stay true (the default) so that
      // password-reset links (which embed the token in the URL hash)
      // and magic-link / OAuth callbacks are auto-detected.
      // The stale-lock issue that previously motivated setting this to
      // false is mitigated by the localStorage cleanup code above.
      storageKey: 'rlco-session-v2', // ← new key: avoids stale lock
      flowType: 'implicit',
    },
  },
)

export const isMisconfigured = !supabaseUrl || !supabaseAnonKey

export default supabase
