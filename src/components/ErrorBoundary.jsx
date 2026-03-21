import { Component } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

/**
 * ErrorBoundary
 * Wraps the entire app — catches any unhandled JS/React errors
 * and shows a friendly recovery screen instead of a blank white page.
 *
 * Must be a class component (React hooks can't catch render errors).
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, info: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    this.setState({ info })
    // Log to console in development
    if (import.meta.env.DEV) {
      console.error('[ErrorBoundary] Caught error:', error)
      console.error('[ErrorBoundary] Component stack:', info?.componentStack)
    }
    // In production you'd send this to an error tracking service (Sentry etc.)
  }

  handleReload = () => {
    window.location.reload()
  }

  handleHome = () => {
    this.setState({ hasError: false, error: null, info: null })
    window.location.href = '/'
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    const isDev = import.meta.env.DEV
    const msg   = this.state.error?.message || 'An unexpected error occurred'

    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#060c1a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          fontFamily: "'DM Sans', system-ui, sans-serif",
        }}
      >
        <div
          style={{
            maxWidth: '420px',
            width: '100%',
            background: 'rgba(12,24,41,0.9)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '20px',
            padding: '40px',
            textAlign: 'center',
          }}
        >
          {/* Icon */}
          <div
            style={{
              width: '64px', height: '64px',
              borderRadius: '50%',
              background: 'rgba(239,68,68,0.08)',
              border: '1.5px solid rgba(239,68,68,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
            }}
          >
            <AlertTriangle style={{ width: 28, height: 28, color: '#ef4444' }} />
          </div>

          {/* Title */}
          <h1
            style={{
              fontSize: '22px', fontWeight: 700,
              color: '#f5f0e8', margin: '0 0 10px',
              fontFamily: "'Cormorant Garamond', Georgia, serif",
            }}
          >
            Something went wrong
          </h1>

          <p style={{ fontSize: '14px', color: 'rgba(232,226,216,0.55)', lineHeight: 1.65, margin: '0 0 24px' }}>
            An unexpected error occurred. Your data is safe — please try refreshing the page.
          </p>

          {/* Dev error details */}
          {isDev && msg && (
            <div
              style={{
                background: 'rgba(239,68,68,0.06)',
                border: '1px solid rgba(239,68,68,0.15)',
                borderRadius: '10px',
                padding: '12px 14px',
                marginBottom: '24px',
                textAlign: 'start',
              }}
            >
              <p style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(239,68,68,0.7)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                Error (dev only)
              </p>
              <p style={{ fontSize: '12px', color: '#ef4444', fontFamily: 'monospace', wordBreak: 'break-all', lineHeight: 1.5 }}>
                {msg}
              </p>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button
              onClick={this.handleReload}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '10px 20px', borderRadius: '10px',
                background: 'linear-gradient(135deg, #c9992e, #e8b84b)',
                color: '#060c1a', fontWeight: 700, fontSize: '13px',
                border: 'none', cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <RefreshCw style={{ width: 13, height: 13 }} />
              Reload Page
            </button>
            <button
              onClick={this.handleHome}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '10px 20px', borderRadius: '10px',
                background: 'transparent',
                color: 'rgba(232,226,216,0.6)',
                border: '1px solid rgba(255,255,255,0.1)',
                fontWeight: 500, fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              <Home style={{ width: 13, height: 13 }} />
              Go Home
            </button>
          </div>
        </div>
      </div>
    )
  }
}

export default ErrorBoundary
