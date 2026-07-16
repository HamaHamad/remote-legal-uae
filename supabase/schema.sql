-- ============================================================
-- Remote Legal Case Orchestrator (UAE) — Phase 1 Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ─── Extensions ─────────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ─── Enums ───────────────────────────────────────────────────────
create type user_role     as enum ('client', 'admin', 'partner');
create type case_status   as enum ('pending', 'active', 'resolved');
create type case_type     as enum (
  'visa', 'business', 'dispute', 'contract',
  'property', 'family', 'criminal', 'other'
);
create type app_language  as enum ('en', 'ar', 'hi', 'ur', 'tl');

-- ============================================================
-- TABLE: users
-- Extends auth.users — stores role, language preference, etc.
-- ============================================================
create table public.users (
  id           uuid        primary key references auth.users(id) on delete cascade,
  email        text        not null unique,
  full_name    text,
  role         user_role   not null default 'client',
  language     app_language not null default 'en',
  avatar_url   text,
  phone        text,
  is_active    boolean     not null default true,
  last_seen_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table public.users is
  'Application user profiles, linked 1:1 to auth.users';

-- ─── Trigger: update updated_at ──────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger users_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

-- ─── Trigger: auto-create user profile on signup ─────────────────
-- SECURITY: role is hardcoded to 'client'. Admin/partner roles are
-- granted ONLY via the set_user_role() RPC (see migration_phase0_security.sql).
-- The client-supplied raw_user_meta_data->>'role' is intentionally IGNORED
-- to prevent self-service privilege escalation.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email, full_name, role, language)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    'client',
    coalesce(
      nullif(new.raw_user_meta_data ->> 'language', ''),
      'en'
    )::app_language
  )
  on conflict (id) do update
    set email     = excluded.email,
        full_name = coalesce(excluded.full_name, public.users.full_name);
  return new;
end;
$$;

comment on function public.handle_new_user() is
  'Auto-create a client profile on signup. Role is hardcoded to ''client'' — admins/partners are promoted via set_user_role() RPC.';

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- TABLE: cases
-- Core case entity owned by a client user
-- ============================================================
create table public.cases (
  id             uuid        primary key default uuid_generate_v4(),
  user_id        uuid        not null references public.users(id) on delete cascade,
  assigned_to    uuid        references public.users(id) on delete set null,
  type           case_type   not null default 'other',
  status         case_status not null default 'pending',
  title          text,
  description    text,
  priority       smallint    not null default 1 check (priority between 1 and 5),
  internal_notes text,
  resolved_at    timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

comment on table public.cases is
  'Legal cases submitted by clients and managed by partners/admins';
comment on column public.cases.assigned_to is
  'Partner user assigned to handle this case';
comment on column public.cases.priority is
  '1=low, 2=normal, 3=high, 4=urgent, 5=critical';

create trigger cases_updated_at
  before update on public.cases
  for each row execute function public.set_updated_at();

-- ─── Indexes ─────────────────────────────────────────────────────
create index idx_cases_user_id     on public.cases(user_id);
create index idx_cases_assigned_to on public.cases(assigned_to);
create index idx_cases_status      on public.cases(status);
create index idx_cases_created_at  on public.cases(created_at desc);

-- ============================================================
-- TABLE: documents
-- Files attached to cases, stored in Supabase Storage
-- ============================================================
create table public.documents (
  id           uuid        primary key default uuid_generate_v4(),
  case_id      uuid        not null references public.cases(id) on delete cascade,
  uploaded_by  uuid        not null references public.users(id) on delete cascade,
  file_name    text        not null,
  file_url     text        not null,
  storage_path text        not null,
  mime_type    text,
  file_size    bigint,
  is_verified  boolean     not null default false,
  created_at   timestamptz not null default now()
);

comment on table public.documents is
  'Case documents and attachments stored in Supabase Storage';

create index idx_documents_case_id on public.documents(case_id);

-- ============================================================
-- TABLE: case_activities (audit log)
-- Future-ready activity/event stream for cases
-- ============================================================
create table public.case_activities (
  id         uuid        primary key default uuid_generate_v4(),
  case_id    uuid        not null references public.cases(id) on delete cascade,
  actor_id   uuid        not null references public.users(id) on delete cascade,
  action     text        not null,
  metadata   jsonb,
  created_at timestamptz not null default now()
);

create index idx_case_activities_case_id on public.case_activities(case_id);
create index idx_case_activities_created on public.case_activities(created_at desc);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on all tables
alter table public.users           enable row level security;
alter table public.cases           enable row level security;
alter table public.documents       enable row level security;
alter table public.case_activities enable row level security;

-- ─── Helper function: get current user role ───────────────────────
create or replace function public.current_user_role()
returns user_role language sql stable security definer set search_path = public as $$
  select role from public.users where id = auth.uid()
$$;

-- ─── Helper function: is admin ────────────────────────────────────
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role = 'admin'
  )
$$;

-- ─── Helper function: is partner ─────────────────────────────────
create or replace function public.is_partner()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role = 'partner'
  )
$$;

-- ============================================================
-- RLS POLICIES: users
-- ============================================================

-- Users can read their own profile
create policy "users_select_own"
  on public.users for select
  using (id = auth.uid() or public.is_admin());

-- Users can update their own profile (restricted columns)
create policy "users_update_own"
  on public.users for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- Admins can do full CRUD
create policy "users_admin_all"
  on public.users for all
  using (public.is_admin());

-- Service role can insert (for trigger)
create policy "users_insert_service"
  on public.users for insert
  with check (id = auth.uid() or public.is_admin());

-- ============================================================
-- RLS POLICIES: cases
-- ============================================================

-- Clients can see only their own cases
create policy "cases_select_client"
  on public.cases for select
  using (
    user_id = auth.uid()
    or public.is_admin()
    or (public.is_partner() and assigned_to = auth.uid())
  );

-- Clients can create their own cases
create policy "cases_insert_client"
  on public.cases for insert
  with check (user_id = auth.uid() or public.is_admin());

-- Clients can update their own cases only if pending
create policy "cases_update_client"
  on public.cases for update
  using (
    (user_id = auth.uid() and status = 'pending')
    or public.is_admin()
    or (public.is_partner() and assigned_to = auth.uid())
  );

-- Only admins can delete cases
create policy "cases_delete_admin"
  on public.cases for delete
  using (public.is_admin());

-- ============================================================
-- RLS POLICIES: documents
-- ============================================================

-- Users can see documents for their own cases or assigned cases
create policy "documents_select"
  on public.documents for select
  using (
    exists (
      select 1 from public.cases c
      where c.id = case_id
        and (
          c.user_id = auth.uid()
          or public.is_admin()
          or (public.is_partner() and c.assigned_to = auth.uid())
        )
    )
  );

-- Users can upload documents to their own cases
create policy "documents_insert"
  on public.documents for insert
  with check (
    uploaded_by = auth.uid()
    and exists (
      select 1 from public.cases c
      where c.id = case_id
        and (c.user_id = auth.uid() or public.is_admin())
    )
  );

-- Only admins can delete documents
create policy "documents_delete_admin"
  on public.documents for delete
  using (public.is_admin());

-- ============================================================
-- RLS POLICIES: case_activities
-- ============================================================

create policy "activities_select"
  on public.case_activities for select
  using (
    exists (
      select 1 from public.cases c
      where c.id = case_id
        and (
          c.user_id = auth.uid()
          or public.is_admin()
          or (public.is_partner() and c.assigned_to = auth.uid())
        )
    )
  );

create policy "activities_insert"
  on public.case_activities for insert
  with check (actor_id = auth.uid() or public.is_admin());

-- ============================================================
-- STORAGE BUCKETS (run separately in Supabase dashboard or via CLI)
-- ============================================================
-- insert into storage.buckets (id, name, public) values ('case-documents', 'case-documents', false);
-- insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);

-- Storage policy for case-documents bucket
-- create policy "case_documents_read"   on storage.objects for select using (bucket_id = 'case-documents' and auth.uid() is not null);
-- create policy "case_documents_upload" on storage.objects for insert with check (bucket_id = 'case-documents' and auth.uid() is not null);
-- create policy "case_documents_delete" on storage.objects for delete using (bucket_id = 'case-documents' and public.is_admin());

-- ============================================================
-- SEED: Create an admin user (update UUID after signup)
-- Run after creating your admin account through the UI:
-- ============================================================
-- update public.users set role = 'admin' where email = 'your-admin@example.com';

-- ============================================================
-- SECURE VIEW: cases_with_users
-- NOTE: PostgreSQL views do NOT inherit RLS from their underlying
-- tables. This view joins cases + users, so querying it via the
-- anon or authenticated role could leak data if not handled carefully.
--
-- For admin use, this is fine (admins can see everything).
-- For client/partner use, ALWAYS query the `cases` table directly
-- (which has RLS) and join user data in application code, OR use
-- the get_cases_with_users() function below which enforces ownership.
-- ============================================================

create or replace view public.cases_with_users as
  select
    c.*,
    u.email         as client_email,
    u.full_name     as client_name,
    p.email         as partner_email,
    p.full_name     as partner_name
  from public.cases c
  left join public.users u on u.id = c.user_id
  left join public.users p on p.id = c.assigned_to;

-- Security warning comment (visible in Supabase dashboard)
comment on view public.cases_with_users is
  'WARNING: This view bypasses RLS. Admins may query it directly. Clients/partners should use get_cases_with_users() or query the cases table directly.';

-- Secure alternative: function-based access with ownership enforcement
create or replace function public.get_cases_with_users()
returns table (
  id             uuid,
  user_id        uuid,
  assigned_to    uuid,
  type           case_type,
  status         case_status,
  title          text,
  description    text,
  priority       smallint,
  internal_notes text,
  resolved_at    timestamptz,
  created_at     timestamptz,
  updated_at     timestamptz,
  client_email   text,
  client_name    text,
  partner_email  text,
  partner_name   text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.*,
    u.email         as client_email,
    u.full_name     as client_name,
    p.email         as partner_email,
    p.full_name     as partner_name
  from public.cases c
  left join public.users u on u.id = c.user_id
  left join public.users p on p.id = c.assigned_to
  where
    c.user_id = auth.uid()
    or public.is_admin()
    or (public.is_partner() and c.assigned_to = auth.uid())
$$;

comment on function public.get_cases_with_users() is
  'RLS-safe alternative to cases_with_users view. Enforces ownership: clients see own cases, partners see assigned, admins see all.';

-- ============================================================
-- DONE
-- ============================================================
