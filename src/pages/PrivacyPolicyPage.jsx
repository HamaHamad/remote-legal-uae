// src/pages/PrivacyPolicyPage.jsx
import { LegalPageLayout } from '@/components/LegalPageLayout'

export function PrivacyPolicyPage() {
  return (
    <LegalPageLayout title="Privacy Policy" lastUpdated="July 2026">
      <p className="text-[var(--text-secondary)] mb-6">
        This Privacy Policy explains how Remote Legal Case Orchestrator (&quot;ResolveUAE&quot;,
        &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) collects, uses, discloses, and
        safeguards your information when you use our platform. We are committed to complying with
        the{' '}
        <strong>UAE Federal Decree-Law No. 45 of 2021 on the Protection of Personal Data</strong>{' '}
        (the &quot;UAE PDPL&quot;) and the{' '}
        <strong>EU General Data Protection Regulation (GDPR)</strong> where applicable to data
        subjects in the European Economic Area.
      </p>

      <h2>1. Information We Collect</h2>
      <h3>1.1 Information You Provide Directly</h3>
      <ul>
        <li>
          <strong>Account information:</strong> Full name, email address, password (hashed),
          preferred language, and role (client, partner, or admin).
        </li>
        <li>
          <strong>Case information:</strong> Case type, title, description, and any documents you
          upload (e.g., contracts, court notices, identification documents).
        </li>
        <li>
          <strong>Payment information:</strong> When you unlock an AI case report, payment is
          processed by Stripe. We do not store your card number, CVC, or full card details. We
          retain the Stripe transaction ID, amount, and payment status for record-keeping.
        </li>
        <li>
          <strong>Profile preferences:</strong> Language preference, notification preferences, and
          avatar (if uploaded).
        </li>
      </ul>

      <h3>1.2 Information Collected Automatically</h3>
      <ul>
        <li>
          <strong>Usage data:</strong> IP address, browser type, device type, pages visited, time
          spent on pages, and referring URLs. This is collected via anonymized analytics (Plausible
          Analytics — no cookies, no cross-site tracking).
        </li>
        <li>
          <strong>Technical logs:</strong> Server-side error logs, edge function invocation logs,
          and database audit logs. These are retained for 30 days for security and debugging
          purposes.
        </li>
      </ul>

      <h3>1.3 Sensitive / Special Category Data</h3>
      <p>
        Legal case data may include information about your employment, immigration status, financial
        situation, family matters, or disputes. Under UAE PDPL Article 11 and GDPR Article 9, this
        is considered &quot;sensitive personal data.&quot; We process this data only with your
        explicit consent (when you create a case) and only for the purpose of providing our case
        organization and AI analysis services.
      </p>

      <h2>2. How We Use Your Information</h2>
      <ul>
        <li>
          <strong>To provide the service:</strong> Creating and managing your cases, generating
          AI-powered case analysis, storing and analyzing uploaded documents, and processing
          payments.
        </li>
        <li>
          <strong>To communicate with you:</strong> Sending email notifications about case status
          changes, AI report readiness, payment confirmations, and security alerts.
        </li>
        <li>
          <strong>To improve the platform:</strong> Analyzing usage patterns, identifying bugs, and
          developing new features. Analytics data is aggregated and anonymized.
        </li>
        <li>
          <strong>To ensure security:</strong> Monitoring for fraudulent activity, enforcing rate
          limits, and maintaining audit logs of case modifications.
        </li>
        <li>
          <strong>Legal compliance:</strong> Retaining records as required by UAE law and responding
          to lawful requests from authorities.
        </li>
      </ul>

      <h2>3. Legal Basis for Processing (GDPR Article 6)</h2>
      <ul>
        <li>
          <strong>Performance of a contract (Art. 6(1)(b)):</strong> Processing your case data to
          provide the case management and AI analysis service you requested.
        </li>
        <li>
          <strong>Consent (Art. 6(1)(a) and Art. 9(2)(a)):</strong> Your explicit consent when
          creating a case that may contain sensitive personal data.
        </li>
        <li>
          <strong>Legitimate interests (Art. 6(1)(f)):</strong> Analytics, security monitoring, and
          service improvement, subject to your right to object.
        </li>
        <li>
          <strong>Legal obligation (Art. 6(1)(c)):</strong> Retaining records as required by UAE
          law.
        </li>
      </ul>

      <h2>4. Data Sharing and Disclosure</h2>
      <p>We do not sell your personal data. We share information only with:</p>
      <ul>
        <li>
          <strong>Assigned legal partners:</strong> When an admin assigns your case to a partner,
          that partner can see your case details, documents, and AI analysis. Partners are bound by
          confidentiality obligations.
        </li>
        <li>
          <strong>Service providers:</strong> Supabase (database, auth, storage, edge functions),
          Stripe (payment processing), OpenAI (AI case analysis), and Resend (transactional email).
          Each provider processes data on our behalf under a Data Processing Agreement (DPA).
        </li>
        <li>
          <strong>Law enforcement:</strong> Only when required by UAE law or a valid court order. We
          will notify you unless legally prohibited.
        </li>
      </ul>

      <h2>5. International Data Transfers</h2>
      <p>
        Your data is stored in Supabase&apos;s infrastructure. Our primary database is hosted in the
        Asia-Pacific region (Seoul). The following international transfers may occur:
      </p>
      <ul>
        <li>
          <strong>OpenAI (United States):</strong> Case type and description (text only — not
          uploaded documents) are sent to OpenAI for AI analysis. OpenAI is certified under the
          EU-US Data Privacy Framework.
        </li>
        <li>
          <strong>Stripe (United States / Ireland):</strong> Payment metadata (case ID, amount).
          Card details never touch our servers.
        </li>
        <li>
          <strong>Resend (United States):</strong> Email address and email content for transactional
          emails.
        </li>
      </ul>
      <p>
        All transfers are made with appropriate safeguards as required by UAE PDPL Article 22 and
        GDPR Chapter V.
      </p>

      <h2>6. Data Retention</h2>
      <table className="legal-table">
        <thead>
          <tr>
            <th>Data Type</th>
            <th>Retention Period</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Account data (profile, email)</td>
            <td>Until account deletion is requested</td>
          </tr>
          <tr>
            <td>Case data (title, description, AI analysis)</td>
            <td>Until case is deleted or account is deleted</td>
          </tr>
          <tr>
            <td>Uploaded documents</td>
            <td>Until case is deleted or account is deleted</td>
          </tr>
          <tr>
            <td>Payment records</td>
            <td>7 years (UAE tax record-keeping requirement)</td>
          </tr>
          <tr>
            <td>Server logs</td>
            <td>30 days</td>
          </tr>
          <tr>
            <td>Analytics data</td>
            <td>24 months (aggregated and anonymized)</td>
          </tr>
        </tbody>
      </table>

      <h2>7. Your Rights</h2>
      <p>Under UAE PDPL and GDPR, you have the following rights:</p>
      <ul>
        <li>
          <strong>Right of access:</strong> Request a copy of your personal data (export available
          in Settings → Download My Data).
        </li>
        <li>
          <strong>Right to rectification:</strong> Correct inaccurate or incomplete data (edit your
          profile at any time).
        </li>
        <li>
          <strong>Right to erasure (&quot;right to be forgotten&quot;):</strong> Request deletion of
          your account and all associated data (Settings → Danger Zone → Delete Account). Payment
          records are retained for 7 years as required by UAE tax law.
        </li>
        <li>
          <strong>Right to restrict processing:</strong> Request that we limit processing of your
          data pending verification of accuracy.
        </li>
        <li>
          <strong>Right to data portability:</strong> Receive your data in a structured,
          machine-readable format.
        </li>
        <li>
          <strong>Right to object:</strong> Object to processing based on legitimate interests
          (e.g., analytics).
        </li>
        <li>
          <strong>Right to withdraw consent:</strong> Withdraw consent for processing sensitive data
          at any time. This may prevent us from providing the AI analysis service.
        </li>
      </ul>
      <p>
        To exercise any of these rights, email{' '}
        <a href="mailto:privacy@resolveuae.com" className="text-gold-400 hover:text-gold-300">
          privacy@resolveuae.com
        </a>
        . We will respond within 30 days (UAE PDPL) or 1 month (GDPR).
      </p>

      <h2>8. Data Security</h2>
      <ul>
        <li>
          <strong>Encryption in transit:</strong> All data is transmitted over HTTPS/TLS 1.2+.
        </li>
        <li>
          <strong>Encryption at rest:</strong> Database and storage are encrypted by Supabase
          (AES-256).
        </li>
        <li>
          <strong>Row-level security:</strong> Database policies ensure users can only access their
          own data. Admins and assigned partners have scoped access.
        </li>
        <li>
          <strong>Access controls:</strong> Service-role keys are never exposed to the client. Edge
          functions validate JWT ownership before any privileged operation.
        </li>
        <li>
          <strong>Document storage:</strong> Uploaded files are stored in a private Supabase Storage
          bucket with MIME-type validation and a 50MB size limit.
        </li>
      </ul>

      <h2>9. Children&apos;s Privacy</h2>
      <p>
        Our service is not directed to individuals under 18. We do not knowingly collect personal
        data from children. If you believe a child has provided us with personal data, please
        contact us and we will delete it promptly.
      </p>

      <h2>10. Changes to This Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. We will notify you by email of any
        material changes at least 30 days before they take effect. The &quot;Last updated&quot; date
        at the top of this page reflects the most recent revision.
      </p>

      <h2>11. Contact Us</h2>
      <p>
        If you have questions about this Privacy Policy or wish to exercise your data protection
        rights, contact our Data Protection Officer:
      </p>
      <p>
        <strong>Email:</strong>{' '}
        <a href="mailto:privacy@resolveuae.com" className="text-gold-400 hover:text-gold-300">
          privacy@resolveuae.com
        </a>
        <br />
        <strong>Subject:</strong> Data Protection Inquiry — ResolveUAE
      </p>
    </LegalPageLayout>
  )
}

export default PrivacyPolicyPage
