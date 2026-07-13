import { useTranslation } from 'react-i18next'
import { clsx } from 'clsx'

const statusConfig = {
  pending: { labelKey: 'case.pending', className: 'status-pending  border' },
  active: { labelKey: 'case.active', className: 'status-active   border' },
  resolved: { labelKey: 'case.resolved', className: 'status-resolved border' },
}

const roleConfig = {
  client: {
    className:
      'text-[var(--status-resolved)]  bg-[var(--status-resolved)]/10  border border-[var(--status-resolved)]/20',
    labelKey: 'roles.client',
  },
  admin: {
    className: 'text-gold-400  bg-gold-500/10  border border-gold-500/20',
    labelKey: 'roles.admin',
  },
  partner: {
    className: 'text-purple-400 bg-purple-500/10 border border-purple-500/20',
    labelKey: 'roles.partner',
  },
}

export function StatusBadge({ status }) {
  const { t } = useTranslation()
  const config = statusConfig[status] || statusConfig.pending
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium',
        config.className,
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {t(config.labelKey)}
    </span>
  )
}

export function RoleBadge({ role }) {
  const { t } = useTranslation()
  const config = roleConfig[role] || roleConfig.client
  // Fall back to capitalized role if translation key returns the key itself
  const label = t(config.labelKey, {
    defaultValue: role ? role.charAt(0).toUpperCase() + role.slice(1) : 'Client',
  })
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        config.className,
      )}
    >
      {label}
    </span>
  )
}

export function Badge({ children, variant = 'default', className = '' }) {
  const variants = {
    default:
      'bg-[var(--text-primary)]/8 text-[var(--text-secondary)] border border-[var(--border)]',
    gold: 'bg-gold-500/10 text-gold-400 border border-gold-500/20',
    green:
      'bg-[var(--status-active)]/10 text-[var(--status-active)] border border-[var(--status-active)]/20',
    red: 'bg-[var(--status-error)]/10 text-[var(--status-error)] border border-[var(--status-error)]/20',
    blue: 'bg-[var(--status-resolved)]/10 text-[var(--status-resolved)] border border-[var(--status-resolved)]/20',
    purple: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
  }
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium',
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}

export default StatusBadge
