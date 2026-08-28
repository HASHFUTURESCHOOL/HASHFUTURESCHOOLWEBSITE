import { getSql } from '../../../lib/db.js';
import { readBody, ok, bad, unauthorized, notFound, serverError } from '../../../lib/http.js';
import { requireAdmin } from '../../../lib/auth.js';

export default async function handler(req, res) {
  const admin = await requireAdmin(req, res);
  if (!admin) return unauthorized(res);

  const sql = getSql();
  const id = Number(req.query.id);
  if (!Number.isInteger(id) || id <= 0) {
    return bad(res, 'Invalid subscriber id');
  }

  if (req.method === 'PATCH') {
    const body = await readBody(req);
    if (body.status !== 'active' && body.status !== 'unsubscribed') {
      return bad(res, 'Status must be "active" or "unsubscribed"');
    }
    try {
      const rows = await sql`
        UPDATE newsletter_subscribers
        SET status = ${body.status},
            unsubscribed_at = CASE WHEN ${body.status === 'unsubscribed'} THEN COALESCE(unsubscribed_at, now()) ELSE NULL END
        WHERE id = ${id}
        RETURNING id, email, name, status
      `;
      if (!rows.length) return notFound(res, 'Subscriber not found');
      return ok(res, { subscriber: rows[0], updated: true });
    } catch (err) {
      return serverError(res, err);
    }
  }

  if (req.method === 'DELETE') {
    try {
      const rows = await sql`DELETE FROM newsletter_subscribers WHERE id = ${id} RETURNING id`;
      if (!rows.length) return notFound(res, 'Subscriber not found');
      return ok(res, { deleted: true });
    } catch (err) {
      return serverError(res, err);
    }
  }

  return bad(res, 'Method not allowed', 405);
}
