import { useState, useRef } from 'react'
import {
  ClipboardList,
  CheckCircle,
  Clock,
  Upload,
  RefreshCw,
  AlertCircle,
  FileCheck,
  ExternalLink,
  ChevronDown,
  X,
  Check,
} from 'lucide-react'
import { clsx } from 'clsx'
import { usePartner } from '@/hooks/usePartner'
import Button from '@/components/ui/Button'

const STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    className:
      'text-[var(--status-pending)]  bg-[var(--status-pending)]/10  border-[var(--status-pending)]/20',
  },
  in_progress: {
    label: 'In Progress',
    className:
      'text-[var(--status-resolved)]   bg-[var(--status-resolved)]/10   border-[var(--status-resolved)]/20',
  },
  done: {
    label: 'Done',
    className:
      'text-[var(--status-active)]  bg-[var(--status-active)]/10  border-[var(--status-active)]/20',
  },
  rejected: {
    label: 'Rejected',
    className:
      'text-[var(--status-error)]    bg-[var(--status-error)]/10    border-[var(--status-error)]/20',
  },
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-AE', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// ─── Proof Upload Modal ───────────────────────────────────────────
function ProofModal({ task, onConfirm, onClose, loading }) {
  const inputRef = useRef(null)
  const [file, setFile] = useState(null)
  const [drag, setDrag] = useState(false)

  const handleDrop = (e) => {
    e.preventDefault()
    setDrag(false)
    const f = e.dataTransfer.files[0]
    if (f) setFile(f)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-sm glass-panel rounded-2xl p-6 animate-slide-up border border-[var(--border)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display text-xl font-semibold text-[var(--text-primary)] mb-1">
          Upload Proof of Work
        </h3>
        <p className="text-xs text-[var(--text-muted)] mb-5 line-clamp-1">{task.title}</p>

        {/* Drop zone */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault()
            setDrag(true)
          }}
          onDragLeave={() => setDrag(false)}
          onClick={() => inputRef.current?.click()}
          className={clsx(
            'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 mb-4',
            drag
              ? 'border-gold-400 bg-gold-500/8'
              : 'border-[var(--border)] bg-[var(--bg-elevated)] hover:border-gold-500/40',
          )}
        >
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={(e) => setFile(e.target.files[0])}
          />
          <Upload
            size={24}
            className={clsx('mx-auto mb-2', drag ? 'text-gold-400' : 'text-[var(--text-muted)]')}
          />
          {file ? (
            <div>
              <p className="text-sm font-medium text-gold-400 truncate">{file.name}</p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
          ) : (
            <div>
              <p className="text-sm text-[var(--text-primary)]">Drop file here or click</p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">PDF, JPG, PNG, DOCX</p>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => onConfirm(task.id, file)}
            disabled={!file}
            loading={loading}
            icon={FileCheck}
            className="flex-1"
          >
            Upload Proof
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Task Card ────────────────────────────────────────────────────
function TaskCard({ task, onStatusChange, onUploadProof, updating }) {
  const [showMenu, setShowMenu] = useState(false)
  const statusCfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.pending
  const client = task.cases?.users?.email || '—'
  const caseType = task.cases?.type || 'other'
  const isUpdating = updating === task.id

  const NEXT_STATUSES = {
    pending: ['in_progress', 'done'],
    in_progress: ['done', 'pending'],
    done: ['in_progress'],
    rejected: ['pending'],
  }
  const nextOptions = NEXT_STATUSES[task.status] || []

  return (
    <div className="glass-panel rounded-2xl p-5 hover:border-[var(--border)] transition-all">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[var(--text-primary)] mb-0.5">{task.title}</p>
          <p className="text-xs text-[var(--text-muted)] truncate">
            Client: <span className="text-[var(--text-secondary)]">{client}</span>
            {' · '}
            <span className="capitalize">{caseType}</span>
          </p>
        </div>
        <span
          className={clsx(
            'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border shrink-0',
            statusCfg.className,
          )}
        >
          {statusCfg.label}
        </span>
      </div>

      {/* Notes */}
      {task.notes && (
        <div className="glass-panel-elevated rounded-lg px-3 py-2.5 mb-3">
          <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">
            Admin Notes
          </p>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{task.notes}</p>
        </div>
      )}

      {/* Meta */}
      <div className="flex items-center gap-4 text-[11px] text-[var(--text-muted)] mb-4">
        {task.due_date && (
          <span className="flex items-center gap-1">
            <Clock size={11} />
            Due:{' '}
            <span
              className={clsx(
                new Date(task.due_date) < new Date() && task.status !== 'done'
                  ? 'text-[var(--status-error)]'
                  : 'text-[var(--text-secondary)]',
              )}
            >
              {formatDate(task.due_date)}
            </span>
          </span>
        )}
        {task.completed_at && (
          <span className="flex items-center gap-1 text-[var(--status-active)]">
            <Check size={11} />
            Completed {formatDate(task.completed_at)}
          </span>
        )}
      </div>

      {/* Proof */}
      {task.proof_url && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-green-500/8 border border-[var(--status-active)]/20 mb-4">
          <FileCheck size={13} className="text-[var(--status-active)] shrink-0" />
          <p className="text-xs text-[var(--status-active)] flex-1 truncate">
            {task.proof_file || 'Proof uploaded'}
          </p>
          <a
            href={task.proof_url}
            target="_blank"
            rel="noreferrer"
            className="text-[10px] text-[var(--status-active)] hover:text-green-300 flex items-center gap-0.5"
            onClick={(e) => e.stopPropagation()}
          >
            View <ExternalLink size={10} />
          </a>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Status update dropdown */}
        {nextOptions.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setShowMenu((v) => !v)}
              disabled={isUpdating}
              className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border)] transition-all disabled:opacity-50"
            >
              {isUpdating ? (
                <span className="w-3 h-3 border border-[var(--text-muted)]/30 border-t-[var(--text-muted)] rounded-full animate-spin" />
              ) : (
                <ChevronDown size={12} />
              )}
              Update Status
            </button>

            {showMenu && (
              <div className="absolute bottom-full mb-1 start-0 z-20 w-40 glass-panel rounded-xl overflow-hidden border border-[var(--border)] shadow-panel animate-fade-in">
                {nextOptions.map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setShowMenu(false)
                      onStatusChange(task.id, s)
                    }}
                    className={clsx(
                      'w-full text-start px-3 py-2 text-xs font-medium capitalize transition-all hover:bg-[var(--text-primary)]/5',
                      STATUS_CONFIG[s]?.className || 'text-[var(--text-secondary)]',
                    )}
                  >
                    Mark as {s.replace('_', ' ')}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Upload proof */}
        {task.status !== 'done' && (
          <button
            onClick={() => onUploadProof(task)}
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-gold-500/10 text-gold-400 border border-gold-500/20 hover:bg-gold-500/15 transition-all"
          >
            <Upload size={12} />
            {task.proof_url ? 'Update Proof' : 'Upload Proof'}
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────
export function PartnerTasksPage() {
  const { tasks, loading, error, fetchAll, updateTaskStatus, uploadProof } = usePartner()

  const [filter, setFilter] = useState('all')
  const [proofModal, setProofModal] = useState(null)
  const [updating, setUpdating] = useState(null)
  const [uploadLoad, setUploadLoad] = useState(false)
  const [successMsg, setSuccess] = useState('')

  const filtered = filter === 'all' ? tasks : tasks.filter((t) => t.status === filter)

  const toast = (msg) => {
    setSuccess(msg)
    setTimeout(() => setSuccess(''), 3000)
  }

  const handleStatusChange = async (taskId, status) => {
    setUpdating(taskId)
    const { error: err } = await updateTaskStatus(taskId, status)
    setUpdating(null)
    if (!err) toast(`Task marked as ${status.replace('_', ' ')}`)
  }

  const handleUploadProof = async (taskId, file) => {
    setUploadLoad(true)
    const { error: err } = await uploadProof(taskId, file)
    setUploadLoad(false)
    setProofModal(null)
    if (!err) toast('Proof uploaded successfully')
    else toast(`Upload failed: ${err}`)
  }

  const counts = {
    all: tasks.length,
    pending: tasks.filter((t) => t.status === 'pending').length,
    in_progress: tasks.filter((t) => t.status === 'in_progress').length,
    done: tasks.filter((t) => t.status === 'done').length,
  }

  return (
    <>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-end justify-between animate-slide-up">
          <div>
            <h1 className="font-display text-3xl font-semibold text-[var(--text-primary)]">
              My Tasks
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              {loading ? '—' : `${filtered.length} tasks`}
            </p>
          </div>
          <Button variant="ghost" size="sm" icon={RefreshCw} onClick={fetchAll} disabled={loading}>
            Refresh
          </Button>
        </div>

        {successMsg && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-green-500/8 border border-[var(--status-active)]/20 text-[var(--status-active)] text-sm animate-fade-in">
            <CheckCircle size={14} /> {successMsg}
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-2 animate-slide-up-delay-1">
          {[
            { key: 'all', label: `All (${counts.all})` },
            { key: 'pending', label: `Pending (${counts.pending})` },
            { key: 'in_progress', label: `In Progress (${counts.in_progress})` },
            { key: 'done', label: `Done (${counts.done})` },
          ].map((opt) => (
            <button
              key={opt.key}
              onClick={() => setFilter(opt.key)}
              className={clsx(
                'px-3 py-2 rounded-lg text-xs font-medium transition-all',
                filter === opt.key
                  ? 'bg-gold-500/15 text-gold-400 border border-gold-500/30'
                  : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border)] hover:border-[var(--border)]',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Tasks */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-36 rounded-2xl glass-panel animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-panel rounded-2xl p-12 text-center">
            <ClipboardList size={32} className="text-[var(--text-muted)] mx-auto mb-4" />
            <p className="text-sm text-[var(--text-secondary)]">
              {tasks.length === 0 ? 'No tasks assigned yet' : 'No tasks match this filter'}
            </p>
          </div>
        ) : (
          <div className="space-y-4 animate-fade-in">
            {filtered.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onStatusChange={handleStatusChange}
                onUploadProof={setProofModal}
                updating={updating}
              />
            ))}
          </div>
        )}
      </div>

      {proofModal && (
        <ProofModal
          task={proofModal}
          onConfirm={handleUploadProof}
          onClose={() => setProofModal(null)}
          loading={uploadLoad}
        />
      )}
    </>
  )
}

export default PartnerTasksPage
