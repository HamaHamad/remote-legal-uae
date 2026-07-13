import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { XCircle, ArrowLeft, RotateCcw } from 'lucide-react'
import Button from '@/components/ui/Button'
import { usePayments } from '@/hooks/usePayments'

export function PaymentCancelPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { startCheckout, loading, redirecting } = usePayments()

  const caseId = searchParams.get('case_id')

  const handleRetry = async () => {
    if (!caseId) return
    await startCheckout(caseId)
  }

  const handleBack = () => {
    if (caseId) navigate(`/dashboard/cases/${caseId}`)
    else navigate('/dashboard')
  }

  return (
    <div className="min-h-screen auth-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm animate-slide-up">
        <div className="glass-panel rounded-2xl p-8 text-center border border-[var(--border)]">
          {/* Icon */}
          <div className="w-16 h-16 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center mx-auto mb-5">
            <XCircle size={30} className="text-[var(--text-muted)]" />
          </div>

          <h1 className="font-display text-2xl font-semibold text-[var(--text-primary)] mb-2">
            Payment Cancelled
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mb-6 leading-relaxed">
            No charge was made. You can try again whenever you're ready to unlock your AI case
            report.
          </p>

          <div className="space-y-2">
            <Button
              onClick={handleRetry}
              fullWidth
              size="lg"
              loading={loading || redirecting}
              icon={RotateCcw}
              disabled={!caseId}
            >
              {redirecting ? 'Redirecting to Stripe…' : 'Try Again — AED 99'}
            </Button>

            <Button onClick={handleBack} variant="ghost" fullWidth size="md" icon={ArrowLeft}>
              Back to Case
            </Button>
          </div>

          <p className="text-[11px] text-[var(--text-muted)] mt-5">
            Questions? Contact support — we're happy to help.
          </p>
        </div>
      </div>
    </div>
  )
}

export default PaymentCancelPage
