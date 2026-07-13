// src/hooks/useRole.test.jsx
import { describe, it, expect } from 'vitest'
import { useRole } from './useRole'
import { authStates, renderWithAuth } from '@/test/mockAuth'

// Render the hook inside a component that has the AuthContext provider.
// (We can't use renderHook directly because we need the AuthContext wrapper.)
function renderHookWithAuthContext(auth, hookFn) {
  let result
  function TestComponent() {
    result = hookFn()
    return null
  }
  renderWithAuth(<TestComponent />, { auth })
  return { result: () => result }
}

describe('useRole hook', () => {
  describe('client role', () => {
    it('exposes isClient=true', () => {
      const { result } = renderHookWithAuthContext(authStates.client, () => useRole())
      expect(result().isClient).toBe(true)
      expect(result().isAdmin).toBe(false)
      expect(result().isPartner).toBe(false)
      expect(result().role).toBe('client')
    })

    it('grants createCase permission', () => {
      const { result } = renderHookWithAuthContext(authStates.client, () => useRole())
      expect(result().can.createCase).toBe(true)
    })

    it('denies admin-only permissions', () => {
      const { result } = renderHookWithAuthContext(authStates.client, () => useRole())
      expect(result().can.manageUsers).toBe(false)
      expect(result().can.viewAnalytics).toBe(false)
      expect(result().can.viewAllCases).toBe(false)
    })

    it('routes to /dashboard', () => {
      const { result } = renderHookWithAuthContext(authStates.client, () => useRole())
      expect(result().dashboardPath()).toBe('/dashboard')
    })
  })

  describe('admin role', () => {
    it('exposes isAdmin=true', () => {
      const { result } = renderHookWithAuthContext(authStates.admin, () => useRole())
      expect(result().isAdmin).toBe(true)
    })

    it('grants all permissions', () => {
      const { result } = renderHookWithAuthContext(authStates.admin, () => useRole())
      expect(result().can.viewAllCases).toBe(true)
      expect(result().can.manageUsers).toBe(true)
      expect(result().can.viewAnalytics).toBe(true)
      expect(result().can.accessAdmin).toBe(true)
    })

    it('routes to /admin', () => {
      const { result } = renderHookWithAuthContext(authStates.admin, () => useRole())
      expect(result().dashboardPath()).toBe('/admin')
    })
  })

  describe('partner role', () => {
    it('exposes isPartner=true', () => {
      const { result } = renderHookWithAuthContext(authStates.partner, () => useRole())
      expect(result().isPartner).toBe(true)
    })

    it('grants viewAssigned but not viewAllCases', () => {
      const { result } = renderHookWithAuthContext(authStates.partner, () => useRole())
      expect(result().can.viewAssigned).toBe(true)
      expect(result().can.viewAllCases).toBe(false)
    })

    it('routes to /partner', () => {
      const { result } = renderHookWithAuthContext(authStates.partner, () => useRole())
      expect(result().dashboardPath()).toBe('/partner')
    })
  })
})
