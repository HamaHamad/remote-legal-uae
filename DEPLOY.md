# 🚀 Remote Legal Case Orchestrator — Production Deployment Guide

## Prerequisites

- Supabase account (free tier is fine to start)
- Vercel account (free tier)
- Stripe account (free to create, test mode available)
- OpenAI API account
- GitHub account + GitHub Desktop installed

---

## Step 1 — Run ALL SQL Migrations

In **Supabase → SQL Editor**, run each file in order:

```
supabase/schema.sql               ← Phase 1: Core tables
supabase/migration_phase2.sql     ← Phase 2: Case types + Storage
supabase/migration_phase3.sql     ← Phase 3: AI columns + case_steps
supabase/migration_phase4.sql     ← Phase 4: Payments table
supabase/migration_phase5.sql     ← Phase 5: Partners + Tasks
supabase/migration_phase6.sql     ← Phase 6: Notifications + Analytics
```

> Run them **one at a time**, waiting for "Success" before the next.
> For ALTER TYPE statements, run each line separately if needed.

---

## Step 2 — Configure Supabase

### Authentication Settings

1. **Supabase → Authentication → Providers → Email**
   - Confirm email: **OFF** (or ON if you want email verification)
   - Minimum password length: **6**
   - Password strength: **None**

2. **Supabase → Authentication → URL Configuration**
   - Site URL: `https://your-domain.vercel.app`
   - Redirect URLs: `https://your-domain.vercel.app/**`
   - Also add: `http://localhost:5173/**`

### Storage Buckets

1. **Supabase → Storage** — verify `case-documents` bucket exists
   - If not: create it, set to **Private**

### Create Your Admin Account

1. Sign up at your live site
2. Run in SQL Editor:

```sql
INSERT INTO public.users (id, email, role, language)
SELECT id, email, 'admin', 'en'
FROM auth.users WHERE email = 'your@email.com'
ON CONFLICT (id) DO UPDATE SET role = 'admin';
```

---

## Step 3 — Deploy Supabase Edge Functions

In **Supabase → Edge Functions → Create new function**, deploy 3 functions:

| Function name     | File                                          |
| ----------------- | --------------------------------------------- |
| `analyze-case`    | `supabase/functions/analyze-case/index.ts`    |
| `create-checkout` | `supabase/functions/create-checkout/index.ts` |
| `stripe-webhook`  | `supabase/functions/stripe-webhook/index.ts`  |

For each: paste the code → rename → click **Deploy function**

### Add Secrets (Supabase → Edge Functions → Secrets)

| Secret name             | Where to find it                                      |
| ----------------------- | ----------------------------------------------------- |
| `OPENAI_API_KEY`        | platform.openai.com → API keys                        |
| `STRIPE_SECRET_KEY`     | Stripe Dashboard → Developers → API Keys → Secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard → Webhooks → (see step below)        |

---

## Step 4 — Configure Stripe

### Create Webhook Endpoint

1. **Stripe Dashboard → Developers → Webhooks → Add endpoint**
2. Endpoint URL:

   ```
   https://YOUR_PROJECT_REF.supabase.co/functions/v1/stripe-webhook
   ```

   Find your project ref in: Supabase → Project Settings → General → Reference ID

3. Select events:
   - `checkout.session.completed`
   - `checkout.session.expired`
   - `payment_intent.payment_failed`

4. Click **Add endpoint** → copy **Signing secret** → add as `STRIPE_WEBHOOK_SECRET`

---

## Step 5 — Deploy to Vercel

### Push to GitHub

1. Open **GitHub Desktop** → your project folder
2. Commit all changes
3. Push to main

### Import to Vercel

1. [vercel.com/new](https://vercel.com/new) → Import your GitHub repo
2. Framework: **Vite** (auto-detected)
3. **Add Environment Variables:**

| Variable                      | Value                          |
| ----------------------------- | ------------------------------ |
| `VITE_SUPABASE_URL`           | `https://xxxx.supabase.co`     |
| `VITE_SUPABASE_ANON_KEY`      | `eyJ...` (anon/public key)     |
| `VITE_STRIPE_PUBLISHABLE_KEY` | `pk_test_...` or `pk_live_...` |

4. Click **Deploy**

---

## Step 6 — Enable Realtime (for notifications)

In **Supabase → Database → Replication**:

- Find `notifications` table → enable **INSERT** replication

Or run in SQL Editor:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
```

---

## Architecture Overview

```
Browser (React + Vite)
    │
    ├── Supabase Auth (login/signup/session)
    ├── Supabase DB (cases, users, tasks, etc.) — RLS enforced
    ├── Supabase Storage (case documents, proofs)
    ├── Supabase Realtime (notifications)
    │
    └── Supabase Edge Functions (Deno)
            ├── analyze-case  → OpenAI GPT-4o-mini
            ├── create-checkout → Stripe Checkout
            └── stripe-webhook → handles payment events
```

---

## Security Checklist

- [x] All tables have RLS enabled
- [x] Users can only see their own data (cases, documents, notifications)
- [x] Admins have elevated access via `is_admin()` function
- [x] Partners see only assigned cases/tasks
- [x] Stripe secret key never in frontend code (Edge Function only)
- [x] OpenAI key never in frontend code (Edge Function only)
- [x] File uploads validated by MIME type + size in Supabase bucket policy
- [x] Auth sessions auto-refresh via Supabase client
- [x] Legal disclaimer shown on all pages

---

## Performance

- [x] Lazy-loaded pages (React.lazy + Suspense) — each page is a separate JS chunk
- [x] Supabase queries use `.limit()` to avoid unbounded fetches
- [x] Parallel queries with `Promise.all()` in admin/partner hooks
- [x] Code split: vendor-react, vendor-supabase, vendor-i18n, vendor-ui all separated
- [x] Tailwind CSS purged in production (only used classes included)

---

## Going Live Checklist

Before switching to Stripe live mode:

- [ ] Test full case creation → AI analysis → payment → unlock flow
- [ ] Test email confirmation flow (if enabled)
- [ ] Test partner assignment and task upload
- [ ] Check all 5 languages render correctly
- [ ] Verify Arabic/Urdu RTL layout
- [ ] Switch `STRIPE_SECRET_KEY` from `sk_test_` to `sk_live_`
- [ ] Switch `VITE_STRIPE_PUBLISHABLE_KEY` from `pk_test_` to `pk_live_`
- [ ] Update Stripe webhook to point to production URL if changed
- [ ] Set up custom domain in Vercel (optional)
- [ ] Update Supabase Site URL to match custom domain

---

## Useful SQL Queries

```sql
-- Check all users
SELECT id, email, role, created_at FROM public.users ORDER BY created_at DESC;

-- Check payments
SELECT * FROM public.payments ORDER BY created_at DESC;

-- Check analytics
SELECT * FROM public.analytics_summary;

-- Manually unlock a case (if payment webhook fails)
UPDATE public.cases SET ai_unlocked = true WHERE id = 'case-uuid-here';

-- Manually set admin
UPDATE public.users SET role = 'admin' WHERE email = 'email@example.com';
```
