// src/components/ThemeToggle.jsx
// A compact dark/light mode toggle button.

import { useTheme } from '@/hooks/useTheme'
import { Sun, Moon } from 'lucide-react'
import { clsx } from 'clsx'

export function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme, isDark } = useTheme()

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
      className={clsx(
        'relative w-9 h-9 rounded-lg flex items-center justify-center',
        'border border-[var(--border)] bg-[var(--bg-elevated)]',
        'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
        'hover:border-[var(--border-gold)] transition-all',
        className,
      )}
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  )
}

export default ThemeToggle
