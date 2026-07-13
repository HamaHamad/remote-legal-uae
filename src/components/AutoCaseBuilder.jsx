import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Upload,
  Brain,
  CheckCircle,
  ArrowRight,
  Loader2,
  FileText,
  X,
  AlertTriangle,
  Sparkles,
  FolderOpen,
} from 'lucide-react'
import { clsx } from 'clsx'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { useDocuments } from '@/hooks/useDocuments'
import { useCases } from '@/hooks/useCases'
import { useDocumentAnalysis } from '@/hooks/useDocumentAnalysis'
import Button from '@/components/ui/Button'
import { LegalDisclaimer } from '@/components/LegalDisclaimer'

const STAGES = [
  { id: 'uploading', label: 'Uploading document…' },
  { id: 'analysing', label: 'AI is reading document…' },
  { id: 'creating', label: 'Building your case…' },
  { id: 'done', label: 'Case created successfully!' },
]

function formatBytes(b) {
  if (b < 1024) return `${b} B`
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`
  return `${(b / 1048576).toFixed(1)} MB`
}

export function AutoCaseBuilder({ onClose, onCaseCreated }) {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const { uploadDocuments } = useDocuments()
  const { createCase } = useCases()
  const { analyzeDocument, pollUntilDone } = useDocumentAnalysis()

  const inputRef = useRef(null)

  const [file, setFile] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [running, setRunning] = useState(false)
  const [stage, setStage] = useState(-1) // index into STAGES
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null) // { caseId, analysis }

  const ALLOWED_EXTS = '.pdf,.jpg,.jpeg,.png,.webp,.doc,.docx'
  const MAX_SIZE_MB = 50

  const handleFile = (f) => {
    if (!f) return
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`File too large. Max ${MAX_SIZE_MB} MB.`)
      return
    }
    setFile(f)
    setError(null)
  }

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [])

  const handleBuild = async () => {
    if (!file || !user) return
    setRunning(true)
    setError(null)

    try {
      // ── Stage 0: Create a temporary placeholder case ─────────
      setStage(0)

      // We need a case_id to attach the document to Storage path
      // Create a temporary 'other' case first
      const { data: tempCase, error: caseErr } = await createCase({
        type: 'other',
        description: `Auto-created from document: ${file.name}`,
      })
      if (caseErr) throw new Error(caseErr)

      // ── Stage 1: Upload file ──────────────────────────────────
      const { data: uploadedDocs, error: uploadErr } = await uploadDocuments(tempCase.id, [file])
      if (uploadErr) throw new Error(uploadErr)
      if (!uploadedDocs?.length) throw new Error('Upload failed — no document returned')

      const uploadedDoc = uploadedDocs[0]

      // ── Stage 2: Analyse document ─────────────────────────────
      setStage(1)
      const { error: analyzeErr } = await analyzeDocument({
        documentId: uploadedDoc.id,
        caseId: tempCase.id,
        storagePath: uploadedDoc.storage_path,
        mimeType: uploadedDoc.mime_type || file.type,
      })
      if (analyzeErr) throw new Error(analyzeErr)

      // Poll for analysis result
      const { data: analysis, error: pollErr } = await pollUntilDone(uploadedDoc.id)
      if (pollErr) throw new Error(pollErr)

      // ── Stage 3: Update case with AI-detected type ────────────
      setStage(2)

      const validTypes = ['banking', 'car', 'employment', 'rental', 'legal', 'visa', 'other']
      const detectedType =
        analysis?.suggested_case_type && validTypes.includes(analysis.suggested_case_type)
          ? analysis.suggested_case_type
          : 'legal'

      const detectedDesc =
        analysis?.suggested_description ||
        analysis?.summary ||
        `Case opened from document: ${file.name}`

      // Update the case with AI-detected values
      await supabase
        .from('cases')
        .update({
          type: detectedType,
          description: detectedDesc,
        })
        .eq('id', tempCase.id)

      // ── Done ──────────────────────────────────────────────────
      setStage(3)
      setResult({ caseId: tempCase.id, analysis })
      onCaseCreated?.()
    } catch (err) {
      setError(err.message || 'Something went wrong')
      setStage(-1)
    } finally {
      setRunning(false)
    }
  }

  const handleViewCase = () => {
    onClose?.()
    navigate(`/dashboard/cases/${result.caseId}`)
  }

  // ─── Success screen ────────────────────────────────────────────
  if (result) {
    const ai = result.analysis?.extracted_json || {}
    return (
      <div className="flex flex-col items-center text-center py-6 px-4 animate-slide-up">
        <div className="relative mb-5">
          <div className="w-20 h-20 rounded-full bg-green-500/10 border-2 border-green-500/30 flex items-center justify-center">
            <CheckCircle size={38} className="text-green-400" />
          </div>
          <div className="absolute -inset-2 rounded-full border border-green-500/10 animate-ping" />
        </div>

        <h3 className="font-display text-2xl font-semibold text-[var(--text-primary)] mb-2">
          Case Created!
        </h3>

        <p className="text-sm text-[var(--text-secondary)] mb-1 max-w-xs leading-relaxed">
          Your{' '}
          <span className="text-gold-400 font-semibold">
            {result.analysis?.document_type || 'document'}
          </span>{' '}
          has been analysed and a case has been created with pre-filled details.
        </p>

        {/* Quick summary */}
        {ai.summary && (
          <div className="w-full max-w-sm mt-4 mb-5 p-4 rounded-xl glass-panel text-start">
            <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-2">
              AI Summary
            </p>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{ai.summary}</p>
          </div>
        )}

        {/* Risk warning */}
        {ai.risks?.length > 0 && (
          <div className="w-full max-w-sm mb-5 p-3 rounded-xl bg-red-500/8 border border-red-500/20 text-start">
            <p className="text-xs text-red-400 font-semibold flex items-center gap-1.5 mb-1">
              <AlertTriangle size={12} /> {ai.risks.length} risk{ai.risks.length !== 1 ? 's' : ''}{' '}
              found
            </p>
            <p className="text-xs text-red-300/80">{ai.risks[0]}</p>
          </div>
        )}

        <div className="space-y-2 w-full max-w-xs">
          <Button onClick={handleViewCase} fullWidth icon={Brain} size="md">
            View Full Analysis
          </Button>
          <Button onClick={onClose} variant="ghost" fullWidth size="sm" icon={FolderOpen}>
            Back to Dashboard
          </Button>
        </div>

        <div className="mt-5 w-full max-w-xs">
          <LegalDisclaimer variant="inline" />
        </div>
      </div>
    )
  }

  // ─── Main flow ─────────────────────────────────────────────────
  return (
    <div className="px-2">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center">
          <Sparkles size={18} className="text-gold-400" />
        </div>
        <div>
          <h3 className="font-display text-xl font-semibold text-[var(--text-primary)]">
            Auto Case Builder
          </h3>
          <p className="text-xs text-[var(--text-muted)]">
            Upload a document — AI creates your case automatically
          </p>
        </div>
      </div>

      {/* Upload zone */}
      {!file && !running && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onClick={() => inputRef.current?.click()}
          className={clsx(
            'border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 mb-4',
            dragging
              ? 'border-gold-400 bg-gold-500/8 scale-[1.01]'
              : 'border-[var(--border)] bg-[var(--bg-elevated)] hover:border-gold-500/40 hover:bg-gold-500/3',
          )}
        >
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept={ALLOWED_EXTS}
            onChange={(e) => handleFile(e.target.files[0])}
          />
          <div
            className={clsx(
              'w-14 h-14 rounded-xl mx-auto mb-4 flex items-center justify-center transition-all',
              dragging ? 'bg-gold-500/20 text-gold-400' : 'bg-white/5 text-[var(--text-muted)]',
            )}
          >
            <Upload size={24} />
          </div>
          <p className="text-sm font-medium text-[var(--text-primary)] mb-1">
            {dragging ? 'Drop to analyse' : 'Drop your document here'}
          </p>
          <p className="text-xs text-[var(--text-muted)] mb-4">
            or{' '}
            <span className="text-gold-400 underline underline-offset-2">browse from device</span>
          </p>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {['PDF', 'JPG', 'PNG', 'DOCX'].map((ext) => (
              <span
                key={ext}
                className="text-[10px] px-2 py-0.5 rounded bg-white/4 border border-white/8 text-[var(--text-muted)] uppercase tracking-wider"
              >
                {ext}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* File selected */}
      {file && !running && (
        <div className="flex items-center gap-3 p-4 rounded-xl glass-panel mb-5">
          <div className="w-10 h-10 rounded-lg bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0">
            <FileText size={18} className="text-gold-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[var(--text-primary)] truncate">{file.name}</p>
            <p className="text-xs text-[var(--text-muted)]">{formatBytes(file.size)}</p>
          </div>
          <button
            onClick={() => setFile(null)}
            className="w-6 h-6 rounded-md flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/8 transition-all"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* Progress stages */}
      {running && (
        <div className="mb-5 space-y-3">
          {STAGES.map((s, i) => (
            <div key={s.id} className="flex items-center gap-3">
              <div
                className={clsx(
                  'w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all duration-300',
                  i < stage
                    ? 'bg-green-500/15 border border-green-500/30 text-green-400'
                    : i === stage
                      ? 'bg-gold-500/15  border border-gold-500/30  text-gold-400'
                      : 'bg-white/5      border border-[var(--border)] text-[var(--text-muted)]',
                )}
              >
                {i < stage ? (
                  <CheckCircle size={12} />
                ) : i === stage ? (
                  <Loader2 size={11} className="animate-spin" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-current opacity-30" />
                )}
              </div>
              <span
                className={clsx(
                  'text-sm',
                  i === stage
                    ? 'text-[var(--text-primary)] font-medium'
                    : i < stage
                      ? 'text-[var(--text-muted)]'
                      : 'text-[var(--text-muted)] opacity-50',
                )}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 flex items-start gap-2.5 p-3 rounded-xl bg-red-500/8 border border-red-500/20 text-red-400 text-xs animate-fade-in">
          <AlertTriangle size={13} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* How it works */}
      {!file && !running && (
        <div className="mb-5 grid grid-cols-3 gap-3">
          {[
            { icon: Upload, label: 'Upload', desc: 'Any legal document' },
            { icon: Brain, label: 'AI reads', desc: 'Extracts all data' },
            { icon: FolderOpen, label: 'Case made', desc: 'Pre-filled & ready' },
          ].map((item) => (
            <div
              key={item.label}
              className="flex flex-col items-center text-center p-3 rounded-xl bg-white/2 border border-white/5"
            >
              <item.icon size={18} className="text-gold-400/60 mb-1.5" />
              <p className="text-xs font-semibold text-[var(--text-secondary)]">{item.label}</p>
              <p className="text-[10px] text-[var(--text-muted)]">{item.desc}</p>
            </div>
          ))}
        </div>
      )}

      {/* CTA */}
      {!running && (
        <Button
          onClick={handleBuild}
          disabled={!file}
          fullWidth
          size="lg"
          icon={ArrowRight}
          iconPosition="end"
        >
          {file ? 'Build Case from Document' : 'Select a Document First'}
        </Button>
      )}
    </div>
  )
}

export default AutoCaseBuilder
