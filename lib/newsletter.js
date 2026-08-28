import { sendEmail } from './email.js';

const DEFAULT_CONTENT_ID = 'weekly';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Small, safe markdown -> HTML renderer (headings, lists, bold, italics, code,
// links, blockquotes, paragraphs). It deliberately escapes all raw HTML.
function mdToHtml(md) {
  const lines = (md || '').replace(/\r\n/g, '\n').split('\n');
  const html = [];
  let listType = null; // 'ul' | 'ol' | null

  const closeList = () => {
    if (listType) {
      html.push(`</${listType}>`);
      listType = null;
    }
  };

  const inline = (text) =>
    text
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/__([^_]+)__/g, '<strong>$1</strong>')
      .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  for (const raw of lines) {
    const line = raw.trimEnd();
    const trimmed = line.trim();

    if (!trimmed) {
      closeList();
      continue;
    }

    // Headings
    const heading = trimmed.match(/^(#{1,3})\s+(.*)$/);
    if (heading) {
      closeList();
      const level = heading[1].length;
      html.push(`<h${level}>${inline(escapeHtml(heading[2]))}</h${level}>`);
      continue;
    }

    // Blockquote
    if (trimmed.startsWith('> ')) {
      closeList();
      html.push(`<blockquote>${inline(escapeHtml(trimmed.slice(2)))}</blockquote>`);
      continue;
    }

    // Unordered list
    const ul = trimmed.match(/^[-*]\s+(.*)$/);
    if (ul) {
      if (listType !== 'ul') {
        closeList();
        html.push('<ul>');
        listType = 'ul';
      }
      html.push(`<li>${inline(escapeHtml(ul[1]))}</li>`);
      continue;
    }

    // Ordered list
    const ol = trimmed.match(/^\d+\.\s+(.*)$/);
    if (ol) {
      if (listType !== 'ol') {
        closeList();
        html.push('<ol>');
        listType = 'ol';
      }
      html.push(`<li>${inline(escapeHtml(ol[1]))}</li>`);
      continue;
    }

    // Paragraph
    closeList();
    html.push(`<p>${inline(escapeHtml(trimmed))}</p>`);
  }

  closeList();
  return html.join('\n');
}

function renderText({ body }) {
  return String(body || '')
    .replace(/[*_`]/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .trim();
}

/**
 * Render the full HTML email body with a consistent branded layout.
 */
export function renderNewsletterHtml({ content, subscriber, baseUrl, unsubscribeUrl }) {
  const greeting = subscriber?.name
    ? `Hi ${escapeHtml(subscriber.name)},`
    : 'Hello,';
  const bodyHtml = mdToHtml(content.body_md);
  const unsub = unsubscribeUrl || `${baseUrl}/api/unsubscribe?email=${encodeURIComponent(subscriber?.email || '')}`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(content.subject)}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="padding:28px 32px;background:#1d4ed8;">
              <div style="color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-0.5px;"># Hash Future School</div>
              <div style="color:#bfdbfe;font-size:13px;margin-top:4px;">A premier AI-first progressive online school</div>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;color:#111827;font-size:16px;line-height:1.7;">
              <p style="margin:0 0 16px;">${greeting}</p>
              ${bodyHtml}
              <p style="margin:24px 0 0;color:#6b7280;font-size:14px;">— The Hash Future School Team</p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px;border-top:1px solid #e5e7eb;background:#f9fafb;color:#9ca3af;font-size:12px;line-height:1.6;">
              <div>You're receiving this because you subscribed at ${escapeHtml(baseUrl)}.</div>
              <div style="margin-top:10px;">
                Want to stop receiving these? <a href="${escapeHtml(unsub)}" style="color:#2563eb;text-decoration:underline;">Unsubscribe here</a>.
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

/**
 * Read the editable newsletter content, seeding defaults on first use.
 */
export async function getNewsletterContent(sql) {
  const rows = await sql`
    SELECT id, subject, body_md AS "bodyMd", updated_at AS "updatedAt"
    FROM newsletter_content
    WHERE id = ${DEFAULT_CONTENT_ID}
  `;
  if (rows.length) return rows[0];

  const defaultBody = [
    'Welcome to this week\'s newsletter from **Hash Future School**.',
    '',
    'Here is what\'s happening this week:',
    '',
    '- Latest updates from our community',
    '- Insights on future-ready learning for your child',
    '- A highlight worth sharing',
    '',
    'We\'re shaping the full format and contents here soon. Stay tuned!',
  ].join('\n');

  await sql`
    INSERT INTO newsletter_content (id, subject, body_md)
    VALUES (${DEFAULT_CONTENT_ID}, 'Your Weekly Hash Future School Newsletter', ${defaultBody})
    ON CONFLICT (id) DO NOTHING
  `;
  const inserted = await sql`
    SELECT id, subject, body_md AS "bodyMd", updated_at AS "updatedAt"
    FROM newsletter_content WHERE id = ${DEFAULT_CONTENT_ID}
  `;
  return inserted[0];
}

/**
 * Update the editable newsletter content.
 */
export async function updateNewsletterContent(sql, { subject, body }) {
  if (!subject || !String(subject).trim()) {
    throw new Error('Subject is required');
  }
  await sql`
    INSERT INTO newsletter_content (id, subject, body_md)
    VALUES (${DEFAULT_CONTENT_ID}, ${String(subject).trim()}, ${String(body || '').trim()})
    ON CONFLICT (id) DO UPDATE
      SET subject = EXCLUDED.subject,
          body_md = EXCLUDED.body_md,
          updated_at = now()
  `;
  return getNewsletterContent(sql);
}

const DEFAULT_BASE_URL = 'https://www.hashfuture.school';

function runConcurrent(items, limit, fn) {
  let index = 0;
  const results = [];
  const workers = Array.from({ length: Math.min(limit, items.length) }, async (_, worker) => {
    while (index < items.length) {
      const i = index++;
      results[i] = await fn(items[i], i);
    }
  });
  return Promise.all(workers).then(() => results);
}

/**
 * Send the weekly newsletter to every active subscriber and record the run.
 *
 * Returns a summary object. The campaign row is created up front so a failure is
 * always visible in the Admin CMS.
 */
export async function sendWeeklyNewsletter({ sql, trigger = 'manual' }) {
  const content = await getNewsletterContent(sql);
  const baseUrl = (process.env.NEWSLETTER_BASE_URL || DEFAULT_BASE_URL)
    .replace(/\/$/, '');

  const created = await sql`
    INSERT INTO newsletter_campaigns (subject, trigger, status, recipient_count)
    VALUES (${content.subject}, ${trigger}, 'sending', 0)
    RETURNING id
  `;
  const campaignId = created[0].id;

  const subscribers = await sql`
    SELECT id, email, name
    FROM newsletter_subscribers
    WHERE status = 'active'
    ORDER BY id
  `;
  const recipientCount = subscribers.length;
  const html = renderNewsletterHtml({ content, subscriber: null, baseUrl });
  const text = renderText({ body: content.body_md });

  if (recipientCount === 0) {
    await sql`
      UPDATE newsletter_campaigns
      SET status = 'sent', recipient_count = 0, sent_count = 0, failed_count = 0, sent_at = now()
      WHERE id = ${campaignId}
    `;
    return { campaignId, subject: content.subject, scheduled: 0, sent: 0, failed: 0, status: 'sent' };
  }

  await sql`
    UPDATE newsletter_campaigns
    SET recipient_count = ${recipientCount}, body_html = ${html}, body_text = ${text}
    WHERE id = ${campaignId}
  `;

  let sent = 0;
  let failed = 0;

  await runConcurrent(subscribers, 5, async (sub) => {
    const unsubscribeUrl = `${baseUrl}/api/unsubscribe?email=${encodeURIComponent(sub.email)}`;
    const personalHtml = renderNewsletterHtml({ content, subscriber: sub, baseUrl, unsubscribeUrl });
    try {
      await sendEmail({
        to: sub.email,
        subject: content.subject,
        html: personalHtml,
        text,
        replyTo: process.env.NEWSLETTER_REPLY_TO || undefined,
      });
      sent++;
      await sql`
        INSERT INTO newsletter_send_log (campaign_id, subscriber_id, email, status)
        VALUES (${campaignId}, ${sub.id}, ${sub.email}, 'sent')
      `;
    } catch (err) {
      failed++;
      await sql`
        INSERT INTO newsletter_send_log (campaign_id, subscriber_id, email, status, error)
        VALUES (${campaignId}, ${sub.id}, ${sub.email}, 'failed', ${String(err.message || 'Unknown error').slice(0, 500)})
      `;
    }
  });

  const status = failed === 0 ? 'sent' : sent === 0 ? 'failed' : 'partial';
  await sql`
    UPDATE newsletter_campaigns
    SET status = ${status}, sent_count = ${sent}, failed_count = ${failed}, sent_at = now(),
        error = CASE WHEN ${failed > 0} THEN ${`${failed} recipient(s) failed`} ELSE NULL END
    WHERE id = ${campaignId}
  `;

  return { campaignId, subject: content.subject, scheduled: recipientCount, sent, failed, status };
}

export async function listNewsletterCampaigns(sql, limit = 20) {
  return sql`
    SELECT
      id, subject, status, trigger,
      recipient_count AS "recipientCount",
      sent_count AS "sentCount",
      failed_count AS "failedCount",
      created_at AS "createdAt",
      sent_at AS "sentAt",
      error
    FROM newsletter_campaigns
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;
}
