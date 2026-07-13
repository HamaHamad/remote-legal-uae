// supabase/functions/stripe-webhook/index.ts
// Receives Stripe webhook events and processes payments.
//
// Phase 0 notes:
//   - This endpoint MUST be deployed with verify_jwt = false in
//     supabase/config.toml, because Stripe can't send a Supabase JWT.
//     Signature verification (via STRIPE_WEBHOOK_SECRET) is the
//     authentication mechanism instead.
//   - No CORS headers needed — Stripe servers don't enforce CORS.
//   - Returns 200 even on internal errors to prevent Stripe retry
//     storms (errors are logged server-side).
//
// Deduplication:
//   - Stripe retries webhook events if we don't return a 200 within
//     ~5 seconds, or if there's a network blip. Without dedup, a
//     retried `checkout.session.completed` would unlock the case
//     twice (the second unlock is harmless but wasteful) and create
//     duplicate payment records.
//   - We now check the `stripe_webhook_events` table BEFORE processing.
//     If the event ID already exists, we skip and return 200.
//     After processing, we insert the event ID so future retries are
//     caught.
//
// Required Supabase secrets:
//   STRIPE_SECRET_KEY         — Stripe secret key
//   STRIPE_WEBHOOK_SECRET     — from Stripe Dashboard → Webhooks → Signing secret
//   SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY
//
// Webhook events handled:
//   checkout.session.completed  → mark case as unlocked, update payment status
//   checkout.session.expired    → update payment status to expired
//   payment_intent.payment_failed → update payment status to failed

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'
import { createAdminClient } from '../_shared/auth.ts'

/**
 * Check if a Stripe event has already been processed.
 * Returns the existing record if found, null otherwise.
 */
async function checkEventProcessed(
  supabase: ReturnType<typeof createAdminClient>,
  eventId: string,
): Promise<{ result: string } | null> {
  const { data, error } = await supabase
    .from('stripe_webhook_events')
    .select('result')
    .eq('id', eventId)
    .maybeSingle()

  if (error) {
    console.error('[stripe-webhook] Dedup check error:', error.message)
    // On error, proceed with processing — better to risk a duplicate
    // than to skip a legitimate payment.
    return null
  }
  return data
}

/**
 * Record a processed event in the dedup table.
 * Uses ON CONFLICT DO NOTHING so concurrent retries don't fail.
 */
async function recordEventProcessed(
  supabase: ReturnType<typeof createAdminClient>,
  eventId: string,
  eventType: string,
  details: { case_id?: string; session_id?: string; result: string; error_message?: string },
): Promise<void> {
  const { error } = await supabase.from('stripe_webhook_events').upsert(
    {
      id: eventId,
      type: eventType,
      case_id: details.case_id || null,
      session_id: details.session_id || null,
      result: details.result,
      error_message: details.error_message || null,
    },
    { onConflict: 'id', ignoreDuplicates: true },
  )

  if (error) {
    // Non-fatal — log but don't fail the webhook
    console.error('[stripe-webhook] Failed to record event:', error.message)
  }
}

serve(async (req: Request) => {
  // ── 1. Only accept POST ───────────────────────────────────────
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: { Allow: 'POST' } })
  }

  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
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
    // Don't leak the underlying crypto detail to the caller
    return new Response('Webhook signature verification failed', { status: 400 })
  }

  // ── 4. Init Supabase admin client ─────────────────────────────
  const supabase = createAdminClient()

  // ── 5. Deduplication check ────────────────────────────────────
  // If we've already processed this event ID, skip and return 200.
  // Stripe retries events for up to 3 days; without this check, a
  // retry would re-run the unlock + payment update.
  const existingEvent = await checkEventProcessed(supabase, event.id)
  if (existingEvent) {
    console.log(
      `[stripe-webhook] Skipping duplicate event ${event.id} (type=${event.type}, previous result=${existingEvent.result})`,
    )
    return new Response(JSON.stringify({ received: true, duplicate: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // ── 6. Handle events ──────────────────────────────────────────
  let processingResult: 'processed' | 'error' = 'processed'
  let errorMessage: string | undefined
  let processedCaseId: string | undefined
  let processedSessionId: string | undefined

  try {
    switch (event.type) {
      // ── Payment succeeded ──────────────────────────────────────
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        const caseId = session.metadata?.case_id
        const userId = session.metadata?.user_id
        const sessionId = session.id
        processedSessionId = sessionId
        processedCaseId = caseId

        if (!caseId || !userId) {
          console.error('[stripe-webhook] Missing metadata in session:', sessionId)
          break
        }

        // Defense-in-depth: confirm the payment's user_id matches the
        // case's owner before unlocking. Prevents a forged metadata
        // from unlocking someone else's case.
        const { data: caseRow } = await supabase
          .from('cases')
          .select('user_id, ai_unlocked')
          .eq('id', caseId)
          .single()

        if (!caseRow) {
          console.error('[stripe-webhook] Case not found:', caseId)
          break
        }
        if (caseRow.user_id !== userId) {
          console.error(
            `[stripe-webhook] Metadata user_id (${userId}) does not match case owner (${caseRow.user_id}) for case ${caseId}. Refusing to unlock.`,
          )
          break
        }
        if (caseRow.ai_unlocked) {
          console.log('[stripe-webhook] Case already unlocked:', caseId)
          // Still update payment status below
        } else {
          const { error: caseErr } = await supabase
            .from('cases')
            .update({ ai_unlocked: true })
            .eq('id', caseId)

          if (caseErr) {
            console.error('[stripe-webhook] Failed to unlock case:', caseErr.message)
            processingResult = 'error'
            errorMessage = `Unlock failed: ${caseErr.message}`
            // Still update payment — don't return error or Stripe will retry
          }
        }

        // Update payment record to 'paid'
        const paymentIntent =
          typeof session.payment_intent === 'string'
            ? session.payment_intent
            : session.payment_intent?.id || null

        const { error: payErr } = await supabase
          .from('payments')
          .update({
            status: 'paid',
            stripe_payment_intent: paymentIntent,
            paid_at: new Date().toISOString(),
          })
          .eq('stripe_session_id', sessionId)

        if (payErr) {
          // Payment record might not exist if insert failed earlier — upsert it
          const { error: upsertErr } = await supabase.from('payments').upsert(
            {
              user_id: userId,
              case_id: caseId,
              stripe_session_id: sessionId,
              stripe_payment_intent: paymentIntent,
              amount: session.amount_total || 9900,
              currency: session.currency || 'aed',
              status: 'paid',
              paid_at: new Date().toISOString(),
            },
            { onConflict: 'stripe_session_id' },
          )
          if (upsertErr) {
            console.error('[stripe-webhook] Payment upsert failed:', upsertErr.message)
            processingResult = 'error'
            errorMessage = `Payment update failed: ${upsertErr.message}`
          }
        }

        console.log(`[stripe-webhook] ✅ Case ${caseId} unlocked for user ${userId}`)
        break
      }

      // ── Session expired without payment ───────────────────────
      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session
        processedSessionId = session.id
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

    // ── 7. Record the event as processed (for dedup) ─────────────
    await recordEventProcessed(supabase, event.id, event.type, {
      case_id: processedCaseId,
      session_id: processedSessionId,
      result: processingResult,
      error_message: errorMessage,
    })

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[stripe-webhook] Handler error:', message)

    // Record the error so retries are still deduped (we don't want
    // Stripe to keep retrying an event that always fails)
    await recordEventProcessed(supabase, event.id, event.type, {
      case_id: processedCaseId,
      session_id: processedSessionId,
      result: 'error',
      error_message: message,
    })

    // Return 200 anyway — if we return non-200 Stripe will keep retrying
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
