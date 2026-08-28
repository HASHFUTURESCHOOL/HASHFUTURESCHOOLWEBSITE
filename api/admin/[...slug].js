import { getSql } from '../../lib/db.js';
import { readBody, ok, bad, unauthorized, notFound, serverError } from '../../lib/http.js';
import { requireAdmin } from '../../lib/auth.js';
import { slugify } from '../../lib/slug.js';
import { generateAndSaveDraft } from '../../lib/blog-generator.js';
import {
  getNewsletterContent,
  updateNewsletterContent,
  listNewsletterCampaigns,
  sendWeeklyNewsletter,
} from '../../lib/newsletter.js';

// One consolidated serverless function for all /api/admin/* routes.
export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  const admin = await requireAdmin(req, res);
  if (!admin) return unauthorized(res);

  const slug = Array.isArray(req.query.slug) ? req.query.slug : [];
  const [seg0, seg1] = slug;

  try {
    const sql = getSql();

    if (seg0 === 'posts' && !seg1) return postsCollection(req, res, sql);
    if (seg0 === 'posts') return postItem(req, res, sql, seg1);
    if (seg0 === 'subscribers' && !seg1) return subscribersCollection(req, res, sql);
    if (seg0 === 'subscribers') return subscriberItem(req, res, sql, seg1);
    if (seg0 === 'content' && !seg1) return contentRoute(req, res, sql);
    if (seg0 === 'generate' && !seg1) return generateRoute(req, res, sql);
    if (seg0 === 'newsletter' && seg1 === 'send') return newsletterSend(req, res, sql);
    if (seg0 === 'newsletter' && !seg1) return newsletterRoute(req, res, sql);

    return bad(res, 'Unknown admin route', 404);
  } catch (err) {
    return serverError(res, err);
  }
}

async function postsCollection(req, res, sql) {
  if (req.method === 'GET') {
    try {
      const rows = await sql`
        SELECT id, title, slug, excerpt, category, cover_image, author, published, source, published_at, updated_at
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

async function postItem(req, res, sql, idRaw) {
  const id = Number(idRaw);
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

async function subscribersCollection(req, res, sql) {
  if (req.method !== 'GET') {
    return bad(res, 'Method not allowed', 405);
  }

  try {
    const rows = await sql`
      SELECT id, email, name, status, subscribed_at, unsubscribed_at
      FROM newsletter_subscribers
      ORDER BY subscribed_at DESC
    `;
    return ok(res, { subscribers: rows });
  } catch (err) {
    return serverError(res, err);
  }
}

async function subscriberItem(req, res, sql, idRaw) {
  const id = Number(idRaw);
  if (!Number.isInteger(id) || id <= 0) {
    return bad(res, 'Invalid subscriber id');
  }

  if (req.method === 'PATCH') {
    const body = await readBody(req);
    if (body.status !== 'active' && body.status !== 'unsubscribed') {
      return bad(res, 'Status must be "active" or "unsubscribed"');
    }
    try {
      const rows = await sql`
        UPDATE newsletter_subscribers
        SET status = ${body.status},
            unsubscribed_at = CASE WHEN ${body.status === 'unsubscribed'} THEN COALESCE(unsubscribed_at, now()) ELSE NULL END
        WHERE id = ${id}
        RETURNING id, email, name, status
      `;
      if (!rows.length) return notFound(res, 'Subscriber not found');
      return ok(res, { subscriber: rows[0], updated: true });
    } catch (err) {
      return serverError(res, err);
    }
  }

  if (req.method === 'DELETE') {
    try {
      const rows = await sql`DELETE FROM newsletter_subscribers WHERE id = ${id} RETURNING id`;
      if (!rows.length) return notFound(res, 'Subscriber not found');
      return ok(res, { deleted: true });
    } catch (err) {
      return serverError(res, err);
    }
  }

  return bad(res, 'Method not allowed', 405);
}

async function contentRoute(req, res, sql) {
  if (req.method === 'GET') {
    try {
      const rows = await sql`SELECT key, value, section FROM site_content ORDER BY key`;
      return ok(res, { items: rows });
    } catch (err) {
      return serverError(res, err);
    }
  }

  if (req.method === 'PUT') {
    const body = await readBody(req);
    const updates = body.entries;
    if (!Array.isArray(updates) || updates.length === 0) {
      return bad(res, 'Provide an array of entries: [{ key, value }]');
    }
    try {
      for (const entry of updates) {
        const key = String(entry.key || '').trim();
        if (!key) continue;
        await sql`
          INSERT INTO site_content (key, value, section)
          VALUES (${key}, ${String(entry.value ?? '')}, ${String(entry.section || 'general')})
          ON CONFLICT (key) DO UPDATE
            SET value = EXCLUDED.value,
                section = EXCLUDED.section,
                updated_at = now()
        `;
      }
      return ok(res, { saved: true });
    } catch (err) {
      return serverError(res, err);
    }
  }

  return bad(res, 'Method not allowed', 405);
}

async function generateRoute(req, res, sql) {
  if (req.method !== 'POST') {
    return bad(res, 'Method not allowed', 405);
  }

  try {
    const body = await readBody(req);
    const topicIndex =
      Number.isInteger(Number(body.topicIndex)) && Number(body.topicIndex) >= 0
        ? Number(body.topicIndex)
        : undefined;

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

async function newsletterRoute(req, res, sql) {
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

async function newsletterSend(req, res, sql) {
  if (req.method !== 'POST') {
    return bad(res, 'Method not allowed', 405);
  }

  if (!process.env.RESEND_API_KEY) {
    return bad(res, 'Email provider is not configured. Set RESEND_API_KEY before sending.', 503);
  }

  try {
    const result = await sendWeeklyNewsletter({ sql, trigger: 'manual' });
    return ok(res, { campaign: result });
  } catch (err) {
    return serverError(res, err);
  }
}
