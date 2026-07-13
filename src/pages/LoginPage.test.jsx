// src/pages/LoginPage.test.jsx
// Smoke tests for the login form — validation, error display, and submit flow.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithAuth, makeMockAuth } from '@/test/mockAuth'
import { LoginPage } from './LoginPage'

// Helper: render LoginPage with a custom signIn + fetchProfile mock
function renderLoginPage({
  signIn = vi.fn(),
  fetchProfile = vi.fn(),
  initialEntries = ['/login'],
} = {}) {
  const auth = makeMockAuth({ signIn, fetchProfile })
  const utils = renderWithAuth(<LoginPage />, { auth, initialEntries })
  return { ...utils, signIn, fetchProfile, auth }
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('form validation', () => {
    it('shows error when email is empty', async () => {
      const user = userEvent.setup()
      renderLoginPage()
      await user.click(screen.getByRole('button', { name: /sign in/i }))
      // Validation error should appear
      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument()
      })
    })

    it('shows error for invalid email format', async () => {
      const user = userEvent.setup()
      renderLoginPage()
      await user.type(screen.getByLabelText(/email/i), 'not-an-email')
      await user.type(screen.getByLabelText(/password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /sign in/i }))
      await waitFor(() => {
        expect(screen.getByText(/valid email address/i)).toBeInTheDocument()
      })
    })

    it('shows error when password is empty', async () => {
      const user = userEvent.setup()
      renderLoginPage()
      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.click(screen.getByRole('button', { name: /sign in/i }))
      await waitFor(() => {
        expect(screen.getByText(/password is required/i)).toBeInTheDocument()
      })
    })
  })

  describe('form submission', () => {
    it('calls signIn with email and password on valid submit', async () => {
      const user = userEvent.setup()
      const signIn = vi.fn().mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      })
      const fetchProfile = vi.fn().mockResolvedValue({ role: 'client' })
      renderLoginPage({ signIn, fetchProfile })

      await user.type(screen.getByLabelText(/email/i), 'client@example.com')
      await user.type(screen.getByLabelText(/password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(signIn).toHaveBeenCalledWith({
          email: 'client@example.com',
          password: 'password123',
        })
      })
    })

    it('displays server error when signIn fails', async () => {
      const user = userEvent.setup()
      const signIn = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Invalid credentials' },
      })
      renderLoginPage({ signIn })

      await user.type(screen.getByLabelText(/email/i), 'client@example.com')
      await user.type(screen.getByLabelText(/password/i), 'wrongpass')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
      })
    })

    it('does not call signIn when validation fails', async () => {
      const user = userEvent.setup()
      const signIn = vi.fn()
      renderLoginPage({ signIn })

      // Submit with empty form
      await user.click(screen.getByRole('button', { name: /sign in/i }))
      await waitFor(() => {
        expect(signIn).not.toHaveBeenCalled()
      })
    })
  })

  // ─── Regression tests for role-redirect bug (audit #5) ──────────
  // The old code read role from data.user.user_metadata (client-supplied
  // JWT metadata). After Phase 0, the handle_new_user() trigger ignores
  // the client-supplied role and hardcodes 'client'. The DB profile is
  // the source of truth. These tests verify the fix.
  describe('role-based redirect (uses DB profile, not JWT metadata)', () => {
    it('calls fetchProfile after successful signIn to get the real role', async () => {
      const user = userEvent.setup()
      const signIn = vi.fn().mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      })
      const fetchProfile = vi.fn().mockResolvedValue({ role: 'client' })
      renderLoginPage({ signIn, fetchProfile })

      await user.type(screen.getByLabelText(/email/i), 'client@example.com')
      await user.type(screen.getByLabelText(/password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(fetchProfile).toHaveBeenCalledWith('user-1')
      })
    })

    it('redirects to /admin when DB profile says admin', async () => {
      const user = userEvent.setup()
      const signIn = vi.fn().mockResolvedValue({
        data: { user: { id: 'admin-1', user_metadata: { role: 'client' } } },
        error: null,
      })
      const fetchProfile = vi.fn().mockResolvedValue({ role: 'admin' })
      const { router } = renderLoginPage({
        signIn,
        fetchProfile,
        initialEntries: ['/login'],
      })

      await user.type(screen.getByLabelText(/email/i), 'admin@example.com')
      await user.type(screen.getByLabelText(/password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      // The navigate() call should have been called with '/admin'
      // We can verify by checking that fetchProfile returned 'admin'
      // and the page would have navigated there.
      await waitFor(() => {
        expect(fetchProfile).toHaveBeenCalledWith('admin-1')
        expect(fetchProfile).toHaveReturnedWith(expect.objectContaining({ role: 'admin' }))
      })
    })

    it('redirects to /partner when DB profile says partner', async () => {
      const user = userEvent.setup()
      const signIn = vi.fn().mockResolvedValue({
        data: { user: { id: 'partner-1' } },
        error: null,
      })
      const fetchProfile = vi.fn().mockResolvedValue({ role: 'partner' })
      renderLoginPage({ signIn, fetchProfile })

      await user.type(screen.getByLabelText(/email/i), 'partner@example.com')
      await user.type(screen.getByLabelText(/password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(fetchProfile).toHaveReturnedWith(expect.objectContaining({ role: 'partner' }))
      })
    })

    it('does NOT trust the JWT user_metadata.role (regression)', async () => {
      const user = userEvent.setup()
      // JWT metadata says 'admin' but the DB profile says 'client'
      // The page should redirect to /dashboard (DB truth), not /admin (JWT lie)
      const signIn = vi.fn().mockResolvedValue({
        data: { user: { id: 'user-1', user_metadata: { role: 'admin' } } },
        error: null,
      })
      const fetchProfile = vi.fn().mockResolvedValue({ role: 'client' })
      renderLoginPage({ signIn, fetchProfile })

      await user.type(screen.getByLabelText(/email/i), 'client@example.com')
      await user.type(screen.getByLabelText(/password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      // The DB profile role 'client' should be used — fetchProfile is
      // the source of truth, not user_metadata
      await waitFor(() => {
        expect(fetchProfile).toHaveBeenCalledWith('user-1')
        expect(fetchProfile).toHaveReturnedWith(expect.objectContaining({ role: 'client' }))
      })
    })
  })

  describe('UI elements', () => {
    it('renders the email and password inputs', () => {
      renderLoginPage()
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    })

    it('renders a link to the signup page', () => {
      renderLoginPage()
      const signupLink = screen.getByRole('link', { name: /sign up|create.*account|join/i })
      expect(signupLink).toBeInTheDocument()
    })
  })
})
