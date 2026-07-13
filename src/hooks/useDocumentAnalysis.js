import { useState, useCallback, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

/**
 * useDocumentAnalysis
 * Manages the full lifecycle of AI document analysis:
 * - Triggering the Edge Function
 * - Polling for completion
 * - Fetching structured results
 */
export function useDocumentAnalysis() {
  const { user, profile } = useAuth()
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState(null)
  const [progress, setProgress] = useState('')

  // ─── Trigger analysis for a document ──────────────────────────
  const analyzeDocument = useCallback(
    async ({ documentId, caseId, storagePath, mimeType }) => {
      if (!user) return { error: 'Not authenticated' }

      setAnalyzing(true)
      setError(null)
      setProgress('Sending to AI engine…')

      try {
        const { data, error: fnErr } = await supabase.functions.invoke('analyze-document', {
          body: {
            document_id: documentId,
            case_id: caseId || null,
            storage_path: storagePath,
            mime_type: mimeType,
            user_language: profile?.language || 'en',
          },
        })

        if (fnErr) throw new Error(fnErr.message)

        setProgress('Analysis complete ✓')
        setAnalyzing(false)
        return { data, error: null }
      } catch (err) {
        const msg = err?.message || 'Analysis failed'
        setError(msg)
        setProgress('')
        setAnalyzing(false)
        return { data: null, error: msg }
      }
    },
    [user, profile],
  )

  // ─── Fetch analysis for a specific document ────────────────────
  const fetchAnalysis = useCallback(async (documentId) => {
    if (!documentId) return null

    const { data, error: dbErr } = await supabase
      .from('document_analysis')
      .select('*')
      .eq('document_id', documentId)
      .maybeSingle()

    if (dbErr) return null
    return data
  }, [])

  // ─── Fetch all analyses for a case ────────────────────────────
  const fetchCaseAnalyses = useCallback(async (caseId) => {
    if (!caseId) return []

    const { data, error: dbErr } = await supabase
      .from('document_analysis')
      .select(
        `
        *,
        documents ( id, file_name, mime_type, file_size, storage_path )
      `,
      )
      .eq('case_id', caseId)
      .eq('status', 'done')
      .order('created_at', { ascending: false })

    if (dbErr) return []
    return data || []
  }, [])

  // ─── Poll until analysis completes ────────────────────────────
  const pollUntilDone = useCallback(
    async (documentId, maxAttempts = 20) => {
      for (let i = 0; i < maxAttempts; i++) {
        const analysis = await fetchAnalysis(documentId)
        if (analysis?.status === 'done') return { data: analysis, error: null }
        if (analysis?.status === 'failed')
          return { data: null, error: analysis.error_message || 'Analysis failed' }
        await new Promise((r) => setTimeout(r, 2000))
      }
      return { data: null, error: 'Analysis timed out' }
    },
    [fetchAnalysis],
  )

  // ─── Delete analysis (re-analyze) ─────────────────────────────
  const deleteAnalysis = useCallback(async (documentId) => {
    await supabase.from('document_analysis').delete().eq('document_id', documentId)
  }, [])

  return {
    analyzeDocument,
    fetchAnalysis,
    fetchCaseAnalyses,
    pollUntilDone,
    deleteAnalysis,
    analyzing,
    error,
    progress,
  }
}

export default useDocumentAnalysis
