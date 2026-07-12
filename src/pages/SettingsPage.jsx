import { useState, useEffect } from 'react'
import {
  Bell,
  Globe,
  Shield,
  Trash2,
  LogOut,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Mail,
  Brain,
  CreditCard,
  Briefcase,
  Users,
} from 'lucide-react'
import { clsx } from 'clsx'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { SUPPORTED_LANGUAGES } from '@/i18n'
import Button from '@/components/ui/Button'

// ─── Toggle switch ─────────────────────────────────────────────────
function Toggle({ checked, onChange, disabled = false }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={clsx(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-all duration-200 focus:outline-none',
        checked ? 'bg-gold-500' : 'bg-[var(--bg-elevated)] border border-[var(--border)]',
        disabled && 'opacity-40 cursor-not-allowed',
      )}
    >
      <span
        className={clsx(
          'inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200',
          checked ? 'translate-x-5' : 'translate-x-0',
        )}
      />
    </button>
  )
}

// ─── Section card ──────────────────────────────────────────────────
function SectionCard({ title, icon: Icon, children, danger = false }) {
  return (
    <div
      className={clsx(
        'rounded-2xl p-6',
        danger ? 'bg-red-500/5 border border-red-500/15' : 'glass-panel',
      )}
    >
      <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-[var(--border)]">
        <div
          className={clsx(
            'w-7 h-7 rounded-lg flex items-center justify-center',
            danger
              ? 'bg-red-500/10 border border-red-500/20 text-red-400'
              : 'bg-gold-500/10 border border-gold-500/20 text-gold-400',
          )}
        >
          <Icon size={14} />
        </div>
        <h2
          className={clsx(
            'text-sm font-semibold',
            danger ? 'text-red-400' : 'text-[var(--text-primary)]',
          )}
        >
          {title}
        </h2>
      </div>
      {children}
    </div>
  )
}

// ─── Notification row ──────────────────────────────────────────────
function NotifRow({ icon: Icon, label, desc, checked, onChange }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3.5 border-b border-[var(--border)] last:border-0">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center shrink-0 mt-0.5">
          <Icon size={14} className="text-[var(--text-muted)]" />
        </div>
        <div>
          <p className="text-sm font-medium text-[var(--text-primary)]">{label}</p>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">{desc}</p>
        </div>
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  )
}

// ─── Toast ─────────────────────────────────────────────────────────
function Toast({ msg, type = 'success' }) {
  if (!msg) return null
  return (
    <div
      className={clsx(
        'flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium animate-fade-in',
        type === 'success'
          ? 'bg-green-500/10 border border-green-500/25 text-green-400'
          : 'bg-red-500/10 border border-red-500/25 text-red-400',
      )}
    >
      {type === 'success' ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
      {msg}
    </div>
  )
}

// ─── Default notification prefs ────────────────────────────────────
const DEFAULT_PREFS = {
  email_ai_ready: true,
  email_case_assigned: true,
  email_payment: true,
  email_task_update: true,
  inapp_ai_ready: true,
  inapp_case_assigned: true,
  inapp_payment: true,
  inapp_task_update: true,
}

// ─── Main Page ─────────────────────────────────────────────────────
export function SettingsPage() {
  const { user, profile, signOut, updateLanguage } = useAuth()

  const [prefs, setPrefs] = useState(DEFAULT_PREFS)
  const [selectedLang, setSelectedLang] = useState(profile?.language || 'en')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const [showDelete, setShowDelete] = useState(false)
  const [deleteInput, setDeleteInput] = useState('')
  const [deleting, setDeleting] = useState(false)

  // Load saved prefs from Supabase
  useEffect(() => {
    if (!user) return
    const loadPrefs = async () => {
      const { data } = await supabase
        .from('users')
        .select('notification_prefs')
        .eq('id', user.id)
        .single()

      if (data?.notification_prefs) {
        setPrefs({ ...DEFAULT_PREFS, ...data.notification_prefs })
      }
    }
    loadPrefs()
    if (profile?.language) setSelectedLang(profile.language)
  }, [user, profile])

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  // ── Save notification prefs ──────────────────────────────────────
  const handleSaveNotifications = async () => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('users')
        .update({ notification_prefs: prefs })
        .eq('id', user.id)

      if (error) throw error
      showToast('Notification preferences saved')
    } catch (err) {
      showToast(err.message || 'Failed to save', 'error')
    } finally {
      setSaving(false)
    }
  }

  // ── Save language ────────────────────────────────────────────────
  const handleSaveLanguage = async () => {
    setSaving(true)
    try {
      await updateLanguage(selectedLang)
      showToast('Language updated')
    } catch (err) {
      showToast('Failed to update language', 'error')
    } finally {
      setSaving(false)
    }
  }

  // ── Toggle pref helper ───────────────────────────────────────────
  const togglePref = (key) => (val) => setPrefs((p) => ({ ...p, [key]: val }))

  // ── Delete account ───────────────────────────────────────────────
  const handleDeleteAccount = async () => {
    if (deleteInput !== user?.email) return
    setDeleting(true)
    try {
      // Sign out first — actual deletion requires service role or support
      await signOut()
      // In production, you'd call a backend endpoint to delete the account
      // For now, redirect to home
      window.location.href = '/'
    } catch (err) {
      showToast('Failed to delete account. Contact support.', 'error')
      setDeleting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="animate-slide-up">
        <h1 className="font-display text-3xl font-semibold text-[var(--text-primary)] mb-1">
          Settings
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Manage your preferences and account settings
        </p>
      </div>

      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* Language */}
      <div className="animate-slide-up-delay-1">
        <SectionCard title="Language & Region" icon={Globe}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                Interface Language
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => setSelectedLang(lang.code)}
                    className={clsx(
                      'flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all text-start',
                      selectedLang === lang.code
                        ? 'border-gold-500/40 bg-gold-500/8 text-gold-400'
                        : 'border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:border-white/15',
                    )}
                  >
                    <span className="text-xl">{lang.flag}</span>
                    <div>
                      <p>{lang.nativeLabel}</p>
                      {lang.nativeLabel !== lang.label && (
                        <p className="text-[11px] opacity-60">{lang.label}</p>
                      )}
                    </div>
                    {lang.dir === 'rtl' && (
                      <span className="ms-auto text-[10px] text-[var(--text-muted)]">RTL</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
            <Button
              onClick={handleSaveLanguage}
              loading={saving}
              size="sm"
              icon={CheckCircle}
              disabled={selectedLang === profile?.language}
            >
              Save Language
            </Button>
          </div>
        </SectionCard>
      </div>

      {/* Notifications */}
      <div className="animate-slide-up-delay-2">
        <SectionCard title="Notification Preferences" icon={Bell}>
          <div className="space-y-1 mb-5">
            <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-3">
              Email Notifications
            </p>
            <NotifRow
              icon={Brain}
              label="AI Analysis Ready"
              desc="Email when your AI case report is complete"
              checked={prefs.email_ai_ready}
              onChange={togglePref('email_ai_ready')}
            />
            <NotifRow
              icon={Briefcase}
              label="Case Assigned"
              desc="Email when a specialist is assigned to your case"
              checked={prefs.email_case_assigned}
              onChange={togglePref('email_case_assigned')}
            />
            <NotifRow
              icon={CreditCard}
              label="Payment Confirmation"
              desc="Email when a payment is processed successfully"
              checked={prefs.email_payment}
              onChange={togglePref('email_payment')}
            />
            <NotifRow
              icon={Users}
              label="Task Updates"
              desc="Email when a task on your case is updated"
              checked={prefs.email_task_update}
              onChange={togglePref('email_task_update')}
            />

            <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest mt-5 mb-3">
              In-App Notifications
            </p>
            <NotifRow
              icon={Brain}
              label="AI Analysis Ready"
              desc="In-app badge when report is complete"
              checked={prefs.inapp_ai_ready}
              onChange={togglePref('inapp_ai_ready')}
            />
            <NotifRow
              icon={Briefcase}
              label="Case Updates"
              desc="In-app alerts for case status changes"
              checked={prefs.inapp_case_assigned}
              onChange={togglePref('inapp_case_assigned')}
            />
            <NotifRow
              icon={CreditCard}
              label="Payment Events"
              desc="In-app alerts for payment activity"
              checked={prefs.inapp_payment}
              onChange={togglePref('inapp_payment')}
            />
            <NotifRow
              icon={Users}
              label="Task Notifications"
              desc="In-app alerts for task assignments"
              checked={prefs.inapp_task_update}
              onChange={togglePref('inapp_task_update')}
            />
          </div>

          <Button onClick={handleSaveNotifications} loading={saving} size="sm" icon={Bell}>
            Save Notification Preferences
          </Button>
        </SectionCard>
      </div>

      {/* Security shortcuts */}
      <div className="animate-slide-up-delay-3">
        <SectionCard title="Security" icon={Shield}>
          <div className="space-y-2">
            {[
              { label: 'Change Password', desc: 'Update your account password', href: '/profile' },
              { label: 'Edit Profile', desc: 'Update your name and details', href: '/profile' },
              { label: 'Active Sessions', desc: "Manage where you're logged in", href: null },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => (item.href ? (window.location.href = item.href) : null)}
                disabled={!item.href}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] hover:border-white/15 hover:bg-[var(--bg-card)] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-start"
              >
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">{item.label}</p>
                  <p className="text-xs text-[var(--text-muted)]">{item.desc}</p>
                </div>
                <ChevronRight size={15} className="text-[var(--text-muted)] shrink-0" />
              </button>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Sign out */}
      <div className="animate-slide-up-delay-3">
        <SectionCard title="Session" icon={LogOut}>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-[var(--text-secondary)] mb-3">
                Sign out of your current session, or revoke access on all devices where you're
                logged in.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={() => signOut({ scope: 'local' })}
                  variant="secondary"
                  icon={LogOut}
                  size="sm"
                >
                  Sign Out (This Device)
                </Button>
                <Button
                  onClick={() => signOut({ scope: 'global' })}
                  variant="danger"
                  icon={LogOut}
                  size="sm"
                >
                  Sign Out of All Devices
                </Button>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Danger zone */}
      <div className="animate-slide-up-delay-3">
        <SectionCard title="Danger Zone" icon={Trash2} danger>
          {!showDelete ? (
            <div>
              <p className="text-sm text-[#e8e2d8]/60 mb-4">
                Permanently delete your account and all associated data. This action cannot be
                undone.
              </p>
              <button
                onClick={() => setShowDelete(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-500/30 text-red-400 text-sm hover:bg-red-500/8 transition-all"
              >
                <Trash2 size={14} />
                Delete Account
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-red-500/8 border border-red-500/20">
                <p className="text-sm text-red-400 font-medium mb-1">⚠ This cannot be undone</p>
                <p className="text-xs text-red-400/70">
                  All your cases, documents, and payment history will be permanently deleted.
                </p>
              </div>
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1.5">
                  Type your email to confirm: <span className="text-red-400">{user?.email}</span>
                </label>
                <input
                  type="email"
                  value={deleteInput}
                  onChange={(e) => setDeleteInput(e.target.value)}
                  placeholder={user?.email}
                  className="w-full px-3 py-2.5 bg-[var(--bg-elevated)] border border-red-500/30 rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-red-500 transition-all"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowDelete(false)
                    setDeleteInput('')
                  }}
                  className="flex-1 px-4 py-2 rounded-lg border border-[var(--border)] text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-white/15 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteInput !== user?.email || deleting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {deleting ? (
                    <span className="w-3 h-3 border border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                  ) : (
                    <Trash2 size={13} />
                  )}
                  {deleting ? 'Deleting…' : 'Delete My Account'}
                </button>
              </div>
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  )
}

export default SettingsPage
