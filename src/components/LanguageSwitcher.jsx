import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Globe, Check, ChevronDown } from 'lucide-react'
import { clsx } from 'clsx'
import { SUPPORTED_LANGUAGES } from '@/i18n'
import { useAuth } from '@/context/AuthContext'

export function LanguageSwitcher({ compact = false }) {
  const { i18n } = useTranslation()
  const { updateLanguage } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const currentLang = SUPPORTED_LANGUAGES.find(l => l.code === i18n.language)
    || SUPPORTED_LANGUAGES[0]

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSelect = async (lang) => {
    setOpen(false)
    await updateLanguage(lang.code)
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={clsx(
          'flex items-center gap-2 rounded-lg border border-[var(--border)]',
          'bg-[var(--bg-elevated)] hover:bg-[var(--bg-card)]',
          'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
          'transition-all duration-200 text-sm font-medium',
          compact ? 'px-2.5 py-1.5' : 'px-3 py-2',
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Globe size={14} className="shrink-0" />
        {!compact && (
          <span className="flex items-center gap-1.5">
            <span className="text-base leading-none">{currentLang.flag}</span>
            <span>{currentLang.nativeLabel}</span>
          </span>
        )}
        {compact && <span className="text-base leading-none">{currentLang.flag}</span>}
        <ChevronDown
          size={12}
          className={clsx('transition-transform duration-200', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div
          className={clsx(
            'absolute z-50 mt-2 w-52 rounded-xl overflow-hidden',
            'bg-[var(--bg-elevated)] border border-[var(--border)]',
            'shadow-panel animate-fade-in',
            // Position based on dir
            '[dir=rtl] &:left-0 [dir=ltr] &:right-0',
            'end-0',
          )}
          role="listbox"
        >
          <div className="p-1">
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isActive = i18n.language === lang.code
              return (
                <button
                  key={lang.code}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onClick={() => handleSelect(lang)}
                  className={clsx(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm',
                    'transition-all duration-150',
                    isActive
                      ? 'bg-gold-500/10 text-gold-400'
                      : 'text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text-primary)]',
                  )}
                >
                  <span className="text-base leading-none w-6 text-center">{lang.flag}</span>
                  <div className="flex flex-col items-start">
                    <span className="font-medium leading-tight">{lang.nativeLabel}</span>
                    {lang.nativeLabel !== lang.label && (
                      <span className="text-xs text-[var(--text-muted)] leading-tight">{lang.label}</span>
                    )}
                  </div>
                  {lang.dir === 'rtl' && (
                    <span className="ms-auto text-xs text-[var(--text-muted)]">RTL</span>
                  )}
                  {isActive && (
                    <Check size={14} className={clsx('ms-auto text-gold-400', lang.dir === 'rtl' && 'me-auto ms-0')} />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default LanguageSwitcher
