import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Mail, Lock, User, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { clsx } from 'clsx'

const ROLES = [
  { value: 'client',  labelKey: 'auth.roleClient',  icon: '👤', desc: 'Submit and track legal cases' },
  { value: 'partner', labelKey: 'auth.rolePartner',  icon: '⚖️', desc: 'Manage and resolve assigned cases' },
]

export function SignupPage() {
  const { t } = useTranslation()
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'client',
  })
  const [errors, setErrors]       = useState({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading]     = useState(false)
  const [success, setSuccess]     = useState(false)

  const update = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }))
    setErrors(v => ({ ...v, [field]: '' }))
  }

  // ─── Validation ─────────────────────────────────────────────────
  const validate = () => {
    const e = {}
    if (!form.fullName.trim())                                     e.fullName = t('errors.nameRequired')
    if (!form.email.trim())                                         e.email = t('errors.emailRequired')
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))      e.email = t('errors.invalidEmail')
    if (!form.password)                                             e.password = t('errors.passwordRequired')
    else if (form.password.length < 8)                             e.password = t('errors.passwordTooShort')
    if (form.password !== form.confirmPassword)                     e.confirmPassword = t('errors.passwordMismatch')
    setErrors(e)
    return Object.keys(e).length === 0
  }

  // ─── Submit ──────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerError('')
    if (!validate()) return

    setLoading(true)
    const { error } = await signUp({
      email:    form.email,
      password: form.password,
      fullName: form.fullName,
      role:     form.role,
    })
    setLoading(false)

    if (error) {
      setServerError(error.message)
      return
    }

    setSuccess(true)
    setTimeout(() => navigate('/login'), 3000)
  }

  if (success) {
    return (
      <div className="min-h-screen auth-bg flex items-center justify-center px-4">
        <div className="glass-panel gold-border rounded-2xl p-8 max-w-sm w-full text-center animate-slide-up shadow-gold">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 mb-5">
            <CheckCircle2 size={32} className="text-green-400" />
          </div>
          <h2 className="font-display text-2xl font-semibold text-[var(--text-primary)] mb-3">
            Account Created!
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mb-2">
            Please check your email to confirm your address. Redirecting to login…
          </p>
          <div className="mt-5 h-1 rounded-full bg-white/5 overflow-hidden">
            <div className="h-full bg-gold-500 animate-[width_3s_linear_forwards] rounded-full" style={{ animation: 'countdown 3s linear forwards' }} />
          </div>
        </div>
        <style>{`@keyframes countdown { from { width: 100%; } to { width: 0%; } }`}</style>
      </div>
    )
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

      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm animate-slide-up">
          {/* Header */}
          <div className="text-center mb-7">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gold-500/10 border border-gold-500/20 mb-5">
              <ScalesLogo large />
            </div>
            <h1 className="font-display text-3xl font-semibold text-[var(--text-primary)] mb-2">
              {t('auth.joinUs')}
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              {t('auth.signupSubtitle')}
            </p>
          </div>

          {/* Card */}
          <div className="glass-panel rounded-2xl p-6 gold-border shadow-gold">
            {serverError && (
              <div className="mb-5 flex items-start gap-3 p-3.5 rounded-xl bg-red-500/8 border border-red-500/20 text-red-400 text-sm animate-fade-in">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{serverError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <Input
                label={t('auth.fullName')}
                icon={User}
                placeholder={t('auth.namePlaceholder')}
                value={form.fullName}
                onChange={update('fullName')}
                error={errors.fullName}
                required
                autoFocus
              />

              <Input
                label={t('auth.email')}
                type="email"
                icon={Mail}
                placeholder={t('auth.emailPlaceholder')}
                value={form.email}
                onChange={update('email')}
                error={errors.email}
                required
                autoComplete="email"
              />

              <Input
                label={t('auth.password')}
                type="password"
                icon={Lock}
                placeholder={t('auth.passwordPlaceholder')}
                value={form.password}
                onChange={update('password')}
                error={errors.password}
                required
                autoComplete="new-password"
                hint="Minimum 8 characters"
              />

              <Input
                label={t('auth.confirmPassword')}
                type="password"
                icon={Lock}
                placeholder={t('auth.passwordPlaceholder')}
                value={form.confirmPassword}
                onChange={update('confirmPassword')}
                error={errors.confirmPassword}
                required
                autoComplete="new-password"
              />

              {/* Role selection */}
              <div>
                <label className="text-sm font-medium text-[var(--text-secondary)] tracking-wide block mb-2">
                  {t('auth.selectRole')} <span className="text-gold-400">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {ROLES.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, role: r.value }))}
                      className={clsx(
                        'flex flex-col items-center gap-1.5 p-3 rounded-xl border text-sm font-medium transition-all duration-200 text-center',
                        form.role === r.value
                          ? 'bg-gold-500/10 border-gold-500/40 text-gold-400'
                          : 'bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-secondary)] hover:border-white/15 hover:text-[var(--text-primary)]',
                      )}
                    >
                      <span className="text-xl leading-none">{r.icon}</span>
                      <span>{t(r.labelKey)}</span>
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-[var(--text-muted)] mt-1.5 px-1">
                  {t('auth.roleDescription')}
                </p>
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
                {loading ? t('auth.creatingAccount') : t('auth.signup')}
              </Button>
            </form>

            <div className="ornament-line my-5 text-[10px] uppercase tracking-widest">
              {t('auth.haveAccount')}
            </div>

            <Link to="/login">
              <Button variant="outline" fullWidth size="md">
                {t('auth.loginLink')}
              </Button>
            </Link>
          </div>

          <p className="text-center text-[11px] text-[var(--text-muted)] mt-5 px-4 leading-relaxed">
            {t('auth.termsAgreement')}{' '}
            <a href="#" className="text-gold-500/70 hover:text-gold-400 transition-colors">
              {t('auth.termsLink')}
            </a>{' '}
            {t('auth.andText')}{' '}
            <a href="#" className="text-gold-500/70 hover:text-gold-400 transition-colors">
              {t('auth.privacyLink')}
            </a>
          </p>
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

export default SignupPage
