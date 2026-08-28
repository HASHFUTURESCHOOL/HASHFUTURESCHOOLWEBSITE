import { getSql } from '../../lib/db.js';
import { generateAndSaveDraft } from '../../lib/blog-generator.js';
import { readBody, ok, bad, unauthorized, serverError } from '../../lib/http.js';
import { requireAdmin } from '../../lib/auth.js';

/**
 * Manually trigger an AI blog draft from the admin panel.
 * Accepts an optional { topicIndex } to pick a specific topic (otherwise random).
 */
export default async function handler(req, res) {
  const admin = await requireAdmin(req, res);
  if (!admin) return unauthorized(res);

  if (req.method !== 'POST') {
    return bad(res, 'Method not allowed', 405);
  }

  try {
    const body = await readBody(req);
    const topicIndex =
      Number.isInteger(Number(body.topicIndex)) && Number(body.topicIndex) >= 0
        ? Number(body.topicIndex)
        : undefined;

    const sql = getSql();
    const post = await generateAndSaveDraft({ sql, topicIndex });
    return ok(res, {
      generated: true,
      post: {
        id: post.id,
        title: post.title,
        slug: post.slug,
        category: post.category,
        author: post.author,
        published: post.published,
        source: post.source,
      },
    });
  } catch (err) {
    return serverError(res, err);
  }
}
