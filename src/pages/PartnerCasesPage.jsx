import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  Briefcase,
  Car,
  Users,
  Home,
  Scale,
  HelpCircle,
  Search,
  X,
  RefreshCw,
  AlertCircle,
  Clock,
  ChevronRight,
  FileText,
  Brain,
  CheckCircle,
} from 'lucide-react'
import { clsx } from 'clsx'
import { usePartner } from '@/hooks/usePartner'
import { StatusBadge } from '@/components/ui/Badge'
import { RiskBadge } from '@/components/AICaseReport'

const TYPE_META = {
  banking: { icon: Briefcase, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  car: { icon: Car, color: 'text-orange-400', bg: 'bg-orange-500/10' },
  employment: { icon: Users, color: 'text-green-400', bg: 'bg-green-500/10' },
  rental: { icon: Home, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  legal: { icon: Scale, color: 'text-gold-400', bg: 'bg-gold-500/10' },
  visa: { icon: FileText, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  other: { icon: HelpCircle, color: 'text-gray-400', bg: 'bg-gray-500/10' },
}

const STATUS_OPTIONS = ['all', 'pending', 'active', 'resolved']

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-AE', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function CaseCard({ caseItem, taskCount }) {
  const { t } = useTranslation()
  const typeKey = caseItem.type || 'other'
  const meta = TYPE_META[typeKey] || TYPE_META.other
  const Icon = meta.icon
  const client = caseItem.users?.email || '—'
  const name = caseItem.users?.full_name

  return (
    <div className="glass-panel rounded-2xl p-5 hover:border-white/10 hover:bg-[var(--bg-elevated)] transition-all group">
      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        <div
          className={clsx(
            'w-11 h-11 rounded-xl flex items-center justify-center shrink-0',
            meta.bg,
          )}
        >
          <Icon size={20} className={meta.color} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <p className="font-semibold text-[var(--text-primary)] capitalize">
              {typeKey.replace('_', ' ')} Case
            </p>
            <span className="text-[10px] font-mono text-[var(--text-muted)] bg-white/5 px-1.5 py-0.5 rounded">
              #{caseItem.id.slice(0, 8).toUpperCase()}
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)] truncate">
            {name ? `${name} · ` : ''}
            {client}
          </p>
        </div>
        <StatusBadge status={caseItem.status} />
      </div>

      {/* Description */}
      {caseItem.description && (
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4 line-clamp-2">
          {caseItem.description}
        </p>
      )}

      {/* Meta row */}
      <div className="flex items-center gap-4 text-xs text-[var(--text-muted)] mb-4">
        <span className="flex items-center gap-1.5">
          <Clock size={11} />
          Assigned {formatDate(caseItem.created_at)}
        </span>
        {caseItem.ai_risk_level && <RiskBadge level={caseItem.ai_risk_level} />}
        {caseItem.ai_status === 'done' && (
          <span className="flex items-center gap-1 text-gold-400/70">
            <Brain size={11} />
            AI ready
          </span>
        )}
      </div>

      {/* Tasks summary */}
      {taskCount !== undefined && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] mb-4">
          <CheckCircle size={13} className="text-[var(--text-muted)] shrink-0" />
          <p className="text-xs text-[var(--text-secondary)]">
            {taskCount === 0
              ? 'No tasks assigned yet'
              : `${taskCount} task${taskCount !== 1 ? 's' : ''} assigned to this case`}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Link to="/partner/tasks" className="flex-1">
          <button className="w-full flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-gold-500/10 text-gold-400 border border-gold-500/20 hover:bg-gold-500/15 transition-all">
            <CheckCircle size={12} />
            {t('partner.tasks', { defaultValue: 'View Tasks' })}
          </button>
        </Link>
        <Link to="/partner" className="flex-1">
          <button className="w-full flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border)] hover:text-[var(--text-primary)] hover:border-white/15 transition-all">
            <FileText size={12} />
            {t('case.viewDetails', { defaultValue: 'Case Details' })}
          </button>
        </Link>
      </div>
    </div>
  )
}

function Skeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="glass-panel rounded-2xl p-5 animate-pulse">
          <div className="flex gap-4 mb-4">
            <div className="w-11 h-11 rounded-xl bg-white/5 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-white/5 rounded w-1/2" />
              <div className="h-3 bg-white/5 rounded w-2/3" />
            </div>
          </div>
          <div className="space-y-2 mb-4">
            <div className="h-3 bg-white/5 rounded w-full" />
            <div className="h-3 bg-white/5 rounded w-3/4" />
          </div>
          <div className="h-8 bg-white/5 rounded-xl" />
        </div>
      ))}
    </div>
  )
}

export function PartnerCasesPage() {
  const { t } = useTranslation()
  const { assignedCases, tasks, loading, error, fetchAll } = usePartner()

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')

  // Count tasks per case
  const taskCountByCaseId = useMemo(() => {
    const counts = {}
    tasks.forEach((t) => {
      counts[t.case_id] = (counts[t.case_id] || 0) + 1
    })
    return counts
  }, [tasks])

  const filtered = useMemo(() => {
    return assignedCases.filter((c) => {
      const matchSearch =
        !search.trim() ||
        c.type?.toLowerCase().includes(search.toLowerCase()) ||
        c.description?.toLowerCase().includes(search.toLowerCase()) ||
        c.id.toLowerCase().includes(search.toLowerCase()) ||
        c.users?.email?.toLowerCase().includes(search.toLowerCase()) ||
        c.users?.full_name?.toLowerCase().includes(search.toLowerCase())
      const matchStatus = status === 'all' || c.status === status
      return matchSearch && matchStatus
    })
  }, [assignedCases, search, status])

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between animate-slide-up">
        <div>
          <h1 className="font-display text-3xl font-semibold text-[var(--text-primary)]">
            {t('partnerCases.title')}
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {loading ? '—' : `${filtered.length} of ${assignedCases.length} cases assigned to you`}
          </p>
        </div>
        <button
          onClick={fetchAll}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg glass-panel text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all disabled:opacity-50"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/8 border border-red-500/20 text-red-400 text-sm animate-fade-in">
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 animate-slide-up-delay-1">
        <div className="relative flex-1 min-w-[220px]">
          <Search
            size={14}
            className="absolute start-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none"
          />
          <input
            type="text"
            placeholder={t('partnerCases.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full ps-10 pe-9 py-2.5 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-gold-500 transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute end-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
            >
              <X size={13} />
            </button>
          )}
        </div>

        <div className="flex gap-1.5">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={clsx(
                'px-3 py-2 rounded-lg text-xs font-medium capitalize transition-all',
                status === s
                  ? 'bg-gold-500/15 text-gold-400 border border-gold-500/30'
                  : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border)] hover:border-white/15',
              )}
            >
              {s === 'all'
                ? `All (${assignedCases.length})`
                : `${s} (${assignedCases.filter((c) => c.status === s).length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <Skeleton />
      ) : filtered.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center animate-fade-in">
          <div className="w-14 h-14 rounded-2xl bg-white/5 border border-[var(--border)] flex items-center justify-center mx-auto mb-4">
            <Briefcase size={24} className="text-[var(--text-muted)]" />
          </div>
          <h3 className="font-display text-xl font-semibold text-[var(--text-primary)] mb-2">
            {assignedCases.length === 0 ? 'No cases assigned yet' : 'No cases match your filters'}
          </h3>
          <p className="text-sm text-[var(--text-secondary)] max-w-xs mx-auto">
            {assignedCases.length === 0
              ? 'Cases assigned to you by an admin will appear here.'
              : 'Try adjusting your search or status filter.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fade-in">
          {filtered.map((c) => (
            <CaseCard key={c.id} caseItem={c} taskCount={taskCountByCaseId[c.id]} />
          ))}
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <p className="text-xs text-[var(--text-muted)] text-center">
          Showing {filtered.length} of {assignedCases.length} cases
        </p>
      )}
    </div>
  )
}

export default PartnerCasesPage
