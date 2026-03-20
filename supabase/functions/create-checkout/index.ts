// supabase/functions/create-checkout/index.ts
// Creates a Stripe Checkout Session for unlocking a case's AI report.
//
// Required Supabase secrets:
//   STRIPE_SECRET_KEY       — from Stripe Dashboard → Developers → API Keys
//
// The price is hardcoded at AED 99 (9900 fils).
// Stripe supports AED natively (currency code: "aed").

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const UNLOCK_AMOUNT_FILS = 9900   // AED 99.00 (Stripe uses smallest currency unit)
const UNLOCK_CURRENCY    = 'aed'
const UNLOCK_LABEL       = 'AI Case Report — Unlock'
const UNLOCK_DESC        = 'Full AI analysis: summary, risk level, cost estimate, and step-by-step action plan.'

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS })
  }

  try {
    // ── 1. Parse & validate body ──────────────────────────────────
    const { case_id, case_type, return_url } = await req.json()

    if (!case_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: case_id' }),
        { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } }
      )
    }

    // ── 2. Verify case exists + get user via auth header ──────────
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing Authorization header' }),
        { status: 401, headers: { ...CORS, 'Content-Type': 'application/json' } }
      )
    }

    // Use user-scoped client to verify ownership (RLS enforced)
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authErr } = await supabaseUser.auth.getUser()
    if (authErr || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired auth token' }),
        { status: 401, headers: { ...CORS, 'Content-Type': 'application/json' } }
      )
    }

    // ── 3. Check case ownership + not already unlocked ────────────
    const { data: caseData, error: caseErr } = await supabaseUser
      .from('cases')
      .select('id, type, ai_status, ai_unlocked, user_id')
      .eq('id', case_id)
      .single()

    if (caseErr || !caseData) {
      return new Response(
        JSON.stringify({ error: 'Case not found or access denied' }),
        { status: 404, headers: { ...CORS, 'Content-Type': 'application/json' } }
      )
    }

    if (caseData.ai_unlocked) {
      return new Response(
        JSON.stringify({ error: 'Case is already unlocked' }),
        { status: 409, headers: { ...CORS, 'Content-Type': 'application/json' } }
      )
    }

    if (caseData.ai_status !== 'done') {
      return new Response(
        JSON.stringify({ error: 'AI analysis not ready yet. Please wait.' }),
        { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } }
      )
    }

    // ── 4. Check for an existing pending payment to avoid duplicates
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } }
    )

    const { data: existingPayment } = await supabaseAdmin
      .from('payments')
      .select('id, stripe_session_id, status')
      .eq('case_id', case_id)
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .maybeSingle()

    // ── 5. Init Stripe ────────────────────────────────────────────
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) throw new Error('STRIPE_SECRET_KEY not set in Edge Function secrets')

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    })

    // Re-use existing session if still valid
    if (existingPayment?.stripe_session_id) {
      try {
        const existing = await stripe.checkout.sessions.retrieve(existingPayment.stripe_session_id)
        if (existing.status === 'open') {
          return new Response(
            JSON.stringify({ url: existing.url, session_id: existing.id }),
            { status: 200, headers: { ...CORS, 'Content-Type': 'application/json' } }
          )
        }
      } catch { /* session expired — create a new one */ }
    }

    // ── 6. Build redirect URLs ────────────────────────────────────
    const base        = return_url || 'https://your-domain.vercel.app'
    const successUrl  = `${base}/payment/success?session_id={CHECKOUT_SESSION_ID}&case_id=${case_id}`
    const cancelUrl   = `${base}/payment/cancel?case_id=${case_id}`

    // ── 7. Create Stripe Checkout Session ─────────────────────────
    const session = await stripe.checkout.sessions.create({
      mode:                'payment',
      payment_method_types: ['card'],
      currency:            UNLOCK_CURRENCY,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency:     UNLOCK_CURRENCY,
            unit_amount:  UNLOCK_AMOUNT_FILS,
            product_data: {
              name:        UNLOCK_LABEL,
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
      customer_email:       user.email,
      success_url:          successUrl,
      cancel_url:           cancelUrl,
      expires_at:           Math.floor(Date.now() / 1000) + 1800, // 30 min
    })

    // ── 8. Insert pending payment record ──────────────────────────
    const { error: insertErr } = await supabaseAdmin
      .from('payments')
      .upsert({
        user_id:           user.id,
        case_id,
        stripe_session_id: session.id,
        amount:            UNLOCK_AMOUNT_FILS,
        currency:          UNLOCK_CURRENCY,
        status:            'pending',
      }, { onConflict: 'stripe_session_id' })

    if (insertErr) {
      console.error('[create-checkout] Payment insert error:', insertErr.message)
      // Non-fatal — session was created, continue
    }

    // ── 9. Return checkout URL ────────────────────────────────────
    return new Response(
      JSON.stringify({ url: session.url, session_id: session.id }),
      { status: 200, headers: { ...CORS, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[create-checkout] Error:', message)
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } }
    )
  }
})
