// src/test/setup.js
// Global test setup — runs before every test file.

import '@testing-library/jest-dom/vitest'
import { afterEach, beforeAll, beforeEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// Auto-cleanup RTL renders after each test
afterEach(() => {
  cleanup()
})

// ─── Polyfills for jsdom ──────────────────────────────────────────
// jsdom doesn't implement matchMedia (used by some libraries)
beforeAll(() => {
  if (!window.matchMedia) {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
  }

  // jsdom doesn't implement IntersectionObserver
  if (!window.IntersectionObserver) {
    window.IntersectionObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
      takeRecords: vi.fn().mockReturnValue([]),
    }))
  }

  // jsdom doesn't implement ResizeObserver
  if (!window.ResizeObserver) {
    window.ResizeObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }))
  }

  // scrollTo is not implemented in jsdom
  if (!window.scrollTo) {
    window.scrollTo = vi.fn()
  }
})

// ─── Mock localStorage ────────────────────────────────────────────
// jsdom has localStorage but we want a clean state between tests
beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
})
