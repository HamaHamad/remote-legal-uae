// src/test/mockAuth.jsx
// Helper to render components that depend on AuthContext with a mock auth state.
import { createElement } from 'react'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import AuthContext from '@/context/AuthContext'

/**
 * Build a mock AuthContext value.
 * Defaults to an unauthenticated visitor.
 */
export function makeMockAuth(overrides = {}) {
  return {
    user: null,
    profile: null,
    role: null,
    isAdmin: false,
    isPartner: false,
    isClient: false,
    loading: false,
    error: null,
    configError: false,
    signUp: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
    updateLanguage: vi.fn(),
    fetchProfile: vi.fn(),
    ...overrides,
  }
}

/**
 * Render a component wrapped with:
 *   - MemoryRouter (for react-router hooks)
 *   - AuthContext.Provider (with the provided mock auth value)
 */
export function renderWithAuth(
  ui,
  { auth = makeMockAuth(), initialEntries = ['/'], ...renderOptions } = {},
) {
  function Wrapper({ children }) {
    return createElement(
      MemoryRouter,
      { initialEntries },
      createElement(AuthContext.Provider, { value: auth }, children),
    )
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    auth,
  }
}

/**
 * Pre-built auth states for common test scenarios.
 */
export const authStates = {
  unauthenticated: makeMockAuth(),

  client: makeMockAuth({
    user: { id: 'client-1', email: 'client@test.com' },
    profile: { id: 'client-1', role: 'client', email: 'client@test.com', full_name: 'Test Client' },
    role: 'client',
    isClient: true,
  }),

  admin: makeMockAuth({
    user: { id: 'admin-1', email: 'admin@test.com' },
    profile: { id: 'admin-1', role: 'admin', email: 'admin@test.com', full_name: 'Test Admin' },
    role: 'admin',
    isAdmin: true,
  }),

  partner: makeMockAuth({
    user: { id: 'partner-1', email: 'partner@test.com' },
    profile: {
      id: 'partner-1',
      role: 'partner',
      email: 'partner@test.com',
      full_name: 'Test Partner',
    },
    role: 'partner',
    isPartner: true,
  }),

  loading: makeMockAuth({ loading: true }),
}
