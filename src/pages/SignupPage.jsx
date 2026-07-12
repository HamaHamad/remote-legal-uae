import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Mail, Lock, User, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import {
  validatePassword,
  passwordStrengthLabel,
  passwordStrengthColor,
  isValidEmail,
  validateFullName,
  validatePasswordMatch,
} from '@/lib/validation'

export function SignupPage() {
  const { t } = useTranslation()
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  // Live password strength (memoized so it only recomputes when password changes)
  const passwordCheck = useMemo(() => validatePassword(form.password), [form.password])

  const update = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }))
    setErrors((v) => ({ ...v, [field]: '' }))
  }

  // ─── Validation ─────────────────────────────────────────────────
  const validate = () => {
    const e = {}

    // Full name
    const nameErr = validateFullName(form.fullName)
    if (nameErr) e.fullName = nameErr

    // Email
    if (!form.email.trim()) e.email = t('errors.emailRequired')
    else if (!isValidEmail(form.email)) e.email = t('errors.invalidEmail')

    // Password — enforce full policy (not just length)
    if (!form.password) {
      e.password = t('errors.passwordRequired')
    } else if (!passwordCheck.valid) {
      e.password = passwordCheck.suggestions[0] || 'Password is too weak'
    }

    // Confirm password
    const matchErr = validatePasswordMatch(form.password, form.confirmPassword)
    if (matchErr) e.confirmPassword = matchErr

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
      email: form.email,
      password: form.password,
      fullName: form.fullName,
      // NOTE: role is intentionally omitted — server hardcodes 'client'.
      // Admins/partners are promoted post-signup via set_user_role() RPC.
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
            Your account is ready. Redirecting to login…
          </p>
          <div className="mt-5 h-1 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full bg-gold-500 rounded-full"
              style={{ animation: 'countdown 3s linear forwards', width: '100%' }}
            />
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
            <p className="text-sm text-[var(--text-secondary)]">{t('auth.signupSubtitle')}</p>
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
              />

              {/* Live password strength indicator */}
              {form.password && (
                <div className="px-1 -mt-2 mb-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="flex-1 flex gap-1">
                      {[0, 1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="h-1 flex-1 rounded-full transition-all duration-300"
                          style={{
                            backgroundColor:
                              i < passwordCheck.score
                                ? passwordStrengthColor(passwordCheck.score)
                                : 'rgba(255,255,255,0.08)',
                          }}
                        />
                      ))}
                    </div>
                    <span
                      className="text-[10px] font-medium"
                      style={{ color: passwordStrengthColor(passwordCheck.score) }}
                    >
                      {passwordStrengthLabel(passwordCheck.score)}
                    </span>
                  </div>
                  {/* Requirement checklist */}
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-[var(--text-muted)]">
                    <span style={{ color: passwordCheck.checks.length ? '#22c55e' : undefined }}>
                      {passwordCheck.checks.length ? '✓' : '○'} 8+ chars
                    </span>
                    <span style={{ color: passwordCheck.checks.upper ? '#22c55e' : undefined }}>
                      {passwordCheck.checks.upper ? '✓' : '○'} Uppercase
                    </span>
                    <span style={{ color: passwordCheck.checks.lower ? '#22c55e' : undefined }}>
                      {passwordCheck.checks.lower ? '✓' : '○'} Lowercase
                    </span>
                    <span style={{ color: passwordCheck.checks.digit ? '#22c55e' : undefined }}>
                      {passwordCheck.checks.digit ? '✓' : '○'} Number
                    </span>
                    <span style={{ color: passwordCheck.checks.special ? '#22c55e' : undefined }}>
                      {passwordCheck.checks.special ? '✓' : '○'} Special
                    </span>
                  </div>
                </div>
              )}

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

              {/* Role note — clients can sign up directly; partners/admins are invited */}
              <div className="rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] p-3.5">
                <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed">
                  <span className="text-[var(--text-primary)] font-medium">
                    👤 {t('auth.roleClient')}
                  </span>
                  <br />
                  {t('auth.roleDescription') ||
                    'Submit and track legal cases. Specialist and admin accounts are created by invitation only.'}
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
            <Link
              to="/terms-of-service"
              className="text-gold-500/70 hover:text-gold-400 transition-colors"
            >
              {t('auth.termsLink')}
            </Link>{' '}
            {t('auth.andText')}{' '}
            <Link
              to="/privacy-policy"
              className="text-gold-500/70 hover:text-gold-400 transition-colors"
            >
              {t('auth.privacyLink')}
            </Link>
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
      <path d="M14 3V25" stroke="#D99D18" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M8 3H20" stroke="#D99D18" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M14 3L5 11" stroke="#D99D18" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M14 3L23 11" stroke="#D99D18" strokeWidth="1.6" strokeLinecap="round" />
      <path
        d="M3 14C3 14 4 18 8 18C12 18 13 14 13 14"
        stroke="#D99D18"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M15 14C15 14 16 18 20 18C24 18 25 14 25 14"
        stroke="#D99D18"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path d="M10 25H18" stroke="#D99D18" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

export default SignupPage
