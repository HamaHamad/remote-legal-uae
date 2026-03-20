-- ============================================================
-- Remote Legal Case Orchestrator (UAE)
-- Phase 5 Migration: Admin + Partner System
-- Run in Supabase → SQL Editor → New Query
-- ============================================================

-- ─── 1. Create partners table ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.partners (
  id           uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      uuid        UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  name         text        NOT NULL,
  email        text        NOT NULL,
  specialty    text        NOT NULL DEFAULT 'general',
  bio          text,
  is_active    boolean     NOT NULL DEFAULT true,
  case_count   integer     NOT NULL DEFAULT 0,
  rating       numeric(3,2) DEFAULT 5.00,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.partners IS
  'Legal partner profiles — one per user with role=partner';

CREATE INDEX IF NOT EXISTS idx_partners_user_id   ON public.partners(user_id);
CREATE INDEX IF NOT EXISTS idx_partners_specialty ON public.partners(specialty);
CREATE INDEX IF NOT EXISTS idx_partners_active    ON public.partners(is_active);

CREATE TRIGGER partners_updated_at
  BEFORE UPDATE ON public.partners
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── 2. Create tasks table ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tasks (
  id           uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id      uuid        NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  assigned_to  uuid        REFERENCES public.users(id) ON DELETE SET NULL,
  created_by   uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title        text        NOT NULL,
  notes        text,
  proof_url    text,
  proof_file   text,
  status       text        NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','in_progress','done','rejected')),
  due_date     timestamptz,
  completed_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.tasks IS
  'Tasks assigned by admin to partners for specific cases';

CREATE INDEX IF NOT EXISTS idx_tasks_case_id     ON public.tasks(case_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status      ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at  ON public.tasks(created_at DESC);

CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── 3. Add assigned_to to cases (if not already there) ──────────
ALTER TABLE public.cases
  ADD COLUMN IF NOT EXISTS assigned_to uuid
    REFERENCES public.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_cases_assigned_to
  ON public.cases(assigned_to);

-- ─── 4. Enable RLS ───────────────────────────────────────────────
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks    ENABLE ROW LEVEL SECURITY;

-- ─── 5. RLS: partners ────────────────────────────────────────────
DROP POLICY IF EXISTS "partners_select" ON public.partners;
DROP POLICY IF EXISTS "partners_insert" ON public.partners;
DROP POLICY IF EXISTS "partners_update" ON public.partners;

-- Anyone authenticated can see partner list (for assignment dropdown)
CREATE POLICY "partners_select"
  ON public.partners FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Only admins can create/modify partners
CREATE POLICY "partners_insert"
  ON public.partners FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "partners_update"
  ON public.partners FOR UPDATE
  USING (public.is_admin() OR user_id = auth.uid());

-- ─── 6. RLS: tasks ───────────────────────────────────────────────
DROP POLICY IF EXISTS "tasks_select" ON public.tasks;
DROP POLICY IF EXISTS "tasks_insert" ON public.tasks;
DROP POLICY IF EXISTS "tasks_update" ON public.tasks;
DROP POLICY IF EXISTS "tasks_delete" ON public.tasks;

-- Admin sees all; partner sees their assigned tasks; client sees tasks on their cases
CREATE POLICY "tasks_select"
  ON public.tasks FOR SELECT
  USING (
    public.is_admin()
    OR assigned_to = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.cases c
      WHERE c.id = case_id AND c.user_id = auth.uid()
    )
  );

-- Only admins can create tasks
CREATE POLICY "tasks_insert"
  ON public.tasks FOR INSERT
  WITH CHECK (public.is_admin());

-- Admins can update anything; partners can update their own tasks (status + proof)
CREATE POLICY "tasks_update"
  ON public.tasks FOR UPDATE
  USING (public.is_admin() OR assigned_to = auth.uid());

-- Only admins can delete
CREATE POLICY "tasks_delete"
  ON public.tasks FOR DELETE
  USING (public.is_admin());

-- ─── 7. Add RLS policy so admins can see all cases ───────────────
DROP POLICY IF EXISTS "cases_admin_all" ON public.cases;
CREATE POLICY "cases_admin_all"
  ON public.cases FOR ALL
  USING (public.is_admin());

-- ─── 8. Add RLS policy so admins can see all users ───────────────
DROP POLICY IF EXISTS "users_admin_all" ON public.users;
CREATE POLICY "users_admin_all"
  ON public.users FOR ALL
  USING (public.is_admin());

-- ─── 9. Seed partner specialties (reference) ─────────────────────
-- These are the specialty options available in the UI:
-- 'visa' | 'employment' | 'banking' | 'rental' | 'legal' | 'car' | 'general'

-- ─── 10. View: tasks with full detail ────────────────────────────
CREATE OR REPLACE VIEW public.tasks_detail AS
  SELECT
    t.*,
    c.type        AS case_type,
    c.status      AS case_status,
    c.user_id     AS client_id,
    u.email       AS assigned_email,
    u.full_name   AS assigned_name,
    cu.email      AS client_email
  FROM  public.tasks t
  JOIN  public.cases c  ON c.id = t.case_id
  LEFT JOIN public.users u  ON u.id = t.assigned_to
  LEFT JOIN public.users cu ON cu.id = c.user_id;

-- ─── 11. Verification ────────────────────────────────────────────
-- SELECT * FROM public.partners;
-- SELECT * FROM public.tasks;
-- SELECT * FROM public.tasks_detail LIMIT 5;

-- ============================================================
-- DONE — Phase 5 migration complete
-- ============================================================
