import { useTranslation } from 'react-i18next'
import {
  Users, FolderOpen, UserCheck, Clock,
  Shield, Activity, TrendingUp, CheckCircle,
  AlertTriangle, Server, Database, Globe,
  ArrowRight, ChevronRight
} from 'lucide-react'
import { StatCard } from '@/components/ui/Card'
import { RoleBadge, StatusBadge, Badge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'

// ─── Mock data for placeholder UI ───────────────────────────────
const MOCK_USERS = [
  { id: '1', email: 'ahmed.al-rashid@example.com', role: 'client',  created_at: '2025-01-10', status: 'active' },
  { id: '2', email: 'sofia.ramirez@example.com',   role: 'partner', created_at: '2025-01-09', status: 'active' },
  { id: '3', email: 'priya.nair@example.com',       role: 'client',  created_at: '2025-01-08', status: 'active' },
  { id: '4', email: 'juan.dela.cruz@example.com',   role: 'client',  created_at: '2025-01-07', status: 'active' },
  { id: '5', email: 'fatima.khan@example.com',      role: 'partner', created_at: '2025-01-06', status: 'active' },
]

const MOCK_CASES = [
  { id: 'abc-001', type: 'visa',     status: 'pending',  user: 'ahmed.al-rashid@example.com' },
  { id: 'abc-002', type: 'business', status: 'active',   user: 'priya.nair@example.com' },
  { id: 'abc-003', type: 'contract', status: 'resolved', user: 'juan.dela.cruz@example.com' },
  { id: 'abc-004', type: 'property', status: 'pending',  user: 'fatima.khan@example.com' },
]

const SYSTEM_CHECKS = [
  { label: 'Database',    status: 'ok', icon: Database },
  { label: 'Auth Service',status: 'ok', icon: Shield },
  { label: 'Storage',     status: 'ok', icon: Server },
  { label: 'CDN',         status: 'ok', icon: Globe },
]

export function AdminDashboard() {
  const { t } = useTranslation()

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="animate-slide-up">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-gold-500/10 border border-gold-500/20 flex items-center justify-center">
            <Shield size={16} className="text-gold-400" />
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[var(--text-primary)]">
            {t('admin.title')}
          </h1>
        </div>
        <p className="text-sm text-[var(--text-secondary)] ms-11">
          {t('admin.subtitle')}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 animate-slide-up-delay-1">
        <StatCard label={t('admin.totalUsers')}    value="247"  icon={Users}     color="gold"   trend={12} />
        <StatCard label={t('admin.totalCases')}    value="1,043" icon={FolderOpen} color="blue"  trend={8}  />
        <StatCard label={t('admin.activePartners')} value="18"   icon={UserCheck} color="green"  />
        <StatCard label={t('admin.pendingReview')} value="34"   icon={Clock}     color="purple" />
      </div>

      {/* Two-column main */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up-delay-2">
        {/* Recent Cases — 2 cols */}
        <div className="lg:col-span-2 space-y-4">
          <SectionHeader title={t('admin.caseManagement')} action={t('common.view')} />

          <div className="space-y-2">
            {MOCK_CASES.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl glass-panel hover:border-white/10 transition-all duration-200 group cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-7 h-7 rounded-md bg-white/5 flex items-center justify-center shrink-0">
                    <FolderOpen size={12} className="text-[var(--text-muted)]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate capitalize">
                      {t(`case.types.${c.type}`)}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] truncate">{c.user}</p>
                  </div>
                </div>
                <StatusBadge status={c.status} />
                <ArrowRight size={13} className="text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </div>
            ))}
          </div>

          <Button variant="secondary" size="sm" fullWidth icon={ChevronRight} iconPosition="end">
            {t('admin.caseManagement')} — View All
          </Button>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* System Status */}
          <div>
            <SectionHeader title={t('admin.systemHealth')} />
            <div className="glass-panel rounded-xl p-4 space-y-3">
              {SYSTEM_CHECKS.map(({ label, status, icon: Icon }) => (
                <div key={label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 text-sm text-[var(--text-secondary)]">
                    <Icon size={14} className="text-[var(--text-muted)]" />
                    {label}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-green-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    {status === 'ok' ? t('admin.allGood').split(' ')[0] : 'Degraded'}
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
            <SectionHeader title={t('admin.recentRegistrations')} />
            <div className="space-y-2">
              {MOCK_USERS.slice(0, 4).map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl glass-panel hover:border-white/10 transition-all duration-200 cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-full bg-gold-500/10 border border-gold-500/20 flex items-center justify-center text-gold-400 text-xs font-semibold shrink-0">
                    {user.email[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[var(--text-primary)] truncate">
                      {user.email}
                    </p>
                  </div>
                  <RoleBadge role={user.role} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* User Management Table */}
      <div className="animate-slide-up-delay-3">
        <SectionHeader title={t('admin.userManagement')} action={t('common.view')} />

        <div className="glass-panel rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  {['Email', 'Role', 'Status', 'Joined', ''].map((h) => (
                    <th
                      key={h}
                      className="text-start px-4 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {MOCK_USERS.map((user) => (
                  <tr key={user.id} className="hover:bg-white/2 transition-colors group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-xs font-medium text-[var(--text-secondary)] shrink-0">
                          {user.email[0].toUpperCase()}
                        </div>
                        <span className="text-[var(--text-primary)]">{user.email}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3"><RoleBadge role={user.role} /></td>
                    <td className="px-4 py-3">
                      <Badge variant="green">Active</Badge>
                    </td>
                    <td className="px-4 py-3 text-[var(--text-muted)] text-xs">{user.created_at}</td>
                    <td className="px-4 py-3 text-end">
                      <button className="text-xs text-[var(--text-muted)] hover:text-gold-400 transition-colors opacity-0 group-hover:opacity-100">
                        {t('common.view')} →
                      </button>
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

function SectionHeader({ title, action }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="font-display text-lg font-semibold text-[var(--text-primary)]">{title}</h2>
      {action && (
        <button className="text-xs text-gold-400 hover:text-gold-300 transition-colors flex items-center gap-1">
          {action} <ArrowRight size={11} />
        </button>
      )}
    </div>
  )
}

export default AdminDashboard
