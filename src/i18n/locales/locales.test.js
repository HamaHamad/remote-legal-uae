// src/i18n/locales.test.js
// Verify all locale files have the same key structure.
// Catches missing translations before they ship to production.
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const LOCALES_DIR = __dirname // locales.test.js is already in src/i18n/locales/

function loadLocale(code) {
  const filePath = join(LOCALES_DIR, `${code}.json`)
  return JSON.parse(readFileSync(filePath, 'utf-8'))
}

const en = loadLocale('en')
const ar = loadLocale('ar')
const hi = loadLocale('hi')
const ur = loadLocale('ur')
const tl = loadLocale('tl')

const locales = { en, ar, hi, ur, tl }

// Recursively collect all keys from a nested object
// Returns keys as dot-paths: "auth.email" → value
function collectKeys(obj, prefix = '') {
  const keys = []
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys.push(...collectKeys(value, path))
    } else {
      keys.push(path)
    }
  }
  return keys.sort()
}

describe('i18n locale parity', () => {
  const enKeys = collectKeys(en)

  it('English locale has keys', () => {
    expect(enKeys.length).toBeGreaterThan(100)
  })

  for (const [localeCode, localeData] of Object.entries(locales)) {
    if (localeCode === 'en') continue

    it(`${localeCode} locale has the same keys as English`, () => {
      const localeKeys = collectKeys(localeData)
      const missing = enKeys.filter((k) => !localeKeys.includes(k))
      const extra = localeKeys.filter((k) => !enKeys.includes(k))

      if (missing.length > 0) {
        console.error(`Locale ${localeCode} is missing keys:`, missing)
      }
      if (extra.length > 0) {
        console.error(`Locale ${localeCode} has extra keys:`, extra)
      }

      expect(missing).toEqual([])
      expect(extra).toEqual([])
    })
  }
})
