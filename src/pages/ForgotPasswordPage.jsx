import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import LanguageSwitcher from '@/components/LanguageSwitcher'

function ScalesLogo() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path
        d="M12 3v18M3 9l9-6 9 6M5 9l-2 6h4L5 9zM19 9l-2 6h4l-2-6z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function ForgotPasswordPage() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim()) {
      setError('Email is required')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email')
      return
    }

    setLoading(true)
    setError('')

    const redirectTo = `${window.location.origin}/reset-password`

    const { error: supaErr } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    })

    setLoading(false)

    if (supaErr) {
      setError(supaErr.message)
    } else {
      setSent(true)
    }
  }

  // ── Success screen ─────────────────────────────────────────────
  if (sent) {
    return (
      <div className="min-h-screen auth-bg flex flex-col">
        <header className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gold-500/10 border border-gold-500/20 flex items-center justify-center text-gold-400">
              <ScalesLogo />
            </div>
            <span className="font-display text-lg font-semibold text-gold-400 hidden sm:block">
              Remote Legal · UAE
            </span>
          </div>
          <LanguageSwitcher />
        </header>

        <div className="flex-1 flex items-center justify-center px-4 py-10">
          <div className="glass-panel gold-border rounded-2xl p-8 max-w-sm w-full text-center animate-slide-up shadow-gold">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 mb-5">
              <CheckCircle size={32} className="text-green-400" />
            </div>
            <h2 className="font-display text-2xl font-semibold text-[var(--text-primary)] mb-3">
              Check your email
            </h2>
            <p className="text-sm text-[var(--text-secondary)] mb-1 leading-relaxed">
              We sent a password reset link to
            </p>
            <p className="text-sm font-semibold text-gold-400 mb-5 break-all">{email}</p>
            <p className="text-xs text-[var(--text-muted)] mb-6">
              Click the link in the email to reset your password. The link expires in 1 hour.
            </p>
            <Link to="/login">
              <Button variant="secondary" fullWidth icon={ArrowLeft}>
                Back to Login
              </Button>
            </Link>
            <button
              onClick={() => setSent(false)}
              className="mt-3 text-xs text-[var(--text-muted)] hover:text-gold-400 transition-colors w-full text-center"
            >
              Didn't receive it? Try again
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Main form ──────────────────────────────────────────────────
  return (
    <div className="min-h-screen auth-bg flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gold-500/10 border border-gold-500/20 flex items-center justify-center text-gold-400">
            <ScalesLogo />
          </div>
          <span className="font-display text-lg font-semibold text-gold-400 hidden sm:block">
            Remote Legal · UAE
          </span>
        </div>
        <LanguageSwitcher />
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm animate-slide-up">
          <div className="text-center mb-7">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gold-500/10 border border-gold-500/20 mb-5">
              <Mail size={24} className="text-gold-400" />
            </div>
            <h1 className="font-display text-3xl font-semibold text-[var(--text-primary)] mb-2">
              Reset your password
            </h1>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              Enter your email and we'll send you a link to reset your password.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="glass-panel rounded-2xl p-6 space-y-5">
            {error && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/8 border border-red-500/20 text-red-400 text-sm animate-fade-in">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              icon={Mail}
              autoFocus
              required
            />

            <Button type="submit" fullWidth size="lg" loading={loading}>
              {loading ? 'Sending…' : 'Send Reset Link'}
            </Button>
          </form>

          <Link to="/login">
            <button className="mt-4 flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-gold-400 transition-colors mx-auto">
              <ArrowLeft size={13} />
              Back to Login
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ForgotPasswordPage
