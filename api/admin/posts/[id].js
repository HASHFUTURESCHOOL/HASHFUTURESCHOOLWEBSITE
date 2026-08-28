import { getSql } from '../../../lib/db.js';
import { readBody, ok, bad, unauthorized, notFound, serverError } from '../../../lib/http.js';
import { requireAdmin } from '../../../lib/auth.js';

export default async function handler(req, res) {
  const admin = await requireAdmin(req, res);
  if (!admin) return unauthorized(res);

  const sql = getSql();
  const id = Number(req.query.id);
  if (!Number.isInteger(id) || id <= 0) {
    return bad(res, 'Invalid post id');
  }

  if (req.method === 'GET') {
    try {
      const rows = await sql`SELECT * FROM posts WHERE id = ${id} LIMIT 1`;
      if (!rows.length) return notFound(res, 'Post not found');
      return ok(res, { post: rows[0] });
    } catch (err) {
      return serverError(res, err);
    }
  }

  if (req.method === 'PUT') {
    const body = await readBody(req);
    const title = String(body.title || '').trim();
    const bodyText = String(body.body || '').trim();
    if (!title || !bodyText) {
      return bad(res, 'Title and body are required');
    }

    const slug = String(body.slug || '').trim();
    const excerpt = String(body.excerpt || '').trim() || null;
    const category = String(body.category || '').trim() || null;
    const coverImage = String(body.cover_image || body.coverImage || '').trim() || null;
    const author = String(body.author || '').trim() || 'Hash Future School';
    const published = Boolean(body.published);

    try {
      const rows = await sql`
        UPDATE posts
        SET title = ${title},
            slug = ${slug},
            excerpt = ${excerpt},
            category = ${category},
            cover_image = ${coverImage},
            body = ${bodyText},
            author = ${author},
            published = ${published},
            updated_at = now(),
            published_at = ${published ? new Date().toISOString() : null}
        WHERE id = ${id}
        RETURNING id, title, slug, published, published_at, updated_at
      `;
      if (!rows.length) return notFound(res, 'Post not found');
      return ok(res, { post: rows[0], updated: true });
    } catch (err) {
      return serverError(res, err);
    }
  }

  if (req.method === 'DELETE') {
    try {
      const rows = await sql`DELETE FROM posts WHERE id = ${id} RETURNING id`;
      if (!rows.length) return notFound(res, 'Post not found');
      return ok(res, { deleted: true });
    } catch (err) {
      return serverError(res, err);
    }
  }

  return bad(res, 'Method not allowed', 405);
}
