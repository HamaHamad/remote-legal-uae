-- ============================================================
-- Remote Legal Case Orchestrator (UAE)
-- Phase 3 Migration: AI Case Structuring Engine
--
-- Run in Supabase → SQL Editor → New Query
-- Safe to run multiple times (idempotent)
-- ============================================================

-- ─── 1. Add AI result columns to cases ───────────────────────────
ALTER TABLE public.cases
  ADD COLUMN IF NOT EXISTS ai_status         text    DEFAULT 'idle'
      CHECK (ai_status IN ('idle','processing','done','failed')),
  ADD COLUMN IF NOT EXISTS ai_summary        text,
  ADD COLUMN IF NOT EXISTS ai_risk_level     text
      CHECK (ai_risk_level IN ('low','medium','high')),
  ADD COLUMN IF NOT EXISTS ai_estimated_cost text,
  ADD COLUMN IF NOT EXISTS ai_estimated_time text,
  ADD COLUMN IF NOT EXISTS ai_unlocked       boolean DEFAULT false;

-- ─── 2. Create case_steps table ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.case_steps (
  id          uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id     uuid        NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  step_text   text        NOT NULL,
  order_index integer     NOT NULL DEFAULT 1,
  status      text        NOT NULL DEFAULT 'pending'
      CHECK (status IN ('pending','current','done','skipped')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.case_steps IS
  'AI-generated action steps for each legal case';

CREATE INDEX IF NOT EXISTS idx_case_steps_case_id
  ON public.case_steps(case_id);
CREATE INDEX IF NOT EXISTS idx_case_steps_order
  ON public.case_steps(case_id, order_index);

-- ─── 3. Enable RLS on case_steps ──────────────────────────────────
ALTER TABLE public.case_steps ENABLE ROW LEVEL SECURITY;

-- ─── 4. RLS Policies for case_steps ───────────────────────────────
DROP POLICY IF EXISTS "steps_select" ON public.case_steps;
DROP POLICY IF EXISTS "steps_insert" ON public.case_steps;
DROP POLICY IF EXISTS "steps_update" ON public.case_steps;
DROP POLICY IF EXISTS "steps_delete" ON public.case_steps;

-- SELECT: case owner, assigned partner, admin
CREATE POLICY "steps_select"
  ON public.case_steps FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.cases c
      WHERE  c.id = case_id
        AND (
          c.user_id = auth.uid()
          OR public.is_admin()
          OR (public.is_partner() AND c.assigned_to = auth.uid())
        )
    )
  );

-- INSERT / UPDATE / DELETE: service role only (via Edge Function)
-- We use the service role key in the edge function, so no JWT RLS check needed.
-- But we add a fallback admin policy for manual corrections:
CREATE POLICY "steps_insert"
  ON public.case_steps FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "steps_update"
  ON public.case_steps FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "steps_delete"
  ON public.case_steps FOR DELETE
  USING (public.is_admin());

-- ─── 5. Allow service_role to bypass RLS (already default in Supabase) ─
-- This is the default — the Edge Function uses service_role key which
-- bypasses all RLS. No extra config needed.

-- ─── 6. Add index on ai_status for dashboard queries ─────────────
CREATE INDEX IF NOT EXISTS idx_cases_ai_status
  ON public.cases(ai_status);

-- ─── 7. Update cases_with_users view to include AI fields ────────
-- PostgreSQL 17+ requires DROP + CREATE when the column list changes
-- (c.* now includes ai_status, ai_summary, etc. added above).
DROP VIEW IF EXISTS public.cases_with_users;
CREATE VIEW public.cases_with_users AS
  SELECT
    c.*,
    u.email          AS client_email,
    u.full_name      AS client_name,
    p.email          AS partner_email,
    p.full_name      AS partner_name,
    (
      SELECT count(*)::int
      FROM   public.documents d
      WHERE  d.case_id = c.id
    ) AS document_count,
    (
      SELECT count(*)::int
      FROM   public.case_steps s
      WHERE  s.case_id = c.id
    ) AS step_count
  FROM  public.cases   c
  LEFT JOIN public.users u ON u.id = c.user_id
  LEFT JOIN public.users p ON p.id = c.assigned_to;

COMMENT ON VIEW public.cases_with_users IS
  'WARNING: This view bypasses RLS. Admins may query it directly. Clients/partners should use get_cases_with_users() or query the cases table directly.';

-- ─── 8. Verification ──────────────────────────────────────────────
-- SELECT column_name, data_type
-- FROM   information_schema.columns
-- WHERE  table_name = 'cases'
-- ORDER  BY ordinal_position;

-- SELECT * FROM public.case_steps LIMIT 5;

-- ============================================================
-- DONE — Phase 3 migration complete
-- ============================================================
