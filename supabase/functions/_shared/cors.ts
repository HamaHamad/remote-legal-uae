// supabase/functions/_shared/cors.ts
// Shared CORS helpers for all edge functions.
//
// SECURITY (Phase 0 fix):
// Old versions used `Access-Control-Allow-Origin: '*'` on every
// endpoint, which allowed any website to make authenticated requests
// on behalf of a logged-in user (cross-origin CSRF with victim's JWT).
//
// The new behavior:
//   - Reads `ALLOWED_ORIGINS` from env (comma-separated list).
//   - Reflects the request's Origin back ONLY if it's on the allowlist.
//   - Varies by Origin so caches don't poison responses.
//   - Returns no Access-Control-Allow-Origin header at all if the
//     origin is unknown — browsers will block the response.

const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:4173',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:4173',
]

/** Parse the comma-separated ALLOWED_ORIGINS env var, falling back to local dev. */
export function getAllowedOrigins(): string[] {
  const raw = Deno.env.get('ALLOWED_ORIGINS')
  if (!raw) return DEFAULT_ALLOWED_ORIGINS
  const list = raw.split(',').map((s) => s.trim()).filter(Boolean)
  // Always allow localhost for dev, even if env overrides prod list
  for (const d of DEFAULT_ALLOWED_ORIGINS) {
    if (!list.includes(d)) list.push(d)
  }
  return list
}

/** Build the CORS headers for a given request. Origin is reflected only if allowlisted. */
export function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') || ''
  const allowed = getAllowedOrigins()
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  }
  if (origin && allowed.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin
    headers['Access-Control-Allow-Credentials'] = 'true'
  }
  return headers
}

/** Convenience: JSON response with proper CORS headers. */
export function json(
  body: unknown,
  status: number,
  cors: Record<string, string>,
  extraHeaders: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...cors,
      ...extraHeaders,
    },
  })
}

/** Handle OPTIONS preflight — call this first in every serve() handler. */
export function handlePreflight(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 204, headers: corsHeaders(req) })
  }
  return null
}
