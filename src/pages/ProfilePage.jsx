import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  User, Mail, Globe, Lock, CheckCircle, AlertCircle,
  Eye, EyeOff, Save, Shield
} from 'lucide-react'
import { clsx } from 'clsx'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { SUPPORTED_LANGUAGES } from '@/i18n'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

// ─── Password field with visibility toggle ────────────────────────
function PasswordInput({ label, value, onChange, placeholder, error }) {
  const [show, setShow] = useState(false)
  return (
    <div>
      {label && (
        <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        <div className="absolute start-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none">
          <Lock size={15} />
        </div>
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={clsx(
            'w-full ps-10 pe-10 py-3 bg-[var(--bg-elevated)] border rounded-xl text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-gold-500 transition-all',
            error ? 'border-red-500/50' : 'border-[var(--border)]',
          )}
        />
        <button
          type="button"
          onClick={() => setShow(v => !v)}
          className="absolute end-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        >
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  )
}

// ─── Toast notification ────────────────────────────────────────────
function Toast({ message, type = 'success' }) {
  return (
    <div className={clsx(
      'flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium animate-fade-in',
      type === 'success'
        ? 'bg-green-500/10 border border-green-500/25 text-green-400'
        : 'bg-red-500/10 border border-red-500/25 text-red-400',
    )}>
      {type === 'success'
        ? <CheckCircle size={15} />
        : <AlertCircle size={15} />
      }
      {message}
    </div>
  )
}

// ─── Section card ──────────────────────────────────────────────────
function SectionCard({ title, icon: Icon, children }) {
  return (
    <div className="glass-panel rounded-2xl p-6">
      <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-[var(--border)]">
        <div className="w-7 h-7 rounded-lg bg-gold-500/10 border border-gold-500/20 flex items-center justify-center">
          <Icon size={14} className="text-gold-400" />
        </div>
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h2>
      </div>
      {children}
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────
export function ProfilePage() {
  const { t } = useTranslation()
  const { user, profile, fetchProfile, updateLanguage } = useAuth()

  // ── Profile form state ─────────────────────────────────────────
  const [fullName,    setFullName]    = useState(profile?.full_name || '')
  const [selectedLang, setSelectedLang] = useState(profile?.language || 'en')
  const [profileMsg,  setProfileMsg]  = useState(null)
  const [profileLoad, setProfileLoad] = useState(false)

  // ── Password form state ────────────────────────────────────────
  const [current,    setCurrent]    = useState('')
  const [newPass,    setNewPass]    = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [passErrors, setPassErrors]  = useState({})
  const [passMsg,    setPassMsg]    = useState(null)
  const [passLoad,   setPassLoad]   = useState(false)

  // Sync profile changes from context
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '')
      setSelectedLang(profile.language || 'en')
    }
  }, [profile])

  // ── Save profile ───────────────────────────────────────────────
  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setProfileMsg(null)
    setProfileLoad(true)

    try {
      const { error: dbErr } = await supabase
        .from('users')
        .update({ full_name: fullName.trim() })
        .eq('id', user.id)

      if (dbErr) throw dbErr

      // Also update Supabase auth metadata
      await supabase.auth.updateUser({
        data: { full_name: fullName.trim() },
      })

      // Apply language change if different
      if (selectedLang !== profile?.language) {
        await updateLanguage(selectedLang)
      }

      await fetchProfile(user.id)
      setProfileMsg({ type: 'success', text: 'Profile updated successfully' })
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.message || 'Failed to update profile' })
    } finally {
      setProfileLoad(false)
      setTimeout(() => setProfileMsg(null), 4000)
    }
  }

  // ── Change password ────────────────────────────────────────────
  const validatePassword = () => {
    const e = {}
    if (!current)               e.current = 'Current password is required'
    if (!newPass)               e.newPass = 'New password is required'
    else if (newPass.length < 8) e.newPass = 'Password must be at least 8 characters'
    if (newPass !== confirmPass) e.confirmPass = 'Passwords do not match'
    if (newPass === current)    e.newPass = 'New password must be different from current'
    setPassErrors(e)
    return Object.keys(e).length === 0
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setPassMsg(null)
    if (!validatePassword()) return

    setPassLoad(true)

    try {
      // Verify current password by attempting a sign-in first
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: current,
      })

      if (signInErr) {
        setPassErrors({ current: 'Current password is incorrect' })
        setPassLoad(false)
        return
      }

      // Update to new password
      const { error: updateErr } = await supabase.auth.updateUser({
        password: newPass,
      })

      if (updateErr) throw updateErr

      setCurrent('')
      setNewPass('')
      setConfirmPass('')
      setPassMsg({ type: 'success', text: 'Password changed successfully' })
    } catch (err) {
      setPassMsg({ type: 'error', text: err.message || 'Failed to change password' })
    } finally {
      setPassLoad(false)
      setTimeout(() => setPassMsg(null), 4000)
    }
  }

  const roleColor = {
    admin:   'bg-gold-500/10   text-gold-400   border-gold-500/25',
    partner: 'bg-purple-500/10 text-purple-400 border-purple-500/25',
    client:  'bg-blue-500/10   text-blue-400   border-blue-500/25',
  }[profile?.role || 'client'] || 'bg-white/5 text-[var(--text-muted)] border-white/10'

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Header */}
      <div className="animate-slide-up">
        <h1 className="font-display text-3xl font-semibold text-[var(--text-primary)] mb-1">
          Profile
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Manage your account details and preferences
        </p>
      </div>

      {/* Account summary */}
      <div className="glass-panel rounded-2xl p-5 flex items-center gap-4 animate-slide-up-delay-1">
        <div className="w-14 h-14 rounded-full bg-gold-500/10 border-2 border-gold-500/25 flex items-center justify-center text-gold-400 text-xl font-semibold shrink-0">
          {(profile?.full_name || user?.email || '?')[0].toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-[var(--text-primary)] truncate">
            {profile?.full_name || 'No name set'}
          </p>
          <p className="text-sm text-[var(--text-muted)] truncate">{user?.email}</p>
        </div>
        <span className={clsx(
          'text-xs font-semibold px-2.5 py-1 rounded-full border capitalize shrink-0',
          roleColor,
        )}>
          {profile?.role || 'client'}
        </span>
      </div>

      {/* Profile details form */}
      <form onSubmit={handleSaveProfile} className="animate-slide-up-delay-2">
        <SectionCard title="Account Details" icon={User}>
          <div className="space-y-4">
            {profileMsg && <Toast message={profileMsg.text} type={profileMsg.type} />}

            {/* Email (read-only) */}
            <div>
              <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute start-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none">
                  <Mail size={15} />
                </div>
                <input
                  type="email"
                  value={user?.email || ''}
                  readOnly
                  className="w-full ps-10 py-3 bg-[var(--bg-elevated)]/50 border border-[var(--border)] rounded-xl text-sm text-[var(--text-muted)] cursor-not-allowed select-none"
                />
              </div>
              <p className="text-[11px] text-[var(--text-muted)] mt-1">
                Email cannot be changed. Contact support if needed.
              </p>
            </div>

            {/* Full name */}
            <Input
              label="Full Name"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Your full name"
              icon={User}
            />

            {/* Language preference */}
            <div>
              <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                Preferred Language
              </label>
              <div className="relative">
                <div className="absolute start-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none">
                  <Globe size={15} />
                </div>
                <select
                  value={selectedLang}
                  onChange={e => setSelectedLang(e.target.value)}
                  className="w-full ps-10 pe-4 py-3 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl text-sm text-[var(--text-primary)] focus:outline-none focus:border-gold-500 transition-all appearance-none cursor-pointer"
                >
                  {SUPPORTED_LANGUAGES.map(lang => (
                    <option key={lang.code} value={lang.code}>
                      {lang.flag} {lang.nativeLabel} ({lang.label})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Button type="submit" icon={Save} loading={profileLoad}>
              Save Changes
            </Button>
          </div>
        </SectionCard>
      </form>

      {/* Change password form */}
      <form onSubmit={handleChangePassword} className="animate-slide-up-delay-3">
        <SectionCard title="Change Password" icon={Shield}>
          <div className="space-y-4">
            {passMsg && <Toast message={passMsg.text} type={passMsg.type} />}

            <PasswordInput
              label="Current Password"
              value={current}
              onChange={e => setCurrent(e.target.value)}
              placeholder="Your current password"
              error={passErrors.current}
            />

            <PasswordInput
              label="New Password"
              value={newPass}
              onChange={e => setNewPass(e.target.value)}
              placeholder="At least 8 characters"
              error={passErrors.newPass}
            />

            {/* Strength indicator */}
            {newPass && (
              <div className="space-y-1">
                <div className="flex gap-1">
                  {[0,1,2,3].map(i => {
                    const checks = [
                      newPass.length >= 8,
                      /[A-Z]/.test(newPass),
                      /[0-9]/.test(newPass),
                      /[^A-Za-z0-9]/.test(newPass),
                    ]
                    const score = checks.filter(Boolean).length
                    const colors = ['bg-red-500', 'bg-orange-400', 'bg-amber-400', 'bg-green-400']
                    return (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i < score ? colors[score-1] : 'bg-white/10'}`} />
                    )
                  })}
                </div>
              </div>
            )}

            <PasswordInput
              label="Confirm New Password"
              value={confirmPass}
              onChange={e => setConfirmPass(e.target.value)}
              placeholder="Repeat new password"
              error={passErrors.confirmPass}
            />

            <Button
              type="submit"
              icon={Lock}
              loading={passLoad}
              disabled={!current || !newPass || !confirmPass}
            >
              Change Password
            </Button>
          </div>
        </SectionCard>
      </form>

      {/* Account info */}
      <div className="glass-panel rounded-xl p-4 text-xs text-[var(--text-muted)] flex flex-wrap gap-4 animate-slide-up-delay-3">
        <span>
          Member since{' '}
          <span className="text-[var(--text-secondary)]">
            {profile?.created_at
              ? new Date(profile.created_at).toLocaleDateString('en-AE', { month: 'long', year: 'numeric' })
              : '—'
            }
          </span>
        </span>
        <span>
          User ID{' '}
          <span className="font-mono text-[var(--text-secondary)]">
            {user?.id?.slice(0, 8).toUpperCase()}
          </span>
        </span>
      </div>
    </div>
  )
}

export default ProfilePage
