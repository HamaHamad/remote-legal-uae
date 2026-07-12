import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Users,
  Search,
  X,
  UserCheck,
  Shield,
  RefreshCw,
  ChevronDown,
  CheckCircle,
  AlertCircle,
  UserPlus,
} from 'lucide-react'
import { clsx } from 'clsx'
import { useAdmin } from '@/hooks/useAdmin'
import { RoleBadge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'

const ROLE_OPTIONS = ['all', 'client', 'partner', 'admin']

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-AE', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// ─── Promote to Partner Modal ─────────────────────────────────────
function PromoteModal({ user, onConfirm, onClose, loading }) {
  const { t } = useTranslation()
  const [form, setForm] = useState({ name: '', specialty: 'general', bio: '' })
  const update = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }))

  const specialties = ['general', 'visa', 'employment', 'banking', 'rental', 'legal', 'car']

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-sm glass-panel rounded-2xl p-6 animate-slide-up border border-[var(--border)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display text-xl font-semibold text-[var(--text-primary)] mb-1">
          Promote to Partner
        </h3>
        <p className="text-xs text-[var(--text-muted)] mb-5">{user.email}</p>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider block mb-1.5">
              Full Name *
            </label>
            <input
              value={form.name}
              onChange={update('name')}
              placeholder="Partner's display name"
              className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-gold-500"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider block mb-1.5">
              Specialty *
            </label>
            <select
              value={form.specialty}
              onChange={update('specialty')}
              className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-gold-500"
            >
              {specialties.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider block mb-1.5">
              Bio
            </label>
            <textarea
              value={form.bio}
              onChange={update('bio')}
              rows={2}
              placeholder="Brief description…"
              className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-gold-500 resize-none"
            />
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          <Button variant="ghost" size="sm" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => onConfirm({ userId: user.id, email: user.email, ...form })}
            disabled={!form.name}
            loading={loading}
            icon={UserCheck}
            className="flex-1"
          >
            Promote
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Change Role Modal ─────────────────────────────────────────────
function ChangeRoleModal({ user, onConfirm, onClose, loading }) {
  const { t } = useTranslation()
  const [role, setRole] = useState(user.role)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-xs glass-panel rounded-2xl p-6 animate-slide-up border border-[var(--border)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display text-lg font-semibold text-[var(--text-primary)] mb-1">
          {t('adminUsers.changeRole')}
        </h3>
        <p className="text-xs text-[var(--text-muted)] mb-5">{user.email}</p>

        <div className="space-y-2 mb-5">
          {['client', 'partner', 'admin'].map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={clsx(
                'w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium capitalize transition-all',
                role === r
                  ? 'border-gold-500/40 bg-gold-500/8 text-gold-400'
                  : 'border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:border-white/15',
              )}
            >
              {r}
              {role === r && <CheckCircle size={14} className="text-gold-400" />}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => onConfirm(user.id, role)}
            disabled={role === user.role}
            loading={loading}
            className="flex-1"
          >
            Save Role
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────
export function AdminUsersPage() {
  const { t } = useTranslation()
  const { users, loading, error, fetchAll, updateUserRole, createPartner } = useAdmin()

  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [promoteModal, setPromoteModal] = useState(null)
  const [roleModal, setRoleModal] = useState(null)
  const [actionLoad, setActionLoad] = useState(false)
  const [successMsg, setSuccess] = useState('')

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        !search.trim() ||
        u.email?.toLowerCase().includes(search.toLowerCase()) ||
        u.full_name?.toLowerCase().includes(search.toLowerCase())
      const matchRole = roleFilter === 'all' || u.role === roleFilter
      return matchSearch && matchRole
    })
  }, [users, search, roleFilter])

  const toast = (msg) => {
    setSuccess(msg)
    setTimeout(() => setSuccess(''), 3000)
  }

  const handleChangeRole = async (userId, role) => {
    setActionLoad(true)
    const { error: err } = await updateUserRole(userId, role)
    setActionLoad(false)
    setRoleModal(null)
    if (!err) toast(t('adminUsers.roleUpdated'))
  }

  const handlePromote = async (data) => {
    setActionLoad(true)
    const { error: err } = await createPartner(data)
    setActionLoad(false)
    setPromoteModal(null)
    if (!err) toast('User promoted to partner')
    else toast(`Error: ${err}`)
  }

  return (
    <>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-end justify-between animate-slide-up">
          <div>
            <h1 className="font-display text-3xl font-semibold text-[var(--text-primary)]">
              {t('adminUsers.title')}
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              {loading ? '—' : `${filtered.length} of ${users.length} users`}
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            onClick={fetchAll}
            disabled={loading}
          >
            Refresh
          </Button>
        </div>

        {/* Toast */}
        {successMsg && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-green-500/8 border border-green-500/20 text-green-400 text-sm animate-fade-in">
            <CheckCircle size={14} /> {successMsg}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3 animate-slide-up-delay-1">
          <div className="relative flex-1 min-w-[220px]">
            <Search
              size={14}
              className="absolute start-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none"
            />
            <input
              type="text"
              placeholder={t('adminUsers.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full ps-10 pe-9 py-2.5 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-gold-500"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute end-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <div className="flex gap-1.5">
            {ROLE_OPTIONS.map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={clsx(
                  'px-3 py-2 rounded-lg text-xs font-medium capitalize transition-all',
                  roleFilter === r
                    ? 'bg-gold-500/15 text-gold-400 border border-gold-500/30'
                    : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border)] hover:border-white/15',
                )}
              >
                {r === 'all'
                  ? `All (${users.length})`
                  : `${r} (${users.filter((u) => u.role === r).length})`}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="glass-panel rounded-xl overflow-hidden animate-slide-up-delay-2">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  {[
                    t('adminUsers.user'),
                    t('adminUsers.role'),
                    'Language',
                    t('adminUsers.joined'),
                    t('adminUsers.actions'),
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-start px-4 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {loading ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-10 text-center text-[var(--text-muted)] text-sm"
                    >
                      Loading users…
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-10 text-center text-[var(--text-muted)] text-sm"
                    >
                      No users match
                    </td>
                  </tr>
                ) : (
                  filtered.map((user) => (
                    <tr key={user.id} className="hover:bg-white/2 transition-colors group">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gold-500/10 border border-gold-500/20 flex items-center justify-center text-gold-400 text-xs font-semibold shrink-0">
                            {(user.email || '?')[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-[var(--text-primary)] truncate max-w-[180px]">
                              {user.email}
                            </p>
                            {user.full_name && (
                              <p className="text-xs text-[var(--text-muted)]">{user.full_name}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <RoleBadge role={user.role} />
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-[var(--text-muted)] uppercase">
                          {user.language || 'en'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[var(--text-muted)] text-xs">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setRoleModal(user)}
                            className="text-[10px] px-2 py-1 rounded-md bg-white/5 text-[var(--text-secondary)] hover:bg-white/10 border border-[var(--border)] transition-all"
                          >
                            Change Role
                          </button>
                          {user.role === 'client' && (
                            <button
                              onClick={() => setPromoteModal(user)}
                              className="text-[10px] px-2 py-1 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 transition-all flex items-center gap-1"
                            >
                              <UserPlus size={9} />
                              Make Partner
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {!loading && filtered.length > 0 && (
          <p className="text-xs text-[var(--text-muted)] text-center">
            Showing {filtered.length} of {users.length} users
          </p>
        )}
      </div>

      {promoteModal && (
        <PromoteModal
          user={promoteModal}
          onConfirm={handlePromote}
          onClose={() => setPromoteModal(null)}
          loading={actionLoad}
        />
      )}

      {roleModal && (
        <ChangeRoleModal
          user={roleModal}
          onConfirm={handleChangeRole}
          onClose={() => setRoleModal(null)}
          loading={actionLoad}
        />
      )}
    </>
  )
}

export default AdminUsersPage
