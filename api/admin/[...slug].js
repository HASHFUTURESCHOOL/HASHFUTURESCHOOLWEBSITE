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
import { emailConfigured, sendEmail } from '../../lib/email.js';
import { enrollmentEmail, SCHOOL_CONNECT_STATUSES } from '../../lib/school-connect-mail.js';
import {
  futureAssistPayload,
  syncRegistrationToFutureAssist,
} from '../../lib/future-assist.js';

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
    if (seg0 === 'applications' && !seg1) return applicationsCollection(req, res, sql);
    if (seg0 === 'applications') return applicationItem(req, res, sql, seg1);
    if (seg0 === 'school-connect' && !seg1) return schoolConnectCollection(req, res, sql);
    if (seg0 === 'school-connect') return schoolConnectItem(req, res, sql, seg1, admin);
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

// ---------- Team applications (from /join) ----------

const APPLICATION_STATUSES = [
  'new',
  'shortlisted',
  'in-conversation',
  'invited',
  'hired',
  'archived',
];

async function applicationsCollection(req, res, sql) {
  if (req.method === 'GET') {
    try {
      const rows = await sql`
        SELECT
          id, ref, full_name, email, phone, location, age, links,
          skills, role_interest, commitment, availability,
          status, score, created_at,
          jsonb_array_length(achievements) AS achievement_count,
          future_assist_state
        FROM team_applications
        ORDER BY created_at DESC
      `;
      return ok(res, { applications: rows });
    } catch (err) {
      return serverError(res, err);
    }
  }

  return bad(res, 'Method not allowed', 405);
}

async function applicationItem(req, res, sql, idRaw) {
  const id = Number(idRaw);
  if (!Number.isInteger(id) || id <= 0) {
    return bad(res, 'Invalid application id');
  }

  if (req.method === 'GET') {
    try {
      const rows = await sql`SELECT * FROM team_applications WHERE id = ${id} LIMIT 1`;
      if (!rows.length) return notFound(res, 'Application not found');
      return ok(res, { application: rows[0] });
    } catch (err) {
      return serverError(res, err);
    }
  }

  if (req.method === 'PATCH') {
    const body = await readBody(req);
    const status = String(body.status || '').trim();
    if (status && !APPLICATION_STATUSES.includes(status)) {
      return bad(res, `Status must be one of: ${APPLICATION_STATUSES.join(', ')}`);
    }

    const notes = body.reviewer_notes === undefined ? null : String(body.reviewer_notes || '');
    const hasScore = body.score !== undefined && body.score !== null && body.score !== '';
    const score = hasScore ? Number(body.score) : null;
    if (hasScore && (!Number.isInteger(score) || score < 0 || score > 10)) {
      return bad(res, 'Score must be a whole number from 0 to 10');
    }

    try {
      const rows = await sql`
        UPDATE team_applications
        SET status = COALESCE(${status || null}, status),
            reviewer_notes = COALESCE(${notes}, reviewer_notes),
            score = COALESCE(${score}, score),
            updated_at = now()
        WHERE id = ${id}
        RETURNING id, ref, status, score, reviewer_notes, updated_at
      `;
      if (!rows.length) return notFound(res, 'Application not found');
      return ok(res, { application: rows[0], updated: true });
    } catch (err) {
      return serverError(res, err);
    }
  }

  if (req.method === 'DELETE') {
    try {
      const rows = await sql`DELETE FROM team_applications WHERE id = ${id} RETURNING id`;
      if (!rows.length) return notFound(res, 'Application not found');
      return ok(res, { deleted: true });
    } catch (err) {
      return serverError(res, err);
    }
  }

  return bad(res, 'Method not allowed', 405);
}

/* ------------------------------------------------ IIT Madras School Connect */

// Students from other schools who registered with us so they can take an IIT
// Madras School Connect course as a Hash Future School student.
async function schoolConnectCollection(req, res, sql) {
  if (req.method === 'GET') {
    try {
      const rows = await sql`
        SELECT
          id, ref, school_id, student_name, student_email, student_phone, age, grade,
          current_school, school_city, school_country, country, city,
          parent_name, parent_email, parent_phone,
          interests, status, reviewer_notes, approved_at,
          enrollment_email_state, enrollment_email_at,
          future_assist_state, future_assist_error, future_assist_synced_at,
          created_at
        FROM school_connect_registrations
        ORDER BY created_at DESC
      `;
      return ok(res, { registrations: rows });
    } catch (err) {
      if (err?.code === '42P01') {
        return ok(res, { registrations: [], migrationRequired: true });
      }
      return serverError(res, err);
    }
  }

  return bad(res, 'Method not allowed', 405);
}

async function schoolConnectItem(req, res, sql, idRaw, admin) {
  const id = Number(idRaw);
  if (!Number.isInteger(id) || id <= 0) {
    return bad(res, 'Invalid registration id');
  }

  if (req.method === 'GET') {
    try {
      const rows = await sql`SELECT * FROM school_connect_registrations WHERE id = ${id} LIMIT 1`;
      if (!rows.length) return notFound(res, 'Registration not found');
      return ok(res, { registration: rows[0] });
    } catch (err) {
      return serverError(res, err);
    }
  }

  if (req.method === 'PATCH') {
    const body = await readBody(req);
    const action = String(body.action || '').trim();
    const status = String(body.status || '').trim();

    if (status && !SCHOOL_CONNECT_STATUSES.includes(status)) {
      return bad(res, `Status must be one of: ${SCHOOL_CONNECT_STATUSES.join(', ')}`);
    }

    if (action && !['approve', 'resend', 'sync'].includes(action)) {
      return bad(res, 'Action must be "approve", "resend" or "sync"');
    }

    try {
      const existing = await sql`SELECT * FROM school_connect_registrations WHERE id = ${id} LIMIT 1`;
      if (!existing.length) return notFound(res, 'Registration not found');
      const current = existing[0];

      const notes = body.reviewer_notes === undefined ? null : String(body.reviewer_notes || '');
      const enrollmentNote =
        body.enrollment_note === undefined ? null : String(body.enrollment_note || '');
      const reviewedBy = admin?.email ? String(admin.email) : null;
      const shouldEmail = body.send_email !== false && body.send_email !== 'false';
      const wantsApproval = action === 'approve' || status === 'approved';
      const wantsResend = action === 'resend';

      // 1. Write the review decision before sending anything, so a mail outage
      //    cannot lose the approval.
      let rows;
      if (wantsApproval) {
        const schoolId =
          current.school_id ||
          current.ref ||
          `HFS-SC-${new Date().getFullYear()}-${String(current.id).padStart(4, '0')}`;

        rows = await sql`
          UPDATE school_connect_registrations
          SET status = 'approved',
              school_id = ${schoolId},
              approved_at = COALESCE(approved_at, now()),
              reviewed_by = COALESCE(${reviewedBy}, reviewed_by),
              reviewer_notes = COALESCE(${notes}, reviewer_notes),
              enrollment_note = COALESCE(${enrollmentNote}, enrollment_note),
              updated_at = now()
          WHERE id = ${id}
          RETURNING *
        `;
      } else {
        rows = await sql`
          UPDATE school_connect_registrations
          SET status = COALESCE(${status || null}, status),
              reviewed_by = COALESCE(${reviewedBy}, reviewed_by),
              reviewer_notes = COALESCE(${notes}, reviewer_notes),
              enrollment_note = COALESCE(${enrollmentNote}, enrollment_note),
              updated_at = now()
          WHERE id = ${id}
          RETURNING *
        `;
      }

      let registration = rows[0];

      // 2. Send (or resend) the enrolment mail. This is the message that carries
      //    the Hash Future School student ID.
      const wantsSyncOnly = action === 'sync';

      if ((wantsApproval || wantsResend) && shouldEmail) {
        let state = 'sent';
        const recipients = [
          registration.student_email,
          registration.parent_email,
          registration.parent2_email,
        ].filter(Boolean);

        try {
          const mail = enrollmentEmail(registration, { note: registration.enrollment_note });
          await sendEmail({
            to: recipients,
            subject: `✅ Approved — your Hash Future School ID for IIT Madras School Connect (${registration.school_id})`,
            html: mail.html,
            text: mail.text,
            replyTo: process.env.SCHOOL_CONNECT_TO || process.env.ADMIN_EMAIL || 'learn@hashfuture.school',
          });
        } catch (err) {
          console.error('[admin/school-connect] enrolment email failed:', err);
          state = 'failed';
        }

        const emailed = await sql`
          UPDATE school_connect_registrations
          SET enrollment_email_state = ${state},
              enrollment_email_at = now(),
              updated_at = now()
          WHERE id = ${id}
          RETURNING *
        `;
        registration = emailed[0];
      }

      // 3. Keep the Future Assist copy in step. The programme desk reads those
      //    rows, so an approval (which is what issues the Hash Future School ID)
      //    and every other status move — verified, rejected, archived — has to
      //    land there too. `sync` re-pushes a row whose first mirror failed
      //    without touching the status; notes-only edits do not push, so the desk
      //    is not rewritten for every keystroke.
      const statusChanged = Boolean(status) && status !== current.status;

      if (wantsApproval || wantsResend || wantsSyncOnly || statusChanged) {
        const sync = await syncRegistrationToFutureAssist(
          futureAssistPayload(registration, {
            emailed: registration.enrollment_email_state === 'sent',
          })
        );

        try {
          const rows2 = await sql`
            UPDATE school_connect_registrations
            SET future_assist_id = ${sync.id},
                future_assist_state = ${sync.state},
                future_assist_error = ${sync.error},
                future_assist_synced_at = now(),
                updated_at = now()
            WHERE id = ${id}
            RETURNING *
          `;
          if (rows2.length) registration = rows2[0];
        } catch (err) {
          console.error('[admin/school-connect] could not record the Future Assist sync state:', err);
        }
      }

      return ok(res, { registration, updated: true });
    } catch (err) {
      return serverError(res, err);
    }
  }

  if (req.method === 'DELETE') {
    try {
      const rows = await sql`DELETE FROM school_connect_registrations WHERE id = ${id} RETURNING id`;
      if (!rows.length) return notFound(res, 'Registration not found');
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
        hasProvider: emailConfigured(),
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

  if (!emailConfigured()) {
    return bad(res, 'Email provider is not configured. Set MAILGUN_API_KEY before sending.', 503);
  }

  try {
    const result = await sendWeeklyNewsletter({ sql, trigger: 'manual' });
    return ok(res, { campaign: result });
  } catch (err) {
    return serverError(res, err);
  }
}
