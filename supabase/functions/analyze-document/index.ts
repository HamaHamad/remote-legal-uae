// supabase/functions/analyze-document/index.ts
// Downloads a document from Supabase Storage, sends it to GPT-4o vision,
// extracts structured legal/financial information, stores results.
//
// Secrets required:
//   OPENAI_API_KEY     — OpenAI API key (already set from Phase 3)
//
// Supports: PDF, JPG, PNG, WEBP, HEIC

import { serve }       from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ─── Rate limiter: 10 document analyses per user per 10 minutes ──
const rateMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT  = 10
const RATE_WINDOW = 10 * 60 * 1000

function checkRateLimit(userId: string): boolean {
  const now   = Date.now()
  const entry = rateMap.get(userId)
  if (!entry || now > entry.resetAt) {
    rateMap.set(userId, { count: 1, resetAt: now + RATE_WINDOW })
    return true
  }
  if (entry.count >= RATE_LIMIT) return false
  entry.count++
  return true
}

// ─── System prompt ────────────────────────────────────────────────
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
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    // ── 1. Parse request ─────────────────────────────────────────
    const { document_id, case_id, storage_path, mime_type, user_language } = await req.json()

    if (!document_id || !storage_path) {
      return new Response(
        JSON.stringify({ error: 'Missing document_id or storage_path' }),
        { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } }
      )
    }

    // ── 2. Verify auth ────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing Authorization header' }),
        { status: 401, headers: { ...CORS, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authErr } = await supabaseUser.auth.getUser()
    if (authErr || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid auth token' }),
        { status: 401, headers: { ...CORS, 'Content-Type': 'application/json' } }
      )
    }

    // ── Rate limit check ──────────────────────────────────────────
    if (!checkRateLimit(user.id)) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Max 10 document analyses per 10 minutes.' }),
        { status: 429, headers: { ...CORS, 'Content-Type': 'application/json', 'Retry-After': '600' } }
      )
    }

    // ── 3. Admin Supabase client ──────────────────────────────────
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } }
    )

    // ── 4. Mark as processing ──────────────────────────────────────
    await supabase.from('document_analysis').upsert({
      document_id,
      case_id:       case_id || null,
      status:        'processing',
      created_by:    user.id,
    }, { onConflict: 'document_id' })

    // ── 5. Download file from Storage ─────────────────────────────
    const { data: fileData, error: downloadErr } = await supabase.storage
      .from('case-documents')
      .download(storage_path)

    if (downloadErr || !fileData) {
      throw new Error(`Storage download failed: ${downloadErr?.message || 'unknown'}`)
    }

    // ── 6. Convert file to base64 ─────────────────────────────────
    const arrayBuffer = await fileData.arrayBuffer()
    const uint8       = new Uint8Array(arrayBuffer)
    let base64 = ''
    const chunkSize = 8192
    for (let i = 0; i < uint8.length; i += chunkSize) {
      base64 += String.fromCharCode(...uint8.slice(i, i + chunkSize))
    }
    base64 = btoa(base64)

    // ── 7. Determine media type ───────────────────────────────────
    // GPT-4o vision accepts: image/jpeg, image/png, image/webp, image/gif, application/pdf
    const normalizedMime = mime_type?.toLowerCase() || 'application/octet-stream'
    let mediaType: string

    if (normalizedMime.includes('pdf')) {
      mediaType = 'application/pdf'
    } else if (normalizedMime.includes('png')) {
      mediaType = 'image/png'
    } else if (normalizedMime.includes('webp')) {
      mediaType = 'image/webp'
    } else if (normalizedMime.includes('gif')) {
      mediaType = 'image/gif'
    } else {
      // Default JPG for heic, bmp, tiff etc.
      mediaType = 'image/jpeg'
    }

    // ── 8. Build language instruction ─────────────────────────────
    const langNote = user_language && user_language !== 'en'
      ? `\n\nIMPORTANT: Return the JSON with all string values translated to ${
          user_language === 'ar' ? 'Arabic' :
          user_language === 'hi' ? 'Hindi' :
          user_language === 'ur' ? 'Urdu' :
          user_language === 'tl' ? 'Filipino/Tagalog' : 'English'
        }.`
      : ''

    // ── 9. Call OpenAI GPT-4o with file ───────────────────────────
    const openAIKey = Deno.env.get('OPENAI_API_KEY')
    if (!openAIKey) throw new Error('OPENAI_API_KEY not set')

    const openAIRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${openAIKey}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        model:           'gpt-4o',
        max_tokens:      2048,
        temperature:     0.1,
        response_format: { type: 'json_object' },
        messages: [
          {
            role:    'system',
            content: SYSTEM_PROMPT + langNote,
          },
          {
            role:    'user',
            content: [
              {
                type:       'image_url',
                image_url:  {
                  url:    `data:${mediaType};base64,${base64}`,
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
      throw new Error(`OpenAI error ${openAIRes.status}: ${errBody}`)
    }

    const openAIData = await openAIRes.json()
    const rawContent = openAIData.choices?.[0]?.message?.content
    if (!rawContent) throw new Error('Empty response from OpenAI')

    // ── 10. Parse AI JSON ─────────────────────────────────────────
    let analysis: Record<string, unknown>
    try {
      analysis = JSON.parse(rawContent)
    } catch {
      throw new Error(`Failed to parse AI JSON: ${rawContent.slice(0, 200)}`)
    }

    // ── 11. Store analysis ────────────────────────────────────────
    const { error: upsertErr } = await supabase
      .from('document_analysis')
      .upsert({
        document_id,
        case_id:                 case_id || null,
        created_by:              user.id,
        status:                  'done',
        document_type:           analysis.document_type   as string || 'Unknown',
        summary:                 analysis.summary         as string || '',
        extracted_json:          analysis,
        suggested_case_type:     analysis.suggested_case_type as string || null,
        suggested_description:   analysis.suggested_case_description as string || null,
      }, { onConflict: 'document_id' })

    if (upsertErr) throw new Error(`DB upsert failed: ${upsertErr.message}`)

    // ── 12. Auto-enhance case if case_id provided ─────────────────
    if (case_id) {
      // Fetch current case
      const { data: caseData } = await supabase
        .from('cases')
        .select('type, description, ai_summary')
        .eq('id', case_id)
        .single()

      const updates: Record<string, unknown> = {}

      // Update case type if it was 'other' or empty
      if (caseData && (caseData.type === 'other' || !caseData.type)) {
        const suggestedType = analysis.suggested_case_type as string
        const validTypes = ['banking','car','employment','rental','legal','visa','other']
        if (suggestedType && validTypes.includes(suggestedType)) {
          updates.type = suggestedType
        }
      }

      // Append document insight to case description
      if (caseData && analysis.summary) {
        const docInsight = `\n\n📄 Document Intelligence: ${analysis.summary}`
        if (!caseData.description?.includes('📄 Document Intelligence:')) {
          updates.description = (caseData.description || '') + docInsight
        }
      }

      if (Object.keys(updates).length > 0) {
        await supabase.from('cases').update(updates).eq('id', case_id)
      }

      // Add recommended steps as case_steps
      const steps = analysis.recommended_next_steps as string[]
      if (Array.isArray(steps) && steps.length > 0) {
        // Get current max order_index
        const { data: existingSteps } = await supabase
          .from('case_steps')
          .select('order_index')
          .eq('case_id', case_id)
          .order('order_index', { ascending: false })
          .limit(1)

        const startIndex = existingSteps?.[0]?.order_index
          ? existingSteps[0].order_index + 1
          : 1

        const newSteps = steps.map((text, i) => ({
          case_id:     case_id,
          step_text:   `📄 ${text}`,
          order_index: startIndex + i,
          status:      'pending',
        }))

        await supabase.from('case_steps').insert(newSteps)
      }

      // Notify the case owner
      const { data: caseOwner } = await supabase
        .from('cases')
        .select('user_id')
        .eq('id', case_id)
        .single()

      if (caseOwner) {
        await supabase.from('notifications').insert({
          user_id:  caseOwner.user_id,
          type:     'document_uploaded',
          title:    'Document analysis complete',
          body:     `Your ${analysis.document_type || 'document'} has been analysed.`,
          link:     `/dashboard/cases/${case_id}`,
          metadata: { case_id, document_id },
        })
      }
    }

    // ── 13. Return success ────────────────────────────────────────
    return new Response(
      JSON.stringify({ success: true, analysis }),
      { status: 200, headers: { ...CORS, 'Content-Type': 'application/json' } }
    )

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[analyze-document] Error:', message)

    // Try to mark as failed
    try {
      const body = await req.clone().json().catch(() => ({}))
      if (body.document_id) {
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL')!,
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
          { auth: { persistSession: false } }
        )
        await supabase.from('document_analysis')
          .update({ status: 'failed', error_message: message })
          .eq('document_id', body.document_id)
      }
    } catch { /* ignore */ }

    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } }
    )
  }
})
