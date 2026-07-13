import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import {
  FolderOpen,
  Plus,
  FileText,
  Clock,
  CheckCircle,
  Activity,
  ArrowRight,
  Sparkles,
  Briefcase,
  Car,
  Users,
  Home,
  Scale,
  HelpCircle,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useCases } from '@/hooks/useCases'
import { StatCard } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { CreateCaseModal } from '@/components/CreateCaseModal'
import { AutoCaseBuilder } from '@/components/AutoCaseBuilder'
import { clsx } from 'clsx'

const TYPE_META = {
  banking: {
    icon: Briefcase,
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
  visa: { icon: FileText, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  business: {
    icon: Briefcase,
    color: 'text-[var(--status-resolved)]',
    bg: 'bg-[var(--status-resolved)]/10',
  },
  dispute: { icon: Scale, color: 'text-[var(--status-error)]', bg: 'bg-[var(--status-error)]/10' },
  contract: { icon: FileText, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  property: { icon: Home, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  family: { icon: Users, color: 'text-pink-400', bg: 'bg-pink-500/10' },
  criminal: { icon: Scale, color: 'text-[var(--status-error)]', bg: 'bg-[var(--status-error)]/10' },
  other: { icon: HelpCircle, color: 'text-gray-400', bg: 'bg-gray-500/10' },
}

function EmptyState({ t, onOpen }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 animate-fade-in">
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-2xl bg-gold-500/8 border border-gold-500/15 flex items-center justify-center">
          <FolderOpen size={36} className="text-gold-500/50" />
        </div>
        <div className="absolute -top-1 -end-1 w-6 h-6 rounded-full bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center">
          <Plus size={12} className="text-gold-400" />
        </div>
      </div>
      <h3 className="font-display text-2xl font-semibold text-[var(--text-primary)] mb-2">
        {t('dashboard.noCases')}
      </h3>
      <p className="text-sm text-[var(--text-secondary)] text-center max-w-xs leading-relaxed mb-6">
        {t('dashboard.noCasesDesc')}
      </p>
      <Button icon={Plus} size="lg" onClick={onOpen}>
        {t('dashboard.createCase')}
      </Button>
      <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-xl">
        {[
          { icon: FileText, label: 'Document Upload', desc: 'Securely share case files' },
          { icon: Activity, label: 'Real-time Tracking', desc: 'Monitor case progress' },
          { icon: CheckCircle, label: 'Expert Assignment', desc: 'Matched to specialists' },
        ].map((item) => (
          <div
            key={item.label}
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/2 border border-[var(--border)] text-center"
          >
            <item.icon size={20} className="text-gold-500/50" />
            <p className="text-xs font-semibold text-[var(--text-secondary)]">{item.label}</p>
            <p className="text-[11px] text-[var(--text-muted)]">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function CaseCard({ caseItem, t }) {
  const navigate = useNavigate()
  const typeKey = caseItem.type || 'other'
  const label = t(`case.types.${typeKey}`, { defaultValue: typeKey })
  const meta = TYPE_META[typeKey] || TYPE_META.other
  const Icon = meta.icon
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
      className="group flex flex-col sm:flex-row sm:items-center gap-4 px-4 py-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] hover:border-[var(--border)] hover:bg-[var(--bg-elevated)] transition-all duration-200 cursor-pointer text-start w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400/50"
    >
      <div
        className={clsx('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', meta.bg)}
      >
        <Icon size={18} className={meta.color} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-[var(--text-primary)]">{label}</p>
          <span className="text-[10px] font-mono text-[var(--text-muted)] bg-[var(--text-primary)]/4 px-1.5 py-0.5 rounded">
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
      <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-1.5 shrink-0">
        <StatusBadge status={caseItem.status} />
        <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-1">
          <Clock size={10} />
          {created}
        </span>
      </div>
      <ArrowRight
        size={14}
        className="hidden sm:block text-[var(--text-muted)] opacity-0 group-hover:opacity-60 transition-opacity shrink-0"
      />
    </button>
  )
}

function CaseSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex items-center gap-4 px-4 py-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] animate-pulse"
        >
          <div className="w-10 h-10 rounded-xl bg-[var(--text-primary)]/5 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 bg-[var(--text-primary)]/5 rounded w-1/3" />
            <div className="h-2.5 bg-[var(--text-primary)]/5 rounded w-2/3" />
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <div className="h-5 bg-[var(--text-primary)]/5 rounded-full w-16" />
            <div className="h-3 bg-[var(--text-primary)]/5 rounded w-20" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function ClientDashboard() {
  const { t } = useTranslation()
  const { profile } = useAuth()
  const { cases, stats, loading, refetch } = useCases()
  const [showModal, setShowModal] = useState(false)
  const [showAutoBuilder, setShowAutoBuilder] = useState(false)

  const firstName = profile?.email?.split('@')[0] || ''
  const openModal = () => setShowModal(true)
  const closeModal = () => setShowModal(false)
  const onCreated = () => {
    closeModal()
    refetch()
  }

  return (
    <>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 animate-slide-up">
          <div>
            <p className="text-sm text-[var(--text-muted)] mb-1">
              {t('dashboard.greeting')},{' '}
              <span className="text-gold-400 font-medium">{firstName}</span>
            </p>
            <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[var(--text-primary)]">
              {t('dashboard.clientTitle')}
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              {t('dashboard.clientSubtitle')}
            </p>
          </div>
          <Button icon={Plus} size="md" onClick={openModal}>
            {t('dashboard.createCase')}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 animate-slide-up-delay-1">
          <StatCard
            label={t('dashboard.totalCases')}
            value={loading ? '—' : stats.total}
            icon={FolderOpen}
            color="gold"
          />
          <StatCard
            label={t('dashboard.activeCases')}
            value={loading ? '—' : stats.active}
            icon={Activity}
            color="green"
          />
          <StatCard
            label={t('dashboard.pendingCases')}
            value={loading ? '—' : stats.pending}
            icon={Clock}
            color="blue"
          />
          <StatCard
            label={t('dashboard.resolvedCases')}
            value={loading ? '—' : stats.resolved}
            icon={CheckCircle}
            color="purple"
          />
        </div>

        {/* Cases List */}
        <div className="animate-slide-up-delay-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-semibold text-[var(--text-primary)]">
              {t('dashboard.recentActivity')}
            </h2>
            {cases.length > 0 && (
              <Link
                to="/dashboard/cases"
                className="text-xs text-gold-400 hover:text-gold-300 transition-colors flex items-center gap-1"
              >
                {t('dashboard.viewAllCases')} <ArrowRight size={12} />
              </Link>
            )}
          </div>

          {loading ? (
            <CaseSkeleton />
          ) : cases.length === 0 ? (
            <div className="glass-panel rounded-2xl">
              <EmptyState t={t} onOpen={openModal} />
            </div>
          ) : (
            <div className="space-y-2">
              {cases.slice(0, 5).map((c) => (
                <CaseCard key={c.id} caseItem={c} t={t} />
              ))}
              {cases.length > 5 && (
                <Link to="/dashboard/cases">
                  <div className="flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-[var(--border)] text-sm text-[var(--text-muted)] hover:text-gold-400 hover:border-gold-500/30 transition-all cursor-pointer">
                    <span>+{cases.length - 5} more cases</span>
                    <ArrowRight size={13} />
                  </div>
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="animate-slide-up-delay-3">
          <h2 className="font-display text-xl font-semibold text-[var(--text-primary)] mb-4">
            {t('dashboard.quickActions')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <QuickAction
              icon={Plus}
              label={t('dashboard.createCase')}
              desc="Open a new legal matter"
              gold
              onClick={openModal}
            />
            <QuickAction
              icon={Sparkles}
              label="Auto Case Builder"
              desc="Upload doc → AI builds case"
              gold
              onClick={() => setShowAutoBuilder(true)}
            />
            <Link to="/dashboard/cases" className="block">
              <QuickAction icon={FolderOpen} label={t('nav.cases')} desc="View all your cases" />
            </Link>
          </div>
        </div>
      </div>

      {showModal && <CreateCaseModal onClose={closeModal} onCreated={onCreated} />}

      {/* Auto Case Builder modal */}
      {showAutoBuilder && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAutoBuilder(false)
          }}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in" />
          <div className="relative z-10 w-full sm:max-w-lg bg-[var(--bg-secondary)] border border-[var(--border)] rounded-t-2xl sm:rounded-2xl shadow-panel max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[var(--border)]">
              <p className="text-sm font-semibold text-[var(--text-primary)]">Auto Case Builder</p>
              <button
                onClick={() => setShowAutoBuilder(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--text-primary)]/8 transition-all text-sm"
              >
                ✕
              </button>
            </div>
            <div className="p-5">
              <AutoCaseBuilder
                onClose={() => setShowAutoBuilder(false)}
                onCaseCreated={() => {
                  refetch()
                  setShowAutoBuilder(false)
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function QuickAction({ icon: Icon, label, desc, gold, disabled, onClick }) {
  return (
    <button
      type="button"
      onClick={!disabled && onClick ? onClick : undefined}
      disabled={disabled}
      aria-label={label}
      className={clsx(
        'flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 h-full text-start w-full',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400/50',
        disabled
          ? 'opacity-40 cursor-not-allowed border-[var(--border)] bg-[var(--bg-card)]'
          : gold
            ? 'cursor-pointer border-gold-500/30 bg-gold-500/5 hover:bg-gold-500/10 hover:border-gold-500/50 hover:shadow-gold-sm'
            : 'cursor-pointer border-[var(--border)] bg-[var(--bg-card)] hover:bg-[var(--bg-elevated)] hover:border-[var(--border)]',
      )}
    >
      <div
        className={clsx(
          'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
          gold
            ? 'bg-gold-500/15 text-gold-400'
            : 'bg-[var(--text-primary)]/5 text-[var(--text-muted)]',
        )}
      >
        <Icon size={18} />
      </div>
      <div>
        <p
          className={clsx(
            'text-sm font-semibold',
            gold ? 'text-gold-300' : 'text-[var(--text-primary)]',
          )}
        >
          {label}
        </p>
        <p className="text-xs text-[var(--text-muted)]">{desc}</p>
      </div>
    </button>
  )
}

export default ClientDashboard
