import { useState } from 'react'
import { clsx } from 'clsx'
import {
  Brain, Lock, Unlock, ShieldAlert, ShieldCheck, ShieldQuestion,
  Clock, DollarSign, CheckCircle2, Circle,
  Loader2, AlertTriangle, Sparkles, CreditCard, X,
  Star
} from 'lucide-react'
import Button from '@/components/ui/Button'
import { usePayments } from '@/hooks/usePayments'

// ─── Risk badge ────────────────────────────────────────────────────
const RISK_CONFIG = {
  low:    { label: 'Low Risk',    icon: ShieldCheck,    className: 'bg-green-500/10  text-green-400  border-green-500/20'  },
  medium: { label: 'Medium Risk', icon: ShieldQuestion, className: 'bg-amber-500/10  text-amber-400  border-amber-500/20'  },
  high:   { label: 'High Risk',   icon: ShieldAlert,    className: 'bg-red-500/10    text-red-400    border-red-500/20'    },
}

export function RiskBadge({ level, large = false }) {
  const cfg  = RISK_CONFIG[level] || RISK_CONFIG.medium
  const Icon = cfg.icon
  return (
    <span className={clsx(
      'inline-flex items-center gap-1.5 rounded-full border font-medium',
      large ? 'px-3.5 py-1.5 text-sm' : 'px-2.5 py-1 text-xs',
      cfg.className,
    )}>
      <Icon size={large ? 14 : 11} className="shrink-0" />
      {cfg.label}
    </span>
  )
}

// ─── Payment modal ─────────────────────────────────────────────────
function PaymentModal({ caseId, onClose }) {
  const { startCheckout, loading, redirecting, error } = usePayments()

  const handlePay = async () => {
    await startCheckout(caseId)
  }

  const FEATURES = [
    'Full AI-generated case summary',
    'Risk level: Low / Medium / High',
    'Estimated cost range in AED',
    'Estimated timeline to resolve',
    '4–7 actionable next steps',
    'Specialist-matched action plan',
  ]

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in" />

      <div
        className="relative z-10 w-full sm:max-w-md bg-[var(--bg-secondary)] border border-[var(--border)] rounded-t-2xl sm:rounded-2xl shadow-panel animate-slide-up overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Gold top accent line */}
        <div className="h-1 bg-gradient-to-r from-gold-700 via-gold-400 to-gold-700" />

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center">
              <Sparkles size={18} className="text-gold-400" />
            </div>
            <div>
              <h3 className="font-display text-xl font-semibold text-[var(--text-primary)]">
                Unlock AI Report
              </h3>
              <p className="text-xs text-[var(--text-muted)]">One-time payment · Instant access</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/8 transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* Features */}
        <div className="px-6 pb-4">
          <div className="glass-panel rounded-xl p-4 space-y-2.5">
            {FEATURES.map(f => (
              <div key={f} className="flex items-center gap-2.5 text-sm text-[var(--text-secondary)]">
                <CheckCircle2 size={13} className="text-gold-400 shrink-0" />
                {f}
              </div>
            ))}
          </div>
        </div>

        {/* Price + CTA */}
        <div className="px-6 pb-6 space-y-3">
          {/* Price block */}
          <div className="flex items-center justify-between px-4 py-3.5 rounded-xl border border-gold-500/25 bg-gold-500/4">
            <div>
              <p className="text-xs text-[var(--text-muted)] uppercase tracking-widest">One-time unlock fee</p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="font-display text-3xl font-semibold text-gold-400">AED 99</span>
                <span className="text-xs text-[var(--text-muted)]">per case</span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-[var(--text-muted)] bg-white/5 rounded-lg px-2.5 py-1.5">
              <Star size={10} className="text-gold-400 fill-gold-400" />
              Instant
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/8 border border-red-500/20 text-red-400 text-xs animate-fade-in">
              <AlertTriangle size={13} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Pay button */}
          <Button
            onClick={handlePay}
            fullWidth
            size="lg"
            loading={loading || redirecting}
            icon={CreditCard}
          >
            {redirecting
              ? 'Redirecting to Stripe…'
              : loading
                ? 'Preparing checkout…'
                : 'Pay AED 99 — Unlock Now'
            }
          </Button>

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-4 text-[10px] text-[var(--text-muted)]">
            <span>🔒 Stripe Secure</span>
            <span>·</span>
            <span>🌍 AED Supported</span>
            <span>·</span>
            <span>⚡ Instant Access</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Paywall blur overlay ──────────────────────────────────────────
function PaywallOverlay({ onUnlock }) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl overflow-hidden">
      <div className="absolute inset-0 backdrop-blur-md bg-[var(--bg-primary)]/65" />
      <div className="relative z-10 flex flex-col items-center text-center px-6 py-8 max-w-xs">
        <div className="w-14 h-14 rounded-2xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center mb-4 animate-pulse-gold">
          <Lock size={22} className="text-gold-400" />
        </div>
        <h4 className="font-display text-xl font-semibold text-[var(--text-primary)] mb-2">
          AI Report Ready
        </h4>
        <p className="text-sm text-[var(--text-secondary)] mb-1.5 leading-relaxed">
          Your AI case analysis is complete. Unlock for{' '}
          <span className="text-gold-400 font-semibold">AED 99</span> to view your full report.
        </p>
        <p className="text-[11px] text-[var(--text-muted)] mb-5">
          One-time payment · Powered by Stripe
        </p>
        <Button onClick={onUnlock} icon={CreditCard} size="md">
          Unlock for AED 99
        </Button>
      </div>
    </div>
  )
}

// ─── Step timeline ─────────────────────────────────────────────────
function StepTimeline({ steps }) {
  return (
    <div>
      {steps.map((step, i) => {
        const isLast    = i === steps.length - 1
        const isDone    = step.status === 'done'
        const isCurrent = step.status === 'current'
        return (
          <div key={step.id || i} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className={clsx(
                'w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 z-10 transition-all duration-300',
                isDone    && 'bg-green-500/15 border-green-500/40 text-green-400',
                isCurrent && 'bg-gold-500/15  border-gold-500/50  text-gold-400 ring-4 ring-gold-500/10',
                !isDone && !isCurrent && 'bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-muted)]',
              )}>
                {isDone    ? <CheckCircle2 size={13} />
                : isCurrent ? <span className="w-2 h-2 rounded-full bg-gold-400 animate-pulse" />
                : <Circle size={10} className="opacity-40" />}
              </div>
              {!isLast && (
                <div
                  className={clsx('w-px flex-1 mt-1 mb-1', isDone ? 'bg-green-500/30' : 'bg-[var(--border)]')}
                  style={{ minHeight: 20 }}
                />
              )}
            </div>
            <div className={clsx('flex-1 pb-4', isLast && 'pb-0')}>
              <p className={clsx(
                'text-sm leading-relaxed py-0.5',
                isDone    && 'text-[var(--text-muted)] line-through',
                isCurrent && 'text-[var(--text-primary)] font-medium',
                !isDone && !isCurrent && 'text-[var(--text-secondary)]',
              )}>
                <span className={clsx(
                  'inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold me-2 align-middle',
                  isCurrent ? 'bg-gold-500/20 text-gold-400' : 'bg-white/5 text-[var(--text-muted)]',
                )}>
                  {i + 1}
                </span>
                {step.step_text}
              </p>
              {isCurrent && (
                <p className="mt-1 ms-7 text-[11px] text-gold-400 font-medium flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-pulse" />
                  Current step
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Stat pill ─────────────────────────────────────────────────────
function StatPill({ icon: Icon, label, value, color = 'gold' }) {
  const colorMap = {
    gold:   'bg-gold-500/8   border-gold-500/20   text-gold-400',
    purple: 'bg-purple-500/8 border-purple-500/20 text-purple-400',
  }
  return (
    <div className={clsx('flex items-center gap-2.5 px-4 py-3 rounded-xl border', colorMap[color])}>
      <Icon size={16} className="shrink-0" />
      <div>
        <p className="text-[10px] uppercase tracking-widest text-current opacity-60 leading-none">{label}</p>
        <p className="text-sm font-semibold leading-tight mt-0.5">{value}</p>
      </div>
    </div>
  )
}

// ─── Skeleton ──────────────────────────────────────────────────────
function AISkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex gap-2">
        <div className="h-6 bg-white/5 rounded-full w-24" />
        <div className="h-6 bg-white/5 rounded-full w-32" />
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-white/5 rounded w-full" />
        <div className="h-3 bg-white/5 rounded w-5/6" />
        <div className="h-3 bg-white/5 rounded w-4/6" />
      </div>
      {[1,2,3,4].map(i => (
        <div key={i} className="flex gap-3">
          <div className="w-7 h-7 rounded-full bg-white/5 shrink-0" />
          <div className="flex-1 h-3 bg-white/5 rounded mt-2" />
        </div>
      ))}
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────
export function AICaseReport({ caseData, steps }) {
  const [showPayModal, setShowPayModal] = useState(false)

  const aiStatus   = caseData?.ai_status   || 'idle'
  const aiUnlocked = caseData?.ai_unlocked || false
  const isLocked   = !aiUnlocked

  if (aiStatus === 'idle') {
    return (
      <div className="glass-panel rounded-2xl p-6 text-center">
        <div className="w-12 h-12 rounded-xl bg-white/5 border border-[var(--border)] flex items-center justify-center mx-auto mb-3">
          <Brain size={22} className="text-[var(--text-muted)]" />
        </div>
        <p className="text-sm font-medium text-[var(--text-primary)] mb-1">AI Analysis Pending</p>
        <p className="text-xs text-[var(--text-muted)]">Analysis begins automatically after case submission.</p>
      </div>
    )
  }

  if (aiStatus === 'processing') {
    return (
      <div className="glass-panel rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center">
            <Loader2 size={18} className="text-gold-400 animate-spin" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">AI is analysing your case…</p>
            <p className="text-xs text-[var(--text-muted)]">Usually takes 5–15 seconds</p>
          </div>
        </div>
        <AISkeleton />
      </div>
    )
  }

  if (aiStatus === 'failed') {
    return (
      <div className="glass-panel rounded-2xl p-5 flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
          <AlertTriangle size={16} className="text-red-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">AI Analysis Failed</p>
          <p className="text-xs text-[var(--text-secondary)]">There was an error analysing your case. Please try again or contact support.</p>
        </div>
      </div>
    )
  }

  if (aiStatus !== 'done') return null

  return (
    <>
      <div className="relative">
        {isLocked && <PaywallOverlay onUnlock={() => setShowPayModal(true)} />}

        <div className={clsx(
          'glass-panel rounded-2xl overflow-hidden transition-all duration-300',
          isLocked && 'select-none pointer-events-none',
        )}>
          {/* Header */}
          <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gold-500/10 border border-gold-500/20 flex items-center justify-center">
                <Brain size={14} className="text-gold-400" />
              </div>
              <span className="text-sm font-semibold text-[var(--text-primary)]">AI Case Analysis</span>
              {isLocked
                ? <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-gold-500/10 text-gold-400 border border-gold-500/20"><Lock size={9} /> Locked</span>
                : <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20"><Unlock size={9} /> Unlocked</span>
              }
            </div>
            <RiskBadge level={caseData.ai_risk_level} />
          </div>

          <div className="p-5 space-y-6">
            {/* Summary */}
            <div>
              <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-2">Summary</p>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{caseData.ai_summary}</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <StatPill icon={DollarSign} label="Estimated Cost"     value={caseData.ai_estimated_cost || '—'} color="gold"   />
              <StatPill icon={Clock}      label="Estimated Timeline" value={caseData.ai_estimated_time || '—'} color="purple" />
            </div>

            {/* Steps */}
            {steps?.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-4">
                  Action Plan — {steps.length} steps
                </p>
                <StepTimeline steps={steps} />
              </div>
            )}
          </div>
        </div>
      </div>

      {showPayModal && (
        <PaymentModal
          caseId={caseData?.id}
          onClose={() => setShowPayModal(false)}
        />
      )}
    </>
  )
}

export default AICaseReport
