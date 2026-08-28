import {
  readBody,
  bad,
  ok,
  unauthorized,
  serverError,
  serializeCookie,
  clearCookie,
} from '../../lib/http.js';
import {
  verifyPassword,
  signToken,
  adminCookie,
  getAdminFromRequest,
} from '../../lib/auth.js';

function resolveAction(req) {
  const fromQuery = String(req.query.action || '').trim().toLowerCase();
  if (fromQuery) return fromQuery;
  const pathname = String(req.url || '').split('?')[0];
  return pathname.split('/').filter(Boolean).pop() || '';
}

export default async function handler(req, res) {
  const action = resolveAction(req);

  if (action === 'login') {
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

  if (action === 'logout') {
    if (req.method !== 'POST') {
      return bad(res, 'Method not allowed', 405);
    }
    res.setHeader('Set-Cookie', clearCookie('hfs_admin'));
    return ok(res, { loggedOut: true });
  }

  if (action === 'me') {
    const payload = await getAdminFromRequest(req);
    if (!payload || payload.role !== 'admin') {
      return unauthorized(res, 'You are not signed in');
    }
    return ok(res, { email: payload.email, role: payload.role });
  }

  return bad(res, 'Unknown auth action', 404);
}
