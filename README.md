# Remote Legal Case Orchestrator — UAE

### Phase 1: Foundation

> A production-grade SaaS platform for remote legal case management in the UAE, built for multilingual audiences including Arabic (RTL), Hindi, Urdu, and Filipino.

---

## 🗂️ Project Structure

```
src/
├── components/
│   ├── ui/
│   │   ├── Button.jsx          # Reusable button with variants
│   │   ├── Input.jsx           # Form input with label, error, icon
│   │   ├── Card.jsx            # Card, StatCard components
│   │   └── Badge.jsx           # StatusBadge, RoleBadge, Badge
│   ├── DashboardLayout.jsx     # Sidebar + main area shell
│   ├── LanguageSwitcher.jsx    # Dropdown language selector
│   ├── LoadingScreen.jsx       # Full-screen loading state
│   ├── ProtectedRoute.jsx      # Auth + role guards
│   └── Sidebar.jsx             # Navigation sidebar
├── context/
│   └── AuthContext.jsx         # Supabase auth + profile state
├── hooks/
│   ├── useCases.js             # Fetch cases from Supabase
│   └── useRole.js              # Role-checking utilities
├── i18n/
│   ├── index.js                # i18next setup + language config
│   └── locales/
│       ├── en.json             # English
│       ├── ar.json             # Arabic  (RTL)
│       ├── hi.json             # Hindi
│       ├── ur.json             # Urdu    (RTL)
│       └── tl.json             # Filipino/Tagalog
├── lib/
│   └── supabase.js             # Supabase client singleton
├── pages/
│   ├── LoginPage.jsx
│   ├── SignupPage.jsx
│   ├── ClientDashboard.jsx
│   ├── AdminDashboard.jsx
│   ├── PartnerDashboard.jsx
│   └── NotFoundPage.jsx
├── AppRouter.jsx               # All routes with role guards
├── App.jsx                     # Root: BrowserRouter + AuthProvider
├── main.jsx                    # Entry point
└── index.css                   # Global styles + CSS variables

supabase/
└── schema.sql                  # Full DB schema + RLS policies
```

---

## ⚙️ Prerequisites

- Node.js 18+
- npm 9+ or pnpm
- A Supabase account: https://supabase.com

---

## 🚀 Setup Instructions

### 1. Create a Supabase Project

1. Go to https://supabase.com → **New Project**
2. Name it `remote-legal-uae`
3. Choose a region (e.g., **Middle East — Bahrain** for UAE proximity)
4. Save the database password somewhere safe

### 2. Run the Database Schema

1. In your Supabase dashboard, go to **SQL Editor → New Query**
2. Paste the full contents of `supabase/schema.sql`
3. Click **Run**

This creates:

- `users` table (with profile data + role)
- `cases` table (core case entity)
- `documents` table (file metadata)
- `case_activities` table (audit log)
- All RLS policies
- Auto-create profile trigger on signup

### 3. Configure Environment Variables

```bash
# Copy the example file
cp .env.example .env.local
```

Edit `.env.local`:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

Find these in: **Supabase Dashboard → Settings → API**

### 4. Install Dependencies & Run

```bash
npm install
npm run dev
```

Open http://localhost:5173

---

## 👤 Creating Your First Admin

1. Sign up through the UI at `/signup` — pick any role (you'll override it)
2. In Supabase SQL Editor, run:

```sql
UPDATE public.users
SET role = 'admin'
WHERE email = 'your-email@example.com';
```

3. Sign out and back in — you'll be redirected to `/admin`

---

## 🔐 Authentication Flow

```
/signup  → Supabase Auth signUp()
         → Trigger: handle_new_user() inserts into public.users
         → Email confirmation sent (configure in Supabase Auth settings)

/login   → Supabase Auth signInWithPassword()
         → AuthContext loads profile from public.users
         → Redirects to /dashboard, /admin, or /partner based on role

Session  → Persisted in localStorage as 'rlco-auth-token'
         → Auto-refreshed by Supabase client
```

---

## 🌐 Languages & RTL

| Code | Language | Direction |
| ---- | -------- | --------- |
| `en` | English  | LTR       |
| `ar` | Arabic   | **RTL**   |
| `hi` | Hindi    | LTR       |
| `ur` | Urdu     | **RTL**   |
| `tl` | Filipino | LTR       |

RTL switching applies `dir="rtl"` to `<html>` and uses the **Noto Naskh Arabic** font family. Language preference is stored in the `users.language` column.

---

## 🛡️ Role System

| Role      | Access Path  | Permissions         |
| --------- | ------------ | ------------------- |
| `client`  | `/dashboard` | Own cases only      |
| `admin`   | `/admin`     | All data, all users |
| `partner` | `/partner`   | Assigned cases only |

Routes are protected at two levels:

1. **React Router** — `ProtectedRoute` component redirects unauthenticated users
2. **Supabase RLS** — database enforces access at the query level regardless of client

---

## 🗄️ Database Schema (Summary)

```sql
users       (id, email, full_name, role, language, is_active, created_at)
cases       (id, user_id, assigned_to, type, status, title, priority, created_at)
documents   (id, case_id, uploaded_by, file_name, file_url, storage_path, created_at)
case_activities (id, case_id, actor_id, action, metadata, created_at)
```

---

## 🔨 Build for Production

```bash
npm run build
```

Output goes to `dist/`. Deploy to any static host:

- **Vercel**: `npx vercel --prod`
- **Netlify**: Drag and drop `dist/`
- **Cloudflare Pages**: Connect GitHub repo

---

## 📋 Phase 2 Roadmap

- [ ] Case creation wizard with type selection
- [ ] Document upload (Supabase Storage)
- [ ] Admin case assignment to partners
- [ ] AI-powered case analysis (Claude API)
- [ ] Stripe payment integration
- [ ] Real-time notifications (Supabase Realtime)
- [ ] Email notifications
- [ ] Full profile management page
- [ ] Case activity timeline

---

## 🧰 Tech Stack

| Layer     | Technology                                       |
| --------- | ------------------------------------------------ |
| Frontend  | React 18 + Vite 5                                |
| Routing   | React Router v6                                  |
| Styling   | Tailwind CSS v3                                  |
| Auth + DB | Supabase                                         |
| i18n      | react-i18next                                    |
| State     | React Context + Zustand (ready)                  |
| Icons     | Lucide React                                     |
| Fonts     | Cormorant Garamond + DM Sans + Noto Naskh Arabic |
