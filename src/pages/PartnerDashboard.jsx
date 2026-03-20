import { useTranslation } from 'react-i18next'
import {
  Briefcase, ClipboardList, FileCheck, TrendingUp,
  Star, Clock, CheckCircle, AlertCircle,
  ArrowRight, Inbox
} from 'lucide-react'
import { StatCard } from '@/components/ui/Card'
import { StatusBadge, Badge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { useAuth } from '@/context/AuthContext'

// ─── Mock assigned cases ─────────────────────────────────────────
const MOCK_ASSIGNED = [
  { id: 'p-case-001', type: 'visa',     status: 'active',   client: 'Ahmed Al-Rashid',    deadline: '2025-02-15', docs: 3 },
  { id: 'p-case-002', type: 'business', status: 'pending',  client: 'Priya Nair',          deadline: '2025-02-20', docs: 1 },
  { id: 'p-case-003', type: 'contract', status: 'active',   client: 'Juan Dela Cruz',      deadline: '2025-02-18', docs: 5 },
]

// ─── Empty assigned state ─────────────────────────────────────────
function NoAssignedCases({ t }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-purple-500/8 border border-purple-500/15 flex items-center justify-center mb-5">
        <Inbox size={32} className="text-purple-400/50" />
      </div>
      <h3 className="font-display text-xl font-semibold text-[var(--text-primary)] mb-2">
        {t('partner.noAssignedCases')}
      </h3>
      <p className="text-sm text-[var(--text-secondary)] text-center max-w-xs">
        {t('partner.noAssignedCasesDesc')}
      </p>
    </div>
  )
}

export function PartnerDashboard() {
  const { t } = useTranslation()
  const { profile } = useAuth()

  const firstName = profile?.email?.split('@')[0] || ''

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="animate-slide-up">
        <div className="flex items-center gap-3 mb-2">
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
        <p className="text-sm text-[var(--text-secondary)] ms-11">
          {t('partner.subtitle')}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 animate-slide-up-delay-1">
        <StatCard label={t('partner.assignedCases')}   value={MOCK_ASSIGNED.length} icon={ClipboardList} color="purple" />
        <StatCard label={t('partner.completedCases')}  value="47"                    icon={CheckCircle}   color="green"  />
        <StatCard label={t('partner.pendingDocuments')} value="8"                   icon={FileCheck}     color="gold"   />
        <StatCard label={t('partner.myPerformance')}   value="96%"                  icon={TrendingUp}    color="blue"   />
      </div>

      {/* Performance Banner */}
      <div className="glass-panel gold-border rounded-2xl p-5 animate-slide-up-delay-2 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-gold-500/5 via-transparent to-transparent pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={16}
                  className={i < 5 ? 'text-gold-400 fill-gold-400' : 'text-[var(--text-muted)]'}
                />
              ))}
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                Top-Rated Partner
              </p>
              <p className="text-xs text-[var(--text-secondary)]">
                96% client satisfaction · 47 cases resolved
              </p>
            </div>
          </div>
          <Badge variant="gold">Expert Level</Badge>
        </div>
      </div>

      {/* Assigned Cases */}
      <div className="animate-slide-up-delay-2">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-semibold text-[var(--text-primary)]">
            {t('partner.assignedCases')}
          </h2>
          <button className="text-xs text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1">
            View all <ArrowRight size={11} />
          </button>
        </div>

        {MOCK_ASSIGNED.length === 0 ? (
          <div className="glass-panel rounded-2xl">
            <NoAssignedCases t={t} />
          </div>
        ) : (
          <div className="space-y-3">
            {MOCK_ASSIGNED.map((c) => (
              <AssignedCaseCard key={c.id} caseItem={c} t={t} />
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="animate-slide-up-delay-3">
        <h2 className="font-display text-xl font-semibold text-[var(--text-primary)] mb-4">
          {t('dashboard.quickActions')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ActionCard
            icon={ClipboardList}
            label={t('nav.assignedCases')}
            desc="View and manage your case queue"
            color="purple"
          />
          <ActionCard
            icon={FileCheck}
            label="Document Review"
            desc="Review pending client documents"
            color="gold"
          />
        </div>
      </div>
    </div>
  )
}

function AssignedCaseCard({ caseItem, t }) {
  const typeMap = {
    visa: t('case.types.visa'),
    business: t('case.types.business'),
    contract: t('case.types.contract'),
    property: t('case.types.property'),
    dispute: t('case.types.dispute'),
    family: t('case.types.family'),
  }

  const isOverdue = false // placeholder
  const deadlineDate = new Date(caseItem.deadline).toLocaleDateString('en-AE', {
    month: 'short', day: 'numeric', year: 'numeric'
  })

  return (
    <div className="glass-panel rounded-xl p-4 hover:border-white/10 hover:bg-[var(--bg-elevated)] transition-all duration-200 cursor-pointer group">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
            <Briefcase size={15} className="text-purple-400" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              {typeMap[caseItem.type] || caseItem.type}
            </p>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Client: <span className="text-[var(--text-primary)]">{caseItem.client}</span>
            </p>
          </div>
        </div>
        <StatusBadge status={caseItem.status} />
      </div>

      <div className="mt-3 flex items-center gap-4 text-xs text-[var(--text-muted)]">
        <span className="flex items-center gap-1">
          <Clock size={11} />
          Due: <span className={isOverdue ? 'text-red-400' : 'text-[var(--text-secondary)]'}>{deadlineDate}</span>
        </span>
        <span className="flex items-center gap-1">
          <FileCheck size={11} />
          {caseItem.docs} {t('nav.documents')}
        </span>
        <button className="ms-auto flex items-center gap-1 text-purple-400 hover:text-purple-300 transition-colors opacity-0 group-hover:opacity-100">
          {t('case.viewDetails')} <ArrowRight size={11} />
        </button>
      </div>
    </div>
  )
}

function ActionCard({ icon: Icon, label, desc, color }) {
  const colorMap = {
    purple: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
    gold:   'bg-gold-500/10  border-gold-500/20  text-gold-400',
    green:  'bg-green-500/10 border-green-500/20 text-green-400',
  }
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl glass-panel hover:border-white/10 hover:bg-[var(--bg-elevated)] transition-all duration-200 cursor-pointer">
      <div className={`w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 ${colorMap[color]}`}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-sm font-semibold text-[var(--text-primary)]">{label}</p>
        <p className="text-xs text-[var(--text-muted)]">{desc}</p>
      </div>
      <ArrowRight size={14} className="ms-auto text-[var(--text-muted)]" />
    </div>
  )
}

export default PartnerDashboard
