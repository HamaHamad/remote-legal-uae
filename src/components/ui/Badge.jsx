import { clsx } from 'clsx'

const statusConfig = {
  pending:  { label: 'Pending',  className: 'status-pending  border' },
  active:   { label: 'Active',   className: 'status-active   border' },
  resolved: { label: 'Resolved', className: 'status-resolved border' },
}

const roleConfig = {
  client:  { className: 'text-blue-400  bg-blue-500/10  border border-blue-500/20' },
  admin:   { className: 'text-gold-400  bg-gold-500/10  border border-gold-500/20' },
  partner: { className: 'text-purple-400 bg-purple-500/10 border border-purple-500/20' },
}

export function StatusBadge({ status }) {
  const config = statusConfig[status] || statusConfig.pending
  return (
    <span className={clsx(
      'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium',
      config.className
    )}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {config.label}
    </span>
  )
}

export function RoleBadge({ role }) {
  const config = roleConfig[role] || roleConfig.client
  const label = role ? role.charAt(0).toUpperCase() + role.slice(1) : 'Client'
  return (
    <span className={clsx(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
      config.className
    )}>
      {label}
    </span>
  )
}

export function Badge({ children, variant = 'default', className = '' }) {
  const variants = {
    default: 'bg-white/8 text-[var(--text-secondary)] border border-white/10',
    gold:    'bg-gold-500/10 text-gold-400 border border-gold-500/20',
    green:   'bg-green-500/10 text-green-400 border border-green-500/20',
    red:     'bg-red-500/10 text-red-400 border border-red-500/20',
    blue:    'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    purple:  'bg-purple-500/10 text-purple-400 border border-purple-500/20',
  }
  return (
    <span className={clsx(
      'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium',
      variants[variant],
      className
    )}>
      {children}
    </span>
  )
}

export default StatusBadge
