import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

/**
 * usePayments
 * Handles Stripe checkout session creation and payment status queries.
 * The checkout session is created via the Supabase Edge Function
 * (which keeps the Stripe secret key server-side).
 */
export function usePayments() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [redirecting, setRedirecting] = useState(false)

  // ─── Start Stripe checkout ────────────────────────────────────
  const startCheckout = useCallback(async (caseId) => {
    setLoading(true)
    setError(null)

    try {
      // The return_url is the current origin so success/cancel land back on your domain
      const returnUrl = window.location.origin

      const { data, error: fnError } = await supabase.functions.invoke('create-checkout', {
        body: {
          case_id: caseId,
          return_url: returnUrl,
        },
      })

      if (fnError) throw new Error(fnError.message)
      if (!data?.url) throw new Error('No checkout URL returned from server')

      // Redirect to Stripe Checkout
      setRedirecting(true)
      window.location.href = data.url

      return { url: data.url, error: null }
    } catch (err) {
      const msg = err?.message || 'Failed to start checkout'
      setError(msg)
      setLoading(false)
      setRedirecting(false)
      return { url: null, error: msg }
    }
  }, [])

  // ─── Check if case is unlocked ────────────────────────────────
  const checkUnlocked = useCallback(async (caseId) => {
    const { data, error: dbErr } = await supabase
      .from('cases')
      .select('ai_unlocked')
      .eq('id', caseId)
      .single()

    if (dbErr) return false
    return data?.ai_unlocked === true
  }, [])

  // ─── Fetch payment history for a case ────────────────────────
  const fetchPayments = useCallback(async (caseId) => {
    const { data, error: dbErr } = await supabase
      .from('payments')
      .select('*')
      .eq('case_id', caseId)
      .order('created_at', { ascending: false })

    if (dbErr) return []
    return data || []
  }, [])

  // ─── Fetch ALL payments for the current user ──────────────────
  const fetchUserPayments = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error: dbErr } = await supabase
      .from('payments')
      .select(
        `
        *,
        cases ( id, type, status )
      `,
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (dbErr) return []
    return data || []
  }, [])

  // ─── Poll until unlock confirmed (used by PaymentSuccessPage) ─
  const pollUntilUnlocked = useCallback(
    async (caseId, maxAttempts = 12) => {
      for (let i = 0; i < maxAttempts; i++) {
        const unlocked = await checkUnlocked(caseId)
        if (unlocked) return true
        // Wait 2.5s between polls
        await new Promise((resolve) => setTimeout(resolve, 2500))
      }
      return false // timeout after ~30s
    },
    [checkUnlocked],
  )

  return {
    startCheckout,
    checkUnlocked,
    fetchPayments,
    fetchUserPayments,
    pollUntilUnlocked,
    loading,
    error,
    redirecting,
  }
}

export default usePayments
