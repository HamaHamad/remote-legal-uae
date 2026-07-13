import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import {
  CheckCircle2,
  Loader2,
  AlertCircle,
  Brain,
  ArrowRight,
  Home,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react'
import { clsx } from 'clsx'
import { usePayments } from '@/hooks/usePayments'
import Button from '@/components/ui/Button'

// ─── Stage definitions ────────────────────────────────────────────
// stage 0 = verifying payment
// stage 1 = unlocking AI report (polling Supabase)
// stage 2 = done (unlocked confirmed)
// stage 3 = pending (payment received, unlock not yet confirmed)
const STAGES = [
  { id: 'verifying', label: 'Verifying payment…' },
  { id: 'unlocking', label: 'Unlocking AI report…' },
  { id: 'done', label: 'Access granted!' },
]

export function PaymentSuccessPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { pollUntilUnlocked } = usePayments()

  const caseId = searchParams.get('case_id')
  const sessionId = searchParams.get('session_id')

  const [stage, setStage] = useState(0) // 0=verifying, 1=unlocking, 2=done, 3=pending
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!caseId) {
      setFailed(true)
      return
    }

    const run = async () => {
      // Brief pause so the webhook has time to fire
      await new Promise((r) => setTimeout(r, 1500))
      setStage(1)

      // Poll Supabase until ai_unlocked = true
      const unlocked = await pollUntilUnlocked(caseId)

      if (unlocked) {
        setStage(2)
      } else {
        // Webhook is taking longer than expected. Show a "pending"
        // state instead of falsely claiming success. The payment was
        // received (Stripe redirected here), but the unlock hasn't
        // propagated yet. User can retry or check the case page.
        setStage(3)
      }
    }

    run()
  }, [caseId, pollUntilUnlocked])

  const handleRetry = () => {
    setStage(1)
    const run = async () => {
      const unlocked = await pollUntilUnlocked(caseId)
      setStage(unlocked ? 2 : 3)
    }
    run()
  }

  const handleViewReport = () => {
    navigate(`/dashboard/cases/${caseId}`)
  }

  // ── Pending (payment received, unlock not yet confirmed) ──────
  if (stage === 3) {
    return (
      <div className="min-h-screen auth-bg flex items-center justify-center px-4">
        <div className="glass-panel gold-border rounded-2xl p-8 max-w-sm w-full text-center animate-slide-up">
          <div className="inline-flex w-16 h-16 rounded-full bg-gold-500/10 border border-gold-500/30 items-center justify-center mb-5">
            <RefreshCw size={28} className="text-gold-400" />
          </div>
          <h2 className="font-display text-2xl font-semibold text-[var(--text-primary)] mb-2">
            Payment Received
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mb-6 leading-relaxed">
            Your payment was successful, but we're still confirming your unlock. This usually takes
            a few seconds. Please check your case page or try again below.
          </p>
          {sessionId && (
            <p className="text-[11px] text-[var(--text-muted)] mb-5">
              Session: {sessionId.slice(-8).toUpperCase()}
            </p>
          )}
          <div className="space-y-2">
            <Button onClick={handleRetry} icon={RefreshCw} fullWidth size="lg">
              Check Again
            </Button>
            <Button onClick={handleViewReport} variant="outline" fullWidth size="sm">
              Go to Case
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen auth-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm animate-slide-up">
        {/* Card */}
        <div className="glass-panel gold-border rounded-2xl p-8 text-center shadow-gold">
          {/* Icon */}
          <div className="relative inline-flex mb-6">
            <div
              className={clsx(
                'w-20 h-20 rounded-full flex items-center justify-center border-2 transition-all duration-500',
                stage === 2
                  ? 'bg-[var(--status-active)]/10 border-[var(--status-active)]/40'
                  : 'bg-gold-500/10  border-gold-500/30',
              )}
            >
              {stage === 2 ? (
                <CheckCircle2 size={38} className="text-[var(--status-active)]" />
              ) : (
                <Loader2 size={32} className="text-gold-400 animate-spin" />
              )}
            </div>
            {stage === 2 && (
              <div className="absolute -inset-2 rounded-full border border-green-500/15 animate-ping" />
            )}
          </div>

          {/* Title */}
          <h1
            className={clsx(
              'font-display text-2xl font-semibold mb-2 transition-colors duration-300',
              stage === 2 ? 'text-[var(--status-active)]' : 'text-[var(--text-primary)]',
            )}
          >
            {stage === 2 ? 'Payment Successful!' : 'Processing Payment…'}
          </h1>

          {/* Subtitle */}
          <p className="text-sm text-[var(--text-secondary)] mb-6 leading-relaxed">
            {stage === 2
              ? 'Your AI case report is now fully unlocked. View your complete analysis, risk assessment, and step-by-step action plan.'
              : 'Please wait while we confirm your payment and unlock your case report.'}
          </p>

          {/* Stage tracker */}
          <div className="space-y-3 mb-7 text-start">
            {STAGES.map((s, i) => (
              <div key={s.id} className="flex items-center gap-3">
                <div
                  className={clsx(
                    'w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all duration-300',
                    i < stage
                      ? 'bg-[var(--status-active)]/15 border border-[var(--status-active)]/30 text-[var(--status-active)]'
                      : i === stage
                        ? 'bg-gold-500/15  border border-gold-500/30  text-gold-400'
                        : 'bg-[var(--text-primary)]/5      border border-[var(--border)] text-[var(--text-muted)]',
                  )}
                >
                  {i < stage ? (
                    <CheckCircle2 size={12} />
                  ) : i === stage && stage < 2 ? (
                    <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                  ) : i === stage && stage === 2 ? (
                    <CheckCircle2 size={12} />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-current opacity-30" />
                  )}
                </div>
                <span
                  className={clsx(
                    'text-sm transition-colors duration-300',
                    i <= stage ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]',
                  )}
                >
                  {s.label}
                </span>
              </div>
            ))}
          </div>

          {/* What's unlocked */}
          {stage === 2 && (
            <div className="glass-panel-elevated rounded-xl p-4 mb-6 text-start animate-fade-in">
              <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-3">
                Now available
              </p>
              <div className="space-y-2">
                {[
                  { icon: Brain, text: 'Full AI case summary' },
                  { icon: ShieldCheck, text: 'Risk level assessment' },
                  { icon: ArrowRight, text: 'Step-by-step action plan' },
                  { icon: CheckCircle2, text: 'Cost & timeline estimates' },
                ].map((item) => (
                  <div
                    key={item.text}
                    className="flex items-center gap-2.5 text-sm text-[var(--text-secondary)]"
                  >
                    <item.icon size={13} className="text-gold-400 shrink-0" />
                    {item.text}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          {stage === 2 ? (
            <div className="space-y-2">
              <Button onClick={handleViewReport} fullWidth size="lg" icon={Brain}>
                View Full AI Report
              </Button>
              <Link to="/dashboard">
                <Button variant="ghost" fullWidth size="sm">
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          ) : (
            <p className="text-xs text-[var(--text-muted)]">
              Do not close this tab. This usually takes under 10 seconds.
            </p>
          )}
        </div>

        {/* Receipt note */}
        {stage === 2 && sessionId && (
          <p className="text-center text-[11px] text-[var(--text-muted)] mt-4">
            Receipt sent to your email · Session: {sessionId.slice(-8).toUpperCase()}
          </p>
        )}
      </div>
    </div>
  )
}

export default PaymentSuccessPage
