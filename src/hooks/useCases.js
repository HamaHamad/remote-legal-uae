import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

export function useCases() {
  const { user, isAdmin } = useAuth()
  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchCases = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)

    try {
      let query = supabase
        .from('cases')
        .select(
          `
          id,
          type,
          status,
          description,
          created_at,
          updated_at,
          user_id,
          ai_status,
          ai_risk_level,
          ai_unlocked
        `,
        )
        .order('created_at', { ascending: false })

      if (!isAdmin) {
        query = query.eq('user_id', user.id)
      }

      const { data, error: fetchErr } = await query
      if (fetchErr) throw fetchErr

      setCases(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user, isAdmin])

  useEffect(() => {
    fetchCases()
  }, [fetchCases])

  // ─── Create a new case ─────────────────────────────────────────
  const createCase = useCallback(
    async ({ type, description }) => {
      if (!user) return { data: null, error: 'Not authenticated' }

      const { data, error: insertErr } = await supabase
        .from('cases')
        .insert({
          user_id: user.id,
          type,
          description,
          status: 'pending',
        })
        .select()
        .single()

      if (insertErr) return { data: null, error: insertErr.message }

      // Optimistically add to local list
      setCases((prev) => [data, ...prev])
      return { data, error: null }
    },
    [user],
  )

  // Stats derived from cases
  const stats = {
    total: cases.length,
    active: cases.filter((c) => c.status === 'active').length,
    pending: cases.filter((c) => c.status === 'pending').length,
    resolved: cases.filter((c) => c.status === 'resolved').length,
  }

  return { cases, stats, loading, error, refetch: fetchCases, createCase }
}

export default useCases
