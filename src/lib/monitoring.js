// src/lib/monitoring.js
// Error tracking (Sentry) + privacy-first analytics (Plausible).
// Both are optional — they only activate if env vars are set and the
// app is running in production.

import { useEffect } from 'react'

const isProd = import.meta.env.VITE_APP_ENV === 'production'
const isDev = !isProd

/**
 * Initialize Sentry error tracking and Plausible analytics.
 * Called once on app startup from main.jsx.
 *
 * Sentry: uses the browser SDK loaded from the CDN. Only activates in
 * production if VITE_SENTRY_DSN is set. Captures unhandled exceptions
 * and React component errors (via ErrorBoundary integration).
 *
 * Plausible: loaded as a <script> tag. Privacy-first — no cookies,
 * no cross-site tracking, no PII. Only activates in production if
 * VITE_PLAUSIBLE_DOMAIN is set.
 */
export function initMonitoring() {
  if (isProd) {
    initSentry()
    initPlausible()
  } else {
    console.info('[monitoring] Development mode — Sentry and Plausible are disabled')
  }
}

function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN
  if (!dsn) {
    console.warn('[monitoring] VITE_SENTRY_DSN not set — error tracking is disabled')
    return
  }

  // Load Sentry from CDN
  const script = document.createElement('script')
  script.src = 'https://browser.sentry-cdn.com/8.22.0/bundle.tracing.replay.min.js'
  script.crossOrigin = 'anonymous'
  script.onload = () => {
    if (window.Sentry) {
      window.Sentry.init({
        dsn,
        environment: import.meta.env.VITE_APP_ENV || 'production',
        release: import.meta.env.VITE_APP_VERSION,
        tracesSampleRate: 0.1, // 10% of transactions traced
        replaysSessionSampleRate: 0.01, // 1% of sessions recorded
        replaysOnErrorSampleRate: 1.0, // 100% of error sessions recorded
        integrations: [
          window.Sentry.browserTracingIntegration(),
          window.Sentry.replayIntegration({
            maskAllText: true,
            blockAllMedia: true,
          }),
        ],
        // Don't send PII
        beforeSend(event) {
          // Scrub email addresses from breadcrumbs
          if (event.request?.headers?.cookie) {
            event.request.headers.cookie = '[REDACTED]'
          }
          return event
        },
      })
      console.info('[monitoring] Sentry initialized')
    }
  }
  document.head.appendChild(script)
}

function initPlausible() {
  const domain = import.meta.env.VITE_PLAUSIBLE_DOMAIN
  if (!domain) {
    console.warn('[monitoring] VITE_PLAUSIBLE_DOMAIN not set — analytics is disabled')
    return
  }

  const script = document.createElement('script')
  script.defer = true
  script.src = 'https://plausible.io/js/script.js'
  script.setAttribute('data-domain', domain)
  document.head.appendChild(script)
  console.info(`[monitoring] Plausible initialized for domain: ${domain}`)
}

/**
 * Manually capture an exception to Sentry.
 * Useful for catching errors in async callbacks that ErrorBoundary
 * doesn't catch.
 */
export function captureException(error, context = {}) {
  if (window.Sentry && isProd) {
    window.Sentry.captureException(error, { extra: context })
  }
  // Always log to console in development
  if (isDev) {
    console.error('[captureException]', error, context)
  }
}

/**
 * Track a custom event in Plausible.
 * @param {string} name - Event name (lowercase, hyphenated)
 * @param {object} props - Optional event properties
 */
export function trackEvent(name, props = {}) {
  if (window.plausible && isProd) {
    window.plausible(name, { props })
  }
  if (isDev) {
    console.debug('[trackEvent]', name, props)
  }
}

/**
 * React hook to set the current user context for Sentry.
 * Call this in a component that has access to the auth state.
 */
export function useSentryUser(user) {
  useEffect(() => {
    if (window.Sentry && isProd && user) {
      window.Sentry.setUser({
        id: user.id,
        email: user.email,
      })
    }
    return () => {
      if (window.Sentry && isProd) {
        window.Sentry.setUser(null)
      }
    }
  }, [user])
}
