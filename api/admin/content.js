import { getSql } from '../../lib/db.js';
import { readBody, ok, bad, unauthorized, serverError } from '../../lib/http.js';
import { requireAdmin } from '../../lib/auth.js';

export default async function handler(req, res) {
  const admin = await requireAdmin(req, res);
  if (!admin) return unauthorized(res);

  const sql = getSql();

  if (req.method === 'GET') {
    try {
      const rows = await sql`SELECT key, value, section FROM site_content ORDER BY key`;
      return ok(res, { items: rows });
    } catch (err) {
      return serverError(res, err);
    }
  }

  if (req.method === 'PUT') {
    const body = await readBody(req);
    const updates = body.entries;
    if (!Array.isArray(updates) || updates.length === 0) {
      return bad(res, 'Provide an array of entries: [{ key, value }]');
    }
    try {
      for (const entry of updates) {
        const key = String(entry.key || '').trim();
        if (!key) continue;
        await sql`
          INSERT INTO site_content (key, value, section)
          VALUES (${key}, ${String(entry.value ?? '')}, ${String(entry.section || 'general')})
          ON CONFLICT (key) DO UPDATE
            SET value = EXCLUDED.value,
                section = EXCLUDED.section,
                updated_at = now()
        `;
      }
      return ok(res, { saved: true });
    } catch (err) {
      return serverError(res, err);
    }
  }

  return bad(res, 'Method not allowed', 405);
}
