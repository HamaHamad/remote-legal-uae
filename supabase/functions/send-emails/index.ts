// supabase/functions/send-emails/index.ts
// Processes the email_queue table and sends emails via Resend.
//
// Deploy: supabase functions deploy send-emails
//
// Required secrets:
//   RESEND_API_KEY   — from resend.com (free tier: 3,000 emails/month)
//   FROM_EMAIL       — your verified sender, e.g. hello@resolveuae.com
//
// Schedule: Call this via Supabase cron every 5 minutes
//   SELECT cron.schedule('send-emails', '*/5 * * * *',
//     'SELECT net.http_post(
//       url := current_setting(''app.supabase_url'') || ''/functions/v1/send-emails'',
//       headers := jsonb_build_object(''Authorization'', ''Bearer '' || current_setting(''app.service_role_key'')),
//       body := ''{}''
//     )');
//
// OR trigger it manually from another function after important events.
// OR call it from your frontend via supabase.functions.invoke('send-emails')

import { serve }       from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const BATCH_SIZE = 20  // Process up to 20 emails per invocation

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const resendKey = Deno.env.get('RESEND_API_KEY')
    const fromEmail = Deno.env.get('FROM_EMAIL') || 'noreply@resolveuae.com'

    if (!resendKey) {
      return new Response(
        JSON.stringify({ error: 'RESEND_API_KEY not configured' }),
        { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } }
      )
    }

    // Admin Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } }
    )

    // Fetch pending emails
    const { data: emails, error: fetchErr } = await supabase
      .from('email_queue')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(BATCH_SIZE)

    if (fetchErr) throw new Error(`Failed to fetch email queue: ${fetchErr.message}`)
    if (!emails || emails.length === 0) {
      return new Response(
        JSON.stringify({ sent: 0, message: 'No pending emails' }),
        { status: 200, headers: { ...CORS, 'Content-Type': 'application/json' } }
      )
    }

    let sent = 0
    let failed = 0

    for (const email of emails) {
      try {
        // Send via Resend
        const res = await fetch('https://api.resend.com/emails', {
          method:  'POST',
          headers: {
            'Authorization': `Bearer ${resendKey}`,
            'Content-Type':  'application/json',
          },
          body: JSON.stringify({
            from:    `ResolveUAE <${fromEmail}>`,
            to:      [email.to_email],
            subject: email.subject,
            html:    wrapEmailHTML(email.body_html, email.subject),
            text:    email.body_text || '',
          }),
        })

        if (res.ok) {
          // Mark as sent
          await supabase
            .from('email_queue')
            .update({ status: 'sent', sent_at: new Date().toISOString() })
            .eq('id', email.id)
          sent++
        } else {
          const errBody = await res.text()
          throw new Error(`Resend API error ${res.status}: ${errBody}`)
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error(`[send-emails] Failed to send ${email.id}:`, msg)

        // Mark as failed
        await supabase
          .from('email_queue')
          .update({ status: 'failed', error: msg })
          .eq('id', email.id)
        failed++
      }
    }

    return new Response(
      JSON.stringify({ sent, failed, total: emails.length }),
      { status: 200, headers: { ...CORS, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[send-emails] Error:', message)
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } }
    )
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

          <!-- Header -->
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

          <!-- Body -->
          <tr>
            <td style="padding:32px;color:#1a1a1a;font-size:15px;line-height:1.7;">
              ${bodyHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8f8f8;padding:20px 32px;border-top:1px solid #eeeeee;">
              <p style="margin:0;font-size:11px;color:#999999;line-height:1.6;">
                ResolveUAE — Cross-Border Case Resolution Platform<br>
                This platform provides AI-assisted case organisation and coordination only.
                It does NOT provide legal advice or guaranteed outcomes.<br><br>
                You received this email because you have an account on ResolveUAE.
                <a href="https://remote-legal-uae.vercel.app/settings" style="color:#c9992e;">Manage notifications</a>
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
