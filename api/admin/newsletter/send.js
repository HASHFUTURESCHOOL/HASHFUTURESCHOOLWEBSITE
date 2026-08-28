import { getSql } from '../../../lib/db.js';
import { ok, bad, unauthorized, serverError } from '../../../lib/http.js';
import { requireAdmin } from '../../../lib/auth.js';
import { sendWeeklyNewsletter } from '../../../lib/newsletter.js';

export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  const admin = await requireAdmin(req, res);
  if (!admin) return unauthorized(res);

  if (req.method !== 'POST') {
    return bad(res, 'Method not allowed', 405);
  }

  if (!process.env.RESEND_API_KEY) {
    return bad(res, 'Email provider is not configured. Set RESEND_API_KEY before sending.', 503);
  }

  try {
    const sql = getSql();
    const result = await sendWeeklyNewsletter({ sql, trigger: 'manual' });
    return ok(res, { campaign: result });
  } catch (err) {
    return serverError(res, err);
  }
}
