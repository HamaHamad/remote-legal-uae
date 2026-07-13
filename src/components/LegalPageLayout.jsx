// src/components/LegalPageLayout.jsx
// Reusable layout for legal pages (Privacy Policy, ToS, Cookie Policy).
// Provides consistent styling, a back-to-top button, and last-updated date.

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowUp } from 'lucide-react'
import { clsx } from 'clsx'

export function LegalPageLayout({ title, lastUpdated, children }) {
  const [showScrollTop, setShowScrollTop] = useState(false)

  useEffect(() => {
    const handler = () => setShowScrollTop(window.scrollY > 400)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <div className="min-h-screen auth-bg">
      {/* Header */}
      <header className="border-b border-[var(--border)] sticky top-0 z-10 backdrop-blur-md bg-[var(--bg-primary)]/80">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-gold-400 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>
          <span className="text-xs text-[var(--text-muted)]">Last updated: {lastUpdated}</span>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[var(--text-primary)] mb-2">
          {title}
        </h1>
        <div className="w-16 h-0.5 bg-gold-500/40 rounded-full mb-10" />

        <div className="prose-legal">{children}</div>

        {/* Footer links */}
        <div className="mt-16 pt-8 border-t border-[var(--border)] flex flex-wrap gap-4 text-sm">
          <Link
            to="/privacy-policy"
            className="text-[var(--text-secondary)] hover:text-gold-400 transition-colors"
          >
            Privacy Policy
          </Link>
          <Link
            to="/terms-of-service"
            className="text-[var(--text-secondary)] hover:text-gold-400 transition-colors"
          >
            Terms of Service
          </Link>
          <Link
            to="/cookie-policy"
            className="text-[var(--text-secondary)] hover:text-gold-400 transition-colors"
          >
            Cookie Policy
          </Link>
        </div>
      </main>

      {/* Scroll to top */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className={clsx(
            'fixed bottom-6 right-6 w-11 h-11 rounded-full',
            'bg-gold-500/10 border border-gold-500/30',
            'flex items-center justify-center',
            'text-gold-400 hover:bg-gold-500/20 transition-all',
            'shadow-lg animate-fade-in',
          )}
          aria-label="Scroll to top"
        >
          <ArrowUp size={18} />
        </button>
      )}
    </div>
  )
}

export default LegalPageLayout
