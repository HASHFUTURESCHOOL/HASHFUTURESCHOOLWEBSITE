/**
 * Student photo upload for the School Connect registration form — POST
 * /api/school-connect-photo
 *
 * The form is public, so the file cannot go to Future Assist's upload route from
 * the browser: that route wants a session, and a cross-origin POST would be
 * blocked anyway. This endpoint forwards the upload server-to-server with the
 * shared sync key, into the one folder Future Assist accepts from that key
 * (admissions/school-connect, images only, 5 MB).
 *
 * Future Assist stays the only place files are stored — the photo lands in the
 * same S3 bucket its admission forms use — and this returns the public path the
 * registration then carries as `photo_url`.
 *
 * The form sends the multipart body with a `folder` field of
 * `admissions/school-connect`: Future Assist only accepts that one folder from
 * this key, so a forged folder is rejected there rather than trusted here.
 */

import { ok, bad, send, serverError } from '../lib/http.js';
import { futureAssistSchoolConnectUrl } from '../lib/future-assist.js';

export const config = { maxDuration: 30 };

// Matches the cap Future Assist applies to this folder, with a little headroom
// for multipart overhead so the real check happens there.
const MAX_BODY_BYTES = 6 * 1024 * 1024;

function uploadUrl() {
  // The intake endpoint is .../api/school-connect; the upload lives beside it.
  return futureAssistSchoolConnectUrl().replace(/\/school-connect(\?.*)?$/, '/upload');
}

async function readRawBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) {
      const err = new Error('too-large');
      err.code = 'TOO_LARGE';
      throw err;
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return bad(res, 'Method not allowed', 405);
  }

  // The dev server parses JSON bodies for API routes; a multipart upload has to
  // keep its raw stream, which it does by passing it through untouched.
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    return bad(res, 'Uploads must be sent as multipart/form-data');
  }

  const contentType = String(req.headers?.['content-type'] || '');
  if (!contentType.startsWith('multipart/form-data')) {
    return bad(res, 'Uploads must be sent as multipart/form-data');
  }

  let raw;
  try {
    raw = Buffer.isBuffer(req.body) ? req.body : await readRawBody(req);
  } catch (err) {
    if (err?.code === 'TOO_LARGE') {
      return bad(res, 'The photo must be under 5 MB');
    }
    return serverError(res, err);
  }

  if (!raw.length) {
    return bad(res, 'No file received');
  }

  const headers = { 'content-type': contentType };
  const key = (process.env.FUTURE_ASSIST_SCHOOL_CONNECT_KEY || '').trim();
  if (key) headers['x-hfs-sync-key'] = key;

  try {
    const upstream = await fetch(uploadUrl(), {
      method: 'POST',
      headers,
      body: raw,
      signal: AbortSignal.timeout(20000),
    });

    const data = await upstream.json().catch(() => ({}));

    if (!upstream.ok || !data?.filePath) {
      console.error(
        `[school-connect-photo] upload failed (${upstream.status}) at ${uploadUrl()}: ${data?.error || 'no path returned'}`
      );
      // A 401 from Future Assist means our own key is wrong — that is our fault,
      // not the family's, so it surfaces as a bad gateway rather than a bad request.
      return send(res, upstream.status === 401 ? 502 : upstream.status || 502, {
        error: data?.error || 'We could not accept that photo. Please try a different image, or WhatsApp it to us on +91 94971 20591.',
      });
    }

    return ok(res, {
      uploaded: true,
      url: data.filePath,
      fileName: data.fileName || null,
      fileSize: data.fileSize || raw.length,
    });
  } catch (err) {
    console.error('[school-connect-photo] could not reach Future Assist:', err);
    return send(res, 503, {
      error: 'We could not upload that photo just now. Please try again, or send it to us on WhatsApp at +91 94971 20591.',
    });
  }
}
