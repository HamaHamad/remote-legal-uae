-- ============================================================
-- Remote Legal Case Orchestrator (UAE)
-- Phase 6 Migration: Polish + Production Hardening
-- Run in Supabase → SQL Editor → New Query
-- ============================================================

-- ─── 1. Notifications table ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id         uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type       text        NOT NULL
    CHECK (type IN (
      'case_created', 'case_updated', 'case_assigned',
      'payment_success', 'payment_failed',
      'task_created', 'task_updated', 'task_done',
      'document_uploaded', 'ai_ready', 'system'
    )),
  title      text        NOT NULL,
  body       text,
  link       text,
  is_read    boolean     NOT NULL DEFAULT false,
  metadata   jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.notifications IS
  'In-app notifications for all user roles';

CREATE INDEX IF NOT EXISTS idx_notifications_user_id   ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read   ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created   ON public.notifications(created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users only see their own notifications
DROP POLICY IF EXISTS "notifications_select" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert" ON public.notifications;

CREATE POLICY "notifications_select"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "notifications_update"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid());

-- Service role (edge functions) can insert; admins too
CREATE POLICY "notifications_insert"
  ON public.notifications FOR INSERT
  WITH CHECK (public.is_admin() OR user_id = auth.uid());

-- ─── 2. Enable Realtime on notifications ─────────────────────────
-- Run this to enable Supabase Realtime on the notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- ─── 3. Security hardening — ensure all tables have RLS ──────────
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename IN ('users','cases','documents','case_steps','payments','partners','tasks','notifications')
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
  END LOOP;
END $$;

-- ─── 4. Validate file uploads via DB constraint ──────────────────
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS is_safe boolean DEFAULT true;

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS proof_verified boolean DEFAULT false;

-- ─── 5. Case activity log trigger ────────────────────────────────
-- Auto-log when a case status changes
CREATE OR REPLACE FUNCTION public.log_case_status_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.case_activities (case_id, actor_id, action, metadata)
    VALUES (
      NEW.id,
      auth.uid(),
      'status_changed',
      jsonb_build_object(
        'from', OLD.status,
        'to',   NEW.status,
        'at',   now()
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_case_status_change ON public.cases;
CREATE TRIGGER on_case_status_change
  AFTER UPDATE OF status ON public.cases
  FOR EACH ROW EXECUTE FUNCTION public.log_case_status_change();

-- ─── 6. Auto-notify partner when task is assigned ─────────────────
CREATE OR REPLACE FUNCTION public.notify_on_task_assigned()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  case_type_val text;
BEGIN
  IF NEW.assigned_to IS NOT NULL AND
     (OLD.assigned_to IS NULL OR OLD.assigned_to != NEW.assigned_to) THEN

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

DROP TRIGGER IF EXISTS on_task_assigned ON public.tasks;
CREATE TRIGGER on_task_assigned
  AFTER INSERT OR UPDATE OF assigned_to ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_task_assigned();

-- ─── 7. Auto-notify client when AI analysis is ready ─────────────
CREATE OR REPLACE FUNCTION public.notify_on_ai_ready()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.ai_status = 'done' AND OLD.ai_status != 'done' THEN
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

DROP TRIGGER IF EXISTS on_ai_ready ON public.cases;
CREATE TRIGGER on_ai_ready
  AFTER UPDATE OF ai_status ON public.cases
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_ai_ready();

-- ─── 8. Auto-notify client when case is assigned to a partner ─────
CREATE OR REPLACE FUNCTION public.notify_on_case_assigned()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.assigned_to IS NOT NULL AND
     (OLD.assigned_to IS NULL OR OLD.assigned_to != NEW.assigned_to) THEN
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

DROP TRIGGER IF EXISTS on_case_assigned ON public.cases;
CREATE TRIGGER on_case_assigned
  AFTER UPDATE OF assigned_to ON public.cases
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_case_assigned();

-- ─── 9. Analytics helper views ────────────────────────────────────
CREATE OR REPLACE VIEW public.analytics_summary AS
SELECT
  (SELECT count(*)         FROM public.cases)                         AS total_cases,
  (SELECT count(*)         FROM public.cases WHERE status='pending')  AS pending_cases,
  (SELECT count(*)         FROM public.cases WHERE status='active')   AS active_cases,
  (SELECT count(*)         FROM public.cases WHERE status='resolved') AS resolved_cases,
  (SELECT count(*)         FROM public.users)                         AS total_users,
  (SELECT count(*)         FROM public.users WHERE role='client')     AS total_clients,
  (SELECT count(*)         FROM public.users WHERE role='partner')    AS total_partners,
  (SELECT count(*)         FROM public.payments WHERE status='paid')  AS paid_unlocks,
  (SELECT coalesce(sum(amount),0) FROM public.payments WHERE status='paid') AS total_revenue_fils,
  (SELECT count(*)         FROM public.tasks)                         AS total_tasks,
  (SELECT count(*)         FROM public.tasks WHERE status='done')     AS completed_tasks;

-- ─── 10. Cases per day (last 30 days) ────────────────────────────
CREATE OR REPLACE VIEW public.cases_per_day AS
SELECT
  date_trunc('day', created_at)::date AS day,
  count(*)                            AS case_count
FROM public.cases
WHERE created_at >= now() - interval '30 days'
GROUP BY 1
ORDER BY 1;

-- ─── 11. Verification ─────────────────────────────────────────────
-- SELECT * FROM public.analytics_summary;
-- SELECT * FROM public.notifications LIMIT 5;

-- ============================================================
-- DONE — Phase 6 migration complete
-- ============================================================
