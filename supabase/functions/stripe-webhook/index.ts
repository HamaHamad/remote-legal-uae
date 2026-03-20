// supabase/functions/stripe-webhook/index.ts
// Receives Stripe webhook events and processes payments.
//
// Required Supabase secrets:
//   STRIPE_SECRET_KEY         — Stripe secret key
//   STRIPE_WEBHOOK_SECRET     — from Stripe Dashboard → Webhooks → Signing secret
//
// Webhook events handled:
//   checkout.session.completed  → mark case as unlocked, update payment status
//   checkout.session.expired    → update payment status to expired

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'

// Stripe requires raw body for signature verification — no CORS headers needed
// since this endpoint is called by Stripe servers, not browsers.

serve(async (req: Request) => {
  // ── 1. Only accept POST ───────────────────────────────────────
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const stripeKey     = Deno.env.get('STRIPE_SECRET_KEY')
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

  if (!stripeKey || !webhookSecret) {
    console.error('[stripe-webhook] Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET')
    return new Response('Server configuration error', { status: 500 })
  }

  // ── 2. Read raw body (required for signature verification) ────
  const rawBody = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return new Response('Missing stripe-signature header', { status: 400 })
  }

  // ── 3. Init Stripe and verify webhook signature ───────────────
  const stripe = new Stripe(stripeKey, {
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient(),
  })

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[stripe-webhook] Signature verification failed:', msg)
    return new Response(`Webhook signature verification failed: ${msg}`, { status: 400 })
  }

  // ── 4. Init Supabase admin client ─────────────────────────────
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } }
  )

  // ── 5. Handle events ──────────────────────────────────────────
  try {
    switch (event.type) {

      // ── Payment succeeded ──────────────────────────────────────
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        const caseId  = session.metadata?.case_id
        const userId  = session.metadata?.user_id
        const sessionId = session.id

        if (!caseId || !userId) {
          console.error('[stripe-webhook] Missing metadata in session:', sessionId)
          break
        }

        // Mark case as unlocked
        const { error: caseErr } = await supabase
          .from('cases')
          .update({ ai_unlocked: true })
          .eq('id', caseId)

        if (caseErr) {
          console.error('[stripe-webhook] Failed to unlock case:', caseErr.message)
          // Still update payment — don't return error or Stripe will retry
        }

        // Update payment record to 'paid'
        const { error: payErr } = await supabase
          .from('payments')
          .update({
            status:             'paid',
            stripe_payment_intent: typeof session.payment_intent === 'string'
              ? session.payment_intent
              : session.payment_intent?.id || null,
            paid_at: new Date().toISOString(),
          })
          .eq('stripe_session_id', sessionId)

        if (payErr) {
          // Payment record might not exist if insert failed earlier — upsert it
          await supabase.from('payments').upsert({
            user_id:                userId,
            case_id:                caseId,
            stripe_session_id:      sessionId,
            stripe_payment_intent:  typeof session.payment_intent === 'string'
              ? session.payment_intent
              : session.payment_intent?.id || null,
            amount:   session.amount_total || 9900,
            currency: session.currency     || 'aed',
            status:   'paid',
            paid_at:  new Date().toISOString(),
          }, { onConflict: 'stripe_session_id' })
        }

        console.log(`[stripe-webhook] ✅ Case ${caseId} unlocked for user ${userId}`)
        break
      }

      // ── Session expired without payment ───────────────────────
      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session

        await supabase
          .from('payments')
          .update({ status: 'expired' })
          .eq('stripe_session_id', session.id)

        console.log('[stripe-webhook] Session expired:', session.id)
        break
      }

      // ── Payment failed ─────────────────────────────────────────
      case 'payment_intent.payment_failed': {
        const intent = event.data.object as Stripe.PaymentIntent

        // Look up the payment by intent ID if we stored it
        await supabase
          .from('payments')
          .update({ status: 'failed' })
          .eq('stripe_payment_intent', intent.id)

        console.log('[stripe-webhook] Payment failed:', intent.id)
        break
      }

      default:
        console.log('[stripe-webhook] Unhandled event type:', event.type)
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[stripe-webhook] Handler error:', message)
    // Return 200 anyway — if we return non-200 Stripe will keep retrying
    return new Response(JSON.stringify({ received: true, warning: message }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
