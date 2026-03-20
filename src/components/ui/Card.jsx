import { clsx } from 'clsx'

export function Card({ children, className = '', hover = false, gold = false, onClick, ...props }) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'glass-panel rounded-xl p-5',
        hover && 'transition-all duration-200 hover:border-white/12 hover:bg-[var(--bg-elevated)] cursor-pointer',
        gold && 'gold-border hover:shadow-gold',
        onClick && 'cursor-pointer',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '' }) {
  return (
    <div className={clsx('mb-4', className)}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className = '' }) {
  return (
    <h3 className={clsx('font-display text-xl font-semibold text-[var(--text-primary)]', className)}>
      {children}
    </h3>
  )
}

export function CardBody({ children, className = '' }) {
  return (
    <div className={clsx(className)}>
      {children}
    </div>
  )
}

export function StatCard({ label, value, icon: Icon, color = 'gold', trend, className = '' }) {
  const colorMap = {
    gold:    'text-gold-400 bg-gold-500/10 border-gold-500/20',
    green:   'text-green-400 bg-green-500/10 border-green-500/20',
    blue:    'text-blue-400 bg-blue-500/10 border-blue-500/20',
    purple:  'text-purple-400 bg-purple-500/10 border-purple-500/20',
    red:     'text-red-400 bg-red-500/10 border-red-500/20',
  }

  return (
    <Card className={clsx('flex items-start justify-between', className)}>
      <div className="flex-1">
        <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-widest mb-2">
          {label}
        </p>
        <p className="font-display text-3xl font-semibold text-[var(--text-primary)]">
          {value}
        </p>
        {trend && (
          <p className={clsx(
            'text-xs mt-2 font-medium',
            trend > 0 ? 'text-green-400' : 'text-red-400'
          )}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% this month
          </p>
        )}
      </div>
      {Icon && (
        <div className={clsx(
          'w-10 h-10 rounded-lg border flex items-center justify-center shrink-0',
          colorMap[color],
        )}>
          <Icon size={18} />
        </div>
      )}
    </Card>
  )
}

export default Card
