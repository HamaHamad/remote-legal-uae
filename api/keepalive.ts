// api/keepalive.ts
// Vercel Serverless Function — pings the Supabase REST API every 5 days
// to prevent the free-tier project from being paused and auto-deleted
// after 90 days of inactivity.
//
// Scheduled via vercel.json crons (see the "crons" key).
// No auth required — this endpoint only makes a single read-only REST
// call against the public Supabase URL.

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export default async function handler(req: Request): Promise<Response> {
  const startedAt = new Date().toISOString()

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('[keepalive] Missing Supabase env vars')
    return Response.json(
      { ok: false, error: 'Missing env vars', at: startedAt },
      { status: 500 },
    )
  }

  try {
    // Make a lightweight REST call — just listing tables costs nothing
    // but counts as "activity" for Supabase's free-tier keep-alive.
    const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'GET',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      signal: AbortSignal.timeout(10000), // 10s timeout
    })

    const ok = res.ok || res.status === 200 || res.status === 404 // 404 is fine — means API is up

    console.log(`[keepalive] ${startedAt} -> ${res.status} (${ok ? 'OK' : 'FAIL'})`)

    return Response.json({
      ok,
      status: res.status,
      at: startedAt,
      project: SUPABASE_URL.split('//')[1]?.split('.')[0] || 'unknown',
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`[keepalive] ${startedAt} -> ERROR: ${msg}`)
    return Response.json({ ok: false, error: msg, at: startedAt }, { status: 500 })
  }
}
