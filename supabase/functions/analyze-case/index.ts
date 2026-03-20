// supabase/functions/analyze-case/index.ts
// Supabase Edge Function — Deno runtime
// Deploy: supabase functions deploy analyze-case
// Secrets: supabase secrets set OPENAI_API_KEY=sk-...

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ─── CORS headers (allow your Vercel domain + localhost) ─────────
const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ─── AI analysis response shape ──────────────────────────────────
interface AIAnalysis {
  summary:        string
  risk_level:     'low' | 'medium' | 'high'
  estimated_cost: string
  estimated_time: string
  steps:          string[]
}

// ─── System prompt ────────────────────────────────────────────────
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
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS })
  }

  try {
    // ── 1. Parse request body ──────────────────────────────────────
    const { case_id, case_type, description } = await req.json()

    if (!case_id || !case_type) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: case_id, case_type' }),
        { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } }
      )
    }

    // ── 2. Create Supabase admin client ───────────────────────────
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } }
    )

    // ── 3. Mark case as processing ────────────────────────────────
    await supabaseAdmin
      .from('cases')
      .update({ ai_status: 'processing' })
      .eq('id', case_id)

    // ── 4. Build user prompt ──────────────────────────────────────
    const userPrompt = `Case Type: ${case_type}
Description: ${description || 'No description provided.'}

Return JSON only.`

    // ── 5. Call OpenAI ────────────────────────────────────────────
    const openAIKey = Deno.env.get('OPENAI_API_KEY')
    if (!openAIKey) throw new Error('OPENAI_API_KEY not set in edge function secrets')

    const openAIRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIKey}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        model:       'gpt-4o-mini',
        max_tokens:  1024,
        temperature: 0.3,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user',   content: userPrompt },
        ],
      }),
    })

    if (!openAIRes.ok) {
      const errBody = await openAIRes.text()
      throw new Error(`OpenAI error ${openAIRes.status}: ${errBody}`)
    }

    const openAIData = await openAIRes.json()
    const rawContent  = openAIData.choices?.[0]?.message?.content

    if (!rawContent) throw new Error('Empty response from OpenAI')

    // ── 6. Parse AI JSON ──────────────────────────────────────────
    let analysis: AIAnalysis
    try {
      analysis = JSON.parse(rawContent)
    } catch {
      throw new Error(`Failed to parse OpenAI JSON: ${rawContent}`)
    }

    // Validate required fields
    const required = ['summary', 'risk_level', 'estimated_cost', 'estimated_time', 'steps']
    for (const field of required) {
      if (!(field in analysis)) throw new Error(`Missing field in AI response: ${field}`)
    }
    if (!['low', 'medium', 'high'].includes(analysis.risk_level)) {
      analysis.risk_level = 'medium'
    }
    if (!Array.isArray(analysis.steps) || analysis.steps.length === 0) {
      throw new Error('AI response missing steps array')
    }

    // ── 7. Update cases table ─────────────────────────────────────
    const { error: caseUpdateErr } = await supabaseAdmin
      .from('cases')
      .update({
        ai_summary:        analysis.summary,
        ai_risk_level:     analysis.risk_level,
        ai_estimated_cost: analysis.estimated_cost,
        ai_estimated_time: analysis.estimated_time,
        ai_status:         'done',
        ai_unlocked:       false,   // locked by default — paywall
      })
      .eq('id', case_id)

    if (caseUpdateErr) throw new Error(`Case update failed: ${caseUpdateErr.message}`)

    // ── 8. Delete old steps then insert fresh ones ─────────────────
    await supabaseAdmin
      .from('case_steps')
      .delete()
      .eq('case_id', case_id)

    const stepRows = analysis.steps.map((text: string, idx: number) => ({
      case_id:     case_id,
      step_text:   text,
      order_index: idx + 1,
      status:      idx === 0 ? 'current' : 'pending',
    }))

    const { error: stepsErr } = await supabaseAdmin
      .from('case_steps')
      .insert(stepRows)

    if (stepsErr) throw new Error(`Steps insert failed: ${stepsErr.message}`)

    // ── 9. Return success ─────────────────────────────────────────
    return new Response(
      JSON.stringify({ success: true, analysis }),
      { status: 200, headers: { ...CORS, 'Content-Type': 'application/json' } }
    )

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[analyze-case] Error:', message)

    // Mark case as failed if we have a case_id
    try {
      const body = await (async () => {
        try { return await (err as { body?: string }).body } catch { return null }
      })()
      void body
    } catch { /* ignore */ }

    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } }
    )
  }
})
