import { getSql } from '../lib/db.js';
import { ok, bad, serverError } from '../lib/http.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return bad(res, 'Method not allowed', 405);
  }

  try {
    const sql = getSql();
    const rows = await sql`SELECT key, value FROM site_content`;
    const content = {};
    for (const row of rows) {
      content[row.key] = row.value;
    }
    return ok(res, { content });
  } catch (err) {
    return serverError(res, err);
  }
}
