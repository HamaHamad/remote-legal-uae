// src/pages/CookiePolicyPage.jsx
import { LegalPageLayout } from '@/components/LegalPageLayout'

export function CookiePolicyPage() {
  return (
    <LegalPageLayout title="Cookie Policy" lastUpdated="July 2026">
      <p className="text-[var(--text-secondary)] mb-6">
        This Cookie Policy explains how ResolveUAE uses cookies and similar technologies. We are
        committed to transparency and comply with the <strong>ePrivacy Directive</strong> and{' '}
        <strong>GDPR</strong> requirements for consent.
      </p>

      <h2>1. What Are Cookies?</h2>
      <p>
        Cookies are small text files placed on your device when you visit a website. They allow the
        site to remember your actions and preferences over time. We use cookies and similar
        technologies (localStorage, sessionStorage) to provide essential functionality.
      </p>

      <h2>2. Types of Cookies We Use</h2>

      <h3>2.1 Essential Cookies (No Consent Required)</h3>
      <p>
        These cookies are strictly necessary for the Service to function. Without them, you cannot
        log in, maintain a session, or use the platform.
      </p>
      <table className="legal-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Purpose</th>
            <th>Duration</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>rlco-session-v2</code>
            </td>
            <td>Supabase authentication session token</td>
            <td>7 days (session)</td>
          </tr>
          <tr>
            <td>
              <code>rlco-lang</code>
            </td>
            <td>Your selected interface language</td>
            <td>1 year (persistent)</td>
          </tr>
        </tbody>
      </table>

      <h3>2.2 Functional Storage (No Consent Required)</h3>
      <p>
        These are stored in <code>localStorage</code> (not cookies) and are essential for
        functionality:
      </p>
      <table className="legal-table">
        <thead>
          <tr>
            <th>Key</th>
            <th>Purpose</th>
            <th>Duration</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>rlco-auth-token</code>
            </td>
            <td>Supabase auth token (refresh)</td>
            <td>Until sign-out</td>
          </tr>
          <tr>
            <td>
              <code>i18nextLng</code>
            </td>
            <td>Selected language preference</td>
            <td>Persistent</td>
          </tr>
        </tbody>
      </table>

      <h3>2.3 Analytics (Consent Required — Cookie-Free)</h3>
      <p>
        We use <strong>Plausible Analytics</strong>, which is privacy-first and{' '}
        <strong>does not use cookies</strong>. It collects aggregated, anonymized page-view data
        using a single non-identifying request per page load. No cross-site tracking, no
        fingerprinting, no personal data is collected. Under GDPR, Plausible does not require cookie
        consent because it does not store any personally identifiable information.
      </p>

      <h3>2.4 Third-Party Services</h3>
      <p>When you interact with certain features, third-party services may set cookies:</p>
      <ul>
        <li>
          <strong>Stripe:</strong> When processing a payment, Stripe may set cookies for fraud
          prevention. See{' '}
          <a
            href="https://stripe.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold-400 hover:text-gold-300"
          >
            Stripe&apos;s Privacy Policy
          </a>
          .
        </li>
        <li>
          <strong>Google Fonts:</strong> Our typography uses Google Fonts. Google may set cookies
          when fonts are loaded. See{' '}
          <a
            href="https://policies.google.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold-400 hover:text-gold-300"
          >
            Google&apos;s Privacy Policy
          </a>
          .
        </li>
      </ul>

      <h2>3. Managing Cookies</h2>
      <h3>3.1 In Your Browser</h3>
      <p>
        You can control and delete cookies through your browser settings. Note that blocking
        essential cookies will prevent you from logging in or using the Service.
      </p>
      <ul>
        <li>
          <strong>Chrome:</strong> Settings → Privacy and security → Cookies and other site data
        </li>
        <li>
          <strong>Firefox:</strong> Settings → Privacy &amp; Security → Cookies and Site Data
        </li>
        <li>
          <strong>Safari:</strong> Preferences → Privacy → Cookies and website data
        </li>
        <li>
          <strong>Edge:</strong> Settings → Cookies and site permissions
        </li>
      </ul>

      <h3>3.2 Clearing Your Data</h3>
      <p>To clear all ResolveUAE data from your browser:</p>
      <ol>
        <li>Sign out of your account (Settings → Sign Out of All Devices).</li>
        <li>
          Open your browser&apos;s developer tools (F12) → Application → Local Storage → remove all{' '}
          <code>rlco-*</code> entries.
        </li>
        <li>
          Clear cookies for <code>remote-legal-uae.vercel.app</code> in browser settings.
        </li>
      </ol>

      <h2>4. Do Not Track (DNT)</h2>
      <p>
        We respect Do Not Track signals. If your browser sends a DNT header, Plausible Analytics
        will not count your page views. Essential cookies (auth session, language) are still set
        because they are strictly necessary for the Service to function.
      </p>

      <h2>5. Cookie-Free Alternative</h2>
      <p>If you prefer not to have any cookies set, you can:</p>
      <ul>
        <li>
          Use the Service in a private/incognito window. Essential cookies will be set during your
          session and deleted when you close the window.
        </li>
        <li>
          Block all third-party cookies in your browser settings. This will not affect our core
          functionality.
        </li>
      </ul>

      <h2>6. Updates to This Policy</h2>
      <p>
        We may update this Cookie Policy when we add new features or change our cookie usage. The
        &quot;Last updated&quot; date at the top of this page reflects the most recent revision.
      </p>

      <h2>7. Contact</h2>
      <p>
        For questions about our cookie usage, contact{' '}
        <a href="mailto:privacy@resolveuae.com" className="text-gold-400 hover:text-gold-300">
          privacy@resolveuae.com
        </a>
        .
      </p>
    </LegalPageLayout>
  )
}

export default CookiePolicyPage
