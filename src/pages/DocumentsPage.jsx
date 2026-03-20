import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  FileText, Download, Trash2, Search, FolderOpen,
  Image, File, X, AlertCircle, RefreshCw,
  Briefcase, Car, Users, Home, Scale, HelpCircle,
  Brain, ChevronDown
} from 'lucide-react'
import { clsx } from 'clsx'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { useDocuments } from '@/hooks/useDocuments'
import { useDocumentAnalysis } from '@/hooks/useDocumentAnalysis'
import { StatusBadge } from '@/components/ui/Badge'
import { DocumentIntelligencePanel } from '@/components/DocumentIntelligencePanel'
import Button from '@/components/ui/Button'

// ─── Helpers ─────────────────────────────────────────────────────
function formatBytes(bytes) {
  if (!bytes) return '—'
  if (bytes < 1024)    return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-AE', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

const TYPE_META = {
  banking:    { icon: Briefcase, color: 'text-blue-400',   bg: 'bg-blue-500/10'   },
  car:        { icon: Car,       color: 'text-orange-400', bg: 'bg-orange-500/10' },
  employment: { icon: Users,     color: 'text-green-400',  bg: 'bg-green-500/10'  },
  rental:     { icon: Home,      color: 'text-purple-400', bg: 'bg-purple-500/10' },
  legal:      { icon: Scale,     color: 'text-gold-400',   bg: 'bg-gold-500/10'   },
  other:      { icon: HelpCircle,color: 'text-gray-400',   bg: 'bg-gray-500/10'   },
}

// ─── File type chip ───────────────────────────────────────────────
function FileChip({ mimeType, fileName }) {
  const isPDF   = mimeType === 'application/pdf' || fileName?.endsWith('.pdf')
  const isImage = mimeType?.startsWith('image/')
  const isDoc   = mimeType?.includes('word') || fileName?.match(/\.(doc|docx)$/i)

  if (isPDF)   return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/15 text-red-400">PDF</span>
  if (isImage) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/15 text-blue-400">IMG</span>
  if (isDoc)   return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/15 text-indigo-400">DOC</span>
  return             <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-white/8 text-[var(--text-muted)]">FILE</span>
}

// ─── File icon (large) ────────────────────────────────────────────
function FileBigIcon({ mimeType, fileName }) {
  const isPDF   = mimeType === 'application/pdf' || fileName?.endsWith('.pdf')
  const isImage = mimeType?.startsWith('image/')
  if (isPDF)   return <FileText size={20} className="text-red-400" />
  if (isImage) return <Image    size={20} className="text-blue-400" />
  return               <File    size={20} className="text-[var(--text-muted)]" />
}

// ─── Empty state ──────────────────────────────────────────────────
function EmptyState({ hasSearch }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-gold-500/8 border border-gold-500/15 flex items-center justify-center mb-5">
        {hasSearch
          ? <Search  size={28} className="text-[var(--text-muted)]" />
          : <FileText size={28} className="text-gold-500/50" />
        }
      </div>
      <h3 className="font-display text-xl font-semibold text-[var(--text-primary)] mb-2">
        {hasSearch ? 'No documents match' : 'No documents yet'}
      </h3>
      <p className="text-sm text-[var(--text-secondary)] max-w-xs">
        {hasSearch
          ? 'Try a different search term.'
          : 'Documents uploaded when creating or updating a case will appear here.'}
      </p>
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="space-y-2">
      {[1,2,3,4].map(i => (
        <div key={i} className="flex items-center gap-4 px-4 py-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] animate-pulse">
          <div className="w-10 h-10 rounded-xl bg-white/5 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 bg-white/5 rounded w-2/5" />
            <div className="h-2.5 bg-white/5 rounded w-1/3" />
          </div>
          <div className="h-5 bg-white/5 rounded w-12" />
          <div className="h-4 bg-white/5 rounded w-20 hidden sm:block" />
        </div>
      ))}
    </div>
  )
}

// ─── Delete confirm modal ─────────────────────────────────────────
function DeleteConfirm({ doc, onConfirm, onCancel, deleting }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative z-10 glass-panel gold-border rounded-2xl p-6 max-w-sm w-full animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
            <AlertCircle size={18} className="text-red-400" />
          </div>
          <div>
            <h3 className="font-semibold text-[var(--text-primary)] text-sm mb-1">Delete Document</h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Are you sure you want to delete <span className="font-medium text-[var(--text-primary)]">"{doc.file_name}"</span>? This cannot be undone.
            </p>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" size="sm" onClick={onCancel} disabled={deleting}>Cancel</Button>
          <Button variant="danger" size="sm" loading={deleting} onClick={onConfirm}>Delete</Button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────
export function DocumentsPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { getSignedUrl, deleteDocument } = useDocuments()
  const { fetchAnalysis, analyzeDocument, pollUntilDone } = useDocumentAnalysis()

  const [documents,     setDocuments]     = useState([])
  const [cases,         setCases]         = useState({})
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState(null)
  const [search,        setSearch]        = useState('')
  const [deleteTarget,  setDeleteTarget]  = useState(null)
  const [deleting,      setDeleting]      = useState(false)
  const [downloadingId, setDownloadingId] = useState(null)
  const [expandedDocId, setExpandedDocId] = useState(null)
  const [docAnalyses,   setDocAnalyses]   = useState({})  // docId → analysis object
  const [analysing,     setAnalysing]     = useState({})  // docId → bool

  // ─── Fetch documents + parent cases + analyses ────────────────
  const fetchAll = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      const { data: docs, error: docsErr } = await supabase
        .from('documents')
        .select('*')
        .eq('uploaded_by', user.id)
        .order('created_at', { ascending: false })

      if (docsErr) throw docsErr
      setDocuments(docs || [])

      const caseIds = [...new Set((docs || []).map(d => d.case_id))]
      if (caseIds.length > 0) {
        const { data: caseData } = await supabase
          .from('cases')
          .select('id, type, status')
          .in('id', caseIds)
        const caseMap = {}
        ;(caseData || []).forEach(c => { caseMap[c.id] = c })
        setCases(caseMap)
      }

      // Fetch existing analyses for all documents
      if ((docs || []).length > 0) {
        const docIds = (docs || []).map(d => d.id)
        const { data: analyses } = await supabase
          .from('document_analysis')
          .select('*')
          .in('document_id', docIds)

        const analysisMap = {}
        ;(analyses || []).forEach(a => { analysisMap[a.document_id] = a })
        setDocAnalyses(analysisMap)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { fetchAll() }, [fetchAll])

  // ─── Trigger document analysis ────────────────────────────────
  const handleAnalyse = async (doc) => {
    setAnalysing(prev => ({ ...prev, [doc.id]: true }))
    setExpandedDocId(doc.id)

    const { error: err } = await analyzeDocument({
      documentId:  doc.id,
      caseId:      doc.case_id || null,
      storagePath: doc.storage_path,
      mimeType:    doc.mime_type,
    })

    if (!err) {
      const { data: result } = await pollUntilDone(doc.id)
      if (result) {
        setDocAnalyses(prev => ({ ...prev, [doc.id]: result }))
      }
    }
    setAnalysing(prev => ({ ...prev, [doc.id]: false }))
  }

  // ─── Download via signed URL ───────────────────────────────────
  const handleDownload = async (doc) => {
    setDownloadingId(doc.id)
    try {
      const signedUrl = await getSignedUrl(doc.storage_path, 60)
      if (signedUrl) {
        const a = document.createElement('a')
        a.href = signedUrl
        a.download = doc.file_name
        a.click()
      }
    } finally {
      setDownloadingId(null)
    }
  }

  // ─── Delete ────────────────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    await deleteDocument(deleteTarget.id, deleteTarget.storage_path)
    setDocuments(prev => prev.filter(d => d.id !== deleteTarget.id))
    setDeleteTarget(null)
    setDeleting(false)
  }

  // ─── Filter ────────────────────────────────────────────────────
  const filtered = documents.filter(doc => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      doc.file_name.toLowerCase().includes(q) ||
      doc.case_id.toLowerCase().includes(q) ||
      cases[doc.case_id]?.type?.toLowerCase().includes(q)
    )
  })

  // ─── Stats ─────────────────────────────────────────────────────
  const totalSize = documents.reduce((sum, d) => sum + (d.file_size || 0), 0)

  return (
    <>
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 animate-slide-up">
          <div>
            <h1 className="font-display text-3xl font-semibold text-[var(--text-primary)]">
              {t('nav.documents')}
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              {loading ? '—' : `${documents.length} files · ${formatBytes(totalSize)} total`}
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

        {/* Search bar */}
        <div className="relative animate-slide-up-delay-1">
          <Search size={14} className="absolute start-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
          <input
            type="text"
            placeholder="Search by filename, case type or ID…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full ps-10 pe-10 py-2.5 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-gold-500 focus:shadow-[0_0_0_3px_rgba(217,157,24,0.12)] transition-all"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute end-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2.5 p-4 rounded-xl bg-red-500/8 border border-red-500/20 text-red-400 text-sm animate-fade-in">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Table header (desktop) */}
        {!loading && documents.length > 0 && (
          <div className="hidden sm:grid grid-cols-[2.5rem_1fr_6rem_8rem_7rem_5.5rem] gap-4 px-4 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border)] pb-2">
            <div />
            <div>File Name</div>
            <div>Type</div>
            <div>Case</div>
            <div>Uploaded</div>
            <div>Actions</div>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <Skeleton />
        ) : filtered.length === 0 ? (
          <div className="glass-panel rounded-2xl">
            <EmptyState hasSearch={!!search} />
          </div>
        ) : (
          <div className="space-y-3 animate-fade-in">
            {filtered.map(doc => {
              const analysis    = docAnalyses[doc.id] || null
              const isAnalysing = !!analysing[doc.id]
              const isExpanded  = expandedDocId === doc.id
              const hasAnalysis = analysis?.status === 'done'

              return (
                <div key={doc.id} className="space-y-0">
                  <DocumentRow
                    doc={doc}
                    parentCase={cases[doc.case_id]}
                    t={t}
                    onDownload={() => handleDownload(doc)}
                    onDelete={() => setDeleteTarget(doc)}
                    isDownloading={downloadingId === doc.id}
                    hasAnalysis={hasAnalysis}
                    isAnalysing={isAnalysing}
                    isExpanded={isExpanded}
                    onAnalyse={() => handleAnalyse(doc)}
                    onToggle={() => setExpandedDocId(isExpanded ? null : doc.id)}
                  />
                  {/* Inline intelligence panel */}
                  {isExpanded && (
                    <div className="ps-4 pe-0 pb-2 animate-fade-in">
                      <DocumentIntelligencePanel
                        document={{
                          id:           doc.id,
                          file_name:    doc.file_name,
                          storage_path: doc.storage_path,
                          mime_type:    doc.mime_type,
                          case_id:      doc.case_id,
                        }}
                        initialAnalysis={analysis}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Footer count */}
        {!loading && filtered.length > 0 && (
          <p className="text-xs text-[var(--text-muted)] text-center pb-2">
            Showing {filtered.length} of {documents.length} documents
          </p>
        )}
      </div>

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <DeleteConfirm
          doc={deleteTarget}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
          deleting={deleting}
        />
      )}
    </>
  )
}

// ─── Document Row ─────────────────────────────────────────────────
function DocumentRow({ doc, parentCase, t, onDownload, onDelete, isDownloading, hasAnalysis, isAnalysing, isExpanded, onAnalyse, onToggle }) {
  const caseType = parentCase?.type || 'other'
  const caseMeta = TYPE_META[caseType] || TYPE_META.other
  const CaseIcon = caseMeta.icon
  const shortCaseId = doc.case_id?.slice(0, 8).toUpperCase() || '—'

  return (
    <div className={clsx(
      'group grid grid-cols-[2.5rem_1fr_auto_auto] sm:grid-cols-[2.5rem_1fr_6rem_8rem_7rem_auto] items-center gap-4 px-4 py-3.5 bg-[var(--bg-card)] border border-[var(--border)] hover:border-white/10 hover:bg-[var(--bg-elevated)] transition-all duration-200',
      isExpanded ? 'rounded-t-xl' : 'rounded-xl',
    )}>

      {/* Icon */}
      <div className="w-10 h-10 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center shrink-0">
        <FileBigIcon mimeType={doc.mime_type} fileName={doc.file_name} />
      </div>

      {/* Name + size */}
      <div className="min-w-0">
        <p className="text-sm font-medium text-[var(--text-primary)] truncate" title={doc.file_name}>
          {doc.file_name}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-[var(--text-muted)]">{formatBytes(doc.file_size)}</span>
          <FileChip mimeType={doc.mime_type} fileName={doc.file_name} />
        </div>
      </div>

      {/* Case type — desktop */}
      <div className="hidden sm:flex items-center gap-1.5 shrink-0">
        <div className={clsx('w-5 h-5 rounded flex items-center justify-center', caseMeta.bg)}>
          <CaseIcon size={11} className={caseMeta.color} />
        </div>
        <span className="text-xs text-[var(--text-secondary)] capitalize truncate max-w-[5rem]">
          {t(`case.types.${caseType}`, { defaultValue: caseType })}
        </span>
      </div>

      {/* Case ID — desktop */}
      <div className="hidden sm:block shrink-0">
        <span className="text-xs font-mono text-[var(--text-muted)] bg-white/4 px-1.5 py-0.5 rounded">
          #{shortCaseId}
        </span>
        {parentCase && (
          <div className="mt-0.5">
            <StatusBadge status={parentCase.status} />
          </div>
        )}
      </div>

      {/* Date — desktop */}
      <div className="hidden sm:block text-xs text-[var(--text-muted)] shrink-0">
        {formatDate(doc.created_at)}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* AI Analyse button */}
        <button
          type="button"
          onClick={hasAnalysis ? onToggle : onAnalyse}
          disabled={isAnalysing}
          title={hasAnalysis ? 'View AI Analysis' : 'Analyse with AI'}
          className={clsx(
            'flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-all',
            hasAnalysis
              ? isExpanded
                ? 'bg-gold-500/20 text-gold-400 border border-gold-500/40'
                : 'bg-gold-500/10 text-gold-400 border border-gold-500/20 hover:bg-gold-500/20'
              : 'bg-white/5 text-[var(--text-muted)] border border-[var(--border)] hover:bg-white/10 hover:text-[var(--text-primary)]',
            'opacity-0 group-hover:opacity-100',
            (hasAnalysis || isAnalysing) && 'opacity-100',
          )}
        >
          {isAnalysing
            ? <span className="w-3 h-3 border border-gold-400/30 border-t-gold-400 rounded-full animate-spin" />
            : <Brain size={11} />
          }
          <span className="hidden sm:inline">
            {isAnalysing ? 'Analysing…' : hasAnalysis ? (isExpanded ? 'Hide' : 'AI') : 'Analyse'}
          </span>
        </button>

        <button
          type="button"
          onClick={onDownload}
          disabled={isDownloading}
          title="Download"
          className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-blue-400 hover:bg-blue-500/10 transition-all disabled:opacity-50"
        >
          {isDownloading
            ? <span className="w-3 h-3 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
            : <Download size={13} />
          }
        </button>
        <button
          type="button"
          onClick={onDelete}
          title="Delete"
          className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
}

export default DocumentsPage
