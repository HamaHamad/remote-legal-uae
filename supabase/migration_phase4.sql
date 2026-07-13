-- ============================================================
-- Remote Legal Case Orchestrator (UAE)
-- Phase 4 Migration: Stripe Payments
--
-- Run in Supabase → SQL Editor → New Query
-- ============================================================

-- ─── 1. Create payments table ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.payments (
  id                      uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                 uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  case_id                 uuid        NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  stripe_session_id       text        UNIQUE,
  stripe_payment_intent   text,
  amount                  integer     NOT NULL DEFAULT 9900,  -- in fils (AED 99.00)
  currency                text        NOT NULL DEFAULT 'aed',
  status                  text        NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','paid','failed','expired','refunded')),
  paid_at                 timestamptz,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.payments IS
  'Stripe payment records for AI report unlocks';
COMMENT ON COLUMN public.payments.amount IS
  'Amount in smallest currency unit (fils for AED). 9900 = AED 99.00';

-- ─── 2. Indexes ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_payments_user_id   ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_case_id   ON public.payments(case_id);
CREATE INDEX IF NOT EXISTS idx_payments_status    ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_session   ON public.payments(stripe_session_id);

-- ─── 3. Updated_at trigger ────────────────────────────────────────
CREATE TRIGGER payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── 4. Enable RLS ───────────────────────────────────────────────
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- ─── 5. RLS Policies ─────────────────────────────────────────────
DROP POLICY IF EXISTS "payments_select_own"   ON public.payments;
DROP POLICY IF EXISTS "payments_insert_own"   ON public.payments;
DROP POLICY IF EXISTS "payments_admin_all"    ON public.payments;

-- Users can see their own payments
CREATE POLICY "payments_select_own"
  ON public.payments FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());

-- Users can insert their own payment records (service role bypasses this)
CREATE POLICY "payments_insert_own"
  ON public.payments FOR INSERT
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- Admins can do everything
CREATE POLICY "payments_admin_all"
  ON public.payments FOR ALL
  USING (public.is_admin());

-- ─── 6. Useful view for payment history ──────────────────────────
CREATE OR REPLACE VIEW public.payment_history AS
  SELECT
    p.*,
    c.type  AS case_type,
    c.status AS case_status,
    u.email AS user_email
  FROM  public.payments p
  JOIN  public.cases    c ON c.id = p.case_id
  JOIN  public.users    u ON u.id = p.user_id;

-- ─── 7. Helper function: check if a case is paid ─────────────────
CREATE OR REPLACE FUNCTION public.is_case_paid(p_case_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.payments
    WHERE  case_id = p_case_id
      AND  status  = 'paid'
  );
$$;

-- ─── 8. Verification ─────────────────────────────────────────────
-- SELECT * FROM public.payments LIMIT 5;
-- SELECT public.is_case_paid('your-case-uuid-here');

-- ============================================================
-- DONE — Phase 4 migration complete
-- ============================================================
