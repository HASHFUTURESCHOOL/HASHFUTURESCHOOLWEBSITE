export async function readBody(req) {
  if (req.body && typeof req.body === 'object') {
    return req.body;
  }
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
  }
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function send(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(data));
}

export function ok(res, data = {}) {
  send(res, 200, data);
}

export function bad(res, message = 'Invalid request', status = 400) {
  send(res, status, { error: message });
}

export function unauthorized(res, message = 'Unauthorized') {
  send(res, 401, { error: message });
}

export function notFound(res, message = 'Not found') {
  send(res, 404, { error: message });
}

export function serverError(res, error) {
  console.error(error);
  send(res, 500, { error: 'Internal server error' });
}

export function parseCookies(req) {
  const header = req.headers?.cookie || '';
  const out = {};
  header.split(';').forEach((part) => {
    const idx = part.indexOf('=');
    if (idx > 0) {
      out[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim());
    }
  });
  return out;
}

export function serializeCookie(name, value, { maxAge, path = '/', httpOnly = true } = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  if (maxAge) parts.push(`Max-Age=${maxAge}`);
  if (httpOnly) parts.push('HttpOnly');
  parts.push(`Path=${path}`);
  if (process.env.NODE_ENV === 'production') parts.push('Secure');
  parts.push('SameSite=Lax');
  return parts.join('; ');
}

export function clearCookie(name) {
  return serializeCookie(name, '', { maxAge: 0 });
}
