import { getSql } from '../../../lib/db.js';
import { readBody, ok, bad, unauthorized, serverError } from '../../../lib/http.js';
import { requireAdmin } from '../../../lib/auth.js';
import { slugify } from '../../../lib/slug.js';

export default async function handler(req, res) {
  const admin = await requireAdmin(req, res);
  if (!admin) return unauthorized(res);

  const sql = getSql();

  if (req.method === 'GET') {
    try {
      const rows = await sql`
        SELECT id, title, slug, excerpt, category, cover_image, author, published, published_at, updated_at
        FROM posts
        ORDER BY updated_at DESC
      `;
      return ok(res, { posts: rows });
    } catch (err) {
      return serverError(res, err);
    }
  }

  if (req.method === 'POST') {
    const body = await readBody(req);
    const title = String(body.title || '').trim();
    const bodyText = String(body.body || '').trim();

    if (!title || !bodyText) {
      return bad(res, 'Title and body are required');
    }

    const slug = String(body.slug || '').trim() || slugify(title);
    const excerpt = String(body.excerpt || '').trim() || null;
    const category = String(body.category || '').trim() || null;
    const coverImage = String(body.cover_image || body.coverImage || '').trim() || null;
    const author = String(body.author || '').trim() || 'Hash Future School';
    const published = Boolean(body.published);

    try {
      const rows = await sql`
        INSERT INTO posts
          (title, slug, excerpt, category, cover_image, body, author, published, published_at)
        VALUES
          (${title}, ${slug}, ${excerpt}, ${category}, ${coverImage}, ${bodyText}, ${author}, ${published}, ${published ? new Date().toISOString() : null})
        RETURNING id, title, slug, published, published_at
      `;
      return ok(res, { post: rows[0], created: true });
    } catch (err) {
      if (err?.code === '23505') {
        return bad(res, 'A post with this slug already exists', 409);
      }
      return serverError(res, err);
    }
  }

  return bad(res, 'Method not allowed', 405);
}
