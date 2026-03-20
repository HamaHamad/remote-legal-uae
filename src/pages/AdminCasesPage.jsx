import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  FolderOpen, Search, X, ChevronDown,
  UserCheck, Clock, CheckCircle, AlertCircle,
  Briefcase, Car, Users, Home, Scale, HelpCircle,
  UserPlus, Check, RefreshCw, Brain
} from 'lucide-react'
import { clsx } from 'clsx'
import { useAdmin } from '@/hooks/useAdmin'
import { StatusBadge, RoleBadge } from '@/components/ui/Badge'
import { RiskBadge } from '@/components/AICaseReport'
import Button from '@/components/ui/Button'

const TYPE_META = {
  banking:    { icon: Briefcase, color: 'text-blue-400',   bg: 'bg-blue-500/10'   },
  car:        { icon: Car,       color: 'text-orange-400', bg: 'bg-orange-500/10' },
  employment: { icon: Users,     color: 'text-green-400',  bg: 'bg-green-500/10'  },
  rental:     { icon: Home,      color: 'text-purple-400', bg: 'bg-purple-500/10' },
  legal:      { icon: Scale,     color: 'text-gold-400',   bg: 'bg-gold-500/10'   },
  visa:       { icon: FolderOpen,color: 'text-cyan-400',   bg: 'bg-cyan-500/10'   },
  other:      { icon: HelpCircle,color: 'text-gray-400',   bg: 'bg-gray-500/10'   },
}

const STATUS_OPTIONS = ['all', 'pending', 'active', 'resolved']
const RISK_OPTIONS   = ['all', 'high', 'medium', 'low']

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-AE', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ─── Assign Partner Modal ─────────────────────────────────────────
function AssignModal({ caseItem, partners, onConfirm, onClose, loading }) {
  const [selected, setSelected] = useState(caseItem.assigned_to || '')
  const { t } = useTranslation()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in" />
      <div
        className="relative z-10 w-full max-w-sm glass-panel gold-border rounded-2xl p-6 animate-slide-up shadow-gold"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="font-display text-xl font-semibold text-[var(--text-primary)] mb-1">
          Assign Partner
        </h3>
        <p className="text-xs text-[var(--text-muted)] mb-5">
          Case: <span className="text-[var(--text-secondary)]">{t(`case.types.${caseItem.type}`, { defaultValue: caseItem.type })}</span>
          {' · '}
          <span className="font-mono">{caseItem.id.slice(0, 8).toUpperCase()}</span>
        </p>

        {partners.length === 0 ? (
          <div className="text-center py-8">
            <Users size={28} className="text-[var(--text-muted)] mx-auto mb-3" />
            <p className="text-sm text-[var(--text-secondary)] mb-1">No partners available</p>
            <p className="text-xs text-[var(--text-muted)]">
              Go to Users → promote a user to partner role first
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto mb-5">
            {partners.map(p => (
              <button
                key={p.id}
                onClick={() => setSelected(p.user_id)}
                className={clsx(
                  'w-full flex items-center gap-3 px-3 py-3 rounded-xl border text-start transition-all',
                  selected === p.user_id
                    ? 'border-gold-500/40 bg-gold-500/8 text-gold-400'
                    : 'border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:border-white/15',
                )}
              >
                <div className="w-8 h-8 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 text-xs font-semibold shrink-0">
                  {p.name[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{p.name}</p>
                  <p className="text-[11px] text-[var(--text-muted)] capitalize">{p.specialty}</p>
                </div>
                {selected === p.user_id && <Check size={14} className="text-gold-400 shrink-0" />}
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onClose} className="flex-1">Cancel</Button>
          <Button
            size="sm"
            onClick={() => onConfirm(caseItem.id, selected)}
            disabled={!selected || partners.length === 0}
            loading={loading}
            icon={UserCheck}
            className="flex-1"
          >
            Assign
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Create Task Modal ─────────────────────────────────────────────
function CreateTaskModal({ caseItem, partners, onConfirm, onClose, loading }) {
  const [form, setForm] = useState({ title: '', notes: '', assignedTo: '', dueDate: '' })
  const update = f => e => setForm(p => ({ ...p, [f]: e.target.value }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-sm glass-panel rounded-2xl p-6 animate-slide-up border border-[var(--border)]"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="font-display text-xl font-semibold text-[var(--text-primary)] mb-5">
          Create Task
        </h3>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider block mb-1.5">Task Title *</label>
            <input
              value={form.title}
              onChange={update('title')}
              placeholder="e.g. Review employment contract"
              className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-gold-500"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider block mb-1.5">Assign To *</label>
            <select
              value={form.assignedTo}
              onChange={update('assignedTo')}
              className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-gold-500"
            >
              <option value="">Select partner…</option>
              {partners.map(p => (
                <option key={p.id} value={p.user_id}>{p.name} ({p.specialty})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider block mb-1.5">Notes</label>
            <textarea
              value={form.notes}
              onChange={update('notes')}
              rows={3}
              placeholder="Instructions for the partner…"
              className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-gold-500 resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider block mb-1.5">Due Date</label>
            <input
              type="date"
              value={form.dueDate}
              onChange={update('dueDate')}
              className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-gold-500"
            />
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          <Button variant="ghost" size="sm" onClick={onClose} className="flex-1">Cancel</Button>
          <Button
            size="sm"
            onClick={() => onConfirm({ caseId: caseItem.id, ...form })}
            disabled={!form.title || !form.assignedTo}
            loading={loading}
            className="flex-1"
          >
            Create Task
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────
export function AdminCasesPage() {
  const { t } = useTranslation()
  const { cases, partners, loading, error, fetchAll, assignPartner, createTask } = useAdmin()

  const [search,       setSearch]       = useState('')
  const [statusFilter, setStatus]       = useState('all')
  const [riskFilter,   setRisk]         = useState('all')
  const [assignModal,  setAssignModal]  = useState(null)  // caseItem
  const [taskModal,    setTaskModal]    = useState(null)   // caseItem
  const [actionLoading, setActionLoading] = useState(false)
  const [successMsg,   setSuccessMsg]   = useState('')

  // ─── Filter logic ───────────────────────────────────────────────
  const filtered = useMemo(() => {
    return cases.filter(c => {
      const matchSearch = !search.trim() ||
        c.type?.toLowerCase().includes(search.toLowerCase()) ||
        c.description?.toLowerCase().includes(search.toLowerCase()) ||
        c.id.toLowerCase().includes(search.toLowerCase()) ||
        c.users?.email?.toLowerCase().includes(search.toLowerCase())

      const matchStatus = statusFilter === 'all' || c.status === statusFilter
      const matchRisk   = riskFilter   === 'all' || c.ai_risk_level === riskFilter

      return matchSearch && matchStatus && matchRisk
    })
  }, [cases, search, statusFilter, riskFilter])

  const handleAssign = async (caseId, partnerUserId) => {
    if (!partnerUserId) return
    setActionLoading(true)
    const { error: err } = await assignPartner(caseId, partnerUserId)
    setActionLoading(false)
    setAssignModal(null)
    if (!err) {
      setSuccessMsg('Partner assigned successfully')
      setTimeout(() => setSuccessMsg(''), 3000)
    }
  }

  const handleCreateTask = async (taskData) => {
    setActionLoading(true)
    const { error: err } = await createTask(taskData)
    setActionLoading(false)
    setTaskModal(null)
    if (!err) {
      setSuccessMsg('Task created successfully')
      setTimeout(() => setSuccessMsg(''), 3000)
    }
  }

  return (
    <>
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-end justify-between animate-slide-up">
          <div>
            <h1 className="font-display text-3xl font-semibold text-[var(--text-primary)]">All Cases</h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              {loading ? '—' : `${filtered.length} of ${cases.length} cases`}
            </p>
          </div>
          <Button variant="secondary" size="sm" icon={RefreshCw} onClick={fetchAll} disabled={loading}>
            Refresh
          </Button>
        </div>

        {/* Success message */}
        {successMsg && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-green-500/8 border border-green-500/20 text-green-400 text-sm animate-fade-in">
            <CheckCircle size={14} />
            {successMsg}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3 animate-slide-up-delay-1">
          {/* Search */}
          <div className="relative flex-1 min-w-[220px]">
            <Search size={14} className="absolute start-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
            <input
              type="text"
              placeholder="Search by type, client, ID…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full ps-10 pe-9 py-2.5 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-gold-500"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute end-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                <X size={13} />
              </button>
            )}
          </div>

          {/* Status filter */}
          <div className="flex gap-1.5">
            {STATUS_OPTIONS.map(s => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={clsx(
                  'px-3 py-2 rounded-lg text-xs font-medium capitalize transition-all',
                  statusFilter === s
                    ? 'bg-gold-500/15 text-gold-400 border border-gold-500/30'
                    : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border)] hover:border-white/15',
                )}
              >
                {s === 'all'
                  ? `All (${cases.length})`
                  : `${s} (${cases.filter(c => c.status === s).length})`
                }
              </button>
            ))}
          </div>

          {/* Risk filter */}
          <div className="flex gap-1.5">
            {RISK_OPTIONS.map(r => (
              <button
                key={r}
                onClick={() => setRisk(r)}
                className={clsx(
                  'px-3 py-2 rounded-lg text-xs font-medium capitalize transition-all',
                  riskFilter === r
                    ? 'bg-gold-500/15 text-gold-400 border border-gold-500/30'
                    : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border)] hover:border-white/15',
                )}
              >
                {r === 'all' ? 'Any Risk' : r}
              </button>
            ))}
          </div>
        </div>

        {/* Table header */}
        {!loading && cases.length > 0 && (
          <div className="hidden lg:grid grid-cols-[2.5rem_1fr_8rem_7rem_7rem_8rem_8rem] gap-3 px-4 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border)] pb-2">
            <div />
            <div>Case / Client</div>
            <div>Date</div>
            <div>Status</div>
            <div>Risk</div>
            <div>Assigned</div>
            <div>Actions</div>
          </div>
        )}

        {/* Cases */}
        {loading ? (
          <div className="space-y-2">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="h-16 rounded-xl glass-panel animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-panel rounded-2xl p-12 text-center">
            <FolderOpen size={32} className="text-[var(--text-muted)] mx-auto mb-3" />
            <p className="text-sm text-[var(--text-secondary)]">
              {cases.length === 0 ? 'No cases yet' : 'No cases match your filters'}
            </p>
          </div>
        ) : (
          <div className="space-y-2 animate-fade-in">
            {filtered.map(c => (
              <AdminCaseRow
                key={c.id}
                caseItem={c}
                partners={partners}
                t={t}
                onAssign={() => setAssignModal(c)}
                onCreateTask={() => setTaskModal(c)}
              />
            ))}
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <p className="text-xs text-[var(--text-muted)] text-center">
            Showing {filtered.length} of {cases.length} cases
          </p>
        )}
      </div>

      {assignModal && (
        <AssignModal
          caseItem={assignModal}
          partners={partners}
          onConfirm={handleAssign}
          onClose={() => setAssignModal(null)}
          loading={actionLoading}
        />
      )}

      {taskModal && (
        <CreateTaskModal
          caseItem={taskModal}
          partners={partners}
          onConfirm={handleCreateTask}
          onClose={() => setTaskModal(null)}
          loading={actionLoading}
        />
      )}
    </>
  )
}

function AdminCaseRow({ caseItem, partners, t, onAssign, onCreateTask }) {
  const typeKey  = caseItem.type || 'other'
  const meta     = TYPE_META[typeKey] || TYPE_META.other
  const Icon     = meta.icon
  const typeLabel = t(`case.types.${typeKey}`, { defaultValue: typeKey })
  const client   = caseItem.users?.email || '—'
  const assignedPartner = partners.find(p => p.user_id === caseItem.assigned_to)

  return (
    <div className="grid grid-cols-[2.5rem_1fr_auto] lg:grid-cols-[2.5rem_1fr_8rem_7rem_7rem_8rem_8rem] items-center gap-3 px-4 py-3.5 rounded-xl glass-panel hover:border-white/10 hover:bg-[var(--bg-elevated)] transition-all">

      <div className={clsx('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', meta.bg)}>
        <Icon size={16} className={meta.color} />
      </div>

      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-[var(--text-primary)]">{typeLabel}</p>
          <span className="text-[10px] font-mono text-[var(--text-muted)] bg-white/4 px-1.5 py-0.5 rounded">
            #{caseItem.id.slice(0,8).toUpperCase()}
          </span>
        </div>
        <p className="text-xs text-[var(--text-secondary)] truncate">{client}</p>
      </div>

      <div className="hidden lg:block text-xs text-[var(--text-muted)]">
        {formatDate(caseItem.created_at)}
      </div>

      <div className="hidden lg:block">
        <StatusBadge status={caseItem.status} />
      </div>

      <div className="hidden lg:block">
        {caseItem.ai_risk_level
          ? <RiskBadge level={caseItem.ai_risk_level} />
          : <span className="text-[10px] text-[var(--text-muted)] flex items-center gap-1">
              <Brain size={10} className="opacity-40" />
              {caseItem.ai_status === 'processing' ? 'Analyzing' : 'N/A'}
            </span>
        }
      </div>

      <div className="hidden lg:block">
        {assignedPartner ? (
          <span className="text-xs text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full">
            {assignedPartner.name}
          </span>
        ) : (
          <span className="text-[10px] text-[var(--text-muted)] italic">Unassigned</span>
        )}
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={onAssign}
          title="Assign partner"
          className="flex items-center gap-1 text-[10px] px-2 py-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 transition-all"
        >
          <UserPlus size={11} />
          <span className="hidden sm:inline">Assign</span>
        </button>
        <button
          onClick={onCreateTask}
          title="Create task"
          className="flex items-center gap-1 text-[10px] px-2 py-1.5 rounded-lg bg-gold-500/10 text-gold-400 border border-gold-500/20 hover:bg-gold-500/20 transition-all"
        >
          <CheckCircle size={11} />
          <span className="hidden sm:inline">Task</span>
        </button>
      </div>
    </div>
  )
}

export default AdminCasesPage
