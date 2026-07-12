// supabase/functions/analyze-case/index.ts
// Supabase Edge Function — Deno runtime
// Deploy: supabase functions deploy analyze-case
// Secrets: OPENAI_API_KEY + standard SUPABASE_URL/ANON_KEY/SERVICE_ROLE_KEY/ALLOWED_ORIGINS
//
// Phase 0 security fixes applied:
//   - CORS: origin allowlist (no more `*`)
//   - Auth: requires valid user JWT (no anonymous calls)
//   - Ownership: verifies caller owns the case (or is admin/assigned partner)
//   - Error leakage: internal error details are logged server-side only;
//     the client sees a generic message.

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
  verifyCaseAccess,
} from '../_shared/auth.ts'

// ─── In-memory rate limiter (per user, resets on cold start) ─────
// Limits: 5 analyses per user per 10 minutes
const rateMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 5
const RATE_WINDOW = 10 * 60 * 1000 // 10 min in ms

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

// ─── AI analysis response shape ──────────────────────────────────
interface AIAnalysis {
  summary: string
  risk_level: 'low' | 'medium' | 'high'
  estimated_cost: string
  estimated_time: string
  steps: string[]
}

const SYSTEM_PROMPT = `You are a legal case organizer for UAE-related issues.
Analyze the user's situation and return structured JSON with exactly these fields:
- summary: a clear 2-3 sentence overview of the case
- risk_level: one of "low", "medium", or "high"
- estimated_cost: a cost range in AED (e.g. "AED 1,500 – 4,000")
- estimated_time: a time estimate (e.g. "2–4 weeks")
- steps: an array of 4–7 actionable steps the user should take

Rules:
- Respond ONLY with valid JSON. No markdown, no code blocks, no explanation.
- Do NOT give legal advice or predict outcomes.
- Base estimates on typical UAE legal practice.
- If description is vague, provide general guidance for that case type.`

// ─── Main handler ─────────────────────────────────────────────────
serve(async (req: Request) => {
  const cors = corsHeaders(req)
  const preflight = handlePreflight(req)
  if (preflight) return preflight

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405, cors, { Allow: 'POST, OPTIONS' })
  }

  let caseIdForRecovery: string | null = null

  try {
    // ── 1. Parse body ─────────────────────────────────────────────
    const body = await req.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return json({ error: 'Invalid JSON body' }, 400, cors)
    }
    const { case_id, case_type, description } = body as {
      case_id?: string
      case_type?: string
      description?: string
    }

    if (!case_id || !case_type) {
      return json(
        { error: 'Missing required fields: case_id, case_type' },
        400,
        cors,
      )
    }
    caseIdForRecovery = case_id

    // ── 2. Verify auth + ownership ────────────────────────────────
    // This throws AuthError if no/invalid JWT, or if the user does
    // not own the case.
    const { user, client: userClient } = await getUserFromRequest(req)
    await verifyCaseAccess(userClient, case_id, user.id)

    // ── 3. Rate limit ─────────────────────────────────────────────
    if (!checkRateLimit(user.id)) {
      return json(
        {
          error:
            'Rate limit exceeded. Please wait 10 minutes before analyzing another case.',
        },
        429,
        cors,
        { 'Retry-After': '600' },
      )
    }

    // ── 4. Admin client for privileged writes ─────────────────────
    const admin = createAdminClient()

    // ── 5. Mark case as processing ────────────────────────────────
    await admin
      .from('cases')
      .update({ ai_status: 'processing' })
      .eq('id', case_id)

    // ── 6. Build prompt + call OpenAI ─────────────────────────────
    const userPrompt = `Case Type: ${case_type}
Description: ${description || 'No description provided.'}

Return JSON only.`

    const openAIKey = Deno.env.get('OPENAI_API_KEY')
    if (!openAIKey) {
      console.error('[analyze-case] OPENAI_API_KEY missing')
      throw new Error('AI service not configured')
    }

    const openAIRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openAIKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 1024,
        temperature: 0.3,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
      }),
    })

    if (!openAIRes.ok) {
      const errBody = await openAIRes.text()
      // Log full detail server-side; return generic message to client
      console.error(`[analyze-case] OpenAI error ${openAIRes.status}: ${errBody}`)
      throw new Error('AI provider returned an error')
    }

    const openAIData = await openAIRes.json()
    const rawContent = openAIData.choices?.[0]?.message?.content
    if (!rawContent) throw new Error('Empty response from AI provider')

    // ── 7. Parse + validate AI JSON ───────────────────────────────
    let analysis: AIAnalysis
    try {
      analysis = JSON.parse(rawContent)
    } catch {
      console.error('[analyze-case] Failed to parse AI JSON:', rawContent.slice(0, 500))
      throw new Error('AI provider returned malformed JSON')
    }

    const required: (keyof AIAnalysis)[] = [
      'summary',
      'risk_level',
      'estimated_cost',
      'estimated_time',
      'steps',
    ]
    for (const field of required) {
      if (!(field in analysis)) {
        throw new Error(`AI response missing field: ${field}`)
      }
    }
    if (!['low', 'medium', 'high'].includes(analysis.risk_level)) {
      analysis.risk_level = 'medium'
    }
    if (!Array.isArray(analysis.steps) || analysis.steps.length === 0) {
      throw new Error('AI response missing steps array')
    }

    // ── 8. Persist results (service role bypasses RLS) ────────────
    // NOTE: ai_unlocked is left UNCHANGED. It can only be set to true
    // by the stripe-webhook edge function after a successful payment.
    const { error: caseUpdateErr } = await admin
      .from('cases')
      .update({
        ai_summary: analysis.summary,
        ai_risk_level: analysis.risk_level,
        ai_estimated_cost: analysis.estimated_cost,
        ai_estimated_time: analysis.estimated_time,
        ai_status: 'done',
      })
      .eq('id', case_id)

    if (caseUpdateErr) {
      console.error('[analyze-case] Case update failed:', caseUpdateErr.message)
      throw new Error('Failed to persist AI results')
    }

    // ── 9. Replace case_steps ─────────────────────────────────────
    await admin.from('case_steps').delete().eq('case_id', case_id)

    const stepRows = analysis.steps.map((text: string, idx: number) => ({
      case_id,
      step_text: text,
      order_index: idx + 1,
      status: idx === 0 ? 'current' : 'pending',
    }))

    const { error: stepsErr } = await admin.from('case_steps').insert(stepRows)
    if (stepsErr) {
      console.error('[analyze-case] Steps insert failed:', stepsErr.message)
      throw new Error('Failed to persist action steps')
    }

    // ── 10. Return success ────────────────────────────────────────
    return json({ success: true, analysis }, 200, cors)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[analyze-case] Error:', message)

    // Mark case as failed (best-effort recovery)
    if (caseIdForRecovery) {
      try {
        const admin = createAdminClient()
        await admin
          .from('cases')
          .update({ ai_status: 'failed' })
          .eq('id', caseIdForRecovery)
      } catch {
        /* ignore */
      }
    }

    // Map known auth errors to their HTTP status; everything else is 500
    if (err instanceof AuthError) {
      return json({ error: err.message }, err.status, cors)
    }
    // Never leak internal error details to the client
    const safeMessage =
      message.includes('not configured') ||
      message.includes('malformed') ||
      message.includes('missing field')
        ? message
        : 'AI analysis failed. Please try again later.'
    return json({ error: safeMessage }, 500, cors)
  }
})
