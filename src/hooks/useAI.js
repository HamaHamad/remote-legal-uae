import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

/**
 * useAI — triggers the analyze-case Edge Function and
 * polls the cases table until ai_status transitions to 'done' or 'failed'.
 */
export function useAI() {
  const [analyzing, setAnalyzing] = useState(false)
  const [aiError, setAiError] = useState(null)
  const [aiProgress, setAiProgress] = useState('') // status label for UI

  // ─── Invoke edge function + poll for result ───────────────────
  const analyzeCase = useCallback(async ({ caseId, caseType, description }) => {
    setAnalyzing(true)
    setAiError(null)
    setAiProgress('Sending to AI engine…')

    try {
      // Call the Supabase Edge Function
      const { error: fnError } = await supabase.functions.invoke('analyze-case', {
        body: {
          case_id: caseId,
          case_type: caseType,
          description: description || '',
        },
      })

      if (fnError) {
        // Edge function returned an error — mark case as failed in local state
        setAiError(fnError.message || 'AI analysis failed')
        setAnalyzing(false)
        setAiProgress('')

        // Update DB status to failed
        await supabase.from('cases').update({ ai_status: 'failed' }).eq('id', caseId)

        return { success: false, error: fnError.message }
      }

      setAiProgress('Analysis complete ✓')
      setAnalyzing(false)
      return { success: true, error: null }
    } catch (err) {
      const msg = err?.message || 'Unexpected error during AI analysis'
      setAiError(msg)
      setAiProgress('')
      setAnalyzing(false)
      return { success: false, error: msg }
    }
  }, [])

  // ─── Fetch the full AI report for a case ─────────────────────
  const fetchAIReport = useCallback(async (caseId) => {
    const { data, error } = await supabase
      .from('cases')
      .select(
        `
        id,
        ai_status,
        ai_summary,
        ai_risk_level,
        ai_estimated_cost,
        ai_estimated_time,
        ai_unlocked
      `,
      )
      .eq('id', caseId)
      .single()

    if (error) return { data: null, error: error.message }
    return { data, error: null }
  }, [])

  // ─── Fetch steps for a case ───────────────────────────────────
  const fetchSteps = useCallback(async (caseId) => {
    const { data, error } = await supabase
      .from('case_steps')
      .select('*')
      .eq('case_id', caseId)
      .order('order_index', { ascending: true })

    if (error) return []
    return data || []
  }, [])

  // ─── Unlock AI report ──────────────────────────────────────────
  // SECURITY: There is intentionally NO client-side unlockReport()
  // function. The `cases.ai_unlocked` column is now protected by the
  // cases_update_client_safe RLS policy (see migration_phase0_security.sql)
  // — clients cannot UPDATE it directly.
  //
  // The ONLY way to unlock an AI report is:
  //   1. Client calls create-checkout edge function → Stripe Checkout
  //   2. Stripe sends checkout.session.completed → stripe-webhook edge fn
  //   3. stripe-webhook (using service role) sets ai_unlocked = true
  //
  // To start a payment, use usePayments().startCheckout(caseId).

  return {
    analyzeCase,
    fetchAIReport,
    fetchSteps,
    analyzing,
    aiError,
    aiProgress,
  }
}

export default useAI
