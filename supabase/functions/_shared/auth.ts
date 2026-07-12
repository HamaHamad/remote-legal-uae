// supabase/functions/_shared/auth.ts
// Shared auth + Supabase client helpers for edge functions.
//
// Two helpers:
//   1. getUserFromRequest(req)  — verifies the caller's JWT and returns
//      the Supabase User object. Throws AuthError on missing/invalid
//      token. Use this for user-facing endpoints (analyze-case,
//      analyze-document, create-checkout).
//
//   2. requireServiceRole(req)  — verifies the caller is the Supabase
//      service role (used by internal cron-triggered functions like
//      send-emails). Use this for endpoints that should NEVER be
//      callable by end users.
//
//   3. createAdminClient()      — service-role Supabase client for
//      privileged DB writes (e.g. updating cases.ai_unlocked from the
//      stripe-webhook). NEVER expose this client's keys to the browser.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import type { SupabaseClient, User } from 'https://esm.sh/@supabase/supabase-js@2'

export class AuthError extends Error {
  status: number
  constructor(message: string, status = 401) {
    super(message)
    this.status = status
  }
}

/** Required env vars sanity check. */
function assertEnv(): { url: string; anonKey: string; serviceKey: string } {
  const url = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !anonKey || !serviceKey) {
    throw new Error('Missing SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY in edge function env')
  }
  return { url, anonKey, serviceKey }
}

/**
 * Verify the caller's JWT and return the User. Throws AuthError(401)
 * if the Authorization header is missing or the token is invalid.
 */
export async function getUserFromRequest(req: Request): Promise<{ user: User; client: SupabaseClient }> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AuthError('Missing or malformed Authorization header', 401)
  }

  const { url, anonKey } = assertEnv()
  const client = createClient(url, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })

  const { data, error } = await client.auth.getUser()
  if (error || !data.user) {
    throw new AuthError('Invalid or expired auth token', 401)
  }
  return { user: data.user, client }
}

/**
 * Require that the caller is using the service-role key. This is
 * used by cron-triggered functions (send-emails) that should never
 * be callable from the browser.
 *
 * The check supports two patterns:
 *   - Authorization: Bearer <service_role_key>   (from pg_net cron)
 *   - x-supabase-key: <service_role_key>         (manual invocation)
 */
export function requireServiceRole(req: Request): void {
  const { serviceKey } = assertEnv()

  const authHeader = req.headers.get('Authorization') || ''
  const xKey = req.headers.get('x-supabase-key') || ''
  const apiKey = req.headers.get('apikey') || ''

  const presented =
    (authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader) ||
    xKey ||
    apiKey

  if (!presented || presented !== serviceKey) {
    throw new AuthError('Forbidden: service-role key required', 403)
  }
}

/** Service-role Supabase client — bypasses RLS. Use sparingly. */
export function createAdminClient(): SupabaseClient {
  const { url, serviceKey } = assertEnv()
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

/**
 * Verify that `caseId` belongs to `userId` (or that the user is an
 * admin or assigned partner). Returns the case row or throws AuthError.
 */
export async function verifyCaseAccess(
  userClient: SupabaseClient,
  caseId: string,
  userId: string,
): Promise<{ id: string; user_id: string; assigned_to: string | null; type: string; status: string; ai_status: string | null; ai_unlocked: boolean | null }> {
  // RLS on the user-scoped client enforces this — if the user can
  // see the case, they own it / are assigned / are admin.
  const { data, error } = await userClient
    .from('cases')
    .select('id, user_id, assigned_to, type, status, ai_status, ai_unlocked')
    .eq('id', caseId)
    .single()

  if (error || !data) {
    throw new AuthError('Case not found or access denied', 404)
  }
  // Defence in depth: explicit ownership check on top of RLS
  if (data.user_id !== userId && data.assigned_to !== userId) {
    // Could still be admin — check role via the user-scoped client
    const { data: profile } = await userClient
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()
    if (profile?.role !== 'admin') {
      throw new AuthError('Case not found or access denied', 404)
    }
  }
  return data
}
