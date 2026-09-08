import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.env.PORT || 3000);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
};

function contentType(filePath) {
  return MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
}

function isApi(p) {
  return p === '/api' || p.startsWith('/api/');
}

// Map a request URL onto the Vercel-style query object a handler would receive.
function buildQuery(url, routeSegments) {
  const query = {};
  for (const [k, v] of url.searchParams) {
    query[k] = v;
  }
  if (routeSegments) {
    query.slug = routeSegments;
  }
  return query;
}

async function readJsonBody(req) {
  let raw = '';
  for await (const chunk of req) raw += chunk;
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

async function handleApi(req, res, url) {
  const seg = url.pathname.split('/').filter(Boolean);
  if (!seg.length || seg[0] !== 'api') return false;

  const route = seg[1];
  let modulePath;
  let query;
  let handlerName;

  switch (route) {
    case 'admin': {
      modulePath = path.join(ROOT, 'api/admin/[...slug].js');
      query = buildQuery(url, seg.slice(2));
      break;
    }
    case 'auth': {
      modulePath = path.join(ROOT, 'api/auth/[action].js');
      query = buildQuery(url);
      if (seg[2]) query.action = seg[2];
      break;
    }
    case 'cron': {
      modulePath = path.join(ROOT, 'api/cron/[...slug].js');
      query = buildQuery(url, seg.slice(2));
      break;
    }
    case 'content': {
      modulePath = path.join(ROOT, 'api/content.js');
      query = buildQuery(url);
      break;
    }
    case 'posts': {
      modulePath = path.join(ROOT, 'api/posts/index.js');
      query = buildQuery(url);
      break;
    }
    case 'subscribe': {
      modulePath = path.join(ROOT, 'api/subscribe.js');
      query = buildQuery(url);
      break;
    }
    case 'unsubscribe': {
      modulePath = path.join(ROOT, 'api/unsubscribe.js');
      query = buildQuery(url);
      break;
    }
    case 'health': {
      modulePath = path.join(ROOT, 'api/health.js');
      query = buildQuery(url);
      break;
    }
    default:
      return false;
  }

  const body = req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH'
    ? await readJsonBody(req) : {};

  const mockReq = {
    method: req.method,
    url: url.pathname + url.search,
    headers: req.headers,
    query,
    body,
  };

  const state = { statusCode: 200, headers: {}, data: '' };
  const mockRes = {
    get statusCode() {
      return state.statusCode;
    },
    set statusCode(value) {
      state.statusCode = value;
    },
    setHeader(name, value) {
      state.headers[name.toLowerCase()] = value;
    },
    end(data) {
      state.data = data;
    },
  };

  const mod = await import(pathToFileURL(modulePath).href);
  const handler = mod.default;

  try {
    await handler(mockReq, mockRes);
  } catch (err) {
    console.error(`[dev/api] ${url.pathname} failed:`, err);
    state.statusCode = 500;
    state.headers['content-type'] = 'application/json; charset=utf-8';
    state.data = JSON.stringify({ error: 'Internal server error' });
  }

  res.statusCode = state.statusCode;
  for (const [k, v] of Object.entries(state.headers)) res.setHeader(k, v);
  // Body may be a Buffer or a string; normalize.
  res.end(typeof state.data === 'string' ? Buffer.from(state.data) : state.data);
  return true;
}

async function handleProxy(req, res, url) {
  if (url.pathname !== '/api/proxy/admissions/demo') return false;
  try {
    const upstream = await fetch('https://futureassist.hashfuture.school/api/admissions/demo', {
      method: req.method,
      headers: { 'content-type': req.headers['content-type'] || 'application/json' },
      body: req.method === 'POST' ? req : undefined,
      redirect: 'manual',
    });
    const text = await upstream.text();
    res.statusCode = upstream.status;
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json');
    res.end(Buffer.from(text));
  } catch (err) {
    console.error('[dev/proxy] failed:', err);
    res.statusCode = 502;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Proxy failed' }));
  }
  return true;
}

function serveStatic(req, res, url) {
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === '/' || pathname === '') pathname = '/index.html';

  // Mirror Vercel cleanUrls: /about -> /about.html
  let filePath = path.join(ROOT, pathname);
  if (!path.extname(filePath)) {
    const htmlCandidate = filePath + '.html';
    if (fs.existsSync(htmlCandidate) && fs.statSync(htmlCandidate).isFile()) {
      filePath = htmlCandidate;
    }
  }

  // Resolve symlinks and guard against path traversal.
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(ROOT + path.sep)) {
    res.statusCode = 403;
    res.end('Forbidden');
    return;
  }

  if (!fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end('<!DOCTYPE html><html><body><h1>404 Not Found</h1></body></html>');
    return;
  }

  const ext = path.extname(resolved).toLowerCase();
  if (ext === '.html') {
    // Pass-through plain HTML (scripts fetch the API relative to the origin).
    res.statusCode = 200;
    res.setHeader('Content-Type', contentType(resolved));
    fs.createReadStream(resolved).pipe(res);
  } else {
    res.statusCode = 200;
    res.setHeader('Content-Type', contentType(resolved));
    fs.createReadStream(resolved).pipe(res);
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (isApi(url.pathname)) {
    if (await handleProxy(req, res, url)) return;
    if (await handleApi(req, res, url)) return;
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: 'Unknown API route' }));
    return;
  }

  serveStatic(req, res, url);
});

server.listen(PORT, () => {
  console.log(`\n  Hash Future School dev server`);
  console.log(`  ----------------------------------------------------`);
  console.log(`  Site:   http://localhost:${PORT}/`);
  console.log(`  Admin:  http://localhost:${PORT}/admin`);
  console.log(`  Health: http://localhost:${PORT}/api/health`);
  console.log(`  ----------------------------------------------------\n`);
});
