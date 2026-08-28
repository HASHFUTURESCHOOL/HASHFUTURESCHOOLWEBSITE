import { ok, unauthorized } from '../../lib/http.js';
import { getAdminFromRequest } from '../../lib/auth.js';

export default async function handler(req, res) {
  const payload = await getAdminFromRequest(req);
  if (!payload || payload.role !== 'admin') {
    return unauthorized(res, 'You are not signed in');
  }
  return ok(res, { email: payload.email, role: payload.role });
}
