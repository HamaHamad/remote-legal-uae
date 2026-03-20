import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  Users, FolderOpen, UserCheck, Clock,
  Shield, CheckCircle, Server, Database, Globe,
  ArrowRight, ChevronRight, RefreshCw, Brain
} from 'lucide-react'
import { clsx } from 'clsx'
import { useAdmin } from '@/hooks/useAdmin'
import { StatCard } from '@/components/ui/Card'
import { RoleBadge, StatusBadge } from '@/components/ui/Badge'
import { RiskBadge } from '@/components/AICaseReport'
import Button from '@/components/ui/Button'

const SYSTEM_CHECKS = [
  { label: 'Database',     icon: Database },
  { label: 'Auth Service', icon: Shield   },
  { label: 'Storage',      icon: Server   },
  { label: 'CDN',          icon: Globe    },
]

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-AE', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function AdminDashboard() {
  const { t } = useTranslation()
  const { stats, cases, users, loading, error, fetchAll } = useAdmin()

  const recentCases = cases.slice(0, 5)
  const recentUsers = users.slice(0, 5)

  return (
    <div className="max-w-6xl mx-auto space-y-8">

      {/* Header */}
      <div className="flex items-start justify-between animate-slide-up">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg bg-gold-500/10 border border-gold-500/20 flex items-center justify-center">
              <Shield size={16} className="text-gold-400" />
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[var(--text-primary)]">
              {t('admin.title')}
            </h1>
          </div>
          <p className="text-sm text-[var(--text-secondary)] ms-11">{t('admin.subtitle')}</p>
        </div>
        <Button variant="ghost" size="sm" icon={RefreshCw} onClick={fetchAll} disabled={loading}>
          Refresh
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/8 border border-red-500/20 text-red-400 text-sm animate-fade-in">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 animate-slide-up-delay-1">
        <StatCard
          label={t('admin.totalUsers')}
          value={loading ? '—' : stats.users.toLocaleString()}
          icon={Users}
          color="gold"
        />
        <StatCard
          label={t('admin.totalCases')}
          value={loading ? '—' : stats.cases.toLocaleString()}
          icon={FolderOpen}
          color="blue"
        />
        <StatCard
          label={t('admin.activePartners')}
          value={loading ? '—' : stats.partners.toLocaleString()}
          icon={UserCheck}
          color="green"
        />
        <StatCard
          label={t('admin.pendingReview')}
          value={loading ? '—' : stats.pending.toLocaleString()}
          icon={Clock}
          color="purple"
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up-delay-2">

        {/* Recent Cases — 2 cols */}
        <div className="lg:col-span-2 space-y-4">
          <SectionHeader title={t('admin.caseManagement')}>
            <Link to="/admin/cases">
              <button className="text-xs text-gold-400 hover:text-gold-300 flex items-center gap-1">
                View all <ArrowRight size={11} />
              </button>
            </Link>
          </SectionHeader>

          {loading ? (
            <CaseSkeleton />
          ) : recentCases.length === 0 ? (
            <EmptyState message="No cases yet" />
          ) : (
            <div className="space-y-2">
              {recentCases.map(c => (
                <CaseRow key={c.id} caseItem={c} t={t} />
              ))}
            </div>
          )}

          <Link to="/admin/cases">
            <Button variant="secondary" size="sm" fullWidth icon={ChevronRight} iconPosition="end">
              {t('admin.caseManagement')} — View All
            </Button>
          </Link>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* System Status */}
          <div>
            <SectionHeader title={t('admin.systemHealth')} />
            <div className="glass-panel rounded-xl p-4 space-y-3">
              {SYSTEM_CHECKS.map(({ label, icon: Icon }) => (
                <div key={label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 text-sm text-[var(--text-secondary)]">
                    <Icon size={14} className="text-[var(--text-muted)]" />
                    {label}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-green-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    OK
                  </div>
                </div>
              ))}
              <div className="pt-2 mt-1 border-t border-[var(--border)]">
                <div className="flex items-center gap-2 text-xs text-green-400">
                  <CheckCircle size={13} />
                  <span>{t('admin.allGood')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Registrations */}
          <div>
            <SectionHeader title={t('admin.recentRegistrations')}>
              <Link to="/admin/users">
                <button className="text-xs text-gold-400 hover:text-gold-300 flex items-center gap-1">
                  View all <ArrowRight size={11} />
                </button>
              </Link>
            </SectionHeader>
            {loading ? (
              <UserSkeleton />
            ) : (
              <div className="space-y-2">
                {recentUsers.map(user => (
                  <div key={user.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl glass-panel hover:border-white/10 transition-all">
                    <div className="w-7 h-7 rounded-full bg-gold-500/10 border border-gold-500/20 flex items-center justify-center text-gold-400 text-xs font-semibold shrink-0">
                      {(user.email || '?')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-[var(--text-primary)] truncate">{user.email}</p>
                      <p className="text-[10px] text-[var(--text-muted)]">{formatDate(user.created_at)}</p>
                    </div>
                    <RoleBadge role={user.role} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User Management Table */}
      <div className="animate-slide-up-delay-3">
        <SectionHeader title={t('admin.userManagement')}>
          <Link to="/admin/users">
            <button className="text-xs text-gold-400 hover:text-gold-300 flex items-center gap-1">
              View all <ArrowRight size={11} />
            </button>
          </Link>
        </SectionHeader>

        <div className="glass-panel rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  {['Email', 'Role', 'Joined', ''].map(h => (
                    <th key={h} className="text-start px-4 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {loading ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-[var(--text-muted)] text-sm">Loading…</td></tr>
                ) : users.slice(0, 8).map(user => (
                  <tr key={user.id} className="hover:bg-white/2 transition-colors group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-xs font-medium text-[var(--text-secondary)] shrink-0">
                          {(user.email || '?')[0].toUpperCase()}
                        </div>
                        <span className="text-[var(--text-primary)] truncate max-w-[200px]">{user.email}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3"><RoleBadge role={user.role} /></td>
                    <td className="px-4 py-3 text-[var(--text-muted)] text-xs">{formatDate(user.created_at)}</td>
                    <td className="px-4 py-3 text-end">
                      <Link to="/admin/users">
                        <button className="text-xs text-[var(--text-muted)] hover:text-gold-400 transition-colors opacity-0 group-hover:opacity-100">
                          Manage →
                        </button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Case row ──────────────────────────────────────────────────────
function CaseRow({ caseItem, t }) {
  const clientEmail = caseItem.users?.email || '—'
  const typeLabel   = t(`case.types.${caseItem.type}`, { defaultValue: caseItem.type })

  return (
    <Link to={`/admin/cases`}>
      <div className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl glass-panel hover:border-white/10 transition-all duration-200 group cursor-pointer">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-7 h-7 rounded-md bg-white/5 flex items-center justify-center shrink-0">
            <FolderOpen size={12} className="text-[var(--text-muted)]" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--text-primary)] truncate">{typeLabel}</p>
            <p className="text-xs text-[var(--text-muted)] truncate">{clientEmail}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {caseItem.ai_risk_level && <RiskBadge level={caseItem.ai_risk_level} />}
          <StatusBadge status={caseItem.status} />
        </div>
        <ArrowRight size={13} className="text-[var(--text-muted)] opacity-0 group-hover:opacity-100 shrink-0" />
      </div>
    </Link>
  )
}

function SectionHeader({ title, children }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="font-display text-lg font-semibold text-[var(--text-primary)]">{title}</h2>
      {children}
    </div>
  )
}

function EmptyState({ message }) {
  return (
    <div className="glass-panel rounded-xl p-8 text-center text-sm text-[var(--text-muted)]">
      {message}
    </div>
  )
}

function CaseSkeleton() {
  return (
    <div className="space-y-2">
      {[1,2,3,4].map(i => (
        <div key={i} className="flex items-center gap-4 px-4 py-3 rounded-xl glass-panel animate-pulse">
          <div className="w-7 h-7 rounded-md bg-white/5 shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 bg-white/5 rounded w-1/3" />
            <div className="h-2.5 bg-white/5 rounded w-1/2" />
          </div>
          <div className="h-5 bg-white/5 rounded-full w-16" />
        </div>
      ))}
    </div>
  )
}

function UserSkeleton() {
  return (
    <div className="space-y-2">
      {[1,2,3].map(i => (
        <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl glass-panel animate-pulse">
          <div className="w-7 h-7 rounded-full bg-white/5 shrink-0" />
          <div className="flex-1 h-3 bg-white/5 rounded" />
          <div className="h-4 bg-white/5 rounded-full w-14" />
        </div>
      ))}
    </div>
  )
}

export default AdminDashboard
