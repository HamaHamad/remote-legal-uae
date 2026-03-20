import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

/**
 * useAdmin — fetches real data for the admin dashboard.
 * All queries rely on Supabase RLS + is_admin() policies.
 */
export function useAdmin() {
  const [stats,    setStats]    = useState({ users: 0, cases: 0, partners: 0, pending: 0 })
  const [cases,    setCases]    = useState([])
  const [users,    setUsers]    = useState([])
  const [partners, setPartners] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Run all queries in parallel
      const [
        { data: casesData,    error: casesErr    },
        { data: usersData,    error: usersErr    },
        { data: partnersData, error: partnersErr },
      ] = await Promise.all([
        supabase
          .from('cases')
          .select(`
            id, type, status, description, created_at, updated_at,
            user_id, assigned_to,
            ai_status, ai_risk_level, ai_unlocked,
            users!cases_user_id_fkey ( email, full_name )
          `)
          .order('created_at', { ascending: false })
          .limit(200),

        supabase
          .from('users')
          .select('id, email, full_name, role, language, created_at, is_active')
          .order('created_at', { ascending: false })
          .limit(200),

        supabase
          .from('partners')
          .select('*, users ( email, full_name )')
          .eq('is_active', true)
          .order('name'),
      ])

      if (casesErr)    throw casesErr
      if (usersErr)    throw usersErr
      if (partnersErr && partnersErr.code !== 'PGRST116') throw partnersErr

      const allCases    = casesData    || []
      const allUsers    = usersData    || []
      const allPartners = partnersData || []

      setCases(allCases)
      setUsers(allUsers)
      setPartners(allPartners)

      setStats({
        users:    allUsers.length,
        cases:    allCases.length,
        partners: allPartners.length,
        pending:  allCases.filter(c => c.status === 'pending').length,
      })
    } catch (err) {
      console.error('[useAdmin] fetchAll error:', err.message)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  // ─── Assign partner to case ────────────────────────────────────
  const assignPartner = useCallback(async (caseId, partnerUserId) => {
    const { error: err } = await supabase
      .from('cases')
      .update({ assigned_to: partnerUserId, status: 'active' })
      .eq('id', caseId)

    if (!err) {
      setCases(prev => prev.map(c =>
        c.id === caseId
          ? { ...c, assigned_to: partnerUserId, status: 'active' }
          : c
      ))
    }
    return { error: err?.message || null }
  }, [])

  // ─── Create task for a case ────────────────────────────────────
  const createTask = useCallback(async ({ caseId, assignedTo, title, notes, dueDate }) => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error: err } = await supabase
      .from('tasks')
      .insert({
        case_id:     caseId,
        assigned_to: assignedTo,
        created_by:  user?.id,
        title,
        notes,
        due_date:    dueDate || null,
        status:      'pending',
      })
      .select()
      .single()

    return { data, error: err?.message || null }
  }, [])

  // ─── Update user role ──────────────────────────────────────────
  const updateUserRole = useCallback(async (userId, role) => {
    const { error: err } = await supabase
      .from('users')
      .update({ role })
      .eq('id', userId)

    if (!err) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u))
    }
    return { error: err?.message || null }
  }, [])

  // ─── Add partner profile ───────────────────────────────────────
  const createPartner = useCallback(async ({ userId, name, email, specialty, bio }) => {
    const { data, error: err } = await supabase
      .from('partners')
      .insert({ user_id: userId, name, email, specialty, bio })
      .select()
      .single()

    if (!err && data) {
      setPartners(prev => [...prev, data])
      // Also update user role to partner
      await supabase.from('users').update({ role: 'partner' }).eq('id', userId)
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: 'partner' } : u))
    }
    return { data, error: err?.message || null }
  }, [])

  return {
    stats, cases, users, partners,
    loading, error,
    fetchAll,
    assignPartner,
    createTask,
    updateUserRole,
    createPartner,
  }
}

export default useAdmin
