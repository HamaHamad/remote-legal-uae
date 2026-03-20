import { createClient } from '@supabase/supabase-js'

const supabaseUrl     = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Warn in console but do NOT throw — a hard throw here crashes the entire
// React tree before it mounts, causing an infinite loading screen with
// no visible error. The auth context will handle the missing-client state.
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '❌ Supabase env vars missing. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY ' +
    'to your Vercel project settings or local .env.local file.'
  )
}

export const supabase = createClient(
  supabaseUrl  || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession:    true,
      autoRefreshToken:  true,
      detectSessionInUrl: true,
      storageKey:        'rlco-auth-token',
    },
  }
)

export const isMisconfigured = !supabaseUrl || !supabaseAnonKey

export default supabase
