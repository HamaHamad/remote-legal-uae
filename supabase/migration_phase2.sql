-- ============================================================
-- Remote Legal Case Orchestrator (UAE)
-- Phase 2 Migration: Case Creation + Document Upload
-- 
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ⚠️  Run AFTER the Phase 1 schema.sql
-- ============================================================

-- ─── 1. Extend case_type enum with new UAE-specific types ────────
-- Supabase/PG requires adding enum values one at a time
ALTER TYPE case_type ADD VALUE IF NOT EXISTS 'banking';
ALTER TYPE case_type ADD VALUE IF NOT EXISTS 'car';
ALTER TYPE case_type ADD VALUE IF NOT EXISTS 'employment';
ALTER TYPE case_type ADD VALUE IF NOT EXISTS 'rental';
ALTER TYPE case_type ADD VALUE IF NOT EXISTS 'legal';

-- ─── 2. Add description column to cases (if not present) ────────
ALTER TABLE public.cases
  ADD COLUMN IF NOT EXISTS description text;

-- ─── 3. Add user_id to documents (if not present) ────────────────
-- Already called "uploaded_by" in Phase 1. Add user_id as alias column
-- so queries using either column name work.
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS user_id uuid
    references public.users(id) on delete cascade;

-- Back-fill user_id from uploaded_by for existing rows
UPDATE public.documents
SET    user_id = uploaded_by
WHERE  user_id IS NULL;

-- ─── 4. Add index on documents.user_id ───────────────────────────
CREATE INDEX IF NOT EXISTS idx_documents_user_id
  ON public.documents(user_id);

-- ─── 5. Add file_size column to documents (if not present) ───────
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS file_size bigint;

-- ─── 6. Add mime_type column to documents (if not present) ────────
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS mime_type text;

-- ─── 7. Add storage_path column to documents (if not present) ────
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS storage_path text;

-- ─── 8. Update RLS: documents — allow user to read own uploads ───
-- Drop old policy if it exists, then recreate cleanly
DROP POLICY IF EXISTS "documents_select"        ON public.documents;
DROP POLICY IF EXISTS "documents_select_own"    ON public.documents;
DROP POLICY IF EXISTS "documents_insert"        ON public.documents;
DROP POLICY IF EXISTS "documents_insert_own"    ON public.documents;
DROP POLICY IF EXISTS "documents_delete_admin"  ON public.documents;
DROP POLICY IF EXISTS "documents_delete_own"    ON public.documents;

-- SELECT: owner of the case OR the uploader OR admin
CREATE POLICY "documents_select"
  ON public.documents FOR SELECT
  USING (
    uploaded_by = auth.uid()
    OR user_id = auth.uid()
    OR public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.cases c
      WHERE  c.id = case_id
        AND (
          c.user_id = auth.uid()
          OR (public.is_partner() AND c.assigned_to = auth.uid())
        )
    )
  );

-- INSERT: uploader must be the authenticated user
CREATE POLICY "documents_insert"
  ON public.documents FOR INSERT
  WITH CHECK (
    (uploaded_by = auth.uid() OR user_id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.cases c
      WHERE  c.id = case_id
        AND (c.user_id = auth.uid() OR public.is_admin())
    )
  );

-- DELETE: owner of the document or admin
CREATE POLICY "documents_delete_own"
  ON public.documents FOR DELETE
  USING (uploaded_by = auth.uid() OR user_id = auth.uid() OR public.is_admin());

-- ─── 9. Supabase Storage bucket setup ────────────────────────────
--
-- Run the two blocks below SEPARATELY if you prefer to manage storage
-- via the Supabase Dashboard UI under Storage > New Bucket.
-- Otherwise run them here — they are idempotent (won't fail if already exists).

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'case-documents',
  'case-documents',
  false,   -- PRIVATE bucket — requires signed URL to access
  52428800, -- 50 MB per file
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/heic',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO UPDATE
  SET file_size_limit    = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ─── 10. Storage RLS policies for case-documents bucket ──────────
-- Authenticated users can upload to their own folder
DROP POLICY IF EXISTS "case_documents_upload" ON storage.objects;
CREATE POLICY "case_documents_upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'case-documents'
    AND auth.uid() IS NOT NULL
    -- Path must start with the user's own UUID
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can read their own files; admins can read all
DROP POLICY IF EXISTS "case_documents_read" ON storage.objects;
CREATE POLICY "case_documents_read"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'case-documents'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.is_admin()
    )
  );

-- Users can delete their own files; admins can delete any
DROP POLICY IF EXISTS "case_documents_delete" ON storage.objects;
CREATE POLICY "case_documents_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'case-documents'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.is_admin()
    )
  );

-- ─── 11. Refresh the cases_with_users view ───────────────────────
CREATE OR REPLACE VIEW public.cases_with_users AS
  SELECT
    c.*,
    u.email         AS client_email,
    u.full_name     AS client_name,
    p.email         AS partner_email,
    p.full_name     AS partner_name,
    (
      SELECT count(*)::int
      FROM   public.documents d
      WHERE  d.case_id = c.id
    ) AS document_count
  FROM  public.cases   c
  LEFT JOIN public.users u ON u.id = c.user_id
  LEFT JOIN public.users p ON p.id = c.assigned_to;

-- ─── 12. Verification queries — run to confirm everything is set ──
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE  table_name = 'cases' ORDER BY ordinal_position;

-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE  table_name = 'documents' ORDER BY ordinal_position;

-- SELECT * FROM storage.buckets WHERE id = 'case-documents';

-- ============================================================
-- DONE — Phase 2 migration complete
-- ============================================================
