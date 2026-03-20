import { clsx } from 'clsx'

const variants = {
  primary: `
    bg-gold-500 hover:bg-gold-400 text-navy-950 font-semibold
    border border-gold-400 hover:border-gold-300
    shadow-gold-sm hover:shadow-gold
    transition-all duration-200
  `,
  secondary: `
    bg-transparent hover:bg-white/5 text-text-primary
    border border-white/10 hover:border-white/20
    transition-all duration-200
  `,
  ghost: `
    bg-transparent hover:bg-white/5 text-text-secondary hover:text-text-primary
    border border-transparent
    transition-all duration-200
  `,
  danger: `
    bg-red-500/10 hover:bg-red-500/20 text-red-400
    border border-red-500/20 hover:border-red-500/40
    transition-all duration-200
  `,
  outline: `
    bg-transparent text-gold-400 hover:text-gold-300
    border border-gold-500/40 hover:border-gold-400/60
    hover:bg-gold-500/5
    transition-all duration-200
  `,
}

const sizes = {
  xs: 'px-3 py-1.5 text-xs rounded-md',
  sm: 'px-4 py-2 text-sm rounded-lg',
  md: 'px-5 py-2.5 text-sm rounded-lg',
  lg: 'px-6 py-3 text-base rounded-xl',
  xl: 'px-8 py-4 text-base rounded-xl',
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  loading = false,
  icon: Icon,
  iconPosition = 'start',
  fullWidth = false,
  type = 'button',
  onClick,
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={clsx(
        'inline-flex items-center justify-center gap-2 font-body',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400/50',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'cursor-pointer select-none',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {loading ? (
        <>
          <SpinnerIcon />
          {children}
        </>
      ) : (
        <>
          {Icon && iconPosition === 'start' && <Icon size={16} className="shrink-0" />}
          {children}
          {Icon && iconPosition === 'end' && <Icon size={16} className="shrink-0" />}
        </>
      )}
    </button>
  )
}

function SpinnerIcon() {
  return (
    <svg
      className="animate-spin h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}

export default Button
