import { useState, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { clsx } from 'clsx'
import {
  X,
  ChevronRight,
  ChevronLeft,
  Check,
  Upload,
  FileText,
  Trash2,
  AlertCircle,
  Briefcase,
  Car,
  Users,
  Home,
  Scale,
  Loader2,
  FolderOpen,
  Brain,
} from 'lucide-react'
import Button from '@/components/ui/Button'
import { useCases } from '@/hooks/useCases'
import { useDocuments } from '@/hooks/useDocuments'
import { useAI } from '@/hooks/useAI'
import { useFocusTrap } from '@/hooks/useFocusTrap'

// ─── Case type definitions ────────────────────────────────────────
const CASE_TYPES = [
  {
    value: 'banking',
    labelKey: 'case.types.banking',
    icon: Briefcase,
    color: 'blue',
    desc: 'Account disputes, loans, fraud, transactions',
  },
  {
    value: 'car',
    labelKey: 'case.types.car',
    icon: Car,
    color: 'orange',
    desc: 'Accidents, fines, ownership, insurance claims',
  },
  {
    value: 'employment',
    labelKey: 'case.types.employment',
    icon: Users,
    color: 'green',
    desc: 'Contracts, termination, salary disputes, MOHRE',
  },
  {
    value: 'rental',
    labelKey: 'case.types.rental',
    icon: Home,
    color: 'purple',
    desc: 'Tenancy disputes, eviction, Ejari, deposits',
  },
  {
    value: 'legal',
    labelKey: 'case.types.legal',
    icon: Scale,
    color: 'gold',
    desc: 'Civil matters, court filings, notarization',
  },
]

const COLOR_MAP = {
  blue: {
    card: 'border-blue-500/40 bg-blue-500/8',
    icon: 'bg-blue-500/15 text-[var(--status-resolved)]',
    ring: 'ring-blue-500/40',
  },
  orange: {
    card: 'border-orange-500/40 bg-orange-500/8',
    icon: 'bg-orange-500/15 text-orange-400',
    ring: 'ring-orange-500/40',
  },
  green: {
    card: 'border-[var(--status-active)]/40 bg-green-500/8',
    icon: 'bg-[var(--status-active)]/15 text-[var(--status-active)]',
    ring: 'ring-green-500/40',
  },
  purple: {
    card: 'border-purple-500/40 bg-purple-500/8',
    icon: 'bg-purple-500/15 text-purple-400',
    ring: 'ring-purple-500/40',
  },
  gold: {
    card: 'border-gold-500/40 bg-gold-500/8',
    icon: 'bg-gold-500/15 text-gold-400',
    ring: 'ring-gold-500/40',
  },
}

const STEPS = ['Type', 'Description', 'Documents']

// ─── File size formatter ──────────────────────────────────────────
function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

// ─── File icon by mime type ───────────────────────────────────────
function FileIcon({ mimeType, className }) {
  const isPDF = mimeType === 'application/pdf'
  const isImage = mimeType?.startsWith('image/')
  return (
    <div
      className={clsx(
        'flex items-center justify-center rounded-lg text-xs font-bold',
        isPDF && 'bg-[var(--status-error)]/15 text-[var(--status-error)]',
        isImage && 'bg-blue-500/15 text-[var(--status-resolved)]',
        !isPDF && !isImage && 'bg-[var(--text-primary)]/8 text-[var(--text-muted)]',
        className,
      )}
    >
      {isPDF ? 'PDF' : isImage ? 'IMG' : 'DOC'}
    </div>
  )
}

// ─── Step 1: Choose Case Type ─────────────────────────────────────
function StepType({ selected, onSelect }) {
  const { t } = useTranslation()
  return (
    <div className="space-y-3">
      <div className="mb-5">
        <h3 className="font-display text-xl font-semibold text-[var(--text-primary)] mb-1">
          What type of case is this?
        </h3>
        <p className="text-sm text-[var(--text-secondary)]">
          Select the category that best describes your legal matter.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {CASE_TYPES.map((ct) => {
          const isActive = selected === ct.value
          const colors = COLOR_MAP[ct.color]
          return (
            <button
              key={ct.value}
              type="button"
              onClick={() => onSelect(ct.value)}
              className={clsx(
                'relative flex items-start gap-3.5 p-4 rounded-xl border text-start',
                'transition-all duration-200 group',
                isActive
                  ? `${colors.card} ring-1 ${colors.ring}`
                  : 'border-[var(--border)] bg-[var(--bg-card)] hover:border-[var(--border)] hover:bg-[var(--bg-elevated)]',
              )}
            >
              {/* Check indicator */}
              <div
                className={clsx(
                  'absolute top-3 end-3 w-4 h-4 rounded-full border flex items-center justify-center transition-all duration-200',
                  isActive
                    ? `${colors.icon} border-transparent`
                    : 'border-[var(--border)] bg-transparent',
                )}
              >
                {isActive && <Check size={9} strokeWidth={3} />}
              </div>

              <div
                className={clsx(
                  'w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
                  isActive ? colors.icon : 'bg-[var(--text-primary)]/5 text-[var(--text-muted)]',
                )}
              >
                <ct.icon size={18} />
              </div>

              <div className="min-w-0 pe-4">
                <p
                  className={clsx(
                    'text-sm font-semibold leading-tight mb-0.5',
                    isActive ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]',
                  )}
                >
                  {t(ct.labelKey)}
                </p>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">{ct.desc}</p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Step 2: Description ──────────────────────────────────────────
function StepDescription({ value, onChange, caseType }) {
  const { t } = useTranslation()
  const ct = CASE_TYPES.find((c) => c.value === caseType)
  const charCount = value.length
  const MAX_CHARS = 2000

  return (
    <div>
      <div className="mb-5">
        <div className="flex items-center gap-2.5 mb-1">
          {ct && (
            <div
              className={clsx(
                'w-7 h-7 rounded-lg flex items-center justify-center shrink-0',
                COLOR_MAP[ct.color].icon,
              )}
            >
              <ct.icon size={14} />
            </div>
          )}
          <h3 className="font-display text-xl font-semibold text-[var(--text-primary)]">
            Describe your case
          </h3>
        </div>
        <p className="text-sm text-[var(--text-secondary)]">
          Provide as much detail as possible. Our team uses this to assign the right specialist.
        </p>
      </div>

      <div className="space-y-3">
        <div className="relative">
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value.slice(0, MAX_CHARS))}
            rows={8}
            placeholder={`Describe your ${ct ? t(ct.labelKey).toLowerCase() : 'legal'} matter in detail…\n\nInclude:\n• Dates and timeline\n• Parties involved\n• What outcome you are seeking`}
            className={clsx(
              'w-full bg-[var(--bg-elevated)] text-[var(--text-primary)]',
              'border border-[var(--border)] rounded-xl',
              'px-4 py-3.5 text-sm font-body leading-relaxed resize-none',
              'placeholder:text-[var(--text-muted)]',
              'transition-all duration-200',
              'focus:outline-none focus:border-gold-500 focus:shadow-[0_0_0_3px_rgba(217,157,24,0.12)]',
            )}
          />
          <div
            className={clsx(
              'absolute bottom-3 end-3 text-xs transition-colors',
              charCount > MAX_CHARS * 0.9 ? 'text-orange-400' : 'text-[var(--text-muted)]',
            )}
          >
            {charCount}/{MAX_CHARS}
          </div>
        </div>

        {value.trim().length > 0 && value.trim().length < 30 && (
          <div className="flex items-center gap-2 text-xs text-[var(--status-pending)]/80 bg-amber-400/8 border border-amber-400/20 rounded-lg px-3 py-2">
            <AlertCircle size={13} />
            Please provide more detail to help us understand your case.
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Step 3: Upload Documents ─────────────────────────────────────
function StepDocuments({ files, onFilesChange }) {
  const dropRef = useRef(null)
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  const ALLOWED_EXTS = '.pdf,.jpg,.jpeg,.png,.webp,.heic,.doc,.docx'
  const MAX_SIZE_MB = 50

  const addFiles = (newFiles) => {
    const arr = Array.from(newFiles)
    const valid = arr.filter((f) => {
      if (f.size > MAX_SIZE_MB * 1024 * 1024) return false
      const ext = f.name.split('.').pop().toLowerCase()
      return ['pdf', 'jpg', 'jpeg', 'png', 'webp', 'heic', 'doc', 'docx'].includes(ext)
    })
    // Deduplicate by name
    onFilesChange((prev) => {
      const existing = new Set(prev.map((f) => f.name))
      return [...prev, ...valid.filter((f) => !existing.has(f.name))]
    })
  }

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    addFiles(e.dataTransfer.files)
  }, [])

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragging(true)
  }
  const handleDragLeave = () => setDragging(false)
  const removeFile = (name) => onFilesChange((prev) => prev.filter((f) => f.name !== name))

  return (
    <div>
      <div className="mb-5">
        <h3 className="font-display text-xl font-semibold text-[var(--text-primary)] mb-1">
          Upload supporting documents
        </h3>
        <p className="text-sm text-[var(--text-secondary)]">
          Optional but recommended. Accepted: PDF, JPG, PNG, DOCX · Max 50 MB per file.
        </p>
      </div>

      {/* Drop zone */}
      <div
        ref={dropRef}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        className={clsx(
          'relative flex flex-col items-center justify-center gap-3',
          'border-2 border-dashed rounded-2xl p-8 cursor-pointer',
          'transition-all duration-200',
          dragging
            ? 'border-gold-400 bg-gold-500/8 scale-[1.01]'
            : 'border-[var(--border)] bg-[var(--bg-elevated)] hover:border-gold-500/40 hover:bg-gold-500/4',
        )}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ALLOWED_EXTS}
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />

        <div
          className={clsx(
            'w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200',
            dragging
              ? 'bg-gold-500/20 text-gold-400'
              : 'bg-[var(--text-primary)]/5 text-[var(--text-muted)]',
          )}
        >
          <Upload size={22} />
        </div>

        <div className="text-center">
          <p className="text-sm font-medium text-[var(--text-primary)]">
            {dragging ? 'Drop files here' : 'Drag & drop files here'}
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            or{' '}
            <span className="text-gold-400 underline underline-offset-2">
              browse from your device
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3 text-[10px] text-[var(--text-muted)] uppercase tracking-widest mt-1">
          {['PDF', 'JPG', 'PNG', 'DOCX'].map((ext) => (
            <span
              key={ext}
              className="px-2 py-0.5 rounded bg-[var(--text-primary)]/4 border border-white/6"
            >
              {ext}
            </span>
          ))}
        </div>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest">
            {files.length} file{files.length !== 1 ? 's' : ''} selected
          </p>
          {files.map((file) => (
            <div
              key={file.name}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] group"
            >
              <FileIcon mimeType={file.type} className="w-9 h-9 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                  {file.name}
                </p>
                <p className="text-xs text-[var(--text-muted)]">{formatBytes(file.size)}</p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  removeFile(file.name)
                }}
                className="w-6 h-6 rounded-md flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--status-error)] hover:bg-[var(--status-error)]/10 transition-all opacity-0 group-hover:opacity-100"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Upload Progress Overlay ──────────────────────────────────────
function UploadProgress({ progress }) {
  const files = Object.entries(progress)
  if (!files.length) return null
  return (
    <div className="mt-4 space-y-2">
      {files.map(([name, pct]) => (
        <div key={name}>
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-[var(--text-secondary)] truncate max-w-[70%]">{name}</p>
            <p className="text-xs text-[var(--text-muted)]">
              {pct === -1 ? '✗ Failed' : pct === 100 ? '✓ Done' : `${pct}%`}
            </p>
          </div>
          <div className="h-1.5 rounded-full bg-[var(--text-primary)]/8 overflow-hidden">
            <div
              className={clsx(
                'h-full rounded-full transition-all duration-500',
                pct === -1 ? 'bg-red-500' : pct === 100 ? 'bg-green-400' : 'bg-gold-500',
              )}
              style={{ width: `${Math.max(0, pct)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Step Indicator ───────────────────────────────────────────────
function StepIndicator({ currentStep, total }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className={clsx(
              'w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300',
              i < currentStep
                ? 'bg-green-500/20 text-[var(--status-active)] border border-[var(--status-active)]/30'
                : i === currentStep
                  ? 'bg-gold-500/20 text-gold-400 border border-gold-500/40 ring-2 ring-gold-500/20'
                  : 'bg-[var(--text-primary)]/5 text-[var(--text-muted)] border border-[var(--border)]',
            )}
          >
            {i < currentStep ? <Check size={12} strokeWidth={3} /> : i + 1}
          </div>
          {i < total - 1 && (
            <div
              className={clsx(
                'h-px w-8 transition-all duration-300',
                i < currentStep ? 'bg-green-500/40' : 'bg-[var(--border)]',
              )}
            />
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Success Screen ───────────────────────────────────────────────
function SuccessScreen({ caseType, docCount, aiLabel, createdCase, onClose }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const ct = CASE_TYPES.find((c) => c.value === caseType)

  const handleViewCase = () => {
    onClose()
    if (createdCase?.id) {
      navigate(`/dashboard/cases/${createdCase.id}`)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center animate-slide-up">
      {/* Animated check circle */}
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-full flex items-center justify-center bg-[var(--status-active)]/10 border-2 border-[var(--status-active)]/30">
          <Check size={36} className="text-[var(--status-active)]" strokeWidth={2.5} />
        </div>
        <div className="absolute -inset-2 rounded-full border border-green-500/10 animate-ping" />
      </div>

      <h3 className="font-display text-2xl font-semibold text-[var(--text-primary)] mb-2">
        Case Created Successfully
      </h3>

      <p className="text-sm text-[var(--text-secondary)] max-w-xs leading-relaxed mb-1">
        Your{' '}
        <span className={clsx('font-semibold', ct ? `text-${ct.color}-400` : 'text-gold-400')}>
          {ct ? t(ct.labelKey) : ''} case
        </span>{' '}
        has been submitted. Our team will review and assign a specialist within 24 hours.
      </p>

      {docCount > 0 && (
        <p className="text-xs text-[var(--text-muted)] mb-2">
          {docCount} document{docCount !== 1 ? 's' : ''} uploaded successfully
        </p>
      )}

      {/* AI status indicator */}
      <div className="flex items-center gap-2 text-xs text-gold-400 bg-gold-500/8 border border-gold-500/20 rounded-lg px-3 py-2 mb-5 mt-1">
        <Brain size={13} className="shrink-0" />
        <span>{aiLabel || 'AI analysis running…'}</span>
        {!aiLabel?.includes('✓') && (
          <span className="w-2.5 h-2.5 rounded-full border-2 border-gold-400/30 border-t-gold-400 animate-spin ms-1" />
        )}
      </div>

      {/* Status timeline */}
      <div className="w-full max-w-xs mb-6 space-y-2">
        {[
          { label: 'Case submitted', done: true },
          { label: 'AI analysis running', done: false, active: true },
          { label: 'Specialist assigned', done: false },
          { label: 'Case in progress', done: false },
        ].map((s, i) => (
          <div key={i} className="flex items-center gap-3 text-sm">
            <div
              className={clsx(
                'w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-xs',
                s.done
                  ? 'bg-[var(--status-active)]/15 border border-[var(--status-active)]/30 text-[var(--status-active)]'
                  : s.active
                    ? 'bg-gold-500/15  border border-gold-500/30  text-gold-400'
                    : 'bg-[var(--text-primary)]/5      border border-[var(--border)] text-[var(--text-muted)]',
              )}
            >
              {s.done ? (
                <Check size={10} strokeWidth={3} />
              ) : s.active ? (
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-current opacity-30" />
              )}
            </div>
            <span
              className={
                s.done || s.active ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'
              }
            >
              {s.label}
            </span>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-2 w-full max-w-xs">
        <Button onClick={handleViewCase} size="md" icon={Brain} className="flex-1">
          View AI Report
        </Button>
        <Button
          onClick={onClose}
          variant="secondary"
          size="md"
          icon={FolderOpen}
          className="flex-1"
        >
          My Cases
        </Button>
      </div>
    </div>
  )
}

// ─── Main Modal ───────────────────────────────────────────────────
export function CreateCaseModal({ onClose, onCreated }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { createCase } = useCases()
  const { uploadDocuments, uploading, uploadProgress } = useDocuments()
  const { analyzeCase, analyzing, aiProgress } = useAI()

  const [step, setStep] = useState(0) // 0,1,2
  const [done, setDone] = useState(false)
  const [caseType, setCaseType] = useState('')
  const [description, setDescription] = useState('')
  const [files, setFiles] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [createdCase, setCreatedCase] = useState(null)
  const [aiLabel, setAiLabel] = useState('')

  // ─── Step validation ─────────────────────────────────────────────
  const canAdvance = () => {
    if (step === 0) return !!caseType
    if (step === 1) return description.trim().length >= 10
    return true
  }

  const handleNext = () => {
    if (step < 2) setStep((s) => s + 1)
    else handleSubmit()
  }

  const handleBack = () => {
    if (step > 0) setStep((s) => s - 1)
    else onClose()
  }

  // ─── Final submit ─────────────────────────────────────────────────
  const handleSubmit = async () => {
    setSubmitError('')
    setSubmitting(true)

    // 1. Create case record
    const { data: newCase, error: caseErr } = await createCase({
      type: caseType,
      description,
    })

    if (caseErr) {
      setSubmitError(caseErr)
      setSubmitting(false)
      return
    }

    setCreatedCase(newCase)

    // 2. Upload documents if any
    if (files.length > 0) {
      const { error: uploadErr } = await uploadDocuments(newCase.id, files)
      if (uploadErr) {
        setSubmitError(`Case created but some files failed: ${uploadErr}`)
      }
    }

    // 3. Trigger AI analysis (non-blocking — we show success then poll)
    setAiLabel('Sending to AI engine…')
    analyzeCase({
      caseId: newCase.id,
      caseType: caseType,
      description: description,
    })
      .then(() => {
        setAiLabel('Analysis complete ✓')
      })
      .catch(() => {
        setAiLabel('AI analysis queued')
      })

    setSubmitting(false)
    setDone(true)
    onCreated?.()
  }

  // ─── Modal: focus trap, Escape to close, backdrop click ─────────
  const modalRef = useRef(null)
  useFocusTrap(modalRef, { isOpen: true, onClose })

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  const STEP_LABELS = ['Case Type', 'Description', 'Documents']

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={handleBackdropClick}
      role="presentation"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in" />

      {/* Panel */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-case-title"
        className={clsx(
          'relative z-10 w-full sm:max-w-lg',
          'bg-[var(--bg-secondary)] border border-[var(--border)]',
          'rounded-t-2xl sm:rounded-2xl shadow-panel',
          'max-h-[90vh] flex flex-col animate-slide-up',
        )}
      >
        {/* Header */}
        {!done && (
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[var(--border)] shrink-0">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <StepIndicator currentStep={step} total={3} />
              </div>
              <p className="text-xs text-[var(--text-muted)] font-medium">
                Step {step + 1} of 3 —{' '}
                <span className="text-[var(--text-secondary)]">{STEP_LABELS[step]}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--text-primary)]/8 transition-all"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {done ? (
            <SuccessScreen
              caseType={caseType}
              docCount={files.length}
              aiLabel={aiLabel}
              createdCase={createdCase}
              onClose={onClose}
            />
          ) : (
            <>
              {step === 0 && <StepType selected={caseType} onSelect={setCaseType} />}
              {step === 1 && (
                <StepDescription
                  value={description}
                  onChange={setDescription}
                  caseType={caseType}
                />
              )}
              {step === 2 && <StepDocuments files={files} onFilesChange={setFiles} />}

              {/* Upload progress (shown during submit) */}
              {submitting && files.length > 0 && <UploadProgress progress={uploadProgress} />}

              {/* Error */}
              {submitError && (
                <div className="mt-4 flex items-start gap-2.5 p-3 rounded-xl bg-[var(--status-error)]/8 border border-[var(--status-error)]/20 text-[var(--status-error)] text-xs">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <span>{submitError}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!done && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-[var(--border)] shrink-0 gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              icon={ChevronLeft}
              iconPosition="start"
            >
              {step === 0 ? 'Cancel' : 'Back'}
            </Button>

            <div className="flex items-center gap-2">
              {/* Dots */}
              <div className="flex gap-1.5 me-2">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className={clsx(
                      'h-1.5 rounded-full transition-all duration-300',
                      i === step ? 'w-5 bg-gold-400' : 'w-1.5 bg-white/15',
                    )}
                  />
                ))}
              </div>

              <Button
                size="sm"
                onClick={handleNext}
                disabled={!canAdvance() || submitting}
                loading={submitting}
                icon={step === 2 ? (submitting ? Loader2 : Check) : ChevronRight}
                iconPosition="end"
              >
                {step === 2 ? (submitting ? 'Submitting…' : 'Submit Case') : 'Continue'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CreateCaseModal
