# Remote Legal Case Orchestrator — UAE

> A production-grade SaaS platform for remote legal case management in the UAE, built for multilingual audiences including Arabic (RTL), Hindi, Urdu, and Filipino.

---

## Project Structure

```
src/
├── components/
│   ├── ui/                     # Reusable UI primitives
│   │   ├── Button.jsx
│   │   ├── Input.jsx
│   │   ├── Card.jsx
│   │   └── Badge.jsx
│   ├── DashboardLayout.jsx     # Sidebar + main area shell
│   ├── LanguageSwitcher.jsx    # Dropdown language selector
│   ├── LoadingScreen.jsx       # Full-screen loading state
│   ├── ProtectedRoute.jsx      # Auth + role guards
│   ├── ErrorBoundary.jsx       # Root error boundary
│   ├── ThemeToggle.jsx         # Dark/light mode switch
│   └── Sidebar.jsx             # Navigation sidebar
├── context/
│   └── AuthContext.jsx         # Supabase auth + profile state
├── hooks/
│   ├── useCases.js             # Fetch/create cases
│   ├── useAI.js                # AI case analysis (edge function)
│   ├── usePayments.js          # Stripe checkout
│   ├── useDocuments.js         # Document upload/management
│   ├── useAdmin.js             # Admin operations
│   ├── usePartner.js           # Partner operations
│   ├── useRole.js              # Role-checking utilities
│   ├── useNotifications.js     # In-app notifications
│   └── useTheme.js             # Dark/light theme
├── i18n/
│   ├── index.js                # i18next setup + language config
│   └── locales/
│       ├── en.json             # English
│       ├── ar.json             # Arabic  (RTL)
│       ├── hi.json             # Hindi
│       ├── ur.json             # Urdu    (RTL)
│       └── tl.json             # Filipino/Tagalog
├── lib/
│   ├── supabase.js             # Supabase client singleton
│   ├── validation.js           # Shared form validators
│   └── monitoring.js           # Error/analytics helpers
├── pages/
│   ├── LandingPage.jsx         # Public marketing page
│   ├── LoginPage.jsx
│   ├── SignupPage.jsx
│   ├── ForgotPasswordPage.jsx
│   ├── ResetPasswordPage.jsx
│   ├── ClientDashboard.jsx
│   ├── AdminDashboard.jsx
│   ├── AdminCasesPage.jsx
│   ├── AdminUsersPage.jsx
│   ├── AnalyticsPage.jsx
│   ├── PartnerDashboard.jsx
│   ├── PartnerCasesPage.jsx
│   ├── PartnerTasksPage.jsx
│   ├── CasesPage.jsx
│   ├── CaseDetailPage.jsx
│   ├── DocumentsPage.jsx
│   ├── ProfilePage.jsx
│   ├── SettingsPage.jsx
│   ├── PaymentSuccessPage.jsx
│   ├── PaymentCancelPage.jsx
│   ├── PrivacyPolicyPage.jsx
│   ├── TermsOfServicePage.jsx
│   ├── CookiePolicyPage.jsx
│   └── NotFoundPage.jsx
├── AppRouter.jsx               # All routes with role guards + lazy loading
├── App.jsx                     # Root: BrowserRouter + AuthProvider
├── main.jsx                    # Entry point
└── index.css                   # Global styles + CSS variables

supabase/
├── schema.sql                  # Base DB schema + RLS + hardened functions
├── migration_phase0_security.sql   # CRITICAL: privilege escalation + paywall fixes
├── migration_phase2.sql            # Case creation + document tables
├── migration_phase3.sql            # AI analysis columns
├── migration_phase4.sql            # Payments table + Stripe
├── migration_phase5.sql            # Notifications + tasks
├── migration_phase6.sql            # Case steps + partner assignments
├── migration_phase7.sql            # Email queue + cron
├── migration_prod_hardening.sql    # Storage RLS + email triggers
├── migration_stripe_dedup.sql      # Webhook event dedup table
├── config.toml                 # Edge function config
└── functions/
    ├── _shared/
    │   ├── auth.ts              # JWT verification + admin client
    │   └── cors.ts              # Origin-allowlisted CORS
    ├── analyze-case/index.ts    # AI case analysis (OpenAI)
    ├── analyze-document/index.ts # Document intelligence
    ├── create-checkout/index.ts  # Stripe checkout session
    ├── stripe-webhook/index.ts   # Payment processing + dedup
    └── send-emails/index.ts      # Email queue processor (cron)
```

---

## Prerequisites

- Node.js 18+
- npm 9+ or pnpm
- A Supabase account: https://supabase.com

---

## Setup Instructions

### 1. Create a Supabase Project

1. Go to https://supabase.com → **New Project**
2. Name it `remote-legal-uae`
3. Choose a region (e.g., **Middle East — Bahrain** for UAE proximity)
4. Save the database password somewhere safe

### 2. Run Database Migrations (ORDER MATTERS)

Migrations **must** be run in the following order. Each file is idempotent (safe to re-run).

| Order | File | What It Does |
|-------|------|-------------|
| 1 | `supabase/schema.sql` | Base schema, RLS policies, hardened `handle_new_user()` (role locked to 'client'), `SET search_path = public` on all functions, `get_cases_with_users()` secure function |
| 2 | `supabase/migration_phase2.sql` | Case creation wizard + document tables |
| 3 | `supabase/migration_phase3.sql` | AI analysis columns on cases |
| 4 | `supabase/migration_phase4.sql` | Payments table + Stripe integration |
| 5 | `supabase/migration_phase5.sql` | Notifications + tasks tables |
| 6 | `supabase/migration_phase6.sql` | Case steps + partner assignments |
| 7 | `supabase/migration_phase7.sql` | Email queue + cron setup |
| 8 | `supabase/migration_prod_hardening.sql` | Storage RLS, MIME limits, email triggers |
| 9 | `supabase/migration_phase0_security.sql` | **CRITICAL** — privilege escalation fix, paywall protection, column-level guards |
| 10 | `supabase/migration_stripe_dedup.sql` | Webhook event dedup table |

**Important**: `migration_phase0_security.sql` is numbered "0" because it patches issues in earlier migrations. It must run **after** all phase 2-7 migrations and prod hardening so it can `CREATE OR REPLACE` the functions with their hardened versions.

To run them all at once in Supabase SQL Editor, concatenate the files in the order above and execute as a single query.

### 3. Configure Edge Function Secrets

In your Supabase dashboard, go to **Edge Functions → Settings** and add:

| Secret | Value |
|--------|-------|
| `SUPABASE_URL` | Your project URL (e.g. `https://xxx.supabase.co`) |
| `SUPABASE_SERVICE_ROLE_KEY` | From Settings → API |
| `SUPABASE_ANON_KEY` | From Settings → API |
| `OPENAI_API_KEY` | Your OpenAI API key |
| `STRIPE_SECRET_KEY` | Your Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | From Stripe Dashboard → Webhooks |
| `ALLOWED_ORIGINS` | `https://your-domain.vercel.app` (comma-separated for multiple) |

### 4. Configure Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_PLAUSIBLE_DOMAIN=
```

Find Supabase keys in: **Supabase Dashboard → Settings → API**

### 5. Install Dependencies & Run

```bash
npm install
npm run dev
```

Open http://localhost:5173

---

## Creating Your First Admin

1. Sign up through the UI at `/signup` — the role will be `client` by design (the signup trigger hardcodes this to prevent privilege escalation)
2. In Supabase SQL Editor, run:

```sql
SELECT set_user_role(
  (SELECT id FROM public.users WHERE email = 'your-email@example.com'),
  'admin'
);
```

3. Sign out and back in — you'll be redirected to `/admin`

---

## Authentication Flow

```
/signup  → Supabase Auth signUp()
         → Trigger: handle_new_user() inserts into public.users with role='client'
         → Email confirmation sent (configure in Supabase Auth settings)

/login   → Supabase Auth signInWithPassword()
         → AuthContext loads profile from public.users
         → Redirects to /dashboard, /admin, or /partner based on role

Session  → Persisted in localStorage as 'rlco-session-v2'
         → Auto-refreshed by Supabase client
```

---

## Security Model

This project implements defense-in-depth security across multiple layers:

**Database Layer (Supabase RLS + Triggers):**
- Row-Level Security on every table (`users`, `cases`, `documents`, `case_activities`, `email_queue`)
- `handle_new_user()` trigger hardcodes `role = 'client'` — client-supplied role metadata is ignored
- `set_user_role()` RPC — the only way to promote users, restricted to existing admins, with last-admin lockout protection
- `protect_user_columns()` trigger — blocks non-admins from changing `role`, `email`, `is_active`, `created_at`
- `protect_case_ai_columns()` trigger — blocks non-admins from modifying any `ai_*` column (paywall enforcement)
- All `SECURITY DEFINER` functions use `SET search_path = public` (CVE-2024-7348 mitigation)
- `get_document_analysis()` uses `SECURITY INVOKER` + explicit ownership check
- `get_cases_with_users()` function provides an RLS-safe alternative to the `cases_with_users` view

**Edge Function Layer:**
- JWT verification on all user-facing endpoints via `getUserFromRequest()`
- Service-role key required for cron/internal endpoints via `requireServiceRole()`
- CORS origin allowlist (no wildcard `*`)
- Stripe webhook: signature verification + event-ID deduplication + defense-in-depth ownership check
- Rate limiting on AI analysis (5 requests per 10 minutes per user)
- Internal errors logged server-side only; clients receive generic messages

**Frontend Layer:**
- `ProtectedRoute` + `PublicRoute` components with role-based redirect maps
- `cases_with_users` view has a security warning; app code uses the `cases` table (which has RLS) directly

**Infrastructure Layer (Vercel):**
- HSTS (2 years), X-Frame-Options DENY, Content-Security-Policy, X-Content-Type-Options nosniff
- Permissions-Policy blocks camera, microphone, geolocation
- Asset caching with immutable headers

---

## Languages & RTL

| Code | Language | Direction | Script |
| ---- | -------- | --------- | ------ |
| `en` | English  | LTR       | Latin |
| `ar` | Arabic   | **RTL**   | Arabic |
| `hi` | Hindi    | LTR       | Devanagari |
| `ur` | Urdu     | **RTL**   | Nastaliq |
| `tl` | Filipino | LTR       | Latin |

Non-Latin fonts are lazy-loaded on demand when the user selects that language, reducing initial page weight.

---

## Role System

| Role      | Access Path  | Permissions         |
| --------- | ------------ | ------------------- |
| `client`  | `/dashboard` | Own cases only      |
| `admin`   | `/admin`     | All data, all users |
| `partner` | `/partner`   | Assigned cases only |

Routes are protected at two levels:

1. **React Router** — `ProtectedRoute` component redirects unauthenticated users
2. **Supabase RLS** — database enforces access at the query level regardless of client

---

## Build for Production

```bash
npm run build
```

Output goes to `dist/`. Deploy to any static host:

- **Vercel**: `npx vercel --prod`
- **Netlify**: Drag and drop `dist/`
- **Cloudflare Pages**: Connect GitHub repo

---

## Tech Stack

| Layer     | Technology                                       |
| --------- | ------------------------------------------------ |
| Frontend  | React 18 + Vite 5                                |
| Routing   | React Router v6 (lazy-loaded)                    |
| Styling   | Tailwind CSS v3 + scoped CSS (landing page)      |
| Auth + DB | Supabase (Auth, Postgres, Edge Functions, Storage) |
| Payments  | Stripe Checkout + Webhooks                       |
| AI        | OpenAI GPT-4o-mini (case analysis)               |
| i18n      | react-i18next (5 languages, RTL support)         |
| State     | React Context + Zustand                           |
| Icons     | Lucide React                                     |
| Fonts     | Cormorant Garamond + DM Sans + Noto Naskh Arabic + Fraunces + Public Sans |