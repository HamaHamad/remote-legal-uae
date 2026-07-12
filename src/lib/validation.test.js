// src/lib/validation.test.js
import { describe, it, expect } from 'vitest'
import {
  isValidEmail,
  validatePassword,
  passwordStrengthLabel,
  passwordStrengthColor,
  validateFullName,
  validatePasswordMatch,
} from './validation'

describe('isValidEmail', () => {
  it('accepts standard emails', () => {
    expect(isValidEmail('test@example.com')).toBe(true)
    expect(isValidEmail('user.name@domain.co.uk')).toBe(true)
    expect(isValidEmail('user+tag@sub.domain.org')).toBe(true)
  })

  it('rejects invalid emails', () => {
    expect(isValidEmail('')).toBe(false)
    expect(isValidEmail('not-an-email')).toBe(false)
    expect(isValidEmail('missing@domain')).toBe(false)
    expect(isValidEmail('missing-domain@.com')).toBe(false)
    expect(isValidEmail('spaces in@email.com')).toBe(false)
  })
})

describe('validatePassword', () => {
  it('rejects empty passwords', () => {
    const result = validatePassword('')
    expect(result.valid).toBe(false)
    expect(result.score).toBe(0)
    expect(result.suggestions.length).toBeGreaterThan(0)
  })

  it('rejects passwords shorter than 8 chars even if they have all char types', () => {
    const result = validatePassword('Aa1!')
    expect(result.valid).toBe(false)
    expect(result.checks.length).toBe(false)
    expect(result.checks.upper).toBe(true)
    expect(result.checks.lower).toBe(true)
    expect(result.checks.digit).toBe(true)
    expect(result.checks.special).toBe(true)
  })

  it('rejects 8-char passwords missing uppercase', () => {
    const result = validatePassword('abcdefg1!')
    expect(result.valid).toBe(false)
    expect(result.checks.upper).toBe(false)
    expect(result.checks.length).toBe(true)
  })

  it('rejects 8-char passwords missing lowercase', () => {
    const result = validatePassword('ABCDEFG1!')
    expect(result.valid).toBe(false)
    expect(result.checks.lower).toBe(false)
  })

  it('rejects 8-char passwords missing a digit', () => {
    const result = validatePassword('Abcdefgh!')
    expect(result.valid).toBe(false)
    expect(result.checks.digit).toBe(false)
  })

  it('rejects 8-char passwords missing a special character', () => {
    const result = validatePassword('Abcdefg1')
    expect(result.valid).toBe(false)
    expect(result.checks.special).toBe(false)
  })

  it('accepts a strong password meeting all criteria', () => {
    const result = validatePassword('Str0ng!Pass')
    expect(result.valid).toBe(true)
    expect(result.score).toBe(5)
    expect(result.suggestions).toEqual([])
  })

  it('scores weak passwords correctly', () => {
    expect(validatePassword('abc').score).toBe(1) // only lowercase
    expect(validatePassword('Abcdefgh').score).toBe(3) // length + upper + lower, no digit/special
    expect(validatePassword('Abcdefg1').score).toBe(4) // length + upper + lower + digit
    expect(validatePassword('Abcdefg1!').score).toBe(5) // all 5 checks
  })
})

describe('passwordStrengthLabel', () => {
  it('returns "Very weak" for score 0-1', () => {
    expect(passwordStrengthLabel(0)).toBe('Very weak')
    expect(passwordStrengthLabel(1)).toBe('Very weak')
  })

  it('returns "Weak" for score 2', () => {
    expect(passwordStrengthLabel(2)).toBe('Weak')
  })

  it('returns "Good" for score 3', () => {
    expect(passwordStrengthLabel(3)).toBe('Good')
  })

  it('returns "Strong" for score 4', () => {
    expect(passwordStrengthLabel(4)).toBe('Strong')
  })
})

describe('passwordStrengthColor', () => {
  it('returns red for very weak passwords', () => {
    expect(passwordStrengthColor(0)).toBe('#ef4444')
    expect(passwordStrengthColor(1)).toBe('#ef4444')
  })

  it('returns green for strong passwords', () => {
    expect(passwordStrengthColor(4)).toBe('#22c55e')
  })
})

describe('validateFullName', () => {
  it('returns error for empty name', () => {
    expect(validateFullName('')).toBe('Name is required')
    expect(validateFullName('   ')).toBe('Name is required')
  })

  it('returns error for very short names', () => {
    expect(validateFullName('A')).toBe('Name must be at least 2 characters')
  })

  it('returns null for valid names', () => {
    expect(validateFullName('Ahmed Al-Rashid')).toBeNull()
    expect(validateFullName('John')).toBeNull()
  })
})

describe('validatePasswordMatch', () => {
  it('returns error when confirm is empty', () => {
    expect(validatePasswordMatch('password', '')).toBe('Please confirm your password')
  })

  it('returns error when passwords do not match', () => {
    expect(validatePasswordMatch('password1', 'password2')).toBe('Passwords do not match')
  })

  it('returns null when passwords match', () => {
    expect(validatePasswordMatch('Str0ng!Pass', 'Str0ng!Pass')).toBeNull()
  })
})
