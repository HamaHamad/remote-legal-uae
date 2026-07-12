-- ============================================================
-- Remote Legal Case Orchestrator (UAE)
-- Phase 0 Security Migration: CRITICAL privilege-escalation &
-- paywall-bypass fixes. MUST be applied before any production launch.
--
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- Run AFTER: schema.sql + migration_phase2-7.sql + migration_prod_hardening.sql
-- Safe to re-run (fully idempotent — DROP IF EXISTS / CREATE OR REPLACE)
--
-- What this fixes:
--   CRITICAL 1 — Self-service role escalation at signup
--   CRITICAL 2 — Clients can UPDATE their own role to admin
--   CRITICAL 3 — Paywall bypass (clients can UPDATE ai_unlocked)
--   CRITICAL 6 — get_document_analysis() SECURITY DEFINER RLS bypass
--   (Also hardens SECURITY DEFINER functions with SET search_path)
-- ============================================================

-- ─── CRITICAL 1: Replace handle_new_user() so it ignores client-supplied role
-- Old version read `raw_user_meta_data->>'role'` which let anyone sign up
-- as 'admin'. New version hardcodes role := 'client'. Admin/partner roles
-- are granted ONLY via a separate SQL operation by an existing admin.
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role, language)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data ->> 'full_name', ''),
    'client',                                  -- ← hardcoded, ignores client request
    COALESCE(
      NULLIF(new.raw_user_meta_data ->> 'language', ''),
      'en'
    )::app_language
  )
  ON CONFLICT (id) DO UPDATE
    SET email     = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, public.users.full_name);
  RETURN new;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user() IS
  'Auto-create a client profile on signup. Role is hardcoded to ''client'' — admins/partners are promoted via SQL or an admin-only RPC.';

-- Re-attach the trigger (idempotent)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ─── CRITICAL 1b: Admin-only RPC to promote a user's role
-- Replaces the unsafe pattern of writing role from client. Existing
-- admins call this from the admin panel (with their JWT) to grant
-- admin or partner privileges.
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_user_role(p_user_id uuid, p_role user_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Caller must be an admin (RLS-evaluated via auth.uid())
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Permission denied: only admins can change user roles'
      USING ERRCODE = '42501';
  END IF;

  -- Prevent self-demotion lockout: an admin cannot demote themselves
  -- if they are the last remaining admin.
  IF p_user_id = auth.uid() AND p_role != 'admin' THEN
    IF (
      SELECT count(*) FROM public.users
      WHERE role = 'admin' AND is_active = true
    ) <= 1 THEN
      RAISE EXCEPTION 'Cannot demote the last active admin'
        USING ERRCODE = '40001';
    END IF;
  END IF;

  UPDATE public.users
  SET role = p_role
  WHERE id = p_user_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.set_user_role(uuid, user_role) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.set_user_role(uuid, user_role) TO authenticated;


-- ─── CRITICAL 2: Replace users_update_own policy with a column-restricted one
-- The old policy let a client UPDATE any column on their own row,
-- including `role`. PostgreSQL row-level security does NOT do
-- column-level checks by itself — so we split writes:
--   * clients can update: full_name, language, avatar_url, phone,
--     notification_prefs, last_seen_at
--   * role, is_active, email are writable ONLY by admin (via the
--     users_admin_all policy + the set_user_role RPC)
-- We enforce this with a CHECK constraint that compares OLD vs NEW
-- for protected columns.
-- ============================================================
DROP POLICY IF EXISTS "users_update_own"        ON public.users;
DROP POLICY IF EXISTS "users_update_own_safe"   ON public.users;

CREATE POLICY "users_update_own_safe"
  ON public.users FOR UPDATE
  TO authenticated
  USING      (id = auth.uid() OR public.is_admin())
  WITH CHECK (
    id = auth.uid()
    -- Clients cannot touch protected columns
    AND OLD.role         = NEW.role
    AND OLD.email        = NEW.email
    AND OLD.is_active    = NEW.is_active
    AND COALESCE(OLD.created_at, NEW.created_at) = NEW.created_at
    OR public.is_admin()
  );

COMMENT ON POLICY "users_update_own_safe" ON public.users IS
  'Clients may update only profile columns (name, language, avatar, phone, prefs). role/email/is_active/created_at are immutable for non-admins.';


-- ─── CRITICAL 3: Paywall bypass — protect ai_unlocked on cases
-- Old cases_update_client policy let clients UPDATE ai_unlocked (and
-- every other ai_* column) on their own pending cases. The
-- useAI.unlockReport() hook used this directly to bypass payment.
--
-- Fix: split the cases update policy so clients can update only a
-- narrow set of fields (title, description, type, priority) while
-- the ai_* fields are service-role-only (set by the analyze-case and
-- stripe-webhook edge functions, which use the service role key and
-- bypass RLS).
--
-- We enforce this with OLD vs NEW comparison in WITH CHECK.
-- ============================================================
DROP POLICY IF EXISTS "cases_update_client"       ON public.cases;
DROP POLICY IF EXISTS "cases_update_client_safe"  ON public.cases;

CREATE POLICY "cases_update_client_safe"
  ON public.cases FOR UPDATE
  TO authenticated
  USING (
    (user_id = auth.uid() AND status = 'pending')
    OR public.is_admin()
    OR (public.is_partner() AND assigned_to = auth.uid())
  )
  WITH CHECK (
    -- Either admin (any change allowed)
    public.is_admin()
    -- Or partner assigned (status, internal_notes only)
    OR (public.is_partner() AND assigned_to = auth.uid()
        AND OLD.user_id             = NEW.user_id
        AND OLD.assigned_to         = NEW.assigned_to
        AND OLD.ai_status           = NEW.ai_status
        AND OLD.ai_summary          IS NOT DISTINCT FROM NEW.ai_summary
        AND OLD.ai_risk_level       IS NOT DISTINCT FROM NEW.ai_risk_level
        AND OLD.ai_estimated_cost   IS NOT DISTINCT FROM NEW.ai_estimated_cost
        AND OLD.ai_estimated_time   IS NOT DISTINCT FROM NEW.ai_estimated_time
        AND OLD.ai_unlocked         = NEW.ai_unlocked)
    -- Or client on pending case — narrow field set only
    OR (user_id = auth.uid() AND status = 'pending'
        AND OLD.user_id             = NEW.user_id
        AND OLD.assigned_to         IS NOT DISTINCT FROM NEW.assigned_to
        AND OLD.status              = NEW.status
        AND OLD.ai_status           = NEW.ai_status
        AND OLD.ai_summary          IS NOT DISTINCT FROM NEW.ai_summary
        AND OLD.ai_risk_level       IS NOT DISTINCT FROM NEW.ai_risk_level
        AND OLD.ai_estimated_cost   IS NOT DISTINCT FROM NEW.ai_estimated_cost
        AND OLD.ai_estimated_time   IS NOT DISTINCT FROM NEW.ai_estimated_time
        AND OLD.ai_unlocked         = NEW.ai_unlocked
        AND OLD.resolved_at         IS NOT DISTINCT FROM NEW.resolved_at)
  );

COMMENT ON POLICY "cases_update_client_safe" ON public.cases IS
  'Clients may edit only title/description/type/priority on their own PENDING cases. All ai_* and status fields are service-role-only (set by edge functions).';


-- ─── CRITICAL 6: Replace get_document_analysis() so it does NOT bypass RLS
-- Old version was SECURITY DEFINER with no ownership check, so any
-- anon key could call it for ANY document UUID and read the AI-
-- extracted financials, parties, risks. New version is SECURITY
-- INVOKER (runs under the caller''s RLS context) AND has an explicit
-- ownership check inside, so even if RLS is later loosened, the
-- function still refuses to leak data.
-- ============================================================
DROP FUNCTION IF EXISTS public.get_document_analysis(uuid);

CREATE OR REPLACE FUNCTION public.get_document_analysis(p_document_id uuid)
RETURNS TABLE (
  id                     uuid,
  status                 text,
  document_type          text,
  summary                text,
  extracted_json         jsonb,
  suggested_case_type    text,
  suggested_description  text,
  created_at             timestamptz
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    da.id,
    da.status,
    da.document_type,
    da.summary,
    da.extracted_json,
    da.suggested_case_type,
    da.suggested_description,
    da.created_at
  FROM public.document_analysis da
  JOIN public.documents d  ON d.id = da.document_id
  JOIN public.cases       c  ON c.id = da.case_id
  WHERE da.document_id = p_document_id
    -- Explicit ownership check (defense-in-depth, even though RLS
    -- on document_analysis already restricts this).
    AND (
      c.user_id = auth.uid()
      OR public.is_admin()
      OR (public.is_partner() AND c.assigned_to = auth.uid())
      OR da.created_by = auth.uid()
    );
$$;

COMMENT ON FUNCTION public.get_document_analysis(uuid) IS
  'Fetch AI analysis for a document. SECURITY INVOKER + explicit ownership check — caller must own the document''s case or be admin/assigned partner.';


-- ─── HARDENING: Add SET search_path = public to all SECURITY DEFINER
-- functions that were missing it (CVE-2024-7348 pattern). Only the
-- function definition changes — bodies are preserved.
-- ============================================================

-- current_user_role()
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$ SELECT role FROM public.users WHERE id = auth.uid() $$;

-- is_admin()
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
$$;

-- is_partner()
CREATE OR REPLACE FUNCTION public.is_partner()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'partner'
  )
$$;

-- is_case_paid()
CREATE OR REPLACE FUNCTION public.is_case_paid(p_case_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.payments
    WHERE case_id = p_case_id
      AND status  = 'paid'
  )
$$;

-- log_case_status_change()
CREATE OR REPLACE FUNCTION public.log_case_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid;
BEGIN
  -- Prefer auth.uid(); fall back to service role marker for edge-function writes
  v_actor := auth.uid();

  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.case_activities (case_id, actor_id, action, metadata)
    VALUES (
      NEW.id,
      COALESCE(v_actor, NEW.user_id),   -- avoid NOT NULL violation on service-role writes
      'status_changed',
      jsonb_build_object(
        'from', OLD.status,
        'to',   NEW.status,
        'at',   now(),
        'actor_is_service_role', v_actor IS NULL
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

-- notify_on_task_assigned()
CREATE OR REPLACE FUNCTION public.notify_on_task_assigned()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  case_type_val text;
BEGIN
  IF NEW.assigned_to IS NOT NULL AND
     (OLD.assigned_to IS NULL OR OLD.assigned_to IS DISTINCT FROM NEW.assigned_to) THEN
    SELECT type INTO case_type_val FROM public.cases WHERE id = NEW.case_id;
    INSERT INTO public.notifications (user_id, type, title, body, link, metadata)
    VALUES (
      NEW.assigned_to,
      'task_created',
      'New task assigned to you',
      NEW.title,
      '/partner/tasks',
      jsonb_build_object('task_id', NEW.id, 'case_id', NEW.case_id, 'case_type', case_type_val)
    );
  END IF;
  RETURN NEW;
END;
$$;

-- notify_on_ai_ready()
CREATE OR REPLACE FUNCTION public.notify_on_ai_ready()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.ai_status = 'done' AND OLD.ai_status IS DISTINCT FROM NEW.ai_status THEN
    INSERT INTO public.notifications (user_id, type, title, body, link, metadata)
    VALUES (
      NEW.user_id,
      'ai_ready',
      'Your AI case analysis is ready',
      'Unlock your full report to see risk assessment and action steps.',
      '/dashboard/cases/' || NEW.id,
      jsonb_build_object('case_id', NEW.id, 'risk_level', NEW.ai_risk_level)
    );
  END IF;
  RETURN NEW;
END;
$$;

-- notify_on_case_assigned()
CREATE OR REPLACE FUNCTION public.notify_on_case_assigned()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.assigned_to IS NOT NULL AND
     (OLD.assigned_to IS NULL OR OLD.assigned_to IS DISTINCT FROM NEW.assigned_to) THEN
    INSERT INTO public.notifications (user_id, type, title, body, link, metadata)
    VALUES (
      NEW.user_id,
      'case_assigned',
      'A specialist has been assigned to your case',
      'Your case is now being handled by a legal specialist.',
      '/dashboard/cases/' || NEW.id,
      jsonb_build_object('case_id', NEW.id, 'case_type', NEW.type)
    );
  END IF;
  RETURN NEW;
END;
$$;

-- email_on_ai_ready()
CREATE OR REPLACE FUNCTION public.email_on_ai_ready()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  client_email text;
  case_url     text;
BEGIN
  IF NEW.ai_status = 'done' AND OLD.ai_status IS DISTINCT FROM NEW.ai_status THEN
    SELECT email INTO client_email FROM public.users WHERE id = NEW.user_id;
    case_url := 'https://remote-legal-uae.vercel.app/dashboard/cases/' || NEW.id;
    INSERT INTO public.email_queue (to_email, subject, body_html, body_text)
    VALUES (
      client_email,
      '✅ Your AI case analysis is ready — ResolveUAE',
      '<h2>Your AI Analysis is Ready</h2>'
        || '<p>Your ' || NEW.type || ' case has been fully analyzed.</p>'
        || '<p>Risk level: <strong>' || COALESCE(NEW.ai_risk_level, 'Unknown') || '</strong></p>'
        || '<p><a href="' || case_url || '" style="background:#c9992e;color:#000;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">View Your Case</a></p>'
        || '<hr><p style="font-size:12px;color:#666;">This platform provides AI-assisted case organisation only. Not legal advice.</p>',
      'Your AI case analysis is ready. Visit: ' || case_url
    );
  END IF;
  RETURN NEW;
END;
$$;

-- email_on_payment_success()
CREATE OR REPLACE FUNCTION public.email_on_payment_success()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  client_email text;
  case_url     text;
  amount_aed   text;
BEGIN
  IF NEW.status = 'paid' AND OLD.status IS DISTINCT FROM NEW.status THEN
    SELECT u.email INTO client_email
    FROM public.users u
    WHERE u.id = NEW.user_id;
    case_url   := 'https://remote-legal-uae.vercel.app/dashboard/cases/' || NEW.case_id;
    amount_aed := 'AED ' || (NEW.amount::float / 100)::text;
    INSERT INTO public.email_queue (to_email, subject, body_html, body_text)
    VALUES (
      client_email,
      '🔓 Payment confirmed — Your case is now unlocked',
      '<h2>Payment Confirmed</h2>'
        || '<p>Your payment of <strong>' || amount_aed || '</strong> was successful.</p>'
        || '<p>Your full AI case report is now unlocked and ready to view.</p>'
        || '<p><a href="' || case_url || '" style="background:#c9992e;color:#000;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">View Full Report</a></p>'
        || '<hr><p style="font-size:12px;color:#666;">ResolveUAE — Cross-Border Case Resolution</p>',
      'Payment confirmed. View your report: ' || case_url
    );
  END IF;
  RETURN NEW;
END;
$$;

-- email_on_case_assigned_to_client()
CREATE OR REPLACE FUNCTION public.email_on_case_assigned_to_client()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  client_email text;
  case_url     text;
BEGIN
  IF NEW.assigned_to IS NOT NULL AND
     (OLD.assigned_to IS NULL OR OLD.assigned_to IS DISTINCT FROM NEW.assigned_to) THEN
    SELECT email INTO client_email FROM public.users WHERE id = NEW.user_id;
    case_url := 'https://remote-legal-uae.vercel.app/dashboard/cases/' || NEW.id;
    INSERT INTO public.email_queue (to_email, subject, body_html, body_text)
    VALUES (
      client_email,
      '👤 A specialist has been assigned to your case',
      '<h2>Specialist Assigned</h2>'
        || '<p>Good news — a legal specialist has been assigned to your <strong>' || NEW.type || '</strong> case.</p>'
        || '<p>They will review your case and begin working on your resolution plan.</p>'
        || '<p><a href="' || case_url || '" style="background:#c9992e;color:#000;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Track Your Case</a></p>',
      'A specialist has been assigned. Track your case: ' || case_url
    );
  END IF;
  RETURN NEW;
END;
$$;


-- ─── REVOKE excess privileges on email_queue
-- The old policy allowed admins full CRUD which is fine, but service
-- role (used by edge functions) bypasses RLS anyway. Make sure anon
-- has zero access.
-- ============================================================
REVOKE ALL ON public.email_queue FROM anon, authenticated;


-- ─── email_queue: add 'processing' status for atomic claim pattern
-- The new send-emails edge function claims a batch atomically by
-- UPDATE ... WHERE status='pending' → 'processing'. This requires
-- the status CHECK to accept 'processing'.
-- ============================================================
ALTER TABLE public.email_queue
  DROP CONSTRAINT IF EXISTS email_queue_status_check;

ALTER TABLE public.email_queue
  ADD CONSTRAINT email_queue_status_check
  CHECK (status IN ('pending', 'processing', 'sent', 'failed'));

COMMENT ON CONSTRAINT email_queue_status_check ON public.email_queue IS
  'pending → processing (claimed by send-emails) → sent/failed.';


-- ─── email_queue: index on (status, created_at) for fast claiming
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_email_queue_status_created
  ON public.email_queue (status, created_at);


-- ─── AUDIT: log privilege changes
-- Add a comment so future maintainers see what this migration does.
-- ============================================================
COMMENT ON SCHEMA public IS
  'Remote Legal UAE — schema with Phase 0 security hardening applied (handle_new_user role locked down, users_update_own column-restricted, ai_unlocked protected, get_document_analysis made SECURITY INVOKER, all SECURITY DEFINER functions hardened with SET search_path = public).';


-- ─── VERIFICATION QUERIES (uncomment to run)
-- SELECT proname, prosecdef, proconfig FROM pg_proc
--   WHERE proname IN (
--     'handle_new_user','set_user_role','current_user_role','is_admin','is_partner',
--     'is_case_paid','log_case_status_change','notify_on_task_assigned',
--     'notify_on_ai_ready','notify_on_case_assigned','email_on_ai_ready',
--     'email_on_payment_success','email_on_case_assigned_to_client',
--     'get_document_analysis'
--   ) ORDER BY proname;
-- Expected: every row has proconfig = {search_path=public}
-- Expected: get_document_analysis has prosecdef = false (INVOKER)

-- SELECT polname, polcmd, pg_get_expr(polqual, polrelid) AS using_expr,
--        pg_get_expr(polwithcheck, polrelid) AS with_check
--   FROM pg_policy WHERE polrelid = 'public.users'::regclass;
-- Expected: users_update_own_safe (not users_update_own)

-- ============================================================
-- DONE — Phase 0 security migration complete.
-- After running this:
--   1. Re-test signup: confirm new users always get role='client'
--      even if the client sends role='admin'.
--   2. Re-test role update: confirm a client JWT cannot change role.
--   3. Re-test paywall: confirm useAI.unlockReport() (if re-added)
--      is rejected by RLS.
--   4. Re-test get_document_analysis: confirm calling it for a
--      document you don't own returns 0 rows.
-- ============================================================
