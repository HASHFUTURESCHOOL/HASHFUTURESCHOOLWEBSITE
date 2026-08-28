import { ok, bad, clearCookie } from '../../lib/http.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return bad(res, 'Method not allowed', 405);
  }
  res.setHeader('Set-Cookie', clearCookie('hfs_admin'));
  return ok(res, { loggedOut: true });
}
