// src/components/ProtectedRoute.test.jsx
import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { renderWithAuth, authStates } from '@/test/mockAuth'
import { ProtectedRoute, PublicRoute } from './ProtectedRoute'

// Helper component representing a protected page
function ProtectedPage({ label = 'Protected' }) {
  return <div>{label}</div>
}

// Render ProtectedRoute inside a Routes component so <Navigate> works
function renderRouter(auth, { roles, initialEntries = ['/protected'] } = {}) {
  return renderWithAuth(
    <Routes>
      <Route path="/login" element={<div>Login Page</div>} />
      <Route path="/dashboard" element={<div>Client Dashboard</div>} />
      <Route path="/admin" element={<div>Admin Dashboard</div>} />
      <Route path="/partner" element={<div>Partner Dashboard</div>} />
      <Route
        path="/protected"
        element={
          <ProtectedRoute roles={roles}>
            <ProtectedPage />
          </ProtectedRoute>
        }
      />
    </Routes>,
    { auth, initialEntries },
  )
}

describe('ProtectedRoute', () => {
  describe('authentication gating', () => {
    it('redirects unauthenticated users to /login', () => {
      renderRouter(authStates.unauthenticated, { initialEntries: ['/protected'] })
      expect(screen.getByText('Login Page')).toBeInTheDocument()
      expect(screen.queryByText('Protected')).not.toBeInTheDocument()
    })

    it('renders the protected content for authenticated clients (no role restriction)', () => {
      renderRouter(authStates.client, { initialEntries: ['/protected'] })
      expect(screen.getByText('Protected')).toBeInTheDocument()
    })

    it('renders the protected content for authenticated admins (no role restriction)', () => {
      renderRouter(authStates.admin, { initialEntries: ['/protected'] })
      expect(screen.getByText('Protected')).toBeInTheDocument()
    })
  })

  describe('role gating', () => {
    it('allows admin to access admin-only routes', () => {
      renderRouter(authStates.admin, {
        roles: ['admin'],
        initialEntries: ['/protected'],
      })
      expect(screen.getByText('Protected')).toBeInTheDocument()
    })

    it('redirects client away from admin-only routes to /dashboard', () => {
      renderRouter(authStates.client, {
        roles: ['admin'],
        initialEntries: ['/protected'],
      })
      expect(screen.getByText('Client Dashboard')).toBeInTheDocument()
      expect(screen.queryByText('Protected')).not.toBeInTheDocument()
    })

    it('redirects admin away from client-only routes to /admin', () => {
      renderRouter(authStates.admin, {
        roles: ['client'],
        initialEntries: ['/protected'],
      })
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument()
      expect(screen.queryByText('Protected')).not.toBeInTheDocument()
    })

    it('allows partner to access partner-only routes', () => {
      renderRouter(authStates.partner, {
        roles: ['partner'],
        initialEntries: ['/protected'],
      })
      expect(screen.getByText('Protected')).toBeInTheDocument()
    })

    it('redirects client away from partner-only routes to /dashboard', () => {
      renderRouter(authStates.client, {
        roles: ['partner'],
        initialEntries: ['/protected'],
      })
      expect(screen.getByText('Client Dashboard')).toBeInTheDocument()
    })
  })
})

describe('PublicRoute', () => {
  function renderPublicRouter(auth, initialEntries = ['/login']) {
    return renderWithAuth(
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <div>Public Login</div>
            </PublicRoute>
          }
        />
        <Route path="/dashboard" element={<div>Client Dashboard</div>} />
        <Route path="/admin" element={<div>Admin Dashboard</div>} />
        <Route path="/partner" element={<div>Partner Dashboard</div>} />
      </Routes>,
      { auth, initialEntries },
    )
  }

  it('shows public content for unauthenticated users', () => {
    renderPublicRouter(authStates.unauthenticated)
    expect(screen.getByText('Public Login')).toBeInTheDocument()
  })

  it('redirects authenticated client to /dashboard', () => {
    renderPublicRouter(authStates.client)
    expect(screen.getByText('Client Dashboard')).toBeInTheDocument()
    expect(screen.queryByText('Public Login')).not.toBeInTheDocument()
  })

  it('redirects authenticated admin to /admin', () => {
    renderPublicRouter(authStates.admin)
    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument()
  })

  it('redirects authenticated partner to /partner', () => {
    renderPublicRouter(authStates.partner)
    expect(screen.getByText('Partner Dashboard')).toBeInTheDocument()
  })
})
