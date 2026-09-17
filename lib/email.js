/**
 * Email provider abstraction.
 *
 * Sends through Mailgun, on the same verified domain the Future Assist platform
 * already uses for its own mail (support.hashfuture.school). Everything else in
 * the codebase only talks to this module, so swapping providers is a one-file
 * change: implement the same `sendEmail` contract — `{ to, subject, html, text,
 * replyTo }` — and return the provider's response.
 *
 * Environment:
 *   MAILGUN_API_KEY  required — Mailgun dashboard → Settings → API keys.
 *   MAILGUN_DOMAIN   optional — defaults to support.hashfuture.school.
 *   MAILGUN_REGION   optional — "us" (default) or "eu".
 *   MAILGUN_FROM     optional — defaults to
 *                    "Hash Future School <noreply@support.hashfuture.school>".
 *
 * The From address has to sit on a domain verified in Mailgun, which is why it
 * is on the support subdomain rather than @hashfuture.school. A send that fails
 * throws instead of logging quietly, because /api/join reports the outcome back
 * to the caller as `emailed`.
 */

/** Is an email provider configured? Used by the newsletter cron and admin UI. */
export function emailConfigured() {
  return Boolean(process.env.MAILGUN_API_KEY);
}

function sender() {
  return (
    process.env.MAILGUN_FROM ||
    process.env.EMAIL_FROM ||
    'Hash Future School <noreply@support.hashfuture.school>'
  );
}

function messagesEndpoint() {
  const region = (process.env.MAILGUN_REGION || 'us').toLowerCase();
  const host = region === 'eu' ? 'api.eu.mailgun.net' : 'api.mailgun.net';
  const domain = process.env.MAILGUN_DOMAIN || 'support.hashfuture.school';
  return `https://${host}/v3/${domain}/messages`;
}

/**
 * Send a single email.
 * @param {{to: string, subject: string, html?: string, text?: string, replyTo?: string}} opts
 * @returns {Promise<{id: string}>}
 */
export async function sendEmail({ to, subject, html, text, replyTo }) {
  const apiKey = process.env.MAILGUN_API_KEY;
  if (!apiKey) {
    throw new Error(
      'MAILGUN_API_KEY is not set. Add it to the environment to enable email.'
    );
  }

  // Callers may pass one address or a list — the team notification passes a list.
  const recipients = (Array.isArray(to) ? to : [to])
    .map((value) => String(value || '').trim())
    .filter(Boolean)
    .join(',');

  if (!recipients) {
    throw new Error('sendEmail: at least one recipient is required');
  }

  const params = new URLSearchParams();
  params.append('from', sender());
  params.append('to', recipients);
  params.append('subject', subject);
  if (html) params.append('html', html);
  if (text) params.append('text', text);
  // Mailgun takes reply-to as a header hint rather than a first-class field.
  if (replyTo) params.append('h:Reply-To', replyTo);

  const res = await fetch(messagesEndpoint(), {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`api:${apiKey}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || `Mailgun returned ${res.status}`);
    err.status = res.status;
    throw err;
  }

  return { id: data.id || null };
}
