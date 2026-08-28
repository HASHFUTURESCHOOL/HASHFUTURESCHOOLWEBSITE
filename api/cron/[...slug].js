import { getSql } from '../../lib/db.js';
import { send, bad, serverError } from '../../lib/http.js';
import { generateAndSaveDraft, weeklyTopicIndex } from '../../lib/blog-generator.js';
import { sendWeeklyNewsletter } from '../../lib/newsletter.js';

// One consolidated serverless function for all /api/cron/* routes.
export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return bad(res, 'Method not allowed', 405);
  }

  // When CRON_SECRET is set, require it (Vercel sends it as a bearer token).
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = String(req.headers.authorization || '');
    if (auth !== `Bearer ${cronSecret}`) {
      return bad(res, 'Unauthorized', 401);
    }
  }

  const slug = Array.isArray(req.query.slug) ? req.query.slug : [];
  const [action] = slug;

  if (action === 'generate-blog') {
    try {
      const sql = getSql();
      const post = await generateAndSaveDraft({ sql, topicIndex: weeklyTopicIndex() });
      return send(res, 200, {
        ok: true,
        generated: true,
        post: {
          id: post.id,
          title: post.title,
          slug: post.slug,
          category: post.category,
          published: post.published,
          source: post.source,
        },
      });
    } catch (err) {
      return serverError(res, err);
    }
  }

  if (action === 'send-newsletter') {
    if (!process.env.RESEND_API_KEY) {
      return bad(res, 'Email provider is not configured. Set RESEND_API_KEY before the cron can deliver.', 503);
    }

    try {
      const sql = getSql();

      // Avoid double-firing if Vercel retries a cron run within a day.
      const recent = await sql`
        SELECT id FROM newsletter_campaigns
        WHERE trigger = 'cron'
          AND status IN ('sending', 'sent')
          AND created_at > now() - interval '25 hours'
        LIMIT 1
      `;
      if (recent.length) {
        return send(res, 200, {
          ok: true,
          skipped: true,
          reason: 'A recent weekly newsletter run already handled this cycle.',
          campaignId: recent[0].id,
        });
      }

      const result = await sendWeeklyNewsletter({ sql, trigger: 'cron' });
      return send(res, 200, { ok: true, campaign: result });
    } catch (err) {
      return serverError(res, err);
    }
  }

  return bad(res, 'Unknown cron action', 404);
}
