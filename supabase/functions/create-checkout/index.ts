// supabase/functions/create-checkout/index.ts
// Creates a Stripe Checkout Session for unlocking a case's AI report.
//
// Phase 0 security fixes applied:
//   - CORS: origin allowlist (no more `*`)
//   - Open redirect: return_url is now validated against an allowlist
//     built from ALLOWED_ORIGINS env var (no more arbitrary redirects)
//   - Error leakage: internal details logged server-side only
//
// Required Supabase secrets:
//   STRIPE_SECRET_KEY
//   SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY
//   ALLOWED_ORIGINS (comma-separated, e.g.
//     "https://remote-legal-uae.vercel.app,https://staging.remote-legal-uae.vercel.app")

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'
import {
  corsHeaders,
  handlePreflight,
  json,
  getAllowedOrigins,
} from '../_shared/cors.ts'
import { AuthError, createAdminClient, getUserFromRequest } from '../_shared/auth.ts'

const UNLOCK_AMOUNT_FILS = 9900 // AED 99.00
const UNLOCK_CURRENCY = 'aed'
const UNLOCK_LABEL = 'AI Case Report — Unlock'
const UNLOCK_DESC =
  'Full AI analysis: summary, risk level, cost estimate, and step-by-step action plan.'

/** Pick the canonical base URL for redirects — never trust the client. */
function resolveBaseUrl(clientReturnUrl: string | undefined): string {
  const allowed = getAllowedOrigins()

  // If the client supplied a URL and it matches the allowlist, use it.
  if (clientReturnUrl) {
    try {
      const u = new URL(clientReturnUrl)
      const origin = `${u.protocol}//${u.host}`
      if (allowed.includes(origin)) return origin
    } catch {
      // invalid URL — ignore
    }
  }

  // Fall back to the first non-localhost origin in the allowlist
  const prod = allowed.find((o) => !o.includes('localhost') && !o.includes('127.0.0.1'))
  if (prod) return prod

  // Last resort: localhost dev
  return allowed[0] || 'http://localhost:5173'
}

serve(async (req: Request) => {
  const cors = corsHeaders(req)
  const preflight = handlePreflight(req)
  if (preflight) return preflight

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405, cors, { Allow: 'POST, OPTIONS' })
  }

  try {
    // ── 1. Parse & validate body ──────────────────────────────────
    const body = await req.json().catch(() => null)
    if (!body) return json({ error: 'Invalid JSON body' }, 400, cors)

    const { case_id, return_url } = body as {
      case_id?: string
      return_url?: string
    }

    if (!case_id) {
      return json({ error: 'Missing required field: case_id' }, 400, cors)
    }

    // ── 2. Verify auth (JWT required) ────────────────────────────
    const { user, client: userClient } = await getUserFromRequest(req)

    // ── 3. Verify case ownership via user-scoped client (RLS) ────
    const { data: caseData, error: caseErr } = await userClient
      .from('cases')
      .select('id, type, ai_status, ai_unlocked, user_id')
      .eq('id', case_id)
      .single()

    if (caseErr || !caseData) {
      return json({ error: 'Case not found or access denied' }, 404, cors)
    }

    if (caseData.ai_unlocked) {
      return json({ error: 'Case is already unlocked' }, 409, cors)
    }

    if (caseData.ai_status !== 'done') {
      return json(
        { error: 'AI analysis not ready yet. Please wait.' },
        400,
        cors,
      )
    }

    // ── 4. Check for an existing pending payment ─────────────────
    const admin = createAdminClient()

    const { data: existingPayment } = await admin
      .from('payments')
      .select('id, stripe_session_id, status')
      .eq('case_id', case_id)
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .maybeSingle()

    // ── 5. Init Stripe ────────────────────────────────────────────
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) {
      console.error('[create-checkout] STRIPE_SECRET_KEY missing')
      return json({ error: 'Payment service not configured' }, 500, cors)
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    })

    // Re-use existing session if still open
    if (existingPayment?.stripe_session_id) {
      try {
        const existing = await stripe.checkout.sessions.retrieve(
          existingPayment.stripe_session_id,
        )
        if (existing.status === 'open') {
          return json(
            { url: existing.url, session_id: existing.id },
            200,
            cors,
          )
        }
      } catch {
        /* session expired — create a new one */
      }
    }

    // ── 6. Build redirect URLs (allowlist-validated) ─────────────
    const base = resolveBaseUrl(return_url)
    const successUrl = `${base}/payment/success?session_id={CHECKOUT_SESSION_ID}&case_id=${case_id}`
    const cancelUrl = `${base}/payment/cancel?case_id=${case_id}`

    // ── 7. Create Stripe Checkout Session ─────────────────────────
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      currency: UNLOCK_CURRENCY,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: UNLOCK_CURRENCY,
            unit_amount: UNLOCK_AMOUNT_FILS,
            product_data: {
              name: UNLOCK_LABEL,
              description: UNLOCK_DESC,
              metadata: { case_id, case_type: caseData.type },
            },
          },
        },
      ],
      metadata: {
        case_id,
        user_id: user.id,
      },
      customer_email: user.email || undefined,
      success_url: successUrl,
      cancel_url: cancelUrl,
      expires_at: Math.floor(Date.now() / 1000) + 1800, // 30 min
    })

    // ── 8. Insert pending payment record ──────────────────────────
    const { error: insertErr } = await admin
      .from('payments')
      .upsert(
        {
          user_id: user.id,
          case_id,
          stripe_session_id: session.id,
          amount: UNLOCK_AMOUNT_FILS,
          currency: UNLOCK_CURRENCY,
          status: 'pending',
        },
        { onConflict: 'stripe_session_id' },
      )

    if (insertErr) {
      console.error('[create-checkout] Payment insert error:', insertErr.message)
      // Non-fatal — session was created, continue
    }

    return json({ url: session.url, session_id: session.id }, 200, cors)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[create-checkout] Error:', message)

    if (err instanceof AuthError) {
      return json({ error: err.message }, err.status, cors)
    }
    // Never leak Stripe error details to the client
    return json({ error: 'Failed to create checkout session' }, 500, cors)
  }
})
