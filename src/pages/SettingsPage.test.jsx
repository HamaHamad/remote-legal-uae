// src/pages/SettingsPage.test.jsx
// Regression tests for the "Sign Out of All Devices" bug (audit #7).
// The old code called signOut() with no arguments, which defaults to
// scope: 'local' — only signing out the current session despite the
// button label saying "all devices".
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithAuth, makeMockAuth } from '@/test/mockAuth'
import { SettingsPage } from './SettingsPage'

function renderSettingsPage({ signOut = vi.fn() } = {}) {
  const auth = makeMockAuth({
    signOut,
    user: { id: 'user-1', email: 'test@example.com' },
    profile: { id: 'user-1', role: 'client', email: 'test@example.com', language: 'en' },
    role: 'client',
    isClient: true,
  })
  return renderWithAuth(<SettingsPage />, { auth })
}

describe('SettingsPage — Sign Out', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders both "Sign Out (This Device)" and "Sign Out of All Devices" buttons', () => {
    renderSettingsPage()
    expect(screen.getByRole('button', { name: /sign out \(this device\)/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign out of all devices/i })).toBeInTheDocument()
  })

  it('calls signOut with scope: "local" when "This Device" is clicked', async () => {
    const user = userEvent.setup()
    const signOut = vi.fn().mockResolvedValue(undefined)
    renderSettingsPage({ signOut })

    await user.click(screen.getByRole('button', { name: /sign out \(this device\)/i }))

    expect(signOut).toHaveBeenCalledTimes(1)
    expect(signOut).toHaveBeenCalledWith({ scope: 'local' })
  })

  it('calls signOut with scope: "global" when "All Devices" is clicked', async () => {
    const user = userEvent.setup()
    const signOut = vi.fn().mockResolvedValue(undefined)
    renderSettingsPage({ signOut })

    await user.click(screen.getByRole('button', { name: /sign out of all devices/i }))

    expect(signOut).toHaveBeenCalledTimes(1)
    // CRITICAL: must be { scope: 'global' } — the old bug was calling
    // signOut() with no args, which defaults to scope: 'local'
    expect(signOut).toHaveBeenCalledWith({ scope: 'global' })
  })

  it('does NOT call signOut with default scope when "All Devices" is clicked (regression)', async () => {
    const user = userEvent.setup()
    const signOut = vi.fn().mockResolvedValue(undefined)
    renderSettingsPage({ signOut })

    await user.click(screen.getByRole('button', { name: /sign out of all devices/i }))

    // The old bug: signOut was called with NO arguments
    expect(signOut).not.toHaveBeenCalledWith()
    // Must explicitly pass { scope: 'global' }
    expect(signOut).toHaveBeenCalledWith({ scope: 'global' })
  })
})
