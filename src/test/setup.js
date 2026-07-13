// src/test/setup.js
// Global test setup — runs before every test file.

import '@testing-library/jest-dom/vitest'
import { afterEach, beforeAll, beforeEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

// ─── Load the English locale for realistic test translations ──────
const __dirname = dirname(fileURLToPath(import.meta.url))
const enLocale = JSON.parse(readFileSync(join(__dirname, '../i18n/locales/en.json'), 'utf-8'))

/**
 * Resolve a dotted i18n key against the loaded locale object.
 * Returns the key itself if not found (so tests can detect missing keys).
 */
function resolveKey(obj, key) {
  return key.split('.').reduce((acc, part) => {
    if (acc && typeof acc === 'object' && part in acc) return acc[part]
    return undefined
  }, obj)
}

/**
 * Interpolate {{variable}} placeholders in a translation string.
 */
function interpolate(str, options = {}) {
  if (typeof str !== 'string') return str
  return str.replace(/\{\{(\w+)\}\}/g, (_, name) => options[name] ?? '')
}

// ─── Mock react-i18next ──────────────────────────────────────────
// Returns the actual English translation for each key, falling back
// to defaultValue (if provided) or the key itself. This lets tests
// assert on real text like "Email is required" while staying fast.
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, options) => {
      const value = resolveKey(enLocale, key)
      if (value !== undefined) return interpolate(value, options)
      if (options && 'defaultValue' in options) return interpolate(options.defaultValue, options)
      return key
    },
    i18n: { language: 'en', changeLanguage: vi.fn() },
    ready: true,
  }),
  initReactI18next: { type: '3rdParty', init: () => {} },
}))

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
