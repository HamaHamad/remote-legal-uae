import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft, FolderOpen, FileText, Clock, RefreshCw,
  Briefcase, Car, Users, Home, Scale, HelpCircle,
  Calendar, Hash, AlertCircle, Brain
} from 'lucide-react'
import { clsx } from 'clsx'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { useAI } from '@/hooks/useAI'
import { useDocuments } from '@/hooks/useDocuments'
import { StatusBadge } from '@/components/ui/Badge'
import { AICaseReport, RiskBadge } from '@/components/AICaseReport'
import Button from '@/components/ui/Button'

// ─── Type config ──────────────────────────────────────────────────
const TYPE_META = {
  banking:    { icon: Briefcase, color: 'text-blue-400',   bg: 'bg-blue-500/10'   },
  car:        { icon: Car,       color: 'text-orange-400', bg: 'bg-orange-500/10' },
  employment: { icon: Users,     color: 'text-green-400',  bg: 'bg-green-500/10'  },
  rental:     { icon: Home,      color: 'text-purple-400', bg: 'bg-purple-500/10' },
  legal:      { icon: Scale,     color: 'text-gold-400',   bg: 'bg-gold-500/10'   },
  other:      { icon: HelpCircle,color: 'text-gray-400',   bg: 'bg-gray-500/10'   },
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-AE', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function formatBytes(b) {
  if (!b) return '—'
  if (b < 1024) return `${b} B`
  if (b < 1048576) return `${(b/1024).toFixed(1)} KB`
  return `${(b/1048576).toFixed(1)} MB`
}

// ─── Skeleton ─────────────────────────────────────────────────────
function PageSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-white/5" />
        <div className="space-y-2">
          <div className="h-5 bg-white/5 rounded w-40" />
          <div className="h-3.5 bg-white/5 rounded w-24" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="h-32 bg-white/5 rounded-2xl" />
          <div className="h-64 bg-white/5 rounded-2xl" />
        </div>
        <div className="space-y-4">
          <div className="h-48 bg-white/5 rounded-2xl" />
          <div className="h-32 bg-white/5 rounded-2xl" />
        </div>
      </div>
    </div>
  )
}

// ─── Document list ─────────────────────────────────────────────────
function DocItem({ doc, onDownload, downloading }) {
  const isPDF = doc.mime_type === 'application/pdf' || doc.file_name?.endsWith('.pdf')
  const isImg = doc.mime_type?.startsWith('image/')

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] hover:border-white/10 transition-all group">
      <div className={clsx(
        'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0',
        isPDF ? 'bg-red-500/15 text-red-400' : isImg ? 'bg-blue-500/15 text-blue-400' : 'bg-white/8 text-[var(--text-muted)]',
      )}>
        {isPDF ? 'PDF' : isImg ? 'IMG' : 'DOC'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-[var(--text-primary)] truncate">{doc.file_name}</p>
        <p className="text-[11px] text-[var(--text-muted)]">{formatBytes(doc.file_size)}</p>
      </div>
      <button
        onClick={() => onDownload(doc)}
        disabled={downloading}
        className="opacity-0 group-hover:opacity-100 text-[11px] text-gold-400 hover:text-gold-300 transition-all flex items-center gap-1"
      >
        {downloading ? <span className="w-3 h-3 border border-gold-400/30 border-t-gold-400 rounded-full animate-spin" /> : 'Download'}
      </button>
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────────
export function CaseDetailPage() {
  const { t }         = useTranslation()
  const { caseId }    = useParams()
  const navigate      = useNavigate()
  const { user }      = useAuth()
  const { fetchAIReport, fetchSteps } = useAI()
  const { fetchDocuments, getSignedUrl } = useDocuments()

  const [caseData,  setCaseData]  = useState(null)
  const [aiReport,  setAiReport]  = useState(null)
  const [steps,     setSteps]     = useState([])
  const [documents, setDocuments] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)
  const [dlId,      setDlId]      = useState(null)
  const [polling,   setPolling]   = useState(false)

  // ─── Fetch all data ──────────────────────────────────────────
  const loadAll = useCallback(async () => {
    if (!caseId || !user) return
    setError(null)

    try {
      // Case + AI fields in one query
      const { data: cData, error: cErr } = await supabase
        .from('cases')
        .select(`
          id, type, status, description, created_at, updated_at, user_id,
          ai_status, ai_summary, ai_risk_level, ai_estimated_cost,
          ai_estimated_time, ai_unlocked
        `)
        .eq('id', caseId)
        .single()

      if (cErr) throw new Error(cErr.message)
      if (!cData) throw new Error('Case not found')

      setCaseData(cData)
      setAiReport(cData)

      // Steps
      const stepsData = await fetchSteps(caseId)
      setSteps(stepsData)

      // Documents
      const docsData = await fetchDocuments(caseId)
      setDocuments(docsData)

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [caseId, user, fetchSteps, fetchDocuments])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  // ─── Poll while processing ────────────────────────────────────
  useEffect(() => {
    if (aiReport?.ai_status !== 'processing') return

    setPolling(true)
    const interval = setInterval(async () => {
      const { data } = await fetchAIReport(caseId)
      if (!data) return

      setAiReport(data)
      setCaseData(prev => prev ? { ...prev, ...data } : data)

      if (data.ai_status === 'done' || data.ai_status === 'failed') {
        clearInterval(interval)
        setPolling(false)
        // Also refresh steps now
        const freshSteps = await fetchSteps(caseId)
        setSteps(freshSteps)
      }
    }, 3000) // poll every 3s

    return () => { clearInterval(interval); setPolling(false) }
  }, [aiReport?.ai_status, caseId, fetchAIReport, fetchSteps])

  // ─── Download ────────────────────────────────────────────────
  const handleDownload = async (doc) => {
    setDlId(doc.id)
    const url = await getSignedUrl(doc.storage_path, 60)
    if (url) {
      const a = document.createElement('a')
      a.href = url; a.download = doc.file_name; a.click()
    }
    setDlId(null)
  }

  if (loading) return <PageSkeleton />

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="glass-panel rounded-2xl p-8 flex flex-col items-center text-center">
          <AlertCircle size={32} className="text-red-400 mb-4" />
          <p className="text-sm font-medium text-[var(--text-primary)] mb-1">Could not load case</p>
          <p className="text-xs text-[var(--text-muted)] mb-5">{error}</p>
          <Button variant="secondary" onClick={() => navigate(-1)} icon={ArrowLeft}>Go Back</Button>
        </div>
      </div>
    )
  }

  const typeKey = caseData?.type || 'other'
  const meta    = TYPE_META[typeKey] || TYPE_META.other
  const Icon    = meta.icon
  const typeLabel = t(`case.types.${typeKey}`, { defaultValue: typeKey })

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">

      {/* ── Breadcrumb + Back ──────────────────────────────────── */}
      <div className="flex items-center gap-3 animate-slide-up">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-gold-400 transition-colors"
        >
          <ArrowLeft size={13} />
          {t('nav.cases')}
        </button>
        <span className="text-[var(--text-muted)] opacity-40">/</span>
        <span className="text-xs text-[var(--text-secondary)] font-mono">
          #{caseData.id.slice(0,8).toUpperCase()}
        </span>
      </div>

      {/* ── Case Header ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4 animate-slide-up-delay-1">
        <div className={clsx('w-14 h-14 rounded-2xl flex items-center justify-center shrink-0', meta.bg)}>
          <Icon size={26} className={meta.color} />
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="font-display text-3xl font-semibold text-[var(--text-primary)]">
              {typeLabel}
            </h1>
            <StatusBadge status={caseData.status} />
            {aiReport?.ai_risk_level && aiReport.ai_status === 'done' && (
              <RiskBadge level={aiReport.ai_risk_level} />
            )}
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--text-muted)]">
            <span className="flex items-center gap-1">
              <Hash size={11} />
              {caseData.id.slice(0,8).toUpperCase()}
            </span>
            <span className="flex items-center gap-1">
              <Calendar size={11} />
              {formatDate(caseData.created_at)}
            </span>
            {polling && (
              <span className="flex items-center gap-1 text-gold-400">
                <RefreshCw size={11} className="animate-spin" />
                AI analyzing…
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Main grid ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up-delay-2">

        {/* Left: description + AI report */}
        <div className="lg:col-span-2 space-y-5">

          {/* Description */}
          {caseData.description && (
            <div className="glass-panel rounded-2xl p-5">
              <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-3">
                Case Description
              </p>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">
                {caseData.description}
              </p>
            </div>
          )}

          {/* AI Report */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Brain size={14} className="text-gold-400" />
              <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest">
                AI Analysis
              </p>
            </div>
            <AICaseReport
              caseData={aiReport}
              steps={steps}
              onUnlockRequest={() => {}}
            />
          </div>
        </div>

        {/* Right: meta + documents */}
        <div className="space-y-5">

          {/* Case info */}
          <div className="glass-panel rounded-2xl p-4 space-y-3">
            <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest">
              Case Info
            </p>

            <InfoRow label="Status">
              <StatusBadge status={caseData.status} />
            </InfoRow>
            <InfoRow label="Type">
              <span className="text-xs text-[var(--text-primary)]">{typeLabel}</span>
            </InfoRow>
            {aiReport?.ai_status === 'done' && aiReport.ai_risk_level && (
              <InfoRow label="Risk">
                <RiskBadge level={aiReport.ai_risk_level} />
              </InfoRow>
            )}
            {aiReport?.ai_estimated_cost && (
              <InfoRow label="Est. Cost">
                <span className="text-xs text-gold-400">{aiReport.ai_estimated_cost}</span>
              </InfoRow>
            )}
            {aiReport?.ai_estimated_time && (
              <InfoRow label="Est. Time">
                <span className="text-xs text-[var(--text-secondary)]">{aiReport.ai_estimated_time}</span>
              </InfoRow>
            )}
            <InfoRow label="Opened">
              <span className="text-xs text-[var(--text-muted)]">
                {new Date(caseData.created_at).toLocaleDateString('en-AE')}
              </span>
            </InfoRow>
          </div>

          {/* Documents */}
          <div className="glass-panel rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest">
                Documents
              </p>
              <span className="text-[11px] text-[var(--text-muted)]">
                {documents.length} file{documents.length !== 1 ? 's' : ''}
              </span>
            </div>

            {documents.length === 0 ? (
              <div className="flex flex-col items-center py-6 text-center">
                <FileText size={22} className="text-[var(--text-muted)] mb-2" />
                <p className="text-xs text-[var(--text-muted)]">No documents uploaded</p>
              </div>
            ) : (
              <div className="space-y-2">
                {documents.map(doc => (
                  <DocItem
                    key={doc.id}
                    doc={doc}
                    onDownload={handleDownload}
                    downloading={dlId === doc.id}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, children }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[11px] text-[var(--text-muted)]">{label}</span>
      {children}
    </div>
  )
}

export default CaseDetailPage
