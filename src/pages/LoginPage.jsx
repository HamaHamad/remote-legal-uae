import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { LegalDisclaimer } from '@/components/LegalDisclaimer'
export function LoginPage() {
  const { t } = useTranslation()
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)

  const from = location.state?.from?.pathname || null

  // ─── Validation ─────────────────────────────────────────────────
  const validate = () => {
    const e = {}
    if (!form.email.trim())                             e.email = t('errors.emailRequired')
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = t('errors.invalidEmail')
    if (!form.password)                                 e.password = t('errors.passwordRequired')
    setErrors(e)
    return Object.keys(e).length === 0
  }

  // ─── Submit ──────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerError('')
    if (!validate()) return

    setLoading(true)
    const { data, error } = await signIn({ email: form.email, password: form.password })
    setLoading(false)

    if (error) {
      setServerError(error.message)
      return
    }

    // Redirect based on role
    const role = data?.user?.user_metadata?.role
    const destMap = { admin: '/admin', partner: '/partner', client: '/dashboard' }
    navigate(from || destMap[role] || '/dashboard', { replace: true })
  }

  return (
    <div className="min-h-screen auth-bg flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-2.5">
          <ScalesLogo />
          <span className="font-display text-lg font-semibold text-gold-400 hidden sm:block">
            Remote Legal · UAE
          </span>
        </div>
        <LanguageSwitcher />
      </header>

      {/* Main */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm animate-slide-up">

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gold-500/10 border border-gold-500/20 mb-5 animate-pulse-gold">
              <ScalesLogo large />
            </div>
            <h1 className="font-display text-3xl font-semibold text-[var(--text-primary)] mb-2">
              {t('auth.welcomeBack')}
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              {t('auth.loginSubtitle')}
            </p>
          </div>

          {/* Card */}
          <div className="glass-panel rounded-2xl p-6 gold-border shadow-gold">
            {/* Server error */}
            {serverError && (
              <div className="mb-5 flex items-start gap-3 p-3.5 rounded-xl bg-red-500/8 border border-red-500/20 text-red-400 text-sm animate-fade-in">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{serverError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <Input
                label={t('auth.email')}
                type="email"
                icon={Mail}
                placeholder={t('auth.emailPlaceholder')}
                value={form.email}
                onChange={e => { setForm(f => ({ ...f, email: e.target.value })); setErrors(v => ({ ...v, email: '' })) }}
                error={errors.email}
                required
                autoComplete="email"
                autoFocus
              />

              <Input
                label={t('auth.password')}
                type="password"
                icon={Lock}
                placeholder={t('auth.passwordPlaceholder')}
                value={form.password}
                onChange={e => { setForm(f => ({ ...f, password: e.target.value })); setErrors(v => ({ ...v, password: '' })) }}
                error={errors.password}
                required
                autoComplete="current-password"
              />

              <div className="flex justify-end">
                <Link
                  to="/forgot-password"
                  className="text-xs text-[var(--text-muted)] hover:text-gold-400 transition-colors"
                >
                  {t('auth.forgotPassword')}
                </Link>
              </div>

              <Button
                type="submit"
                fullWidth
                size="lg"
                loading={loading}
                icon={ArrowRight}
                iconPosition="end"
                className="mt-2"
              >
                {loading ? t('auth.loggingIn') : t('auth.login')}
              </Button>
            </form>

            {/* Ornament divider */}
            <div className="ornament-line my-5 text-[10px] uppercase tracking-widest">
              {t('auth.noAccount')}
            </div>

            <Link to="/signup">
              <Button variant="outline" fullWidth size="md">
                {t('auth.signupLink')}
              </Button>
            </Link>
          </div>

          {/* Decorative tag */}
          <p className="text-center text-xs text-[var(--text-muted)] mt-6">
            🔒 Secured by Supabase · End-to-end encrypted
          </p>

          <div className="mt-4">
            <LegalDisclaimer variant="inline" />
          </div>
        </div>
      </div>
    </div>
  )
}

function ScalesLogo({ large = false }) {
  const size = large ? 28 : 20
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <path d="M14 3V25" stroke="#D99D18" strokeWidth="1.6" strokeLinecap="round"/>
      <path d="M8 3H20" stroke="#D99D18" strokeWidth="1.6" strokeLinecap="round"/>
      <path d="M14 3L5 11" stroke="#D99D18" strokeWidth="1.6" strokeLinecap="round"/>
      <path d="M14 3L23 11" stroke="#D99D18" strokeWidth="1.6" strokeLinecap="round"/>
      <path d="M3 14C3 14 4 18 8 18C12 18 13 14 13 14" stroke="#D99D18" strokeWidth="1.6" strokeLinecap="round"/>
      <path d="M15 14C15 14 16 18 20 18C24 18 25 14 25 14" stroke="#D99D18" strokeWidth="1.6" strokeLinecap="round"/>
      <path d="M10 25H18" stroke="#D99D18" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  )
}

export default LoginPage
