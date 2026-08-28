import { ok } from '../lib/http.js';

export default async function handler(req, res) {
  return ok(res, { ok: true, time: new Date().toISOString() });
}
