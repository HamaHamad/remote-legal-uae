// src/lib/validation.js
// Shared validation utilities for forms.
// Centralizes the password policy, email format, and other common
// validators so they're consistent across SignupPage, LoginPage,
// ResetPasswordPage, and ProfilePage.

/**
 * Email format validation.
 * Uses a pragmatic regex that catches most invalid emails without
 * being overly strict (RFC 5322 is too complex for a regex).
 */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidEmail(email) {
  return EMAIL_REGEX.test(email)
}

/**
 * Password policy:
 *   - Minimum 8 characters
 *   - At least 1 uppercase letter
 *   - At least 1 lowercase letter
 *   - At least 1 digit
 *   - At least 1 special character from !@#$%^&*()_+-=[]{}|;:,.<>?
 *
 * Returns { valid, score, checks, suggestions } where:
 *   valid: boolean — true if all checks pass
 *   score: 0-4 — number of checks that pass (0=very weak, 4=strong)
 *   checks: { length, upper, lower, digit, special } — booleans
 *   suggestions: string[] — what to add to meet the policy
 */
export function validatePassword(password) {
  if (!password) password = ''

  const checks = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    digit: /\d/.test(password),
    special: /[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/.test(password),
  }

  const score = Object.values(checks).filter(Boolean).length
  const valid = Object.values(checks).every(Boolean)

  const suggestions = []
  if (!checks.length) suggestions.push('Use at least 8 characters')
  if (!checks.upper) suggestions.push('Add an uppercase letter')
  if (!checks.lower) suggestions.push('Add a lowercase letter')
  if (!checks.digit) suggestions.push('Add a number')
  if (!checks.special) suggestions.push('Add a special character (!@#$...)')

  return { valid, score, checks, suggestions }
}

/**
 * Password strength label for UI display.
 * @param {number} score — from validatePassword().score (0-4)
 */
export function passwordStrengthLabel(score) {
  if (score <= 1) return 'Very weak'
  if (score === 2) return 'Weak'
  if (score === 3) return 'Good'
  return 'Strong'
}

/**
 * Password strength color for UI display.
 * @param {number} score — from validatePassword().score (0-4)
 */
export function passwordStrengthColor(score) {
  if (score <= 1) return '#ef4444' // red
  if (score === 2) return '#f59e0b' // amber
  if (score === 3) return '#eab308' // yellow
  return '#22c55e' // green
}

/**
 * Validate a full name (not empty, reasonable length).
 */
export function validateFullName(name) {
  if (!name || !name.trim()) return 'Name is required'
  if (name.trim().length < 2) return 'Name must be at least 2 characters'
  if (name.trim().length > 100) return 'Name must be less than 100 characters'
  return null
}

/**
 * Validate that two passwords match.
 */
export function validatePasswordMatch(password, confirmPassword) {
  if (!confirmPassword) return 'Please confirm your password'
  if (password !== confirmPassword) return 'Passwords do not match'
  return null
}
