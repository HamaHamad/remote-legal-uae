import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import {
  FolderOpen,
  Plus,
  Search,
  Filter,
  Clock,
  Briefcase,
  Car,
  Users,
  Home,
  Scale,
  FileText,
  HelpCircle,
  X,
  ChevronDown,
  Brain,
} from 'lucide-react'
import { useCases } from '@/hooks/useCases'
import { StatusBadge } from '@/components/ui/Badge'
import { RiskBadge } from '@/components/AICaseReport'
import Button from '@/components/ui/Button'
import { CreateCaseModal } from '@/components/CreateCaseModal'
import { clsx } from 'clsx'

// ─── shared type map ──────────────────────────────────────────────
const TYPE_META = {
  banking: { icon: Briefcase, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  car: { icon: Car, color: 'text-orange-400', bg: 'bg-orange-500/10' },
  employment: { icon: Users, color: 'text-green-400', bg: 'bg-green-500/10' },
  rental: { icon: Home, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  legal: { icon: Scale, color: 'text-gold-400', bg: 'bg-gold-500/10' },
  visa: { icon: FileText, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  business: { icon: Briefcase, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  dispute: { icon: Scale, color: 'text-red-400', bg: 'bg-red-500/10' },
  contract: { icon: FileText, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  property: { icon: Home, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  family: { icon: Users, color: 'text-pink-400', bg: 'bg-pink-500/10' },
  criminal: { icon: Scale, color: 'text-red-400', bg: 'bg-red-500/10' },
  other: { icon: HelpCircle, color: 'text-gray-400', bg: 'bg-gray-500/10' },
}

const STATUS_FILTERS = ['all', 'pending', 'active', 'resolved']

// ─── Full Case Row ────────────────────────────────────────────────
function CaseRow({ caseItem, t }) {
  const navigate = useNavigate()
  const typeKey = caseItem.type || 'other'
  const meta = TYPE_META[typeKey] || TYPE_META.other
  const Icon = meta.icon
  const label = t(`case.types.${typeKey}`, { defaultValue: typeKey })
  const created = new Date(caseItem.created_at).toLocaleDateString('en-AE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  return (
    <button
      type="button"
      onClick={() => navigate(`/dashboard/cases/${caseItem.id}`)}
      aria-label={`View case ${label}: ${caseItem.status}`}
      className="group grid grid-cols-[2.5rem_1fr_auto_auto] sm:grid-cols-[2.5rem_1fr_8rem_8rem_6rem_5rem] items-center gap-4 px-4 py-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] hover:border-white/10 hover:bg-[var(--bg-elevated)] transition-all duration-200 cursor-pointer text-start w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400/50"
    >
      {/* Icon */}
      <div
        className={clsx('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', meta.bg)}
      >
        <Icon size={17} className={meta.color} />
      </div>

      {/* Title + desc */}
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[var(--text-primary)] truncate">{label}</span>
          <span className="hidden sm:inline text-[10px] font-mono text-[var(--text-muted)] bg-white/4 px-1.5 py-0.5 rounded shrink-0">
            #{caseItem.id.slice(0, 8).toUpperCase()}
          </span>
        </div>
        {caseItem.description ? (
          <p className="text-xs text-[var(--text-secondary)] mt-0.5 line-clamp-1">
            {caseItem.description}
          </p>
        ) : (
          <p className="text-xs text-[var(--text-muted)] mt-0.5 italic">
            {t('case.noDescription')}
          </p>
        )}
      </div>

      {/* AI indicator — desktop */}
      <div className="hidden sm:flex items-center gap-1.5 shrink-0">
        {caseItem.ai_status === 'done' && caseItem.ai_risk_level ? (
          <RiskBadge level={caseItem.ai_risk_level} />
        ) : caseItem.ai_status === 'processing' ? (
          <span className="flex items-center gap-1 text-[10px] text-gold-400 bg-gold-500/8 border border-gold-500/20 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-pulse" />
            {t('case.aiAnalyzing', { defaultValue: 'Analyzing' })}
          </span>
        ) : (
          <span className="text-[10px] text-[var(--text-muted)] flex items-center gap-1">
            <Brain size={10} className="opacity-40" />{' '}
            {t('case.aiPending', { defaultValue: 'Pending' })}
          </span>
        )}
      </div>

      {/* Date — desktop */}
      <div className="hidden sm:flex items-center gap-1 text-xs text-[var(--text-muted)] shrink-0">
        <Clock size={11} />
        {created}
      </div>

      {/* Status */}
      <div className="shrink-0">
        <StatusBadge status={caseItem.status} />
      </div>

      {/* Arrow — desktop */}
      <span className="hidden sm:block text-xs text-[var(--text-muted)] group-hover:text-gold-400 transition-colors opacity-0 group-hover:opacity-100 text-end shrink-0">
        {t('case.viewDetails')} →
      </span>
    </button>
  )
}

function EmptyFiltered({ onClear }) {
  return (
    <div className="flex flex-col items-center py-16 text-center">
      <Search size={32} className="text-[var(--text-muted)] mb-4" />
      <p className="text-sm font-medium text-[var(--text-primary)] mb-1">
        No cases match your filters
      </p>
      <p className="text-xs text-[var(--text-muted)] mb-4">
        Try adjusting the status or search term
      </p>
      <button
        onClick={onClear}
        className="text-xs text-gold-400 hover:text-gold-300 transition-colors flex items-center gap-1"
      >
        <X size={12} /> Clear filters
      </button>
    </div>
  )
}

function Skeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="grid grid-cols-[2.5rem_1fr_auto] items-center gap-4 px-4 py-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] animate-pulse"
        >
          <div className="w-10 h-10 rounded-xl bg-white/5" />
          <div className="space-y-2">
            <div className="h-3.5 bg-white/5 rounded w-1/4" />
            <div className="h-2.5 bg-white/5 rounded w-1/2" />
          </div>
          <div className="h-5 bg-white/5 rounded-full w-16" />
        </div>
      ))}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────
export function CasesPage() {
  const { t } = useTranslation()
  const { cases, stats, loading, refetch } = useCases()
  const [showModal, setShowModal] = useState(false)
  const [statusFilter, setStatus] = useState('all')
  const [search, setSearch] = useState('')
  const [showFilter, setShowFilter] = useState(false)

  const filtered = cases.filter((c) => {
    const matchStatus = statusFilter === 'all' || c.status === statusFilter
    const matchSearch =
      !search.trim() ||
      c.type?.toLowerCase().includes(search.toLowerCase()) ||
      c.description?.toLowerCase().includes(search.toLowerCase()) ||
      c.id.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  const clearFilters = () => {
    setStatus('all')
    setSearch('')
  }

  const onCreated = () => {
    setShowModal(false)
    refetch()
  }

  return (
    <>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 animate-slide-up">
          <div>
            <h1 className="font-display text-3xl font-semibold text-[var(--text-primary)]">
              {t('nav.cases')}
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              {loading
                ? '—'
                : `${cases.length} total · ${stats.active} active · ${stats.pending} pending`}
            </p>
          </div>
          <Button icon={Plus} size="md" onClick={() => setShowModal(true)}>
            {t('dashboard.createCase')}
          </Button>
        </div>

        {/* Filters bar */}
        <div className="flex flex-col sm:flex-row gap-3 animate-slide-up-delay-1">
          {/* Search */}
          <div className="relative flex-1">
            <Search
              size={14}
              className="absolute start-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none"
            />
            <input
              type="text"
              placeholder="Search by type, description or ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full ps-10 pe-4 py-2.5 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-gold-500 focus:shadow-[0_0_0_3px_rgba(217,157,24,0.12)] transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute end-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Status pills */}
          <div className="flex gap-1.5 flex-wrap">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={clsx(
                  'px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 capitalize',
                  statusFilter === s
                    ? 'bg-gold-500/15 text-gold-400 border border-gold-500/30'
                    : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border)] hover:border-white/15',
                )}
              >
                {s === 'all' ? `All (${cases.length})` : `${s} (${stats[s] ?? 0})`}
              </button>
            ))}
          </div>
        </div>

        {/* Table header (desktop) */}
        {!loading && cases.length > 0 && (
          <div className="hidden sm:grid grid-cols-[2.5rem_1fr_8rem_7rem_6rem] gap-4 px-4 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border)] pb-2">
            <div />
            <div>{t('case.type')}</div>
            <div>{t('case.created')}</div>
            <div>{t('case.status')}</div>
            <div />
          </div>
        )}

        {/* Cases */}
        {loading ? (
          <Skeleton />
        ) : filtered.length === 0 ? (
          cases.length === 0 ? (
            /* Brand new user — proper empty state */
            <div className="glass-panel rounded-2xl py-16 flex flex-col items-center text-center px-4">
              <div className="w-16 h-16 rounded-2xl bg-gold-500/8 border border-gold-500/15 flex items-center justify-center mb-5">
                <FolderOpen size={28} className="text-gold-500/50" />
              </div>
              <h3 className="font-display text-xl font-semibold text-[var(--text-primary)] mb-2">
                {t('dashboard.noCases')}
              </h3>
              <p className="text-sm text-[var(--text-secondary)] max-w-xs mb-6">
                {t('dashboard.noCasesDesc')}
              </p>
              <Button icon={Plus} onClick={() => setShowModal(true)}>
                {t('dashboard.createCase')}
              </Button>
            </div>
          ) : (
            <div className="glass-panel rounded-2xl">
              <EmptyFiltered onClear={clearFilters} />
            </div>
          )
        ) : (
          <div className="space-y-2 animate-fade-in">
            {filtered.map((c) => (
              <CaseRow key={c.id} caseItem={c} t={t} />
            ))}
          </div>
        )}

        {/* Summary footer */}
        {!loading && filtered.length > 0 && (
          <p className="text-xs text-[var(--text-muted)] text-center pb-2">
            Showing {filtered.length} of {cases.length} cases
          </p>
        )}
      </div>

      {showModal && <CreateCaseModal onClose={() => setShowModal(false)} onCreated={onCreated} />}
    </>
  )
}

export default CasesPage
