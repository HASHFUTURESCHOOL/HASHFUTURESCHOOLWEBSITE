import { getSql } from '../../../lib/db.js';
import { readBody, ok, bad, unauthorized, serverError } from '../../../lib/http.js';
import { requireAdmin } from '../../../lib/auth.js';
import { getNewsletterContent, updateNewsletterContent, listNewsletterCampaigns } from '../../../lib/newsletter.js';

export default async function handler(req, res) {
  const admin = await requireAdmin(req, res);
  if (!admin) return unauthorized(res);

  const sql = getSql();

  if (req.method === 'GET') {
    try {
      const [content, campaigns, active] = await Promise.all([
        getNewsletterContent(sql),
        listNewsletterCampaigns(sql, 25),
        sql`SELECT count(*)::int AS count FROM newsletter_subscribers WHERE status = 'active'`,
      ]);
      return ok(res, {
        content,
        campaigns,
        stats: { activeSubscribers: active[0].count },
        hasProvider: Boolean(process.env.RESEND_API_KEY),
      });
    } catch (err) {
      return serverError(res, err);
    }
  }

  if (req.method === 'PUT') {
    const body = await readBody(req);
    if (!body.subject || !String(body.subject).trim()) {
      return bad(res, 'Subject is required');
    }
    try {
      const content = await updateNewsletterContent(sql, {
        subject: body.subject,
        body: body.body,
      });
      return ok(res, { content });
    } catch (err) {
      return serverError(res, err);
    }
  }

  return bad(res, 'Method not allowed', 405);
}
