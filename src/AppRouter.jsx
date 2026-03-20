import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute, PublicRoute } from '@/components/ProtectedRoute'
import DashboardLayout from '@/components/DashboardLayout'
import { LoadingScreen } from '@/components/LoadingScreen'

// ─── Lazy-loaded pages ─────────────────────────────────────────────
// Split into separate chunks — only loaded when the user navigates to that route
const LoginPage          = lazy(() => import('@/pages/LoginPage'))
const SignupPage         = lazy(() => import('@/pages/SignupPage'))
const ClientDashboard    = lazy(() => import('@/pages/ClientDashboard'))
const AdminDashboard     = lazy(() => import('@/pages/AdminDashboard'))
const AdminCasesPage     = lazy(() => import('@/pages/AdminCasesPage'))
const AdminUsersPage     = lazy(() => import('@/pages/AdminUsersPage'))
const AnalyticsPage      = lazy(() => import('@/pages/AnalyticsPage'))
const PartnerDashboard   = lazy(() => import('@/pages/PartnerDashboard'))
const PartnerTasksPage   = lazy(() => import('@/pages/PartnerTasksPage'))
const CasesPage          = lazy(() => import('@/pages/CasesPage'))
const CaseDetailPage     = lazy(() => import('@/pages/CaseDetailPage'))
const DocumentsPage      = lazy(() => import('@/pages/DocumentsPage'))
const PaymentSuccessPage = lazy(() => import('@/pages/PaymentSuccessPage'))
const PaymentCancelPage  = lazy(() => import('@/pages/PaymentCancelPage'))
const NotFoundPage       = lazy(() => import('@/pages/NotFoundPage'))

// ─── Suspense fallback ────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-bounce [animation-delay:-0.3s]" />
          <div className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-bounce [animation-delay:-0.15s]" />
          <div className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-bounce" />
        </div>
        <p className="text-xs text-[var(--text-muted)]">Loading page…</p>
      </div>
    </div>
  )
}

export function AppRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* ─── Root redirect ──────────────────────────────── */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* ─── Auth routes ──────────────────────────────── */}
        <Route path="/login"  element={<PublicRoute><LoginPage  /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />

        {/* ─── Client routes ────────────────────────────── */}
        <Route
          path="/dashboard"
          element={<ProtectedRoute roles={['client']}><DashboardLayout /></ProtectedRoute>}
        >
          <Route index                 element={<ClientDashboard />} />
          <Route path="cases"          element={<CasesPage />} />
          <Route path="cases/:caseId"  element={<CaseDetailPage />} />
          <Route path="documents"      element={<DocumentsPage />} />
        </Route>

        {/* ─── Admin routes ─────────────────────────────── */}
        <Route
          path="/admin"
          element={<ProtectedRoute roles={['admin']}><DashboardLayout /></ProtectedRoute>}
        >
          <Route index             element={<AdminDashboard />} />
          <Route path="cases"      element={<AdminCasesPage />} />
          <Route path="users"      element={<AdminUsersPage />} />
          <Route path="analytics"  element={<AnalyticsPage />} />
        </Route>

        {/* ─── Partner routes ───────────────────────────── */}
        <Route
          path="/partner"
          element={<ProtectedRoute roles={['partner']}><DashboardLayout /></ProtectedRoute>}
        >
          <Route index             element={<PartnerDashboard />} />
          <Route path="cases"      element={<PlaceholderPage title="Assigned Cases" />} />
          <Route path="tasks"      element={<PartnerTasksPage />} />
          <Route path="documents"  element={<PlaceholderPage title="Documents" />} />
          <Route path="reports"    element={<PlaceholderPage title="Reports" />} />
        </Route>

        {/* ─── Shared protected routes ──────────────────── */}
        <Route
          path="/profile"
          element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}
        >
          <Route index element={<PlaceholderPage title="Profile" />} />
        </Route>

        <Route
          path="/settings"
          element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}
        >
          <Route index element={<PlaceholderPage title="Settings" />} />
        </Route>

        {/* ─── Payment return routes ────────────────────── */}
        <Route path="/payment/success" element={<PaymentSuccessPage />} />
        <Route path="/payment/cancel"  element={<PaymentCancelPage />}  />

        {/* ─── 404 ──────────────────────────────────────── */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}

function PlaceholderPage({ title }) {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="glass-panel rounded-2xl p-12 flex flex-col items-center justify-center text-center">
        <div className="w-14 h-14 rounded-2xl bg-gold-500/8 border border-gold-500/15 flex items-center justify-center mb-5">
          <span className="text-2xl">🚧</span>
        </div>
        <h2 className="font-display text-2xl font-semibold text-[var(--text-primary)] mb-2">{title}</h2>
        <p className="text-sm text-[var(--text-secondary)] max-w-xs">
          This section will be available in the next update.
        </p>
        <div className="mt-4">
          <span className="text-xs px-3 py-1 rounded-full bg-gold-500/10 text-gold-400 border border-gold-500/20">
            Coming Soon
          </span>
        </div>
      </div>
    </div>
  )
}

export default AppRouter
