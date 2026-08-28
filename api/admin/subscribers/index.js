import { getSql } from '../../../lib/db.js';
import { ok, bad, unauthorized, serverError } from '../../../lib/http.js';
import { requireAdmin } from '../../../lib/auth.js';

export default async function handler(req, res) {
  const admin = await requireAdmin(req, res);
  if (!admin) return unauthorized(res);

  if (req.method !== 'GET') {
    return bad(res, 'Method not allowed', 405);
  }

  try {
    const sql = getSql();
    const rows = await sql`
      SELECT id, email, name, status, subscribed_at, unsubscribed_at
      FROM newsletter_subscribers
      ORDER BY subscribed_at DESC
    `;
    return ok(res, { subscribers: rows });
  } catch (err) {
    return serverError(res, err);
  }
}
