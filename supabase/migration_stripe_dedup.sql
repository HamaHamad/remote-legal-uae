-- ============================================================
-- Remote Legal Case Orchestrator (UAE)
-- Stripe Webhook Event Deduplication Migration
--
-- Creates a table to track processed Stripe webhook event IDs so
-- that retries (which Stripe sends if our webhook doesn't return
-- a 200 fast enough, or if there's a network blip) don't double-
-- process payments and unlock cases twice.
--
-- Run AFTER: schema.sql + migration_phase2-7.sql + migration_prod_hardening.sql + migration_phase0_security.sql
-- Safe to re-run (idempotent).
-- ============================================================

-- ─── 1. Create stripe_webhook_events table ──────────────────────
CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  id              text        PRIMARY KEY,             -- Stripe event ID (e.g. 'evt_1AbCdE...')
  type            text        NOT NULL,                -- e.g. 'checkout.session.completed'
  processed_at    timestamptz NOT NULL DEFAULT now(),
  case_id         uuid        REFERENCES public.cases(id) ON DELETE SET NULL,
  session_id      text,                                -- Stripe checkout session ID
  result          text        NOT NULL DEFAULT 'processed',  -- 'processed' | 'skipped' | 'error'
  error_message   text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.stripe_webhook_events IS
  'Deduplication log for Stripe webhook events. Prevents double-processing on retry.';

COMMENT ON COLUMN public.stripe_webhook_events.id IS
  'Stripe event ID — primary key. If a row exists here, the event was already processed.';

COMMENT ON COLUMN public.stripe_webhook_events.result IS
  'processed = action taken (case unlocked, payment updated). skipped = duplicate, no action. error = handler threw.';

-- ─── 2. Indexes ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_processed_at
  ON public.stripe_webhook_events (processed_at DESC);

CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_type
  ON public.stripe_webhook_events (type, processed_at DESC);

-- ─── 3. Enable RLS ──────────────────────────────────────────────
ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;

-- Only the service role (used by the stripe-webhook edge function)
-- can read/write this table. No client access.
REVOKE ALL ON public.stripe_webhook_events FROM anon, authenticated;

-- ─── 4. Retention policy: auto-delete events older than 90 days ─
-- Stripe event IDs are unique forever, but we don't need to keep
-- the log entries indefinitely. 90 days is enough to catch any
-- legitimate retries (Stripe retries for up to 3 days).
-- This is a manual cleanup — run via cron or pg_cron if available:
--
--   SELECT cron.schedule(
--     'cleanup-stripe-webhook-events',
--     '0 3 * * *',  -- daily at 3 AM
--     $$DELETE FROM public.stripe_webhook_events
--        WHERE processed_at < now() - interval '90 days'$$
--   );

-- ─── 5. Verification ────────────────────────────────────────────
-- SELECT * FROM public.stripe_webhook_events LIMIT 5;
-- SELECT count(*) FROM public.stripe_webhook_events;

-- ============================================================
-- DONE — Stripe webhook event deduplication table created.
-- Next step: redeploy the stripe-webhook edge function which
-- now checks this table before processing.
-- ============================================================
