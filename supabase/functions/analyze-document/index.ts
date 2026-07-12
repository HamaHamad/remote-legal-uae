// supabase/functions/analyze-document/index.ts
// Downloads a document from Supabase Storage, sends it to GPT-4o vision,
// extracts structured legal/financial information, stores results.
//
// Phase 0 security fixes applied:
//   - CORS: origin allowlist (no more `*`)
//   - Auth: requires valid user JWT (was already present, kept + hardened)
//   - Ownership: verifies caller owns the document's case before
//      downloading the file (prevents reading any storage_path)
//   - Error leakage: internal details logged server-side only
//
// Secrets required:
//   OPENAI_API_KEY
//   SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY
//   ALLOWED_ORIGINS (comma-separated)

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import {
  corsHeaders,
  handlePreflight,
  json,
} from '../_shared/cors.ts'
import {
  AuthError,
  createAdminClient,
  getUserFromRequest,
} from '../_shared/auth.ts'

// ─── Rate limiter: 10 per user per 10 minutes ───────────────────
const rateMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 10
const RATE_WINDOW = 10 * 60 * 1000

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const entry = rateMap.get(userId)
  if (!entry || now > entry.resetAt) {
    rateMap.set(userId, { count: 1, resetAt: now + RATE_WINDOW })
    return true
  }
  if (entry.count >= RATE_LIMIT) return false
  entry.count++
  return true
}

// ─── System prompt (unchanged) ───────────────────────────────────
const SYSTEM_PROMPT = `You are a document analysis engine for UAE-related legal and financial documents.
Read the document carefully and extract structured information.

Return ONLY valid JSON with exactly these fields:
{
  "document_type": "string — e.g. Employment Contract, Car Loan Agreement, Tenancy Contract, Bank Statement, Court Notice, etc.",
  "language": "string — detected language of the document (e.g. English, Arabic)",
  "summary": "string — 2-3 sentences describing what this document is about",
  "key_entities": {
    "parties": ["list of people or organisations mentioned"],
    "dates": ["important dates found, with context"],
    "reference_numbers": ["contract numbers, case IDs, etc."]
  },
  "financials": {
    "total_amount": "string or null",
    "currency": "string or null",
    "monthly_payment": "string or null",
    "outstanding_balance": "string or null",
    "fees": ["any fees or penalties mentioned"],
    "payment_schedule": "string or null"
  },
  "obligations": ["bullet list of obligations on each party"],
  "risks": ["bullet list of risks, red flags, or unfavourable terms"],
  "important_clauses": ["key clauses that the user should know about"],
  "recommended_next_steps": ["4-6 actionable steps based on this document"],
  "suggested_case_type": "one of: banking, car, employment, rental, legal, visa, other",
  "suggested_case_description": "string — a 2-sentence case description pre-filled for the user"
}

Rules:
- Return ONLY valid JSON. No markdown, no code blocks, no explanation.
- Do NOT give legal advice or predict legal outcomes.
- If a field has no data, use null for objects/strings or [] for arrays.
- Base your analysis on UAE law and practice where relevant.`

serve(async (req: Request) => {
  const cors = corsHeaders(req)
  const preflight = handlePreflight(req)
  if (preflight) return preflight

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405, cors, { Allow: 'POST, OPTIONS' })
  }

  let documentIdForRecovery: string | null = null

  try {
    // ── 1. Parse request ─────────────────────────────────────────
    const body = await req.json().catch(() => null)
    if (!body) return json({ error: 'Invalid JSON body' }, 400, cors)

    const { document_id, case_id, storage_path, mime_type, user_language } = body as {
      document_id?: string
      case_id?: string
      storage_path?: string
      mime_type?: string
      user_language?: string
    }

    if (!document_id || !storage_path) {
      return json({ error: 'Missing document_id or storage_path' }, 400, cors)
    }
    documentIdForRecovery = document_id

    // ── 2. Verify auth ───────────────────────────────────────────
    const { user, client: userClient } = await getUserFromRequest(req)

    // ── 3. Verify caller owns the document (or its case) ─────────
    // Look up the document via the user-scoped client — RLS will
    // refuse to return it if the caller doesn't own the case.
    const { data: docRow, error: docErr } = await userClient
      .from('documents')
      .select('id, case_id, uploaded_by, storage_path')
      .eq('id', document_id)
      .single()

    if (docErr || !docRow) {
      return json({ error: 'Document not found or access denied' }, 404, cors)
    }

    // If case_id was passed in body, ensure it matches the document's case
    if (case_id && case_id !== docRow.case_id) {
      return json({ error: 'Document does not belong to the specified case' }, 400, cors)
    }

    // Defense-in-depth: ignore client-supplied storage_path; use the
    // one we got from the DB (prevents the caller from downloading
    // any arbitrary path).
    const verifiedStoragePath = docRow.storage_path
    const verifiedCaseId = docRow.case_id

    // ── 4. Rate limit ────────────────────────────────────────────
    if (!checkRateLimit(user.id)) {
      return json(
        { error: 'Rate limit exceeded. Max 10 document analyses per 10 minutes.' },
        429,
        cors,
        { 'Retry-After': '600' },
      )
    }

    // ── 5. Admin client for privileged writes ────────────────────
    const admin = createAdminClient()

    // ── 6. Mark as processing ────────────────────────────────────
    await admin.from('document_analysis').upsert(
      {
        document_id,
        case_id: verifiedCaseId,
        status: 'processing',
        created_by: user.id,
      },
      { onConflict: 'document_id' },
    )

    // ── 7. Download file from Storage ────────────────────────────
    const { data: fileData, error: downloadErr } = await admin.storage
      .from('case-documents')
      .download(verifiedStoragePath)

    if (downloadErr || !fileData) {
      console.error('[analyze-document] Storage download failed:', downloadErr?.message)
      throw new Error('Failed to download document from storage')
    }

    // ── 8. Convert to base64 ─────────────────────────────────────
    const arrayBuffer = await fileData.arrayBuffer()
    const uint8 = new Uint8Array(arrayBuffer)
    let base64 = ''
    const chunkSize = 8192
    for (let i = 0; i < uint8.length; i += chunkSize) {
      base64 += String.fromCharCode(...uint8.slice(i, i + chunkSize))
    }
    base64 = btoa(base64)

    // ── 9. Determine media type ──────────────────────────────────
    const normalizedMime = mime_type?.toLowerCase() || 'application/octet-stream'
    let mediaType: string
    if (normalizedMime.includes('pdf')) mediaType = 'application/pdf'
    else if (normalizedMime.includes('png')) mediaType = 'image/png'
    else if (normalizedMime.includes('webp')) mediaType = 'image/webp'
    else if (normalizedMime.includes('gif')) mediaType = 'image/gif'
    else mediaType = 'image/jpeg'

    // ── 10. Build language instruction ───────────────────────────
    const langNote =
      user_language && user_language !== 'en'
        ? `\n\nIMPORTANT: Return the JSON with all string values translated to ${
            user_language === 'ar'
              ? 'Arabic'
              : user_language === 'hi'
              ? 'Hindi'
              : user_language === 'ur'
              ? 'Urdu'
              : user_language === 'tl'
              ? 'Filipino/Tagalog'
              : 'English'
          }.`
        : ''

    // ── 11. Call OpenAI ──────────────────────────────────────────
    const openAIKey = Deno.env.get('OPENAI_API_KEY')
    if (!openAIKey) {
      console.error('[analyze-document] OPENAI_API_KEY missing')
      throw new Error('AI service not configured')
    }

    const openAIRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openAIKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 2048,
        temperature: 0.1,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT + langNote },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mediaType};base64,${base64}`,
                  detail: 'high',
                },
              },
              {
                type: 'text',
                text: 'Analyse this document and return the JSON structure exactly as specified.',
              },
            ],
          },
        ],
      }),
    })

    if (!openAIRes.ok) {
      const errBody = await openAIRes.text()
      console.error(`[analyze-document] OpenAI error ${openAIRes.status}: ${errBody}`)
      throw new Error('AI provider returned an error')
    }

    const openAIData = await openAIRes.json()
    const rawContent = openAIData.choices?.[0]?.message?.content
    if (!rawContent) throw new Error('Empty response from AI provider')

    // ── 12. Parse AI JSON ────────────────────────────────────────
    let analysis: Record<string, unknown>
    try {
      analysis = JSON.parse(rawContent)
    } catch {
      console.error(
        '[analyze-document] Failed to parse AI JSON:',
        rawContent.slice(0, 200),
      )
      throw new Error('AI provider returned malformed JSON')
    }

    // ── 13. Store analysis ───────────────────────────────────────
    const { error: upsertErr } = await admin.from('document_analysis').upsert(
      {
        document_id,
        case_id: verifiedCaseId,
        created_by: user.id,
        status: 'done',
        document_type: (analysis.document_type as string) || 'Unknown',
        summary: (analysis.summary as string) || '',
        extracted_json: analysis,
        suggested_case_type: (analysis.suggested_case_type as string) || null,
        suggested_description:
          (analysis.suggested_case_description as string) || null,
      },
      { onConflict: 'document_id' },
    )

    if (upsertErr) {
      console.error('[analyze-document] DB upsert failed:', upsertErr.message)
      throw new Error('Failed to persist analysis')
    }

    // ── 14. Auto-enhance case if case_id provided ────────────────
    if (verifiedCaseId) {
      const { data: caseData } = await admin
        .from('cases')
        .select('type, description, ai_summary')
        .eq('id', verifiedCaseId)
        .single()

      const updates: Record<string, unknown> = {}

      if (caseData && (caseData.type === 'other' || !caseData.type)) {
        const suggestedType = analysis.suggested_case_type as string
        const validTypes = [
          'banking',
          'car',
          'employment',
          'rental',
          'legal',
          'visa',
          'other',
        ]
        if (suggestedType && validTypes.includes(suggestedType)) {
          updates.type = suggestedType
        }
      }

      if (caseData && analysis.summary) {
        const docInsight = `\n\n📄 Document Intelligence: ${analysis.summary}`
        if (!caseData.description?.includes('📄 Document Intelligence:')) {
          updates.description = (caseData.description || '') + docInsight
        }
      }

      if (Object.keys(updates).length > 0) {
        await admin.from('cases').update(updates).eq('id', verifiedCaseId)
      }

      // Add recommended steps
      const steps = analysis.recommended_next_steps as string[]
      if (Array.isArray(steps) && steps.length > 0) {
        const { data: existingSteps } = await admin
          .from('case_steps')
          .select('order_index')
          .eq('case_id', verifiedCaseId)
          .order('order_index', { ascending: false })
          .limit(1)

        const startIndex = existingSteps?.[0]?.order_index
          ? existingSteps[0].order_index + 1
          : 1

        const newSteps = steps.map((text, i) => ({
          case_id: verifiedCaseId,
          step_text: `📄 ${text}`,
          order_index: startIndex + i,
          status: 'pending',
        }))

        await admin.from('case_steps').insert(newSteps)
      }

      // Notify the case owner
      const { data: caseOwner } = await admin
        .from('cases')
        .select('user_id')
        .eq('id', verifiedCaseId)
        .single()

      if (caseOwner) {
        await admin.from('notifications').insert({
          user_id: caseOwner.user_id,
          type: 'document_uploaded',
          title: 'Document analysis complete',
          body: `Your ${analysis.document_type || 'document'} has been analysed.`,
          link: `/dashboard/cases/${verifiedCaseId}`,
          metadata: { case_id: verifiedCaseId, document_id },
        })
      }
    }

    return json({ success: true, analysis }, 200, cors)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[analyze-document] Error:', message)

    // Mark as failed (best-effort)
    if (documentIdForRecovery) {
      try {
        const admin = createAdminClient()
        await admin
          .from('document_analysis')
          .update({ status: 'failed', error_message: message })
          .eq('document_id', documentIdForRecovery)
      } catch {
        /* ignore */
      }
    }

    if (err instanceof AuthError) {
      return json({ error: err.message }, err.status, cors)
    }
    const safeMessage = message.includes('not configured') ||
      message.includes('malformed')
      ? message
      : 'Document analysis failed. Please try again later.'
    return json({ error: safeMessage }, 500, cors)
  }
})
