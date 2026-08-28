import { getSql } from '../../lib/db.js';
import { ok, bad, notFound, serverError } from '../../lib/http.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return bad(res, 'Method not allowed', 405);
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const slug = url.searchParams.get('slug');
  const category = url.searchParams.get('category');

  try {
    const sql = getSql();

    if (slug) {
      const rows = await sql`
        SELECT * FROM posts
        WHERE slug = ${slug} AND published = true
        LIMIT 1
      `;
      if (!rows.length) return notFound(res, 'Post not found');
      return ok(res, { post: rows[0] });
    }

    let rows;
    if (category) {
      rows = await sql`
        SELECT id, title, slug, excerpt, category, cover_image, author, published_at
        FROM posts
        WHERE published = true AND category = ${category}
        ORDER BY published_at DESC
      `;
    } else {
      rows = await sql`
        SELECT id, title, slug, excerpt, category, cover_image, author, published_at
        FROM posts
        WHERE published = true
        ORDER BY published_at DESC
      `;
    }

    return ok(res, { posts: rows });
  } catch (err) {
    return serverError(res, err);
  }
}
