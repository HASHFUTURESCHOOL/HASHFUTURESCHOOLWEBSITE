/**
 * Email provider abstraction.
 *
 * Defaults to Resend (a single HTTP call, no SMTP/serverless friction). To switch
 * providers, implement the same `sendEmail` contract: `{ to, subject, html, text }`
 * and return the provider's response. Everything else in the codebase only talks
 * to this module, so swapping providers is a one-file change.
 */

const RESEND_URL = 'https://api.resend.com/emails';

function sender() {
  return process.env.NEWSLETTER_FROM || 'Hash Future School <newsletter@hashfuture.school>';
}

/**
 * Send a single email.
 * @param {{to: string, subject: string, html?: string, text?: string, replyTo?: string}} opts
 * @returns {Promise<{id: string}>}
 */
export async function sendEmail({ to, subject, html, text, replyTo }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error(
      'RESEND_API_KEY is not set. Add it to your env to enable newsletter delivery.'
    );
  }

  const payload = {
    from: sender(),
    to,
    subject,
    ...(html ? { html } : {}),
    ...(text ? { text } : {}),
    ...(replyTo ? { reply_to: replyTo } : {}),
  };

  const res = await fetch(RESEND_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || `Email provider error (${res.status})`);
    err.status = res.status;
    throw err;
  }

  return { id: data.id };
}
