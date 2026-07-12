import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { clsx } from 'clsx'
import {
  FileSearch,
  Brain,
  AlertTriangle,
  DollarSign,
  CheckCircle,
  ChevronRight,
  Loader2,
  RotateCcw,
  Users,
  Calendar,
  Hash,
  FileText,
  Shield,
  Lightbulb,
  Scale,
  X,
  RefreshCw,
} from 'lucide-react'
import Button from '@/components/ui/Button'
import { LegalDisclaimer } from '@/components/LegalDisclaimer'
import { useDocumentAnalysis } from '@/hooks/useDocumentAnalysis'

// ─── Section wrapper ───────────────────────────────────────────────
function Section({ icon: Icon, title, color = 'gold', children }) {
  const colorMap = {
    gold: 'text-gold-400   bg-gold-500/10   border-gold-500/20',
    red: 'text-red-400    bg-red-500/10    border-red-500/20',
    green: 'text-green-400  bg-green-500/10  border-green-500/20',
    blue: 'text-blue-400   bg-blue-500/10   border-blue-500/20',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    amber: 'text-amber-400  bg-amber-500/10  border-amber-500/20',
  }
  return (
    <div>
      <div className="flex items-center gap-2.5 mb-3">
        <div
          className={clsx(
            'w-7 h-7 rounded-lg border flex items-center justify-center shrink-0',
            colorMap[color],
          )}
        >
          <Icon size={13} />
        </div>
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
      </div>
      {children}
    </div>
  )
}

// ─── Bullet list ───────────────────────────────────────────────────
function BulletList({
  items,
  color = 'text-[var(--text-secondary)]',
  dot = 'bg-[var(--text-muted)]',
}) {
  if (!items || items.length === 0)
    return <p className="text-xs text-[var(--text-muted)] italic">None identified</p>
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5">
          <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0 mt-1.5', dot)} />
          <span className={clsx('text-sm leading-relaxed', color)}>{item}</span>
        </li>
      ))}
    </ul>
  )
}

// ─── Financial row ─────────────────────────────────────────────────
function FinancialRow({ label, value }) {
  if (!value) return null
  return (
    <div className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0">
      <span className="text-xs text-[var(--text-muted)]">{label}</span>
      <span className="text-sm font-semibold text-gold-400 tabular-nums">{value}</span>
    </div>
  )
}

// ─── Skeleton ──────────────────────────────────────────────────────
function AnalysisSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="h-4 bg-white/5 rounded w-1/3" />
      <div className="space-y-2">
        <div className="h-3 bg-white/5 rounded w-full" />
        <div className="h-3 bg-white/5 rounded w-5/6" />
        <div className="h-3 bg-white/5 rounded w-4/6" />
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-2">
          <div className="h-3.5 bg-white/5 rounded w-1/4" />
          <div className="h-3 bg-white/5 rounded w-3/4" />
          <div className="h-3 bg-white/5 rounded w-2/3" />
        </div>
      ))}
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────
export function DocumentIntelligencePanel({
  document, // { id, file_name, storage_path, mime_type, case_id }
  initialAnalysis, // pre-fetched analysis object (optional)
  onCaseCreated, // callback when auto-case is created
  compact = false, // compact mode for inline display
}) {
  const { t } = useTranslation()
  const { analyzeDocument, fetchAnalysis, pollUntilDone, deleteAnalysis } = useDocumentAnalysis()

  const [analysis, setAnalysis] = useState(initialAnalysis || null)
  const [loading, setLoading] = useState(!initialAnalysis)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState(null)
  const [stage, setStage] = useState('') // progress label

  // ─── Load existing analysis on mount ────────────────────────────
  const loadAnalysis = useCallback(async () => {
    if (!document?.id) return
    setLoading(true)
    const data = await fetchAnalysis(document.id)
    setAnalysis(data)
    setLoading(false)

    // If currently processing, start polling
    if (data?.status === 'processing') {
      startPolling()
    }
  }, [document?.id, fetchAnalysis])

  useEffect(() => {
    if (!initialAnalysis) loadAnalysis()
  }, [initialAnalysis, loadAnalysis])

  // ─── Trigger analysis ────────────────────────────────────────────
  const handleAnalyze = async () => {
    if (!document) return
    setRunning(true)
    setError(null)
    setStage(t('docIntelligence.analyzing'))

    const { error: triggerErr } = await analyzeDocument({
      documentId: document.id,
      caseId: document.case_id || null,
      storagePath: document.storage_path,
      mimeType: document.mime_type,
    })

    if (triggerErr) {
      setError(triggerErr)
      setRunning(false)
      setStage('')
      return
    }

    setStage('AI is reading your document…')

    // Poll for result
    const { data, error: pollErr } = await pollUntilDone(document.id)
    setRunning(false)
    setStage('')

    if (pollErr) {
      setError(pollErr)
    } else {
      setAnalysis(data)
    }
  }

  const startPolling = async () => {
    setRunning(true)
    setStage('AI is reading your document…')
    const { data, error: pollErr } = await pollUntilDone(document.id)
    setRunning(false)
    setStage('')
    if (!pollErr && data) setAnalysis(data)
  }

  const handleReanalyze = async () => {
    await deleteAnalysis(document.id)
    setAnalysis(null)
    handleAnalyze()
  }

  // ─── Render: no document ─────────────────────────────────────────
  if (!document) return null

  // ─── Render: loading ─────────────────────────────────────────────
  if (loading) {
    return (
      <div className="glass-panel rounded-2xl p-5">
        <AnalysisSkeleton />
      </div>
    )
  }

  // ─── Render: no analysis yet ─────────────────────────────────────
  if (!analysis) {
    return (
      <div className="glass-panel rounded-2xl p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-gold-500/8 border border-gold-500/15 flex items-center justify-center mx-auto mb-4">
          <FileSearch size={24} className="text-gold-400/60" />
        </div>
        <h3 className="font-display text-lg font-semibold text-[var(--text-primary)] mb-2">
          AI Document Analysis
        </h3>
        <p className="text-sm text-[var(--text-secondary)] mb-5 max-w-xs mx-auto leading-relaxed">
          Extract entities, financials, risks and obligations from this document using AI.
        </p>
        {error && (
          <div className="mb-4 flex items-start gap-2 p-3 rounded-xl bg-red-500/8 border border-red-500/20 text-red-400 text-xs text-start">
            <AlertTriangle size={13} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
        <Button onClick={handleAnalyze} loading={running} icon={Brain} size="md">
          {running ? stage || t('docIntelligence.analyzing') : t('docIntelligence.analyzeDocument')}
        </Button>
        <p className="text-[10px] text-[var(--text-muted)] mt-3">
          Powered by GPT-4o Vision · Takes 10–30 seconds
        </p>
      </div>
    )
  }

  // ─── Render: processing ───────────────────────────────────────────
  if (analysis.status === 'processing' || running) {
    return (
      <div className="glass-panel rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center">
            <Loader2 size={18} className="text-gold-400 animate-spin" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              {stage || 'AI is analysing your document…'}
            </p>
            <p className="text-xs text-[var(--text-muted)]">This usually takes 10–30 seconds</p>
          </div>
        </div>
        <AnalysisSkeleton />
      </div>
    )
  }

  // ─── Render: failed ───────────────────────────────────────────────
  if (analysis.status === 'failed') {
    return (
      <div className="glass-panel rounded-2xl p-5 flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
          <AlertTriangle size={16} className="text-red-400" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">Analysis Failed</p>
          <p className="text-xs text-[var(--text-secondary)] mb-3">
            {analysis.error_message || t('docIntelligence.analysisFailed')}
          </p>
          <Button variant="secondary" size="sm" icon={RotateCcw} onClick={handleReanalyze}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  // ─── Render: done ─────────────────────────────────────────────────
  const ai = analysis.extracted_json || {}
  const financials = ai.financials || {}
  const entities = ai.key_entities || {}

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        {/* Top accent */}
        <div className="h-0.5 bg-gradient-to-r from-gold-700 via-gold-400 to-gold-700" />

        <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gold-500/10 border border-gold-500/20 flex items-center justify-center">
              <Brain size={14} className="text-gold-400" />
            </div>
            <span className="text-sm font-semibold text-[var(--text-primary)]">
              {t('docIntelligence.title')}
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
              <CheckCircle size={9} /> Analysed
            </span>
          </div>
          <div className="flex items-center gap-2">
            {analysis.document_type && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold-500/10 text-gold-400 border border-gold-500/20">
                {analysis.document_type}
              </span>
            )}
            <button
              onClick={handleReanalyze}
              title={t('docIntelligence.reanalyze')}
              className="w-6 h-6 rounded-md flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/8 transition-all"
            >
              <RefreshCw size={11} />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-6">
          {/* Summary */}
          <Section icon={FileText} title="Document Summary" color="gold">
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              {analysis.summary || ai.summary || t('docIntelligence.notAvailable')}
            </p>
            {entities.dates && entities.dates.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {entities.dates.map((d, i) => (
                  <span
                    key={i}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-[var(--text-muted)] border border-[var(--border)]"
                  >
                    <Calendar size={9} className="inline me-1" />
                    {d}
                  </span>
                ))}
              </div>
            )}
          </Section>

          {/* Key entities */}
          {(entities.parties?.length > 0 || entities.reference_numbers?.length > 0) && (
            <Section icon={Users} title="Key Parties & References" color="blue">
              {entities.parties?.length > 0 && (
                <div className="mb-3">
                  <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                    {t('docIntelligence.parties')}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {entities.parties.map((p, i) => (
                      <span
                        key={i}
                        className="text-xs px-2.5 py-1 rounded-lg bg-blue-500/8 text-blue-400 border border-blue-500/20"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {entities.reference_numbers?.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                    References
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {entities.reference_numbers.map((r, i) => (
                      <span
                        key={i}
                        className="text-xs px-2.5 py-1 rounded-lg bg-white/5 text-[var(--text-secondary)] border border-[var(--border)] font-mono"
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Section>
          )}

          {/* Financials */}
          {(financials.total_amount ||
            financials.monthly_payment ||
            financials.outstanding_balance) && (
            <Section icon={DollarSign} title="Financial Overview" color="green">
              <div className="glass-panel-elevated rounded-xl px-4">
                <FinancialRow
                  label={t('docIntelligence.totalAmount')}
                  value={financials.total_amount}
                />
                <FinancialRow
                  label={t('docIntelligence.monthlyPayment')}
                  value={financials.monthly_payment}
                />
                <FinancialRow
                  label={t('docIntelligence.outstandingBalance')}
                  value={financials.outstanding_balance}
                />
                <FinancialRow
                  label={t('docIntelligence.paymentSchedule')}
                  value={financials.payment_schedule}
                />
              </div>
              {financials.fees?.length > 0 && (
                <div className="mt-3">
                  <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                    Fees & Penalties
                  </p>
                  <BulletList items={financials.fees} color="text-amber-400" dot="bg-amber-400" />
                </div>
              )}
            </Section>
          )}

          {/* Obligations */}
          {ai.obligations?.length > 0 && (
            <Section icon={Scale} title={t('docIntelligence.obligations')} color="purple">
              <BulletList
                items={ai.obligations}
                dot="bg-purple-400"
                color="text-[var(--text-secondary)]"
              />
            </Section>
          )}

          {/* Risks — highlighted in red */}
          {ai.risks?.length > 0 && (
            <Section icon={AlertTriangle} title="Risks & Red Flags" color="red">
              <div className="space-y-2">
                {ai.risks.map((risk, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2.5 p-3 rounded-xl bg-red-500/6 border border-red-500/15"
                  >
                    <AlertTriangle size={13} className="text-red-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-300/90 leading-relaxed">{risk}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Important clauses */}
          {ai.important_clauses?.length > 0 && (
            <Section icon={FileText} title={t('docIntelligence.importantClauses')} color="amber">
              <BulletList
                items={ai.important_clauses}
                dot="bg-amber-400"
                color="text-[var(--text-secondary)]"
              />
            </Section>
          )}

          {/* Recommended next steps */}
          {ai.recommended_next_steps?.length > 0 && (
            <Section icon={Lightbulb} title={t('docIntelligence.recommendedSteps')} color="gold">
              <div className="space-y-2">
                {ai.recommended_next_steps.map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-gold-500/15 text-gold-400 text-[10px] font-bold shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>
      </div>

      {/* Legal disclaimer */}
      <LegalDisclaimer variant="inline" />
    </div>
  )
}

export default DocumentIntelligencePanel
