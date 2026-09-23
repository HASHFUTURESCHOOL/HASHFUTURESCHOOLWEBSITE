/**
 * Read-only feed for the "School Updates" page.
 *
 * Content is owned by Future Assist (https://futureassist.hashfuture.school/storyboard).
 * This endpoint reads the storyboard feed, keeps only the fields the public page
 * needs, rewrites relative upload paths to absolute URLs, and edge-caches the
 * result so the page stays fast.
 *
 * The storyboard is posted by school staff and is currently behind a login, so
 * unlike /api/showcase this source needs a server-side credential (or a public
 * read route on the Future Assist side). Configure it with:
 *   FUTURE_ASSIST_UPDATES_URL    full URL of the feed (default: /api/storyboard)
 *   FUTURE_ASSIST_UPDATES_TOKEN  optional bearer token sent with the request
 */

const DEFAULT_UPDATES_URL = 'https://futureassist.hashfuture.school/api/storyboard';
const CACHE_SECONDS = 300;
const TIMEOUT_MS = 12000;
const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 50;

function updatesUrl() {
  const configured = (process.env.FUTURE_ASSIST_UPDATES_URL || '').trim();
  if (configured) return configured;

  const joinUrl = (process.env.FUTURE_ASSIST_JOIN_URL || '').trim();
  if (joinUrl && /^https?:\/\//i.test(joinUrl)) {
    try {
      return new URL('/api/storyboard', joinUrl).toString();
    } catch {
      /* fall through to the default */
    }
  }

  return DEFAULT_UPDATES_URL;
}

function token() {
  return (
    process.env.FUTURE_ASSIST_UPDATES_TOKEN ||
    process.env.FUTURE_ASSIST_API_TOKEN ||
    ''
  ).trim();
}

function sendJson(res, status, data, cacheSeconds = 0) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader(
    'Cache-Control',
    cacheSeconds > 0
      ? `public, s-maxage=${cacheSeconds}, stale-while-revalidate=${cacheSeconds * 2}`
      : 'no-store'
  );
  res.end(JSON.stringify(data));
}

function toAbsolute(path, origin) {
  if (!path || typeof path !== 'string') return null;
  const value = path.trim();
  if (!value) return null;
  if (/^(https?:|data:|blob:)/i.test(value)) return value;
  if (value.startsWith('//')) return `https:${value}`;
  // Uploads are stored either as an app-relative path or a bare key.
  return `${origin}${value.startsWith('/') ? '' : '/'}${value}`;
}

function cleanText(value, max = 8000) {
  if (typeof value !== 'string') return '';
  return value.replace(/\r\n/g, '\n').replace(/[ \t]+$/gm, '').trim().slice(0, max);
}

function displayName(author) {
  if (!author) return 'Hash Future School';
  const name = [author.firstName, author.lastName]
    .filter((part) => typeof part === 'string' && part.trim())
    .map((part) => part.trim().replace(/\s+/g, ' '))
    .join(' ');
  return name || 'Hash Future School';
}

function initials(name) {
  const parts = String(name).split(' ').filter(Boolean);
  if (!parts.length) return 'HF';
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

function normalize(post, origin) {
  const author = displayName(post.author);
  return {
    id: post.id,
    title: cleanText(post.title, 240),
    content: cleanText(post.content),
    link: typeof post.link === 'string' && post.link.trim() ? post.link.trim() : null,
    image: toAbsolute(post.imageUrl, origin),
    author: {
      name: author,
      initials: initials(author),
      photo: toAbsolute(post.author?.profilePhoto, origin),
    },
    createdAt: post.createdAt || post.updatedAt || null,
    likeCount: Number(post._count?.likes ?? (Array.isArray(post.likes) ? post.likes.length : 0)) || 0,
    commentCount: Number(post._count?.comments ?? 0) || 0,
  };
}

function isVisible(post) {
  if (!post || typeof post !== 'object') return false;
  if (post.isArchived === true) return false;
  return Boolean(post.content || post.title);
}

async function fetchUpdates(url, { limit, cursor }) {
  const target = new URL(url);
  target.searchParams.set('limit', String(limit));
  if (cursor) target.searchParams.set('cursor', cursor);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const headers = {
    Accept: 'application/json',
    'User-Agent': 'hashfuture.school updates proxy (+https://www.hashfuture.school)',
  };
  const bearer = token();
  if (bearer) headers.Authorization = `Bearer ${bearer}`;

  try {
    return await fetch(target.toString(), {
      headers,
      cache: 'no-store',
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  const sourceUrl = updatesUrl();
  let origin;
  try {
    origin = new URL(sourceUrl).origin;
  } catch {
    return sendJson(res, 500, { error: 'Updates source is misconfigured', updates: [] });
  }

  const params = new URL(req.url, `http://${req.headers.host || 'localhost'}`).searchParams;
  const requestedLimit = Number.parseInt(params.get('limit') || '', 10);
  const limit = Number.isFinite(requestedLimit)
    ? Math.min(Math.max(requestedLimit, 1), MAX_LIMIT)
    : DEFAULT_LIMIT;
  const cursorParam = (params.get('cursor') || '').trim();
  const cursor = /^\d+$/.test(cursorParam) ? cursorParam : null;

  try {
    const upstream = await fetchUpdates(sourceUrl, { limit, cursor });

    if (upstream.status === 401 || upstream.status === 403) {
      return sendJson(res, 502, {
        error: 'School updates are not publicly readable yet',
        code: 'UPDATES_NOT_PUBLIC',
        updates: [],
      });
    }

    if (!upstream.ok) {
      return sendJson(res, 502, {
        error: `Future Assist responded with ${upstream.status}`,
        updates: [],
      });
    }

    const payload = await upstream.json().catch(() => null);
    const raw = Array.isArray(payload?.posts)
      ? payload.posts
      : Array.isArray(payload?.updates)
        ? payload.updates
        : Array.isArray(payload)
          ? payload
          : null;

    if (!raw) {
      return sendJson(res, 502, { error: 'Unexpected response from Future Assist', updates: [] });
    }

    const updates = raw.filter(isVisible).map((post) => normalize(post, origin));
    const nextCursor = payload?.nextCursor ? String(payload.nextCursor) : null;

    return sendJson(
      res,
      200,
      {
        updates,
        nextCursor,
        meta: {
          count: updates.length,
          source: 'https://futureassist.hashfuture.school/storyboard',
          fetchedAt: new Date().toISOString(),
        },
      },
      CACHE_SECONDS
    );
  } catch (err) {
    console.error('[updates] upstream fetch failed:', err);
    const aborted = err?.name === 'AbortError';
    return sendJson(res, 502, {
      error: aborted ? 'Future Assist timed out' : 'Could not load school updates',
      updates: [],
    });
  }
}
