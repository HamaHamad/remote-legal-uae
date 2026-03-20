-- ============================================================
-- Remote Legal Case Orchestrator — Phase 2 Migration
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ─── 1. Extend case_type enum with new types ─────────────────────
alter type case_type add value if not exists 'banking';
alter type case_type add value if not exists 'car';
alter type case_type add value if not exists 'employment';
alter type case_type add value if not exists 'rental';
alter type case_type add value if not exists 'legal';

-- ─── 2. Add description column to cases ──────────────────────────
alter table public.cases
  add column if not exists description text;

-- ─── 3. Add user_id to documents (who uploaded it) ───────────────
-- user_id already exists from Phase 1 as uploaded_by
-- Add a convenience alias column if needed, or just use uploaded_by
-- We'll add file_size and mime_type if not already present
alter table public.documents
  add column if not exists file_size  bigint;

alter table public.documents
  add column if not exists mime_type  text;

-- ─── 4. Create Supabase Storage bucket ───────────────────────────
-- Run this ONLY if the bucket doesn't already exist.
-- You can also create it via Supabase Dashboard → Storage → New Bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'case-documents',
  'case-documents',
  false,                            -- private bucket
  52428800,                         -- 50 MB per file
  array[
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
on conflict (id) do nothing;

-- ─── 5. Storage RLS Policies ─────────────────────────────────────

-- Allow authenticated users to upload to their own folder
create policy "case_documents_upload"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'case-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow users to read their own documents
create policy "case_documents_read_own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'case-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow admins to read ALL documents
create policy "case_documents_read_admin"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'case-documents'
    and public.is_admin()
  );

-- Allow users to delete their own documents
create policy "case_documents_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'case-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ─── 6. Update documents RLS to allow owner via uploaded_by ──────
-- Drop old policies and recreate cleanly
drop policy if exists "documents_select" on public.documents;
drop policy if exists "documents_insert" on public.documents;
drop policy if exists "documents_delete_admin" on public.documents;

-- Users can see documents they uploaded OR documents on their cases
create policy "documents_select_v2"
  on public.documents for select
  using (
    uploaded_by = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.cases c
      where c.id = documents.case_id
        and (
          c.user_id = auth.uid()
          or (public.is_partner() and c.assigned_to = auth.uid())
        )
    )
  );

-- Users can insert documents to their own cases
create policy "documents_insert_v2"
  on public.documents for insert
  with check (
    uploaded_by = auth.uid()
    and exists (
      select 1 from public.cases c
      where c.id = documents.case_id
        and (c.user_id = auth.uid() or public.is_admin())
    )
  );

-- Owner or admin can delete
create policy "documents_delete_v2"
  on public.documents for delete
  using (
    uploaded_by = auth.uid()
    or public.is_admin()
  );

-- ─── 7. Add index for fast document lookup by case ────────────────
create index if not exists idx_documents_uploaded_by
  on public.documents(uploaded_by);

-- ─── Done ─────────────────────────────────────────────────────────
-- Verify by running:
-- select column_name, data_type from information_schema.columns where table_name = 'cases';
-- select column_name, data_type from information_schema.columns where table_name = 'documents';
-- select * from storage.buckets where id = 'case-documents';
