import { getSql } from '../../lib/db.js';
import { generateAndSaveDraft, weeklyTopicIndex } from '../../lib/blog-generator.js';
import { send, bad, serverError } from '../../lib/http.js';

/**
 * Vercel Cron Job: generate a fresh AI blog draft each week.
 * Always creates a draft (published=false) so a human must approve it before
 * it appears on the public blog.
 */
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
