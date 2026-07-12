import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Bell,
  Check,
  CheckCheck,
  Brain,
  CreditCard,
  Briefcase,
  FileText,
  AlertCircle,
  Shield,
} from 'lucide-react'
import { clsx } from 'clsx'
import { useNotifications } from '@/hooks/useNotifications'

// ─── Icon per notification type ───────────────────────────────────
const TYPE_ICON = {
  case_created: { icon: Briefcase, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  case_updated: { icon: Briefcase, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  case_assigned: { icon: Briefcase, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  payment_success: { icon: CreditCard, color: 'text-green-400', bg: 'bg-green-500/10' },
  payment_failed: { icon: CreditCard, color: 'text-red-400', bg: 'bg-red-500/10' },
  task_created: { icon: FileText, color: 'text-gold-400', bg: 'bg-gold-500/10' },
  task_updated: { icon: FileText, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  task_done: { icon: Check, color: 'text-green-400', bg: 'bg-green-500/10' },
  document_uploaded: { icon: FileText, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  ai_ready: { icon: Brain, color: 'text-gold-400', bg: 'bg-gold-500/10' },
  system: { icon: Shield, color: 'text-[var(--text-muted)]', bg: 'bg-white/5' },
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export function NotificationBell() {
  const { t } = useTranslation()
  const { notifications, unreadCount, loading, markRead, markAllRead } = useNotifications()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const navigate = useNavigate()

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleClick = (notif) => {
    markRead(notif.id)
    if (notif.link) {
      setOpen(false)
      navigate(notif.link)
    }
  }

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative w-9 h-9 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/8 transition-all border border-[var(--border)]"
        aria-label={t('notifications.title', { defaultValue: 'Notifications' })}
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -end-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center animate-pulse-gold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute end-0 top-11 w-80 z-50 glass-panel rounded-2xl shadow-panel border border-[var(--border)] animate-fade-in overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <Bell size={14} className="text-gold-400" />
              <span className="text-sm font-semibold text-[var(--text-primary)]">
                {t('notifications.title', { defaultValue: 'Notifications' })}
              </span>
              {unreadCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/20 font-medium">
                  {unreadCount} {t('notifications.unread', { defaultValue: 'new' })}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-[10px] text-gold-400 hover:text-gold-300 transition-colors"
              >
                <CheckCheck size={11} />
                {t('notifications.markAllRead', { defaultValue: 'Mark all read' })}
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="w-5 h-5 border-2 border-gold-400/30 border-t-gold-400 rounded-full animate-spin mx-auto" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell size={24} className="text-[var(--text-muted)] mx-auto mb-2 opacity-50" />
                <p className="text-sm text-[var(--text-muted)]">
                  {t('notifications.empty', { defaultValue: 'No notifications yet' })}
                </p>
              </div>
            ) : (
              <div>
                {notifications.map((notif) => {
                  const cfg = TYPE_ICON[notif.type] || TYPE_ICON.system
                  const Icon = cfg.icon
                  return (
                    <button
                      key={notif.id}
                      onClick={() => handleClick(notif)}
                      className={clsx(
                        'w-full flex items-start gap-3 px-4 py-3 text-start transition-all hover:bg-white/3',
                        !notif.is_read && 'bg-gold-500/4',
                      )}
                    >
                      <div
                        className={clsx(
                          'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
                          cfg.bg,
                        )}
                      >
                        <Icon size={14} className={cfg.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={clsx(
                              'text-xs leading-snug',
                              notif.is_read
                                ? 'text-[var(--text-secondary)]'
                                : 'text-[var(--text-primary)] font-medium',
                            )}
                          >
                            {notif.title}
                          </p>
                          {!notif.is_read && (
                            <span className="w-2 h-2 rounded-full bg-gold-400 shrink-0 mt-1" />
                          )}
                        </div>
                        {notif.body && (
                          <p className="text-[11px] text-[var(--text-muted)] mt-0.5 line-clamp-2">
                            {notif.body}
                          </p>
                        )}
                        <p className="text-[10px] text-[var(--text-muted)] mt-1">
                          {timeAgo(notif.created_at)}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-[var(--border)] px-4 py-2.5 text-center">
              <span className="text-[10px] text-[var(--text-muted)]">
                {t('notifications.showing', {
                  count: Math.min(notifications.length, 50),
                  defaultValue: 'Showing {{count}} most recent',
                })}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default NotificationBell
