import { NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { clsx } from 'clsx'
import {
  LayoutDashboard, FolderOpen, FileText, User,
  Settings, LogOut, Users, BarChart2, Briefcase,
  ClipboardList, Shield, ChevronRight, CheckCircle
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useRole } from '@/hooks/useRole'
import { RoleBadge } from '@/components/ui/Badge'
import LanguageSwitcher from '@/components/LanguageSwitcher'

// ─── Nav items per role ──────────────────────────────────────────
const clientNav = (t) => [
  { label: t('nav.dashboard'), icon: LayoutDashboard, to: '/dashboard' },
  { label: t('nav.cases'),     icon: FolderOpen,       to: '/dashboard/cases' },
  { label: t('nav.documents'), icon: FileText,          to: '/dashboard/documents' },
]

const adminNav = (t) => [
  { label: t('nav.admin'),     icon: Shield,           to: '/admin' },
  { label: t('nav.allCases'),  icon: FolderOpen,       to: '/admin/cases' },
  { label: t('nav.users'),     icon: Users,            to: '/admin/users' },
  { label: t('nav.analytics'), icon: BarChart2,        to: '/admin/analytics' },
]

const partnerNav = (t) => [
  { label: t('nav.partner'),        icon: Briefcase,     to: '/partner' },
  { label: t('nav.assignedCases'),  icon: ClipboardList, to: '/partner/cases' },
  { label: 'My Tasks',              icon: CheckCircle,   to: '/partner/tasks' },
  { label: t('nav.documents'),      icon: FileText,       to: '/partner/documents' },
  { label: t('nav.reports'),        icon: BarChart2,      to: '/partner/reports' },
]

const bottomNav = (t) => [
  { label: t('nav.profile'),  icon: User,     to: '/profile' },
  { label: t('nav.settings'), icon: Settings, to: '/settings' },
]

export function Sidebar({ onClose }) {
  const { t } = useTranslation()
  const { profile, signOut } = useAuth()
  const { isAdmin, isPartner, isClient } = useRole()
  const navigate = useNavigate()

  const mainNav = isAdmin
    ? adminNav(t)
    : isPartner
      ? partnerNav(t)
      : clientNav(t)

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="p-5 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gold-500/15 border border-gold-500/30 flex items-center justify-center shrink-0">
            <ScalesLogo />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-gold-400 leading-tight truncate">
              Remote Legal
            </p>
            <p className="text-[10px] text-[var(--text-muted)] leading-tight">
              Case Orchestrator · UAE
            </p>
          </div>
        </div>
      </div>

      {/* User Profile Card */}
      {profile && (
        <div className="px-4 py-3 border-b border-[var(--border)]">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-white/3">
            <div className="w-8 h-8 rounded-full bg-gold-500/20 border border-gold-500/30 flex items-center justify-center text-gold-400 text-sm font-semibold shrink-0">
              {profile.email?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-[var(--text-primary)] truncate">
                {profile.email}
              </p>
              <div className="mt-0.5">
                <RoleBadge role={profile.role} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Nav */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {mainNav.map((item) => (
          <NavItem key={item.to} {...item} onClose={onClose} />
        ))}

        <div className="pt-4 pb-1">
          <p className="px-3 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest">
            Account
          </p>
        </div>

        {bottomNav(t).map((item) => (
          <NavItem key={item.to} {...item} onClose={onClose} />
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-[var(--border)] space-y-2">
        <div className="px-1">
          <LanguageSwitcher />
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className="sidebar-nav-item w-full text-red-400/80 hover:text-red-400 hover:bg-red-500/8"
        >
          <LogOut size={16} />
          <span>{t('nav.logout')}</span>
        </button>
      </div>
    </aside>
  )
}

function NavItem({ label, icon: Icon, to, onClose }) {
  return (
    <NavLink
      to={to}
      end
      onClick={onClose}
      className={({ isActive }) =>
        clsx('sidebar-nav-item', isActive && 'active')
      }
    >
      <Icon size={16} className="shrink-0" />
      <span className="flex-1">{label}</span>
      <ChevronRight size={12} className="opacity-30 shrink-0 [.active_&]:opacity-60" />
    </NavLink>
  )
}

function ScalesLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 28 28" fill="none">
      <path d="M14 3V25" stroke="#D99D18" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M8 3H20" stroke="#D99D18" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M14 3L5 11" stroke="#D99D18" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M14 3L23 11" stroke="#D99D18" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M3 14C3 14 4 18 8 18C12 18 13 14 13 14" stroke="#D99D18" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M15 14C15 14 16 18 20 18C24 18 25 14 25 14" stroke="#D99D18" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M10 25H18" stroke="#D99D18" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  )
}

export default Sidebar
