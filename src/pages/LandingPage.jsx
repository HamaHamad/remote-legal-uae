import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { clsx } from 'clsx'
import {
  ShieldCheck,
  FileText,
  Users,
  Globe,
  Lock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Scale,
  Brain,
  Sparkles,
  ChevronDown,
  Building2,
  Phone,
  MessageSquare,
} from 'lucide-react'

// ─── WhatsApp (placeholder — change to real number) ───────────────
const WA_NUMBER = '971501234567'
const WA_URL = `https://wa.me/${WA_NUMBER}?text=Hello%2C+I+have+a+question+about+ExpatUAE`

// ─── Language metadata ────────────────────────────────────────────
const LANG_META = {
  en: { flag: '🇬🇧', label: 'EN', dir: 'ltr' },
  ar: { flag: '🇦🇪', label: 'عر', dir: 'rtl' },
  hi: { flag: '🇮🇳', label: 'हि', dir: 'ltr' },
  ur: { flag: '🇵🇰', label: 'ار', dir: 'rtl' },
  tl: { flag: '🇵🇭', label: 'TL', dir: 'ltr' },
}

// ─── Issue types (for the "What's your situation?" selector) ──────
const ISSUE_TYPES = [
  { id: 'banking', icon: '🏦', labelKey: 'landing.issues.banking' },
  { id: 'car', icon: '🚗', labelKey: 'landing.issues.car' },
  { id: 'legal', icon: '⚖️', labelKey: 'landing.issues.legal' },
  { id: 'employment', icon: '💼', labelKey: 'landing.issues.employment' },
  { id: 'visa', icon: '📋', labelKey: 'landing.issues.visa' },
  { id: 'rental', icon: '🏠', labelKey: 'landing.issues.rental' },
  { id: 'travel', icon: '✈️', labelKey: 'landing.issues.travel' },
  { id: 'other', icon: '📝', labelKey: 'landing.issues.other' },
]

// ─── Pricing tiers ────────────────────────────────────────────────
const PRICING_TIERS = [
  {
    id: 'free',
    nameKey: 'landing.pricing.free.name',
    price: null,
    priceLabelKey: 'landing.pricing.free.priceLabel',
    descKey: 'landing.pricing.free.desc',
    features: ['landing.pricing.free.f1', 'landing.pricing.free.f2', 'landing.pricing.free.f3'],
    ctaKey: 'landing.pricing.free.cta',
    highlighted: false,
  },
  {
    id: 'basic',
    nameKey: 'landing.pricing.basic.name',
    price: 'AED 299',
    priceLabelKey: 'landing.pricing.basic.priceLabel',
    descKey: 'landing.pricing.basic.desc',
    features: [
      'landing.pricing.basic.f1',
      'landing.pricing.basic.f2',
      'landing.pricing.basic.f3',
      'landing.pricing.basic.f4',
    ],
    ctaKey: 'landing.pricing.basic.cta',
    highlighted: false,
  },
  {
    id: 'standard',
    nameKey: 'landing.pricing.standard.name',
    price: 'AED 499–599',
    priceLabelKey: 'landing.pricing.standard.priceLabel',
    descKey: 'landing.pricing.standard.desc',
    features: [
      'landing.pricing.standard.f1',
      'landing.pricing.standard.f2',
      'landing.pricing.standard.f3',
      'landing.pricing.standard.f4',
      'landing.pricing.standard.f5',
    ],
    ctaKey: 'landing.pricing.standard.cta',
    highlighted: true,
  },
  {
    id: 'premium',
    nameKey: 'landing.pricing.premium.name',
    price: 'AED 999+',
    priceLabelKey: 'landing.pricing.premium.priceLabel',
    descKey: 'landing.pricing.premium.desc',
    features: [
      'landing.pricing.premium.f1',
      'landing.pricing.premium.f2',
      'landing.pricing.premium.f3',
      'landing.pricing.premium.f4',
      'landing.pricing.premium.f5',
    ],
    ctaKey: 'landing.pricing.premium.cta',
    highlighted: false,
  },
]

function WAIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  )
}

function ScalesLogo({ size = 28 }) {
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

export function LandingPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()

  const [lang, setLangState] = useState(i18n.language || 'en')
  const [langOpen, setLangOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const meta = LANG_META[lang] || LANG_META.en
  const isRTL = ['ar', 'ur'].includes(lang)

  useEffect(() => {
    document.documentElement.dir = meta.dir
    document.documentElement.lang = lang
    return () => {
      document.documentElement.dir = 'ltr'
      document.documentElement.lang = 'en'
    }
  }, [lang, meta.dir])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 500)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const langRef = useRef(null)
  useEffect(() => {
    const handler = (e) => {
      if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const setLang = (l) => {
    setLangState(l)
    i18n.changeLanguage(l)
    localStorage.setItem('rlco-lang', l)
    setLangOpen(false)
  }

  const handleCTA = () => navigate('/signup')

  return (
    <div className="min-h-screen bg-[#060c1a] text-[#e8e2d8] font-sans overflow-x-hidden">
      {/* ── NAVBAR ─────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-[#060c1a]/90 backdrop-blur-xl border-b border-white/8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#c9992e] to-[#e8b84b] flex items-center justify-center text-[#060c1a] font-bold text-sm shadow-lg">
              E
            </div>
            <span className="font-semibold text-[#e8b84b] text-lg tracking-tight">ExpatUAE</span>
          </Link>

          <div className="hidden md:flex items-center gap-6 text-sm text-[#e8e2d8]/60">
            <a href="#how" className="hover:text-[#e8b84b] transition-colors">
              {t('landing.nav.how')}
            </a>
            <a href="#benefits" className="hover:text-[#e8b84b] transition-colors">
              {t('landing.nav.benefits')}
            </a>
            <a href="#pricing" className="hover:text-[#e8b84b] transition-colors">
              {t('landing.nav.pricing')}
            </a>
            <a href="#lawyers" className="hover:text-[#e8b84b] transition-colors">
              {t('landing.nav.lawyers')}
            </a>
            <a href="#faq" className="hover:text-[#e8b84b] transition-colors">
              {t('landing.nav.faq')}
            </a>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative" ref={langRef}>
              <button
                onClick={() => setLangOpen((v) => !v)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/10 text-[#e8e2d8]/60 hover:text-[#e8e2d8] hover:border-white/20 transition-all text-sm"
              >
                <span>{meta.flag}</span>
                <span className="hidden sm:inline">{meta.label}</span>
                <ChevronDown size={12} className="opacity-50" />
              </button>
              {langOpen && (
                <div className="absolute end-0 top-11 w-32 bg-[#0f1120] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                  {Object.entries(LANG_META).map(([code, m]) => (
                    <button
                      key={code}
                      onClick={() => setLang(code)}
                      className={clsx(
                        'w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-white/5 transition-colors text-start',
                        lang === code ? 'text-[#e8b84b]' : 'text-[#e8e2d8]/70',
                      )}
                    >
                      <span>{m.flag}</span>
                      <span>{m.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Link
              to="/login"
              className="px-3 py-1.5 rounded-lg text-sm text-[#e8e2d8]/60 hover:text-[#e8e2d8] hover:border-white/20 transition-all border border-white/10 hidden sm:block"
            >
              {t('landing.nav.login')}
            </Link>

            <button
              onClick={handleCTA}
              className="px-4 py-2 rounded-lg font-bold text-sm bg-gradient-to-r from-[#c9992e] to-[#e8b84b] text-[#060c1a] shadow-lg shadow-gold-500/20 hover:-translate-y-0.5 transition-all"
            >
              {t('landing.nav.cta')}
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO ───────────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#060c1a] via-[#0a0f1f] to-[#060c1a]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(217,157,24,0.08),transparent_50%)]" />

        <div className="relative max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#e8b84b]/8 border border-[#e8b84b]/20 text-[#e8b84b] text-xs font-medium mb-6 animate-fade-in">
            <Sparkles size={12} />
            {t('landing.hero.badge')}
          </div>

          {/* Headline */}
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold text-[#f0eee8] mb-5 leading-tight animate-slide-up">
            {t('landing.hero.headline')}
          </h1>

          {/* Subheadline */}
          <p className="text-base sm:text-lg text-[#e8e2d8]/65 mb-8 max-w-2xl mx-auto leading-relaxed animate-slide-up">
            {t('landing.hero.sub')}
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6 animate-slide-up">
            <button
              onClick={handleCTA}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-base bg-gradient-to-r from-[#c9992e] to-[#e8b84b] text-[#060c1a] shadow-xl shadow-gold-500/20 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
            >
              {t('landing.hero.cta1')}
              <ArrowRight size={18} />
            </button>
            <a
              href="#how"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-medium text-base text-[#e8e2d8]/70 border border-white/10 hover:border-white/25 hover:text-[#e8e2d8] transition-all"
            >
              {t('landing.hero.cta2')}
            </a>
          </div>

          {/* Trust line */}
          <p className="text-xs text-[#e8e2d8]/40 mb-8">{t('landing.hero.trust')}</p>

          {/* Hero disclaimer */}
          <div className="inline-flex items-start gap-2 max-w-xl mx-auto p-3 rounded-xl bg-white/[0.02] border border-white/5">
            <AlertCircle size={14} className="text-[#e8b84b]/60 shrink-0 mt-0.5" />
            <p className="text-[11px] text-[#e8e2d8]/40 text-start leading-relaxed">
              {t('landing.hero.disclaimer')}
            </p>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────── */}
      <section id="how" className="py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-[#e8b84b]/70 uppercase tracking-widest mb-2">
              {t('landing.how.badge')}
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-[#f0eee8] mb-3">
              {t('landing.how.title')}
            </h2>
            <p className="text-sm text-[#e8e2d8]/55 max-w-xl mx-auto">
              {t('landing.how.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                num: '01',
                icon: MessageSquare,
                titleKey: 'landing.how.s1.title',
                descKey: 'landing.how.s1.desc',
              },
              {
                num: '02',
                icon: Brain,
                titleKey: 'landing.how.s2.title',
                descKey: 'landing.how.s2.desc',
              },
              {
                num: '03',
                icon: FileText,
                titleKey: 'landing.how.s3.title',
                descKey: 'landing.how.s3.desc',
              },
              {
                num: '04',
                icon: Users,
                titleKey: 'landing.how.s4.title',
                descKey: 'landing.how.s4.desc',
              },
            ].map((step) => {
              const Icon = step.icon
              return (
                <div
                  key={step.num}
                  className="relative glass-panel rounded-2xl p-6 border border-white/8 hover:border-[#e8b84b]/20 transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-[#e8b84b]/8 border border-[#e8b84b]/20 flex items-center justify-center">
                      <Icon size={18} className="text-[#e8b84b]" />
                    </div>
                    <span className="font-display text-2xl font-bold text-white/8">{step.num}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-[#f0eee8] mb-2">{t(step.titleKey)}</h3>
                  <p className="text-xs text-[#e8e2d8]/55 leading-relaxed">{t(step.descKey)}</p>
                </div>
              )
            })}
          </div>

          {/* Why this matters callout */}
          <div className="mt-10 p-5 rounded-2xl bg-[#e8b84b]/5 border border-[#e8b84b]/15 text-center">
            <p className="text-sm text-[#e8e2d8]/65">
              <strong className="text-[#e8b84b]">{t('landing.how.callout.label')}</strong>{' '}
              {t('landing.how.callout.text')}
            </p>
          </div>
        </div>
      </section>

      {/* ── BENEFITS ──────────────────────────────────────── */}
      <section id="benefits" className="py-20 px-4 sm:px-6 bg-[#0a0f1f]/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-[#e8b84b]/70 uppercase tracking-widest mb-2">
              {t('landing.benefits.badge')}
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-[#f0eee8]">
              {t('landing.benefits.title')}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                icon: Brain,
                titleKey: 'landing.benefits.b1.title',
                descKey: 'landing.benefits.b1.desc',
              },
              {
                icon: FileText,
                titleKey: 'landing.benefits.b2.title',
                descKey: 'landing.benefits.b2.desc',
              },
              {
                icon: Users,
                titleKey: 'landing.benefits.b3.title',
                descKey: 'landing.benefits.b3.desc',
              },
              {
                icon: Lock,
                titleKey: 'landing.benefits.b4.title',
                descKey: 'landing.benefits.b4.desc',
              },
              {
                icon: ShieldCheck,
                titleKey: 'landing.benefits.b5.title',
                descKey: 'landing.benefits.b5.desc',
              },
              {
                icon: Globe,
                titleKey: 'landing.benefits.b6.title',
                descKey: 'landing.benefits.b6.desc',
              },
            ].map((benefit) => {
              const Icon = benefit.icon
              return (
                <div
                  key={benefit.titleKey}
                  className="glass-panel rounded-2xl p-5 border border-white/8 hover:border-[#e8b84b]/20 transition-all"
                >
                  <div className="w-9 h-9 rounded-lg bg-[#e8b84b]/8 border border-[#e8b84b]/20 flex items-center justify-center mb-3">
                    <Icon size={16} className="text-[#e8b84b]" />
                  </div>
                  <h3 className="text-sm font-semibold text-[#f0eee8] mb-1.5">
                    {t(benefit.titleKey)}
                  </h3>
                  <p className="text-xs text-[#e8e2d8]/55 leading-relaxed">{t(benefit.descKey)}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── AI ANALYSIS ────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-[#e8b84b]/70 uppercase tracking-widest mb-2">
              {t('landing.ai.badge')}
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-[#f0eee8] mb-3">
              {t('landing.ai.title')}
            </h2>
            <p className="text-sm text-[#e8e2d8]/55 max-w-xl mx-auto">{t('landing.ai.subtitle')}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Can do */}
            <div className="glass-panel rounded-2xl p-6 border border-green-500/15">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-8 h-8 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                  <CheckCircle2 size={15} className="text-green-400" />
                </div>
                <h3 className="text-sm font-semibold text-[#f0eee8]">{t('landing.ai.canDo')}</h3>
              </div>
              <ul className="space-y-3">
                {['c1', 'c2', 'c3', 'c4', 'c5'].map((k) => (
                  <li key={k} className="flex items-start gap-2.5 text-sm text-[#e8e2d8]/65">
                    <CheckCircle2 size={14} className="text-green-400/70 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{t(`landing.ai.${k}`)}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Cannot do */}
            <div className="glass-panel rounded-2xl p-6 border border-red-500/15">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                  <AlertCircle size={15} className="text-red-400" />
                </div>
                <h3 className="text-sm font-semibold text-[#f0eee8]">{t('landing.ai.cannotDo')}</h3>
              </div>
              <ul className="space-y-3">
                {['n1', 'n2', 'n3', 'n4', 'n5'].map((k) => (
                  <li key={k} className="flex items-start gap-2.5 text-sm text-[#e8e2d8]/65">
                    <span className="text-red-400/70 shrink-0 mt-0.5 text-xs">✕</span>
                    <span className="leading-relaxed">{t(`landing.ai.${k}`)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Accuracy disclaimer */}
          <div className="mt-6 p-4 rounded-xl bg-[#e8b84b]/5 border border-[#e8b84b]/15">
            <p className="text-xs text-[#e8e2d8]/55 leading-relaxed">
              <strong className="text-[#e8b84b]">{t('landing.ai.accuracyLabel')}</strong>{' '}
              {t('landing.ai.accuracyText')}
            </p>
          </div>
        </div>
      </section>

      {/* ── PRICING ───────────────────────────────────────── */}
      <section id="pricing" className="py-20 px-4 sm:px-6 bg-[#0a0f1f]/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-[#e8b84b]/70 uppercase tracking-widest mb-2">
              {t('landing.pricing.badge')}
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-[#f0eee8] mb-3">
              {t('landing.pricing.title')}
            </h2>
            <p className="text-sm text-[#e8e2d8]/55 max-w-xl mx-auto">
              {t('landing.pricing.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PRICING_TIERS.map((tier) => (
              <div
                key={tier.id}
                className={clsx(
                  'relative rounded-2xl p-6 border transition-all flex flex-col',
                  tier.highlighted
                    ? 'bg-gradient-to-b from-[#e8b84b]/8 to-transparent border-[#e8b84b]/40 shadow-xl shadow-gold-500/10'
                    : 'glass-panel border-white/8 hover:border-white/15',
                )}
              >
                {tier.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-[#c9992e] to-[#e8b84b] text-[#060c1a] text-[10px] font-bold uppercase tracking-wider">
                    {t('landing.pricing.popular')}
                  </div>
                )}

                <h3 className="text-sm font-semibold text-[#f0eee8] mb-1">{t(tier.nameKey)}</h3>
                <p className="text-xs text-[#e8e2d8]/45 mb-4 min-h-[2.5rem]">{t(tier.descKey)}</p>

                <div className="mb-5">
                  {tier.price ? (
                    <>
                      <p className="font-display text-3xl font-bold text-[#e8b84b]">{tier.price}</p>
                      <p className="text-[11px] text-[#e8e2d8]/40 mt-0.5">
                        {t(tier.priceLabelKey)}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-display text-3xl font-bold text-[#e8e2d8]/80">
                        {t('landing.pricing.freeLabel')}
                      </p>
                      <p className="text-[11px] text-[#e8e2d8]/40 mt-0.5">
                        {t(tier.priceLabelKey)}
                      </p>
                    </>
                  )}
                </div>

                <ul className="space-y-2.5 mb-6 flex-1">
                  {tier.features.map((fk) => (
                    <li key={fk} className="flex items-start gap-2 text-xs text-[#e8e2d8]/60">
                      <CheckCircle2 size={13} className="text-[#e8b84b]/70 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{t(fk)}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={handleCTA}
                  className={clsx(
                    'w-full py-2.5 rounded-lg font-semibold text-sm transition-all',
                    tier.highlighted
                      ? 'bg-gradient-to-r from-[#c9992e] to-[#e8b84b] text-[#060c1a] hover:-translate-y-0.5 shadow-lg shadow-gold-500/20'
                      : 'border border-white/15 text-[#e8e2d8]/70 hover:border-[#e8b84b]/40 hover:text-[#e8b84b]',
                  )}
                >
                  {t(tier.ctaKey)}
                </button>
              </div>
            ))}
          </div>

          {/* Monetization transparency */}
          <div className="mt-8 max-w-3xl mx-auto p-5 rounded-2xl bg-white/[0.02] border border-white/8">
            <h4 className="text-sm font-semibold text-[#f0eee8] mb-2 flex items-center gap-2">
              <ShieldCheck size={15} className="text-[#e8b84b]" />
              {t('landing.pricing.monetizationTitle')}
            </h4>
            <p className="text-xs text-[#e8e2d8]/55 leading-relaxed mb-3">
              {t('landing.pricing.monetizationText')}
            </p>
            <div className="flex items-start gap-2 p-3 rounded-lg bg-[#e8b84b]/5 border border-[#e8b84b]/10">
              <AlertCircle size={13} className="text-[#e8b84b]/60 shrink-0 mt-0.5" />
              <p className="text-[11px] text-[#e8e2d8]/50 leading-relaxed">
                {t('landing.pricing.monetizationNote')}
              </p>
            </div>
          </div>

          {/* Pricing disclaimer */}
          <div className="mt-6 text-center">
            <p className="text-[11px] text-[#e8e2d8]/35 max-w-xl mx-auto leading-relaxed">
              {t('landing.pricing.disclaimer')}
            </p>
          </div>
        </div>
      </section>

      {/* ── FOR LAWYERS ────────────────────────────────────── */}
      <section id="lawyers" className="py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#e8b84b]/8 border border-[#e8b84b]/20 text-[#e8b84b] text-xs font-medium mb-4">
              <Building2 size={12} />
              {t('landing.lawyers.badge')}
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-[#f0eee8] mb-3">
              {t('landing.lawyers.title')}
            </h2>
            <p className="text-sm text-[#e8e2d8]/55 max-w-xl mx-auto">
              {t('landing.lawyers.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* What we send */}
            <div className="glass-panel rounded-2xl p-6 border border-white/8">
              <h3 className="text-sm font-semibold text-[#f0eee8] mb-4 flex items-center gap-2">
                <CheckCircle2 size={15} className="text-green-400" />
                {t('landing.lawyers.sendTitle')}
              </h3>
              <ul className="space-y-3">
                {['s1', 's2', 's3', 's4'].map((k) => (
                  <li key={k} className="flex items-start gap-2.5 text-sm text-[#e8e2d8]/65">
                    <CheckCircle2 size={14} className="text-green-400/70 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{t(`landing.lawyers.send.${k}`)}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* What we don't do */}
            <div className="glass-panel rounded-2xl p-6 border border-white/8">
              <h3 className="text-sm font-semibold text-[#f0eee8] mb-4 flex items-center gap-2">
                <AlertCircle size={15} className="text-red-400" />
                {t('landing.lawyers.dontTitle')}
              </h3>
              <ul className="space-y-3">
                {['d1', 'd2', 'd3', 'd4'].map((k) => (
                  <li key={k} className="flex items-start gap-2.5 text-sm text-[#e8e2d8]/65">
                    <span className="text-red-400/70 shrink-0 mt-0.5 text-xs">✕</span>
                    <span className="leading-relaxed">{t(`landing.lawyers.dont.${k}`)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Compliance note */}
          <div className="p-5 rounded-2xl bg-[#e8b84b]/5 border border-[#e8b84b]/15 mb-8">
            <div className="flex items-start gap-3">
              <Scale size={18} className="text-[#e8b84b] shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-[#e8b84b] mb-1">
                  {t('landing.lawyers.complianceLabel')}
                </p>
                <p className="text-xs text-[#e8e2d8]/55 leading-relaxed">
                  {t('landing.lawyers.complianceText')}
                </p>
              </div>
            </div>
          </div>

          {/* Onboarding */}
          <div className="text-center">
            <p className="text-sm text-[#e8e2d8]/55 mb-4">{t('landing.lawyers.onboardingText')}</p>
            <a
              href="mailto:partners@expatuae.kafeely.com"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm border border-[#e8b84b]/40 text-[#e8b84b] hover:bg-[#e8b84b]/8 transition-all"
            >
              {t('landing.lawyers.applyCta')}
              <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────── */}
      <section id="faq" className="py-20 px-4 sm:px-6 bg-[#0a0f1f]/50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-[#e8b84b]/70 uppercase tracking-widest mb-2">
              {t('landing.faq.badge')}
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-[#f0eee8]">
              {t('landing.faq.title')}
            </h2>
          </div>

          <div className="space-y-3">
            {[
              { qKey: 'landing.faq.q1', aKey: 'landing.faq.a1' },
              { qKey: 'landing.faq.q2', aKey: 'landing.faq.a2' },
              { qKey: 'landing.faq.q3', aKey: 'landing.faq.a3' },
              { qKey: 'landing.faq.q4', aKey: 'landing.faq.a4' },
              { qKey: 'landing.faq.q5', aKey: 'landing.faq.a5' },
              { qKey: 'landing.faq.q6', aKey: 'landing.faq.a6' },
              { qKey: 'landing.faq.q7', aKey: 'landing.faq.a7' },
            ].map((faq) => (
              <details
                key={faq.qKey}
                className="group glass-panel rounded-xl border border-white/8 overflow-hidden"
              >
                <summary className="flex items-center justify-between gap-3 p-4 cursor-pointer text-sm font-medium text-[#f0eee8] hover:bg-white/[0.02] transition-colors list-none">
                  {t(faq.qKey)}
                  <ChevronDown
                    size={16}
                    className="text-[#e8e2d8]/40 shrink-0 group-open:rotate-180 transition-transform"
                  />
                </summary>
                <div className="px-4 pb-4 text-sm text-[#e8e2d8]/55 leading-relaxed">
                  {t(faq.aKey)}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ──────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-semibold text-[#f0eee8] mb-4">
            {t('landing.finalCta.title')}
          </h2>
          <p className="text-sm text-[#e8e2d8]/55 mb-8 max-w-xl mx-auto">
            {t('landing.finalCta.subtitle')}
          </p>
          <button
            onClick={handleCTA}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-base bg-gradient-to-r from-[#c9992e] to-[#e8b84b] text-[#060c1a] shadow-xl shadow-gold-500/20 hover:-translate-y-0.5 transition-all"
          >
            {t('landing.finalCta.cta')}
            <ArrowRight size={18} />
          </button>
          <p className="text-[11px] text-[#e8e2d8]/35 mt-4 max-w-md mx-auto">
            {t('landing.finalCta.disclaimer')}
          </p>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────── */}
      <footer className="py-10 px-4 bg-[#060c1a] border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#c9992e] to-[#e8b84b] flex items-center justify-center text-[#060c1a] font-bold text-xs">
                E
              </div>
              <span className="font-semibold text-[#e8b84b]">ExpatUAE</span>
            </div>
            <div className="flex flex-wrap gap-5">
              <Link
                to="/privacy-policy"
                className="text-sm text-[#e8e2d8]/35 hover:text-[#e8e2d8]/60 transition-colors"
              >
                {t('landing.footer.privacy')}
              </Link>
              <Link
                to="/terms-of-service"
                className="text-sm text-[#e8e2d8]/35 hover:text-[#e8e2d8]/60 transition-colors"
              >
                {t('landing.footer.terms')}
              </Link>
              <Link
                to="/cookie-policy"
                className="text-sm text-[#e8e2d8]/35 hover:text-[#e8e2d8]/60 transition-colors"
              >
                {t('landing.footer.cookies')}
              </Link>
              <a
                href="mailto:support@expatuae.kafeely.com"
                className="text-sm text-[#e8e2d8]/35 hover:text-[#e8e2d8]/60 transition-colors"
              >
                {t('landing.footer.contact')}
              </a>
            </div>
          </div>

          {/* Footer disclaimer */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-[#e8b84b]/5 border border-[#e8b84b]/15 mb-6">
            <Scale size={16} className="text-[#e8b84b]/60 shrink-0 mt-0.5" />
            <p className="text-xs text-[#e8e2d8]/40 leading-relaxed">
              {t('landing.footer.disclaimer')}
            </p>
          </div>

          <p className="text-center text-xs text-[#e8e2d8]/20">
            © 2026 ExpatUAE. {t('landing.footer.rights')}
          </p>
        </div>
      </footer>

      {/* ── STICKY BOTTOM BAR ──────────────────────────────── */}
      <div
        className={clsx(
          'fixed bottom-0 inset-x-0 z-40 bg-[#060c1a]/96 backdrop-blur-xl border-t border-white/10 px-4 py-3 flex items-center justify-between gap-3 transition-transform duration-500',
          scrolled ? 'translate-y-0' : 'translate-y-full',
        )}
      >
        <p className="text-sm text-[#e8e2d8]/50 hidden sm:block">{t('landing.sticky.text')}</p>
        <div className="flex items-center gap-2 ms-auto">
          <a
            href={WA_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/25 text-sm font-medium hover:bg-[#25D366]/20 transition-all"
          >
            <WAIcon size={15} />
            <span className="hidden sm:inline">WhatsApp</span>
          </a>
          <button
            onClick={handleCTA}
            className="px-5 py-2.5 rounded-lg font-bold text-sm bg-gradient-to-r from-[#c9992e] to-[#e8b84b] text-[#060c1a] shadow-lg shadow-gold-500/20 hover:-translate-y-0.5 transition-all"
          >
            {t('landing.sticky.cta')}
          </button>
        </div>
      </div>

      {/* ── FLOATING WHATSAPP ──────────────────────────────── */}
      <a
        href={WA_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className={clsx(
          'fixed z-50 w-14 h-14 rounded-full bg-[#25D366] flex items-center justify-center text-white shadow-2xl shadow-green-500/30 hover:scale-110 transition-all',
          scrolled ? 'bottom-20' : 'bottom-6',
          isRTL ? 'left-4 sm:left-6' : 'right-4 sm:right-6',
        )}
        style={{ animation: 'float 3s ease-in-out infinite' }}
      >
        <WAIcon size={26} />
      </a>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  )
}

export default LandingPage
