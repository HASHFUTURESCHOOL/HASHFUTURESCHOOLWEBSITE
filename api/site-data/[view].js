/**
 * Public read-only site data — one function for the two endpoints that serve it.
 *
 *   GET /api/site-data/content  ← /api/content   (editable homepage snippets)
 *   GET /api/posts              ← /api/site-data/posts (blog list and single posts)
 *
 * Both used to be separate files. This project sits at Vercel's limit of 12
 * serverless functions, so they were merged; `rewrites` in vercel.json keep the
 * old URLs working, which is why no page or link had to change.
 *
 * Both are also cached at the edge now. They are read-only public data, and the
 * uncached version cost every visitor a function invocation plus a database round
 * trip (measured: ~354ms versus ~135ms when the edge answers).
 */

import { getSql } from '../../lib/db.js';
import { ok, bad, notFound, serverError } from '../../lib/http.js';

// Blog content changes deliberately and rarely; site snippets are edited in the
// CMS, so they get a shorter window. `stale-while-revalidate` means a visitor
// never waits for the refresh.
const CACHE = {
  posts: 'public, s-maxage=300, stale-while-revalidate=600',
  content: 'public, s-maxage=60, stale-while-revalidate=300',
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return bad(res, 'Method not allowed', 405);
  }

  const view = Array.isArray(req.query?.view) ? req.query.view[0] : req.query?.view;

  if (view === 'posts') return posts(req, res);
  if (view === 'content') return content(req, res);
  return notFound(res, 'Unknown view');
}

/** The blog: a list, a category, or one post by slug. */
async function posts(req, res) {
  const url = new URL(req.url, `http://${req.headers?.host || 'localhost'}`);
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
      return ok(res, { post: rows[0] }, { cacheControl: CACHE.posts });
    }

    const rows = category
      ? await sql`
          SELECT id, title, slug, excerpt, category, cover_image, author, published_at
          FROM posts
          WHERE published = true AND category = ${category}
          ORDER BY published_at DESC
        `
      : await sql`
          SELECT id, title, slug, excerpt, category, cover_image, author, published_at
          FROM posts
          WHERE published = true
          ORDER BY published_at DESC
        `;

    return ok(res, { posts: rows }, { cacheControl: CACHE.posts });
  } catch (err) {
    return serverError(res, err);
  }
}

/** Editable text snippets used across the site. */
async function content(req, res) {
  try {
    const sql = getSql();
    const rows = await sql`SELECT key, value FROM site_content`;
    const snippets = {};
    for (const row of rows) {
      snippets[row.key] = row.value;
    }
    return ok(res, { content: snippets }, { cacheControl: CACHE.content });
  } catch (err) {
    return serverError(res, err);
  }
}
