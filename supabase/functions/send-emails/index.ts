// supabase/functions/send-emails/index.ts
// Processes the email_queue table and sends emails via Resend.
//
// Phase 0 security fixes applied:
//   - CORS: origin allowlist (no more `*`)
//   - Auth: requires service-role key (no more anonymous calls)
//   - Concurrency: claim emails with atomic UPDATE ... WHERE status='pending'
//     so multiple cron invocations don't send duplicates
//   - Error leakage: internal details logged server-side only
//
// Required secrets:
//   RESEND_API_KEY
//   FROM_EMAIL
//   SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY
//   ALLOWED_ORIGINS (not strictly needed for cron, but harmless)
//
// Schedule via Supabase cron:
//   SELECT cron.schedule('send-emails', '*/5 * * * *',
//     'SELECT net.http_post(
//       url := current_setting(''app.supabase_url'') || ''/functions/v1/send-emails'',
//       headers := jsonb_build_object(
//         ''Authorization'', ''Bearer '' || current_setting(''app.service_role_key''),
//         ''Content-Type'', ''application/json''
//       ),
//       body := ''{}''
//     )');

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import {
  corsHeaders,
  handlePreflight,
  json,
} from '../_shared/cors.ts'
import {
  AuthError,
  createAdminClient,
  requireServiceRole,
} from '../_shared/auth.ts'

const BATCH_SIZE = 20

serve(async (req: Request) => {
  const cors = corsHeaders(req)
  const preflight = handlePreflight(req)
  if (preflight) return preflight

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405, cors, { Allow: 'POST, OPTIONS' })
  }

  try {
    // ── 1. Auth: this endpoint is internal-only ──────────────────
    // Must be called with the service-role key (via cron or admin
    // tooling). Anonymous browser calls are rejected with 403.
    try {
      requireServiceRole(req)
    } catch (err) {
      if (err instanceof AuthError) {
        return json({ error: err.message }, err.status, cors)
      }
      throw err
    }

    // ── 2. Resend config ─────────────────────────────────────────
    const resendKey = Deno.env.get('RESEND_API_KEY')
    const fromEmail = Deno.env.get('FROM_EMAIL') || 'noreply@resolveuae.com'

    if (!resendKey) {
      console.error('[send-emails] RESEND_API_KEY not configured')
      return json({ error: 'Email service not configured' }, 500, cors)
    }

    const admin = createAdminClient()

    // ── 3. Claim a batch atomically ──────────────────────────────
    // The old code did a plain SELECT then UPDATE per row after send.
    // If two cron invocations overlapped, both would SELECT the same
    // pending rows and send duplicates.
    //
    // New approach: a single atomic UPDATE flips N rows from
    // 'pending' → 'processing' (a new status we add to the CHECK),
    // returning them. Other concurrent invocations won't see them.
    //
    // NOTE: requires migration_phase0_security.sql to have been run
    // (which extends the email_queue status CHECK constraint).
    const { data: claimed, error: claimErr } = await admin
      .from('email_queue')
      .update({ status: 'processing' })
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(BATCH_SIZE)
      .select('*')

    if (claimErr) {
      console.error('[send-emails] Claim failed:', claimErr.message)
      return json({ error: 'Failed to claim emails' }, 500, cors)
    }

    if (!claimed || claimed.length === 0) {
      return json({ sent: 0, failed: 0, message: 'No pending emails' }, 200, cors)
    }

    // ── 4. Send each email ───────────────────────────────────────
    let sent = 0
    let failed = 0

    for (const email of claimed) {
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: `ResolveUAE <${fromEmail}>`,
            to: [email.to_email],
            subject: email.subject,
            html: wrapEmailHTML(email.body_html, email.subject),
            text: email.body_text || '',
          }),
        })

        if (res.ok) {
          await admin
            .from('email_queue')
            .update({ status: 'sent', sent_at: new Date().toISOString(), error: null })
            .eq('id', email.id)
          sent++
        } else {
          const errBody = await res.text()
          console.error(`[send-emails] Resend API ${res.status} for ${email.id}:`, errBody)
          throw new Error(`Resend API error ${res.status}`)
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error(`[send-emails] Failed ${email.id}:`, msg)
        await admin
          .from('email_queue')
          .update({ status: 'failed', error: msg })
          .eq('id', email.id)
        failed++
      }
    }

    return json({ sent, failed, total: claimed.length }, 200, cors)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[send-emails] Error:', message)
    // Never leak internals
    return json({ error: 'Email processing error' }, 500, cors)
  }
})

// ─── Branded HTML wrapper ─────────────────────────────────────────
function wrapEmailHTML(bodyHtml: string, subject: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:24px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:#060c1a;padding:24px 32px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#c9992e;width:32px;height:32px;border-radius:8px;text-align:center;vertical-align:middle;font-weight:bold;color:#060c1a;font-size:16px;">R</td>
                  <td style="padding-left:10px;font-size:18px;font-weight:600;color:#e8b84b;font-family:Georgia,serif;letter-spacing:0.02em;">ResolveUAE</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;color:#1a1a1a;font-size:15px;line-height:1.7;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="background:#f8f8f8;padding:20px 32px;border-top:1px solid #eeeeee;">
              <p style="margin:0;font-size:11px;color:#999999;line-height:1.6;">
                ResolveUAE — Cross-Border Case Resolution Platform<br>
                This platform provides AI-assisted case organisation and coordination only.
                It does NOT provide legal advice or guaranteed outcomes.<br><br>
                You received this email because you have an account on ResolveUAE.
                <a href="${Deno.env.get('SITE_URL') || 'https://expat.legalwakeely.com'}/settings" style="color:#c9992e;">Manage notifications</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
