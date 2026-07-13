import { useState } from 'react'
import { Scale, X } from 'lucide-react'
import { clsx } from 'clsx'
import { useTranslation } from 'react-i18next'

const STORAGE_KEY = 'rlco-disclaimer-dismissed'

export function LegalDisclaimer({ variant = 'banner' }) {
  const { i18n } = useTranslation()
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(STORAGE_KEY) === 'true')

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true')
    setDismissed(true)
  }

  // Inline variant (always visible, no dismiss)
  if (variant === 'inline') {
    return (
      <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-500/6 border border-[var(--status-pending)]/20">
        <Scale size={15} className="text-[var(--status-pending)] shrink-0 mt-0.5" />
        <p className="text-xs text-[var(--status-pending)]/90 leading-relaxed">
          <strong className="font-semibold">Legal Disclaimer:</strong> This platform provides
          AI-assisted case organisation and coordination only. It does <strong>not</strong> provide
          legal advice, legal representation, or guaranteed outcomes. Always consult a qualified UAE
          legal professional.
        </p>
      </div>
    )
  }

  // Banner variant (dismissible, shown once)
  if (dismissed) return null

  return (
    <div
      className={clsx(
        'w-full bg-amber-500/8 border-b border-[var(--status-pending)]/20',
        'px-4 py-2.5 flex items-center justify-between gap-3',
      )}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <Scale size={13} className="text-[var(--status-pending)] shrink-0" />
        <p className="text-[11px] text-[var(--status-pending)]/90 leading-relaxed">
          <strong className="font-semibold">Disclaimer:</strong> This platform provides AI-assisted
          case organisation only and does <strong>not</strong> constitute legal advice. Consult a
          licensed UAE attorney for legal representation.
        </p>
      </div>
      <button
        onClick={dismiss}
        className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-[var(--status-pending)]/60 hover:text-[var(--status-pending)] hover:bg-[var(--status-pending)]/10 transition-all"
        aria-label="Dismiss disclaimer"
      >
        <X size={12} />
      </button>
    </div>
  )
}

export default LegalDisclaimer
