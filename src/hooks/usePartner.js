import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

export function usePartner() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState([])
  const [assignedCases, setAssignedCases] = useState([])
  const [profile, setProfile] = useState(null)
  const [stats, setStats] = useState({ assigned: 0, inProgress: 0, done: 0, pending: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchAll = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)

    try {
      const [
        { data: tasksData, error: tasksErr },
        { data: casesData, error: casesErr },
        { data: profileData, error: profileErr },
      ] = await Promise.all([
        // Tasks assigned to this partner
        supabase
          .from('tasks')
          .select(
            `
            *,
            cases (
              id, type, status, description, user_id,
              users!cases_user_id_fkey ( email, full_name )
            )
          `,
          )
          .eq('assigned_to', user.id)
          .order('created_at', { ascending: false }),

        // Cases assigned to this partner
        supabase
          .from('cases')
          .select(
            `
            id, type, status, description, created_at, ai_risk_level,
            users!cases_user_id_fkey ( email, full_name )
          `,
          )
          .eq('assigned_to', user.id)
          .order('created_at', { ascending: false }),

        // Partner profile
        supabase.from('partners').select('*').eq('user_id', user.id).maybeSingle(),
      ])

      if (tasksErr) throw tasksErr
      if (casesErr) throw casesErr

      const t = tasksData || []
      const c = casesData || []

      setTasks(t)
      setAssignedCases(c)
      setProfile(profileData)
      setStats({
        assigned: c.length,
        inProgress: t.filter((x) => x.status === 'in_progress').length,
        done: t.filter((x) => x.status === 'done').length,
        pending: t.filter((x) => x.status === 'pending').length,
      })
    } catch (err) {
      console.error('[usePartner] fetchAll error:', err.message)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  // ─── Update task status ────────────────────────────────────────
  const updateTaskStatus = useCallback(
    async (taskId, status) => {
      const updates = { status }
      if (status === 'done') updates.completed_at = new Date().toISOString()

      const { error: err } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)
        .eq('assigned_to', user.id) // RLS: partner can only update own tasks

      if (!err) {
        setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t)))
      }
      return { error: err?.message || null }
    },
    [user],
  )

  // ─── Upload proof of work ──────────────────────────────────────
  const uploadProof = useCallback(
    async (taskId, file) => {
      if (!file || !user) return { error: 'Missing file or user' }

      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const storagePath = `proofs/${user.id}/${taskId}/${Date.now()}-${safeName}`

      const { error: uploadErr } = await supabase.storage
        .from('case-documents')
        .upload(storagePath, file, { cacheControl: '3600', upsert: true })

      if (uploadErr) return { error: uploadErr.message }

      const { data: urlData } = supabase.storage.from('case-documents').getPublicUrl(storagePath)

      const { error: dbErr } = await supabase
        .from('tasks')
        .update({
          proof_url: urlData?.publicUrl || '',
          proof_file: file.name,
          status: 'in_progress',
        })
        .eq('id', taskId)
        .eq('assigned_to', user.id)

      if (!dbErr) {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  proof_url: urlData?.publicUrl,
                  proof_file: file.name,
                  status: 'in_progress',
                }
              : t,
          ),
        )
      }

      return { error: dbErr?.message || null }
    },
    [user],
  )

  return {
    tasks,
    assignedCases,
    profile,
    stats,
    loading,
    error,
    fetchAll,
    updateTaskStatus,
    uploadProof,
  }
}

export default usePartner
