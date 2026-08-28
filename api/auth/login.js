import {
  readBody,
  bad,
  ok,
  unauthorized,
  serverError,
  serializeCookie,
} from '../../lib/http.js';
import { verifyPassword, signToken, adminCookie } from '../../lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return bad(res, 'Method not allowed', 405);
  }

  const body = await readBody(req);
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');

  const adminEmail = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const adminHash = process.env.ADMIN_PASSWORD_HASH;

  if (!adminEmail || !adminHash) {
    return serverError(res, new Error('Admin credentials are not configured'));
  }

  if (email !== adminEmail || !verifyPassword(password, adminHash)) {
    return unauthorized(res, 'Invalid email or password');
  }

  const token = await signToken({ role: 'admin', email });
  const { value } = adminCookie(token);
  res.setHeader('Set-Cookie', serializeCookie('hfs_admin', value, { maxAge: 604800 }));

  return ok(res, { token, email });
}
