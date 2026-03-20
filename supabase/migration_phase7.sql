-- ============================================================
-- Remote Legal Case Orchestrator (UAE)
-- Phase 7 Migration: AI Document Intelligence
-- Run in Supabase → SQL Editor → New Query
-- ============================================================

-- ─── 1. Create document_analysis table ───────────────────────────
CREATE TABLE IF NOT EXISTS public.document_analysis (
  id                   uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id          uuid        UNIQUE NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  case_id              uuid        REFERENCES public.cases(id) ON DELETE SET NULL,
  created_by           uuid        REFERENCES public.users(id) ON DELETE SET NULL,

  -- Status tracking
  status               text        NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','processing','done','failed')),
  error_message        text,

  -- Core AI results
  document_type        text,
  summary              text,

  -- Auto-case-builder suggestions
  suggested_case_type  text,
  suggested_description text,

  -- Full structured JSON from AI
  extracted_json       jsonb,

  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.document_analysis IS
  'AI-powered document intelligence results for uploaded files';

COMMENT ON COLUMN public.document_analysis.extracted_json IS
  'Full JSON: document_type, summary, key_entities, financials, obligations, risks, important_clauses, recommended_next_steps';

-- ─── 2. Indexes ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_doc_analysis_document_id ON public.document_analysis(document_id);
CREATE INDEX IF NOT EXISTS idx_doc_analysis_case_id     ON public.document_analysis(case_id);
CREATE INDEX IF NOT EXISTS idx_doc_analysis_status      ON public.document_analysis(status);
CREATE INDEX IF NOT EXISTS idx_doc_analysis_created_by  ON public.document_analysis(created_by);

-- ─── 3. Updated_at trigger ────────────────────────────────────────
CREATE TRIGGER document_analysis_updated_at
  BEFORE UPDATE ON public.document_analysis
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── 4. Enable RLS ───────────────────────────────────────────────
ALTER TABLE public.document_analysis ENABLE ROW LEVEL SECURITY;

-- ─── 5. RLS Policies ─────────────────────────────────────────────
DROP POLICY IF EXISTS "doc_analysis_select" ON public.document_analysis;
DROP POLICY IF EXISTS "doc_analysis_insert" ON public.document_analysis;
DROP POLICY IF EXISTS "doc_analysis_update" ON public.document_analysis;

-- Owner of the document's case OR admin can see analysis
CREATE POLICY "doc_analysis_select"
  ON public.document_analysis FOR SELECT
  USING (
    created_by = auth.uid()
    OR public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.cases c
      WHERE c.id = case_id
        AND (
          c.user_id = auth.uid()
          OR (public.is_partner() AND c.assigned_to = auth.uid())
        )
    )
  );

-- Only admins and the document owner can insert (service role bypasses RLS)
CREATE POLICY "doc_analysis_insert"
  ON public.document_analysis FOR INSERT
  WITH CHECK (created_by = auth.uid() OR public.is_admin());

CREATE POLICY "doc_analysis_update"
  ON public.document_analysis FOR UPDATE
  USING (public.is_admin());

-- ─── 6. Helper function: get analysis for a document ─────────────
CREATE OR REPLACE FUNCTION public.get_document_analysis(p_document_id uuid)
RETURNS TABLE (
  id                  uuid,
  status              text,
  document_type       text,
  summary             text,
  extracted_json      jsonb,
  suggested_case_type text,
  suggested_description text,
  created_at          timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    id, status, document_type, summary, extracted_json,
    suggested_case_type, suggested_description, created_at
  FROM public.document_analysis
  WHERE document_id = p_document_id
$$;

-- ─── 7. View: documents_with_analysis ────────────────────────────
CREATE OR REPLACE VIEW public.documents_with_analysis AS
  SELECT
    d.*,
    da.id             AS analysis_id,
    da.status         AS analysis_status,
    da.document_type  AS ai_document_type,
    da.summary        AS ai_summary,
    da.extracted_json AS ai_data,
    da.suggested_case_type,
    da.suggested_description
  FROM  public.documents      d
  LEFT JOIN public.document_analysis da ON da.document_id = d.id;

-- ─── 8. Verification ─────────────────────────────────────────────
-- SELECT * FROM public.document_analysis LIMIT 5;
-- SELECT * FROM public.documents_with_analysis LIMIT 5;

-- ============================================================
-- DONE — Phase 7 migration complete
-- ============================================================
