-- ============================================================
-- Remote Legal Case Orchestrator (UAE)
-- Production Hardening Migration
-- Run in Supabase → SQL Editor → New Query
-- ============================================================

-- ─── 1. Storage bucket security ──────────────────────────────────
-- Set max file size (50MB) and restrict to safe MIME types
-- Run this AFTER creating the case-documents bucket

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'case-documents',
  'case-documents',
  false,
  52428800,  -- 50 MB in bytes
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/heic',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit    = 52428800,
  allowed_mime_types = ARRAY[
    'application/pdf',
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ];

-- ─── 2. Storage RLS Policies ─────────────────────────────────────
-- Users can only upload to their own case folders
-- Admins can access everything

DROP POLICY IF EXISTS "storage_upload_own"   ON storage.objects;
DROP POLICY IF EXISTS "storage_select_own"   ON storage.objects;
DROP POLICY IF EXISTS "storage_delete_own"   ON storage.objects;

-- Upload: user can upload if they own the case this doc belongs to
CREATE POLICY "storage_upload_own"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'case-documents'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR public.is_admin()
    )
  );

-- Select: user can read docs from their own cases or admin
CREATE POLICY "storage_select_own"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'case-documents'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR public.is_admin()
      OR public.is_partner()
    )
  );

-- Delete: only owner or admin
CREATE POLICY "storage_delete_own"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'case-documents'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR public.is_admin()
    )
  );

-- ─── 3. Email queue table ────────────────────────────────────────
-- Logs email events to a queue table, which a cron job or edge
-- function (send-emails) processes.

CREATE TABLE IF NOT EXISTS public.email_queue (
  id          uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  to_email    text        NOT NULL,
  subject     text        NOT NULL,
  body_html   text        NOT NULL,
  body_text   text,
  status      text        NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'failed')),
  error       text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  sent_at     timestamptz
);

ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;

-- Only service role can manage email queue
CREATE POLICY "email_queue_admin"
  ON public.email_queue FOR ALL
  USING (public.is_admin());

-- ─── 4. Centralized site URL ─────────────────────────────────────
-- Instead of hardcoding the production domain in every email trigger,
-- read it from this config table. Change the value when you switch
-- to a custom domain or staging environment:
--   UPDATE app_config SET value='https://your-domain.com' WHERE key='site_url';
CREATE TABLE IF NOT EXISTS public.app_config (
  key   text PRIMARY KEY,
  value text NOT NULL
);

INSERT INTO public.app_config (key, value)
VALUES ('site_url', 'https://expat.legalwakeely.com')
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.site_url()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT value FROM public.app_config WHERE key = 'site_url';
$$;

COMMENT ON FUNCTION public.site_url() IS
  'Returns the configurable site URL. Used by email triggers to build links. Update via: UPDATE app_config SET value=''https://your-domain.com'' WHERE key=''site_url'';';

ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "app_config_admin" ON public.app_config FOR ALL USING (public.is_admin());

-- ─── 5. Auto-email trigger: AI report ready ───────────────────────
CREATE OR REPLACE FUNCTION public.email_on_ai_ready()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  client_email text;
  case_url     text;
BEGIN
  IF NEW.ai_status = 'done' AND OLD.ai_status != 'done' THEN
    SELECT email INTO client_email FROM public.users WHERE id = NEW.user_id;
    case_url := public.site_url() || '/dashboard/cases/' || NEW.id;

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

DROP TRIGGER IF EXISTS email_ai_ready ON public.cases;
CREATE TRIGGER email_ai_ready
  AFTER UPDATE OF ai_status ON public.cases
  FOR EACH ROW EXECUTE FUNCTION public.email_on_ai_ready();

-- ─── 6. Auto-email trigger: Payment successful ────────────────────
CREATE OR REPLACE FUNCTION public.email_on_payment_success()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  client_email text;
  case_url     text;
  amount_aed   text;
BEGIN
  IF NEW.status = 'paid' AND OLD.status != 'paid' THEN
    SELECT u.email INTO client_email
    FROM public.users u
    WHERE u.id = NEW.user_id;

    case_url   := public.site_url() || '/dashboard/cases/' || NEW.case_id;
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

DROP TRIGGER IF EXISTS email_payment_success ON public.payments;
CREATE TRIGGER email_payment_success
  AFTER UPDATE OF status ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.email_on_payment_success();

-- ─── 7. Auto-email trigger: Case assigned to partner ─────────────
CREATE OR REPLACE FUNCTION public.email_on_case_assigned_to_client()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  client_email text;
  case_url     text;
BEGIN
  IF NEW.assigned_to IS NOT NULL AND
     (OLD.assigned_to IS NULL OR OLD.assigned_to != NEW.assigned_to) THEN

    SELECT email INTO client_email FROM public.users WHERE id = NEW.user_id;
    case_url := public.site_url() || '/dashboard/cases/' || NEW.id;

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

DROP TRIGGER IF EXISTS email_case_assigned ON public.cases;
CREATE TRIGGER email_case_assigned
  AFTER UPDATE OF assigned_to ON public.cases
  FOR EACH ROW EXECUTE FUNCTION public.email_on_case_assigned_to_client();

-- ─── 8. Add notification_prefs column to users ───────────────────
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS notification_prefs jsonb DEFAULT '{
    "email_ai_ready": true,
    "email_case_assigned": true,
    "email_payment": true,
    "email_task_update": true,
    "inapp_ai_ready": true,
    "inapp_case_assigned": true,
    "inapp_payment": true,
    "inapp_task_update": true
  }'::jsonb;

COMMENT ON COLUMN public.users.notification_prefs IS
  'User notification preferences — email and in-app toggles';

-- ─── 9. Verification ─────────────────────────────────────────────
-- SELECT * FROM public.email_queue ORDER BY created_at DESC LIMIT 10;
-- SELECT * FROM storage.buckets WHERE id = 'case-documents';
-- SELECT * FROM public.app_config;

-- ============================================================
-- DONE — Production hardening migration complete
-- ============================================================