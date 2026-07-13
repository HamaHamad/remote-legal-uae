import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  Briefcase,
  ClipboardList,
  CheckCircle,
  Clock,
  ArrowRight,
  RefreshCw,
  FileCheck,
  TrendingUp,
  Briefcase as BriefcaseIcon,
  Car,
  Users,
  Home,
  Scale,
  HelpCircle,
  Brain,
  AlertCircle,
} from 'lucide-react'
import { clsx } from 'clsx'
import { useAuth } from '@/context/AuthContext'
import { usePartner } from '@/hooks/usePartner'
import { StatCard } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/Badge'
import { RiskBadge } from '@/components/AICaseReport'
import Button from '@/components/ui/Button'

const TYPE_META = {
  banking: {
    icon: BriefcaseIcon,
    color: 'text-[var(--status-resolved)]',
    bg: 'bg-[var(--status-resolved)]/10',
  },
  car: { icon: Car, color: 'text-orange-400', bg: 'bg-orange-500/10' },
  employment: {
    icon: Users,
    color: 'text-[var(--status-active)]',
    bg: 'bg-[var(--status-active)]/10',
  },
  rental: { icon: Home, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  legal: { icon: Scale, color: 'text-gold-400', bg: 'bg-gold-500/10' },
  other: { icon: HelpCircle, color: 'text-gray-400', bg: 'bg-gray-500/10' },
}

const STATUS_COLORS = {
  pending:
    'text-[var(--status-pending)]  bg-[var(--status-pending)]/10  border-[var(--status-pending)]/20',
  in_progress:
    'text-[var(--status-resolved)]   bg-[var(--status-resolved)]/10   border-[var(--status-resolved)]/20',
  done: 'text-[var(--status-active)]  bg-[var(--status-active)]/10  border-[var(--status-active)]/20',
  rejected:
    'text-[var(--status-error)]    bg-[var(--status-error)]/10    border-[var(--status-error)]/20',
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-AE', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function PartnerDashboard() {
  const { t } = useTranslation()
  const { profile } = useAuth()
  const { tasks, assignedCases, stats, loading, error, fetchAll } = usePartner()

  const firstName = profile?.email?.split('@')[0] || ''
  const pendingTasks = tasks.filter((t) => t.status === 'pending')
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress')
  const recentCases = assignedCases.slice(0, 5)

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between animate-slide-up">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <Briefcase size={16} className="text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-[var(--text-muted)]">
                {t('dashboard.greeting')}, <span className="text-purple-400">{firstName}</span>
              </p>
              <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[var(--text-primary)]">
                {t('partner.title')}
              </h1>
            </div>
          </div>
          <p className="text-sm text-[var(--text-secondary)] ms-11">{t('partner.subtitle')}</p>
        </div>
        <Button variant="ghost" size="sm" icon={RefreshCw} onClick={fetchAll} disabled={loading}>
          Refresh
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--status-error)]/8 border border-[var(--status-error)]/20 text-[var(--status-error)] text-sm">
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 animate-slide-up-delay-1">
        <StatCard
          label={t('partner.assignedCases')}
          value={loading ? '—' : stats.assigned}
          icon={ClipboardList}
          color="purple"
        />
        <StatCard
          label="In Progress"
          value={loading ? '—' : stats.inProgress}
          icon={TrendingUp}
          color="blue"
        />
        <StatCard
          label={t('partner.pendingDocuments')}
          value={loading ? '—' : stats.pending}
          icon={Clock}
          color="gold"
        />
        <StatCard
          label={t('partner.completedCases')}
          value={loading ? '—' : stats.done}
          icon={CheckCircle}
          color="green"
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-slide-up-delay-2">
        {/* Pending Tasks */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-semibold text-[var(--text-primary)]">
              Pending Tasks
              {pendingTasks.length > 0 && (
                <span className="ms-2 text-sm font-normal text-[var(--status-pending)] bg-[var(--status-pending)]/10 border border-[var(--status-pending)]/20 px-2 py-0.5 rounded-full">
                  {pendingTasks.length}
                </span>
              )}
            </h2>
            <Link to="/partner/tasks">
              <button className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1">
                View all <ArrowRight size={11} />
              </button>
            </Link>
          </div>

          {loading ? (
            <TaskSkeleton />
          ) : pendingTasks.length === 0 ? (
            <div className="glass-panel rounded-xl p-8 text-center">
              <CheckCircle size={28} className="text-[var(--status-active)] mx-auto mb-3" />
              <p className="text-sm text-[var(--text-secondary)]">All caught up!</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">No pending tasks</p>
            </div>
          ) : (
            <div className="space-y-2">
              {pendingTasks.slice(0, 4).map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          )}
        </div>

        {/* In Progress Tasks */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-semibold text-[var(--text-primary)]">
              In Progress
            </h2>
            <Link to="/partner/tasks">
              <button className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1">
                View all <ArrowRight size={11} />
              </button>
            </Link>
          </div>

          {loading ? (
            <TaskSkeleton />
          ) : inProgressTasks.length === 0 ? (
            <div className="glass-panel rounded-xl p-8 text-center">
              <ClipboardList size={28} className="text-[var(--text-muted)] mx-auto mb-3" />
              <p className="text-sm text-[var(--text-secondary)]">No tasks in progress</p>
            </div>
          ) : (
            <div className="space-y-2">
              {inProgressTasks.slice(0, 4).map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Assigned Cases */}
      <div className="animate-slide-up-delay-3">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-semibold text-[var(--text-primary)]">
            {t('partner.assignedCases')}
          </h2>
          <Link to="/partner/cases">
            <button className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1">
              View all <ArrowRight size={11} />
            </button>
          </Link>
        </div>

        {loading ? (
          <CaseSkeleton />
        ) : recentCases.length === 0 ? (
          <div className="glass-panel rounded-2xl p-12 text-center">
            <Briefcase size={32} className="text-[var(--text-muted)] mx-auto mb-4" />
            <h3 className="font-display text-xl font-semibold text-[var(--text-primary)] mb-2">
              {t('partner.noAssignedCases')}
            </h3>
            <p className="text-sm text-[var(--text-secondary)] max-w-xs mx-auto">
              {t('partner.noAssignedCasesDesc')}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentCases.map((c) => (
              <PartnerCaseCard key={c.id} caseItem={c} t={t} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Task card ─────────────────────────────────────────────────────
function TaskCard({ task }) {
  const statusCls = STATUS_COLORS[task.status] || STATUS_COLORS.pending
  const caseType = task.cases?.type || 'other'
  const client = task.cases?.users?.email || '—'

  return (
    <Link to="/partner/tasks">
      <div className="glass-panel rounded-xl p-4 hover:border-[var(--border)] hover:bg-[var(--bg-elevated)] transition-all cursor-pointer group">
        <div className="flex items-start justify-between gap-3 mb-2">
          <p className="text-sm font-semibold text-[var(--text-primary)] line-clamp-1">
            {task.title}
          </p>
          <span
            className={clsx(
              'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border shrink-0',
              statusCls,
            )}
          >
            {task.status.replace('_', ' ')}
          </span>
        </div>
        <p className="text-xs text-[var(--text-muted)] truncate">{client}</p>
        {task.notes && (
          <p className="text-xs text-[var(--text-secondary)] mt-1.5 line-clamp-2">{task.notes}</p>
        )}
        {task.due_date && (
          <p className="text-[10px] text-[var(--text-muted)] mt-2 flex items-center gap-1">
            <Clock size={10} />
            Due: {formatDate(task.due_date)}
          </p>
        )}
      </div>
    </Link>
  )
}

// ─── Partner case card ─────────────────────────────────────────────
function PartnerCaseCard({ caseItem, t }) {
  const typeKey = caseItem.type || 'other'
  const meta = TYPE_META[typeKey] || TYPE_META.other
  const Icon = meta.icon
  const client = caseItem.users?.email || '—'

  return (
    <Link to="/partner/cases">
      <div className="glass-panel rounded-xl p-4 hover:border-[var(--border)] hover:bg-[var(--bg-elevated)] transition-all cursor-pointer group flex items-center gap-4">
        <div
          className={clsx(
            'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
            meta.bg,
          )}
        >
          <Icon size={18} className={meta.color} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            {t(`case.types.${typeKey}`, { defaultValue: typeKey })}
          </p>
          <p className="text-xs text-[var(--text-secondary)] truncate">{client}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {caseItem.ai_risk_level && <RiskBadge level={caseItem.ai_risk_level} />}
          <StatusBadge status={caseItem.status} />
        </div>
        <ArrowRight
          size={14}
          className="text-[var(--text-muted)] opacity-0 group-hover:opacity-60 shrink-0"
        />
      </div>
    </Link>
  )
}

function TaskSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="glass-panel rounded-xl p-4 animate-pulse">
          <div className="h-3.5 bg-[var(--text-primary)]/5 rounded w-2/3 mb-2" />
          <div className="h-2.5 bg-[var(--text-primary)]/5 rounded w-1/2" />
        </div>
      ))}
    </div>
  )
}

function CaseSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="glass-panel rounded-xl p-4 animate-pulse flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[var(--text-primary)]/5 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 bg-[var(--text-primary)]/5 rounded w-1/3" />
            <div className="h-2.5 bg-[var(--text-primary)]/5 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default PartnerDashboard
