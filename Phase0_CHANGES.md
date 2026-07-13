# Phase 0 — Critical Security Fixes (Production Blockers)

This document summarizes every change made to address the Phase 0
issues from the production-readiness audit. All changes are
backward-compatible — the application builds successfully
(`npm run build` passes) and existing data is preserved.

**Run order:**

1. Apply the SQL migration (see §1 below)
2. Deploy the updated edge functions (see §2)
3. Set the new `ALLOWED_ORIGINS` secret (see §3)
4. Smoke-test the affected flows (see §4)

---

## 1. SQL Migration — `supabase/migration_phase0_security.sql`

Run this in **Supabase Dashboard → SQL Editor → New Query** after
`schema.sql` + `migration_phase2-7.sql` + `migration_prod_hardening.sql`
have been applied. The migration is fully idempotent — re-running it
is safe.

### What it fixes

| #              | Severity  | Fix                                                                                                                                                                                                                                                                                                                                                                             |
| -------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **CRITICAL 1** | Blocker   | `handle_new_user()` trigger rewritten — hardcoded `role := 'client'`, ignores client-supplied `role` from `raw_user_meta_data`. New `set_user_role(uuid, user_role)` admin-only RPC added for legitimate promotions.                                                                                                                                                            |
| **CRITICAL 2** | Blocker   | `users_update_own` policy replaced with `users_update_own_safe` — clients can update only `full_name`, `language`, `avatar_url`, `phone`, `notification_prefs`, `last_seen_at`. `role`, `email`, `is_active`, `created_at` are immutable for non-admins (enforced via `OLD.col = NEW.col` checks in `WITH CHECK`).                                                              |
| **CRITICAL 3** | Blocker   | `cases_update_client` policy replaced with `cases_update_client_safe` — clients can no longer UPDATE `ai_unlocked`, `ai_status`, `ai_summary`, `ai_risk_level`, `ai_estimated_cost`, `ai_estimated_time` on their own cases. Only the service role (used by `analyze-case` and `stripe-webhook` edge functions) can write these columns.                                        |
| **CRITICAL 6** | Blocker   | `get_document_analysis()` rewritten as `SECURITY INVOKER` (was `SECURITY DEFINER`) with explicit ownership check joining `documents → cases` and verifying caller is the case owner, assigned partner, or admin.                                                                                                                                                                |
| HARDENING      | Hardening | `SET search_path = public` added to all 11 `SECURITY DEFINER` functions that were missing it (CVE-2024-7348 pattern): `current_user_role`, `is_admin`, `is_partner`, `is_case_paid`, `log_case_status_change`, `notify_on_task_assigned`, `notify_on_ai_ready`, `notify_on_case_assigned`, `email_on_ai_ready`, `email_on_payment_success`, `email_on_case_assigned_to_client`. |
| HARDENING      | Hardening | `log_case_status_change()` no longer throws a NOT NULL violation on service-role writes — falls back to `NEW.user_id` when `auth.uid()` returns NULL.                                                                                                                                                                                                                           |
| HARDENING      | Hardening | `email_queue.status` CHECK extended to include `'processing'` (new atomic-claim pattern in `send-emails` edge function). Index on `(status, created_at)` added for fast claiming.                                                                                                                                                                                               |
| HARDENING      | Hardening | `REVOKE ALL ON email_queue FROM anon, authenticated` — only service role can read/write the queue.                                                                                                                                                                                                                                                                              |

### Verification queries (uncomment at bottom of migration)

```sql
SELECT proname, prosecdef, proconfig FROM pg_proc
  WHERE proname IN (
    'handle_new_user','set_user_role','current_user_role','is_admin','is_partner',
    'is_case_paid','log_case_status_change','notify_on_task_assigned',
    'notify_on_ai_ready','notify_on_case_assigned','email_on_ai_ready',
    'email_on_payment_success','email_on_case_assigned_to_client',
    'get_document_analysis'
  ) ORDER BY proname;
-- Expected: every row has proconfig = {search_path=public}
-- Expected: get_document_analysis has prosecdef = false (INVOKER)
```

---

## 2. Edge Function Rewrites

All five edge functions were rewritten. Shared CORS + auth helpers
were extracted to `supabase/functions/_shared/`.

### New shared modules

| File                                 | Purpose                                                                                                                                                                                                                                                        |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `supabase/functions/_shared/cors.ts` | Origin-allowlist CORS helper. Reads `ALLOWED_ORIGINS` env var, reflects Origin only if allowlisted, varies by Origin, always allows localhost for dev.                                                                                                         |
| `supabase/functions/_shared/auth.ts` | `getUserFromRequest(req)` verifies user JWT and returns Supabase client. `requireServiceRole(req)` for internal-only endpoints. `createAdminClient()` for service-role DB access. `verifyCaseAccess(client, caseId, userId)` defense-in-depth ownership check. |

### Per-function changes

#### `analyze-case/index.ts` — CRITICAL 4

- **CORS**: `*` → origin allowlist via `_shared/cors.ts`
- **Auth**: now requires a valid user JWT (was optional before — anonymous calls were allowed if no `Authorization` header was sent)
- **Ownership**: calls `verifyCaseAccess()` to confirm the caller owns (or is admin/partner of) the case before running AI
- **Error leakage**: OpenAI error bodies and DB error messages are logged server-side only; client sees generic `'AI analysis failed. Please try again later.'`
- **Idempotency**: `ai_unlocked` is no longer touched by this function (was previously reset to `false` on every analysis — now left unchanged)

#### `analyze-document/index.ts` — CRITICAL 4

- **CORS**: `*` → origin allowlist
- **Auth**: was already required, kept
- **Ownership**: now looks up the document via the user-scoped client (RLS-enforced) and uses the **DB-returned** `storage_path` instead of the client-supplied one. Prevents the caller from downloading arbitrary files from storage.
- **Error leakage**: OpenAI error bodies, DB errors, and raw AI JSON logged server-side only

#### `send-emails/index.ts` — CRITICAL 5

- **CORS**: `*` → origin allowlist
- **Auth**: now requires service-role key via `requireServiceRole(req)`. Anonymous browser calls are rejected with 403. (Previously anyone on the internet could drain the email queue.)
- **Concurrency**: atomic claim pattern — `UPDATE email_queue SET status='processing' WHERE status='pending' LIMIT 20` replaces the old SELECT-then-UPDATE-per-row. Two concurrent cron invocations can no longer send duplicate emails.
- **Error leakage**: internal errors return generic `'Email processing error'`

#### `create-checkout/index.ts` — H1 + open-redirect fix

- **CORS**: `*` → origin allowlist
- **Open redirect**: `return_url` is now validated against the `ALLOWED_ORIGINS` allowlist. If the client-supplied URL's origin isn't on the list, it's ignored and the function falls back to the first non-localhost origin in the allowlist.
- **Error leakage**: Stripe errors logged server-side, client sees `'Failed to create checkout session'`

#### `stripe-webhook/index.ts` — Hardening

- **CORS**: unchanged (no CORS headers — Stripe servers don't need them)
- **Defense-in-depth**: before unlocking a case, verifies the payment's `metadata.user_id` matches the case's actual `user_id`. Prevents a forged-metadata attack from unlocking someone else's case.
- **Error leakage**: signature verification errors no longer echo the underlying crypto detail
- **Idempotency**: skips the unlock UPDATE if `ai_unlocked` is already true (still updates payment status)

---

## 3. `supabase/config.toml` — CRITICAL 7

New file. Without it, `supabase functions deploy` doesn't work —
edge functions can only be deployed by pasting code into the
dashboard, with no audit trail.

Key settings:

```toml
[functions.analyze-case]      verify_jwt = true
[functions.analyze-document]  verify_jwt = true
[functions.create-checkout]   verify_jwt = true
[functions.send-emails]       verify_jwt = false   # cron uses service-role key
[functions.stripe-webhook]    verify_jwt = false   # CRITICAL — Stripe can't send a JWT
```

The `stripe-webhook` setting is the most important: with the default
`verify_jwt = true`, Supabase would reject every Stripe webhook call
and payments would silently stop unlocking cases.

---

## 4. Client-Side Changes

### `src/context/AuthContext.jsx` — CRITICAL 1

- `signUp()` no longer accepts a `role` parameter
- `signUp()` no longer sends `role` in `auth.signUp({ options: { data }})`
- `signUp()` no longer does a client-side `upsert` on `public.users` (the `handle_new_user()` trigger handles that, and the new RLS policy would block a client role write anyway)

### `src/pages/SignupPage.jsx` — CRITICAL 1

- Removed the role-selection radio buttons (`client` / `partner`) from the form
- Now shows a single info panel explaining that all new signups are `client` accounts and that specialist/admin accounts are created by invitation only
- Removed the now-unused `ROLES` constant and `clsx` import

### `src/hooks/useAI.js` — CRITICAL 3

- Removed the `unlockReport()` function entirely
- Added a comment explaining the only legitimate path to unlock an AI report: client → `create-checkout` edge function → Stripe Checkout → `stripe-webhook` edge function → `cases.ai_unlocked = true`

### `src/hooks/useAdmin.js` — CRITICAL 2

- `updateUserRole(userId, role)` now calls the `set_user_role()` RPC instead of a direct `UPDATE` on `public.users`
- `createPartner({ userId, ... })` now promotes the user to `partner` via `set_user_role()` RPC instead of a direct UPDATE
- Both paths now work correctly under the new `users_update_own_safe` RLS policy

### `.env.example` — Documentation

- Expanded with all server-side Supabase secrets (including new `ALLOWED_ORIGINS`)
- Clear separation between client-side env vars (Vite) and server-side secrets (Supabase CLI)

---

## 5. Deployment Steps

### Step 1 — Apply the SQL migration

```bash
# Option A: via Supabase CLI
supabase db push

# Option B: via Dashboard
# 1. Open Supabase Dashboard → SQL Editor → New Query
# 2. Paste supabase/migration_phase0_security.sql
# 3. Click Run
# 4. (Optional) Uncomment and run the verification queries at the bottom
```

### Step 2 — Set the new `ALLOWED_ORIGINS` secret

```bash
supabase secrets set ALLOWED_ORIGINS="https://remote-legal-uae.vercel.app,https://staging.remote-legal-uae.vercel.app"
```

If you have custom domains, include them too. Localhost origins are
always allowed automatically for dev.

### Step 3 — Redeploy all 5 edge functions

```bash
supabase functions deploy analyze-case
supabase functions deploy analyze-document
supabase functions deploy create-checkout
supabase functions deploy send-emails
supabase functions deploy stripe-webhook
```

The `stripe-webhook` deploy is the critical one — without the new
`config.toml`, the function would default to `verify_jwt = true` and
reject all Stripe webhooks.

### Step 4 — Redeploy the frontend

```bash
npm run build
# Deploy dist/ to Vercel / Netlify / Cloudflare Pages as usual
```

---

## 6. Smoke Tests (run after deploy)

| Test                                | Expected behavior                                                                                                                                                        |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Signup as admin attempt**         | Sign up via `/signup` — there's no role selector. Sign up, then in SQL editor check `SELECT role FROM users WHERE email = 'you@x.com';` — must always return `'client'`. |
| **Direct role update attempt**      | Open browser console while logged in as a client and run: `supabase.from('users').update({ role: 'admin' }).eq('id', <your-id>)` — must return an RLS error.             |
| **Paywall bypass attempt**          | Open browser console and run: `supabase.from('cases').update({ ai_unlocked: true }).eq('id', <case-id>)` — must return an RLS error.                                     |
| **AI report unlock via payment**    | Create a case, run AI analysis, pay via Stripe test card (`4242 4242 4242 4242`), confirm the case unlocks.                                                              |
| **Unauthorized document analysis**  | Try to call `analyze-document` with a `document_id` you don't own — must return 404.                                                                                     |
| **Unauthorized email queue drain**  | Try to POST to `send-emails` with no auth header — must return 403.                                                                                                      |
| **Stripe webhook (test mode)**      | Trigger a test event from the Stripe dashboard — must return 200 and unlock the case.                                                                                    |
| **CORS preflight from evil origin** | From a different origin (e.g. `https://evil.com`), call `analyze-case` — browser must block the response (no `Access-Control-Allow-Origin` header returned).             |

---

## 7. Files Changed

```
NEW  supabase/migration_phase0_security.sql         (559 lines)
NEW  supabase/config.toml                            (132 lines)
NEW  supabase/functions/_shared/cors.ts              ( 76 lines)
NEW  supabase/functions/_shared/auth.ts              (130 lines)
MOD  supabase/functions/analyze-case/index.ts        (223 → 264 lines)
MOD  supabase/functions/analyze-document/index.ts    (359 → 398 lines)
MOD  supabase/functions/send-emails/index.ts         (182 → 201 lines)
MOD  supabase/functions/create-checkout/index.ts     (195 → 211 lines)
MOD  supabase/functions/stripe-webhook/index.ts      (168 → 193 lines)
MOD  src/context/AuthContext.jsx                     (signUp rewrite)
MOD  src/pages/SignupPage.jsx                        (role selector removed)
MOD  src/hooks/useAI.js                              (unlockReport removed)
MOD  src/hooks/useAdmin.js                           (set_user_role RPC)
MOD  .env.example                                    (ALLOWED_ORIGINS docs)
```

---

## 8. What's NOT in Phase 0

The following items from the audit are deferred to Phase 1+:

- H1 partial — `stripe-webhook` doesn't need CORS (Stripe doesn't enforce it)
- Stripe webhook event-ID deduplication table (Phase 1)
- Soft deletes for `cases` and `case_activities` (Phase 1)
- i18n sweep, accessibility fixes, form validation, tests (Phase 1)
- Privacy Policy / ToS / DPA / UAE DPL compliance artifacts (Phase 2)
- CSP / HSTS headers in `vercel.json` (Phase 1)
- Sentry / Plausible / UptimeRobot (Phase 1)

See the audit report in `/home/z/my-project/worklog.md` for the full
remaining-issues list.
