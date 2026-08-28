import { getSql } from '../lib/db.js';
import { readBody, ok, bad, serverError } from '../lib/http.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return bad(res, 'Method not allowed', 405);
  }

  // POST is used by the in-page form; GET is used by the unsubscribe link in the
  // newsletter email footer (a recipient simply clicks it).
  const body = req.method === 'GET' ? {} : await readBody(req);

  const email = String(body.email || req.query.email || '').trim().toLowerCase();
  if (!email || !EMAIL_RE.test(email)) {
    return bad(res, 'A valid email address is required');
  }

  try {
    const sql = getSql();
    const isGet = req.method === 'GET';
    if (isGet) {
      // Verify this email is actually subscribed before showing success.
      const exists = await sql`
        SELECT id, status FROM newsletter_subscribers WHERE email = ${email}
      `;
      if (!exists.length) {
        return html(res, 200, 'This email is not on our list, so there is nothing to unsubscribe.');
      }
    }
    const result = await sql`
      UPDATE newsletter_subscribers
      SET status = 'unsubscribed', unsubscribed_at = now()
      WHERE email = ${email}
      RETURNING id
    `;
    if (isGet) {
      return html(res, 200, result.length
        ? 'You have been unsubscribed from the Hash Future School newsletter.'
        : 'This email is already unsubscribed.');
    }
    return ok(res, { unsubscribed: true, updated: result.length });
  } catch (err) {
    return serverError(res, err);
  }
}

function html(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Unsubscribed · Hash Future School</title>
  <style>
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background:#f3f4f6;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:24px;}
    .card{background:#fff;border-radius:16px;padding:40px;max-width:440px;width:100%;text-align:center;box-shadow:0 10px 30px rgba(0,0,0,0.08);}
    .brand{font-size:20px;font-weight:800;color:#1d4ed8;margin-bottom:16px;}
    h1{font-size:20px;color:#111827;margin:0 0 8px;}
    p{color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 24px;}
    a{color:#2563eb;text-decoration:none;font-weight:600;}
  </style>
</head>
<body>
  <div class="card">
    <div class="brand"># Hash Future School</div>
    <h1>You're all set</h1>
    <p>${body.replace(/</g, '&lt;')}</p>
    <a href="/">Back to the site</a>
  </div>
</body>
</html>`);
}
