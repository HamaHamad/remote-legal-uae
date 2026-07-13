import { clsx } from 'clsx'
import { forwardRef, useId } from 'react'

const Input = forwardRef(function Input(
  {
    label,
    error,
    hint,
    icon: Icon,
    iconPosition = 'start',
    className = '',
    containerClassName = '',
    type = 'text',
    required,
    disabled,
    id,
    ...props
  },
  ref,
) {
  // useId() generates a stable unique ID for associating the input
  // with its label, error message, and hint via aria-describedby.
  const autoId = useId()
  const inputId = id || `input-${autoId}`
  const errorId = `${inputId}-error`
  const hintId = `${inputId}-hint`

  // Build aria-describedby from error + hint IDs
  const describedBy =
    [error ? errorId : null, hint && !error ? hintId : null].filter(Boolean).join(' ') || undefined

  return (
    <div className={clsx('flex flex-col gap-1.5', containerClassName)}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-[var(--text-secondary)] tracking-wide"
        >
          {label}
          {required && <span className="text-gold-400 ms-1">*</span>}
        </label>
      )}

      <div className="relative">
        {Icon && iconPosition === 'start' && (
          <span className="absolute inset-y-0 start-3 flex items-center pointer-events-none text-[var(--text-muted)]">
            <Icon size={16} />
          </span>
        )}

        <input
          ref={ref}
          id={inputId}
          type={type}
          disabled={disabled}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy}
          aria-required={required || undefined}
          className={clsx(
            'w-full bg-[var(--bg-elevated)] text-[var(--text-primary)]',
            'border border-[var(--border)] rounded-lg',
            'px-4 py-2.5 text-sm font-body',
            'placeholder:text-[var(--text-muted)]',
            'transition-all duration-200',
            'input-ring',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            Icon && iconPosition === 'start' && 'ps-10',
            Icon && iconPosition === 'end' && 'pe-10',
            error &&
              'border-red-500/50 focus:border-red-500 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.15)]',
            className,
          )}
          {...props}
        />

        {Icon && iconPosition === 'end' && (
          <span className="absolute inset-y-0 end-3 flex items-center pointer-events-none text-[var(--text-muted)]">
            <Icon size={16} />
          </span>
        )}
      </div>

      {error && (
        <p
          id={errorId}
          role="alert"
          className="text-xs text-[var(--status-error)] flex items-center gap-1"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <circle cx="6" cy="6" r="5.5" stroke="currentColor" />
            <path d="M6 3.5V6.5" stroke="currentColor" strokeLinecap="round" />
            <circle cx="6" cy="8.5" r="0.5" fill="currentColor" />
          </svg>
          {error}
        </p>
      )}

      {hint && !error && (
        <p id={hintId} className="text-xs text-[var(--text-muted)]">
          {hint}
        </p>
      )}
    </div>
  )
})

export default Input
