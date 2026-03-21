import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import LanguageSwitcher from '@/components/LanguageSwitcher'

function ScalesLogo() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 3v18M3 9l9-6 9 6M5 9l-2 6h4L5 9zM19 9l-2 6h4l-2-6z" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function PasswordInput({ label, value, onChange, placeholder }) {
  const [show, setShow] = useState(false)
  return (
    <div>
      {label && (
        <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        <div className="absolute start-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none">
          <Lock size={15} />
        </div>
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full ps-10 pe-10 py-3 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-gold-500 focus:shadow-[0_0_0_3px_rgba(217,157,24,0.12)] transition-all"
        />
        <button
          type="button"
          onClick={() => setShow(v => !v)}
          className="absolute end-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        >
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </div>
  )
}

function StrengthBar({ password }) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ]
  const score = checks.filter(Boolean).length
  const colors = ['bg-red-500', 'bg-orange-500', 'bg-amber-400', 'bg-green-400']
  const labels = ['Too weak', 'Weak', 'Good', 'Strong']

  if (!password) return null
  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {[0,1,2,3].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i < score ? colors[score-1] : 'bg-white/10'}`} />
        ))}
      </div>
      <p className={`text-[11px] ${score <= 1 ? 'text-red-400' : score === 2 ? 'text-amber-400' : score === 3 ? 'text-amber-300' : 'text-green-400'}`}>
        {labels[score-1] || ''}
      </p>
    </div>
  )
}

export function ResetPasswordPage() {
  const navigate = useNavigate()

  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [loading,   setLoading]   = useState(false)
  const [done,      setDone]      = useState(false)
  const [error,     setError]     = useState('')
  const [tokenValid, setTokenValid] = useState(false)
  const [checking,  setChecking]  = useState(true)

  // Supabase sends the token in the URL hash — onAuthStateChange fires PASSWORD_RECOVERY
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setTokenValid(true)
        setChecking(false)
      } else if (event === 'SIGNED_IN' && session) {
        // Also handle if already signed in from token
        setTokenValid(true)
        setChecking(false)
      }
    })

    // Safety: if no event fires in 3s, assume bad/expired link
    const timer = setTimeout(() => {
      setChecking(false)
    }, 3000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timer)
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    if (password !== confirm) { setError('Passwords do not match'); return }

    setLoading(true)

    const { error: updateErr } = await supabase.auth.updateUser({ password })

    setLoading(false)

    if (updateErr) {
      setError(updateErr.message)
    } else {
      setDone(true)
      setTimeout(() => navigate('/dashboard'), 2500)
    }
  }

  // ── Checking token ─────────────────────────────────────────────
  if (checking) {
    return (
      <div className="min-h-screen auth-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="flex gap-1.5">
            {[0,1,2].map(i => (
              <div key={i} className="w-2 h-2 rounded-full bg-gold-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
          <p className="text-sm text-[var(--text-muted)]">Verifying reset link…</p>
        </div>
      </div>
    )
  }

  // ── Invalid / expired link ─────────────────────────────────────
  if (!tokenValid) {
    return (
      <div className="min-h-screen auth-bg flex items-center justify-center px-4">
        <div className="glass-panel rounded-2xl p-8 max-w-sm w-full text-center animate-slide-up">
          <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={28} className="text-red-400" />
          </div>
          <h2 className="font-display text-2xl font-semibold text-[var(--text-primary)] mb-2">
            Link expired or invalid
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mb-6">
            This password reset link has expired or already been used. Please request a new one.
          </p>
          <Button onClick={() => navigate('/forgot-password')} fullWidth>
            Request New Reset Link
          </Button>
        </div>
      </div>
    )
  }

  // ── Success ────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="min-h-screen auth-bg flex items-center justify-center px-4">
        <div className="glass-panel gold-border rounded-2xl p-8 max-w-sm w-full text-center animate-slide-up shadow-gold">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 mb-5">
            <CheckCircle size={32} className="text-green-400" />
          </div>
          <h2 className="font-display text-2xl font-semibold text-[var(--text-primary)] mb-2">
            Password updated!
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Redirecting you to your dashboard…
          </p>
          <div className="mt-5 h-1 rounded-full bg-white/5 overflow-hidden">
            <div className="h-full bg-gold-500 rounded-full" style={{ animation: 'countdown 2.5s linear forwards', width: '100%' }} />
          </div>
          <style>{`@keyframes countdown{from{width:100%}to{width:0%}}`}</style>
        </div>
      </div>
    )
  }

  // ── Form ───────────────────────────────────────────────────────
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
              <Lock size={22} className="text-gold-400" />
            </div>
            <h1 className="font-display text-3xl font-semibold text-[var(--text-primary)] mb-2">
              Set new password
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Choose a strong password for your account.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="glass-panel rounded-2xl p-6 space-y-4">
            {error && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/8 border border-red-500/20 text-red-400 text-sm animate-fade-in">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <PasswordInput
              label="New Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="At least 8 characters"
            />

            {password && <StrengthBar password={password} />}

            <PasswordInput
              label="Confirm Password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Repeat password"
            />

            {confirm && password !== confirm && (
              <p className="text-xs text-red-400">Passwords don't match</p>
            )}

            <Button
              type="submit"
              fullWidth
              size="lg"
              loading={loading}
              disabled={!password || !confirm || password !== confirm}
            >
              {loading ? 'Updating…' : 'Update Password'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ResetPasswordPage
