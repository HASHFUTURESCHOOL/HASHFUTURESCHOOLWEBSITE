import { getSql } from '../lib/db.js';
import { readBody, ok, bad, serverError } from '../lib/http.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return bad(res, 'Method not allowed', 405);
  }

  const body = await readBody(req);

  const email = String(body.email || '').trim().toLowerCase();
  if (!email || !EMAIL_RE.test(email)) {
    return bad(res, 'A valid email address is required');
  }

  try {
    const sql = getSql();
    const result = await sql`
      UPDATE newsletter_subscribers
      SET status = 'unsubscribed', unsubscribed_at = now()
      WHERE email = ${email}
      RETURNING id
    `;
    return ok(res, { unsubscribed: true, updated: result.length });
  } catch (err) {
    return serverError(res, err);
  }
}
