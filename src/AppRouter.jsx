import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute, PublicRoute } from '@/components/ProtectedRoute'
import DashboardLayout from '@/components/DashboardLayout'

import LoginPage     from '@/pages/LoginPage'
import SignupPage    from '@/pages/SignupPage'
import ClientDashboard from '@/pages/ClientDashboard'
import AdminDashboard  from '@/pages/AdminDashboard'
import PartnerDashboard from '@/pages/PartnerDashboard'
import NotFoundPage  from '@/pages/NotFoundPage'
import CasesPage      from '@/pages/CasesPage'
import DocumentsPage  from '@/pages/DocumentsPage'
import CaseDetailPage from '@/pages/CaseDetailPage'
import PaymentSuccessPage from '@/pages/PaymentSuccessPage'
import PaymentCancelPage  from '@/pages/PaymentCancelPage'

export function AppRouter() {
  return (
    <Routes>
      {/* ─── Public root redirect ──────────────────────────── */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* ─── Auth routes (redirect if already logged in) ──── */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/signup"
        element={
          <PublicRoute>
            <SignupPage />
          </PublicRoute>
        }
      />

      {/* ─── Client routes ────────────────────────────────── */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute roles={['client']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<ClientDashboard />} />
        <Route path="cases"          element={<CasesPage />} />
        <Route path="cases/:caseId"  element={<CaseDetailPage />} />
        <Route path="documents"      element={<DocumentsPage />} />
      </Route>

      {/* ─── Admin routes ─────────────────────────────────── */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={['admin']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="cases"     element={<PlaceholderPage title="All Cases" />} />
        <Route path="users"     element={<PlaceholderPage title="User Management" />} />
        <Route path="analytics" element={<PlaceholderPage title="Analytics" />} />
      </Route>

      {/* ─── Partner routes ───────────────────────────────── */}
      <Route
        path="/partner"
        element={
          <ProtectedRoute roles={['partner']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<PartnerDashboard />} />
        <Route path="cases"     element={<PlaceholderPage title="Assigned Cases" />} />
        <Route path="documents" element={<PlaceholderPage title="Documents" />} />
        <Route path="reports"   element={<PlaceholderPage title="Reports" />} />
      </Route>

      {/* ─── Shared protected routes ──────────────────────── */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<PlaceholderPage title="Profile" />} />
      </Route>

      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<PlaceholderPage title="Settings" />} />
      </Route>

      {/* ─── Payment return routes (public — Stripe redirects here) ─ */}
      <Route path="/payment/success" element={<PaymentSuccessPage />} />
      <Route path="/payment/cancel"  element={<PaymentCancelPage />}  />

      {/* ─── 404 ──────────────────────────────────────────── */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

// ─── Generic placeholder for sub-routes not yet built ───────────
function PlaceholderPage({ title }) {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="glass-panel rounded-2xl p-12 flex flex-col items-center justify-center text-center">
        <div className="w-14 h-14 rounded-2xl bg-gold-500/8 border border-gold-500/15 flex items-center justify-center mb-5">
          <span className="text-2xl">🚧</span>
        </div>
        <h2 className="font-display text-2xl font-semibold text-[var(--text-primary)] mb-2">
          {title}
        </h2>
        <p className="text-sm text-[var(--text-secondary)] max-w-xs">
          This section is being built. It will be available in the next phase.
        </p>
        <div className="mt-4">
          <span className="text-xs px-3 py-1 rounded-full bg-gold-500/10 text-gold-400 border border-gold-500/20">
            Phase 2 — Coming Soon
          </span>
        </div>
      </div>
    </div>
  )
}

export default AppRouter
