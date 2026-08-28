import { getSql } from '../lib/db.js';
import { readBody, ok, bad, serverError } from '../lib/http.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return bad(res, 'Method not allowed', 405);
  }

  const body = await readBody(req);

  const email = String(body.email || '').trim().toLowerCase();
  const name = String(body.name || '').trim() || null;

  if (!email || !EMAIL_RE.test(email)) {
    return bad(res, 'A valid email address is required');
  }

  try {
    const sql = getSql();
    await sql`
      INSERT INTO newsletter_subscribers (email, name)
      VALUES (${email}, ${name})
      ON CONFLICT (email) DO UPDATE
        SET name = COALESCE(EXCLUDED.name, newsletter_subscribers.name),
            status = 'active',
            unsubscribed_at = NULL
    `;
    return ok(res, { subscribed: true });
  } catch (err) {
    return serverError(res, err);
  }
}
