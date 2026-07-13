import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

const BUCKET = 'case-documents'
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50 MB
const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

export function useDocuments() {
  const { user } = useAuth()
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({}) // { fileName: 0-100 }
  const [error, setError] = useState(null)

  // ─── Validate a single file ──────────────────────────────────────
  const validateFile = (file) => {
    if (file.size > MAX_FILE_SIZE) {
      return `${file.name}: File exceeds 50 MB limit`
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `${file.name}: File type not allowed (use PDF, JPG, PNG, DOCX)`
    }
    return null
  }

  // ─── Upload multiple files for a case ───────────────────────────
  const uploadDocuments = useCallback(
    async (caseId, files) => {
      if (!user || !caseId || !files.length) return { data: null, error: 'Missing required params' }

      setError(null)
      setUploading(true)
      const results = []
      const errors = []

      for (const file of files) {
        const validationError = validateFile(file)
        if (validationError) {
          errors.push(validationError)
          continue
        }

        // Storage path: {userId}/{caseId}/{timestamp}-{filename}
        const timestamp = Date.now()
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
        const storagePath = `${user.id}/${caseId}/${timestamp}-${safeName}`

        // Track progress per file
        setUploadProgress((prev) => ({ ...prev, [file.name]: 0 }))

        try {
          // Upload to Supabase Storage
          const { error: storageErr } = await supabase.storage
            .from(BUCKET)
            .upload(storagePath, file, {
              cacheControl: '3600',
              upsert: false,
            })

          if (storageErr) throw storageErr

          setUploadProgress((prev) => ({ ...prev, [file.name]: 60 }))

          // Get public/signed URL for reference
          const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath)

          // Insert document metadata into DB
          const { data: docData, error: dbErr } = await supabase
            .from('documents')
            .insert({
              case_id: caseId,
              uploaded_by: user.id,
              file_name: file.name,
              file_url: urlData?.publicUrl || '',
              storage_path: storagePath,
              mime_type: file.type,
              file_size: file.size,
            })
            .select()
            .single()

          if (dbErr) throw dbErr

          setUploadProgress((prev) => ({ ...prev, [file.name]: 100 }))
          results.push(docData)
        } catch (err) {
          errors.push(`${file.name}: ${err.message}`)
          setUploadProgress((prev) => ({ ...prev, [file.name]: -1 }))
        }
      }

      setUploading(false)

      if (errors.length > 0) {
        const errMsg = errors.join('\n')
        setError(errMsg)
        return { data: results, error: errMsg }
      }

      return { data: results, error: null }
    },
    [user],
  )

  // ─── Fetch documents for a case ─────────────────────────────────
  const fetchDocuments = useCallback(async (caseId) => {
    if (!caseId) return []
    const { data, error: fetchErr } = await supabase
      .from('documents')
      .select('*')
      .eq('case_id', caseId)
      .order('created_at', { ascending: false })

    if (fetchErr) {
      console.error('[useDocuments] fetch error:', fetchErr.message)
      return []
    }
    return data || []
  }, [])

  // ─── Get signed URL for private file ────────────────────────────
  const getSignedUrl = useCallback(async (storagePath, expiresIn = 3600) => {
    const { data, error: urlErr } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(storagePath, expiresIn)

    if (urlErr) return null
    return data?.signedUrl || null
  }, [])

  // ─── Delete a document ───────────────────────────────────────────
  const deleteDocument = useCallback(async (documentId, storagePath) => {
    // Delete from storage
    if (storagePath) {
      await supabase.storage.from(BUCKET).remove([storagePath])
    }
    // Delete DB record
    const { error: dbErr } = await supabase.from('documents').delete().eq('id', documentId)

    return { error: dbErr }
  }, [])

  return {
    uploadDocuments,
    fetchDocuments,
    getSignedUrl,
    deleteDocument,
    uploading,
    uploadProgress,
    error,
    ALLOWED_TYPES,
    MAX_FILE_SIZE,
  }
}

export default useDocuments
