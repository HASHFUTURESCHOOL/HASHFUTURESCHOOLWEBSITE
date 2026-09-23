/**
 * Public read-only proxy for the Student Project Showcase.
 *
 * Content is owned by Future Assist (https://futureassist.hashfuture.school/projects).
 * This endpoint fetches the approved projects there, keeps only the fields the
 * showcase page needs, rewrites upload paths to absolute URLs, and edge-caches
 * the result so the website stays fast and never hits Future Assist per visitor.
 *
 * There is no CORS on the Future Assist API, so the browser cannot call it
 * directly — this server-side hop is required.
 */

const DEFAULT_PROJECTS_URL = 'https://futureassist.hashfuture.school/api/projects';
const CACHE_SECONDS = 300;
const TIMEOUT_MS = 12000;

function projectsUrl() {
  const configured = (process.env.FUTURE_ASSIST_PROJECTS_URL || '').trim();
  if (configured) return configured;

  const joinUrl = (process.env.FUTURE_ASSIST_JOIN_URL || '').trim();
  if (joinUrl && /^https?:\/\//i.test(joinUrl)) {
    try {
      return new URL('/api/projects', joinUrl).toString();
    } catch {
      /* fall through to the default */
    }
  }

  return DEFAULT_PROJECTS_URL;
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
  if (/^(https?:|data:|blob:)/i.test(path)) return path;
  return `${origin}${path.startsWith('/') ? '' : '/'}${path}`;
}

function cleanText(value, max = 4000) {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim().slice(0, max);
}

function displayName(student) {
  if (!student) return 'Hash Future Student';
  const name = [student.firstName, student.lastName]
    .filter((part) => typeof part === 'string' && part.trim())
    .map((part) => part.trim().replace(/\s+/g, ' '))
    .join(' ');
  return name || 'Hash Future Student';
}

function initials(name) {
  const parts = String(name).split(' ').filter(Boolean);
  if (!parts.length) return 'HF';
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

function isPublic(project) {
  if (!project || typeof project !== 'object') return false;
  if (project.status !== 'APPROVED') return false;
  if (project.isArchived === true) return false;
  if (project.rejectionReason) return false;
  return Boolean(project.title);
}

function normalize(project, origin) {
  const name = displayName(project.student);
  const gallery = Array.isArray(project.images)
    ? project.images.map((img) => toAbsolute(img, origin)).filter(Boolean)
    : [];
  const cover = toAbsolute(project.coverImage, origin) || gallery[0] || null;

  return {
    id: project.id,
    title: cleanText(project.title, 180),
    description: cleanText(project.description, 4000),
    projectLink: typeof project.projectLink === 'string' ? project.projectLink.trim() : null,
    coverImage: cover,
    images: gallery.filter((img) => img !== cover),
    student: {
      name,
      initials: initials(name),
      photo: toAbsolute(project.student?.profilePhoto, origin),
      reference: project.student?.admissionNumber ? String(project.student.admissionNumber) : null,
    },
    publishedAt: project.publishedAt || project.updatedAt || project.createdAt || null,
    likeCount: Number(project._count?.likes ?? (Array.isArray(project.likes) ? project.likes.length : 0)) || 0,
    commentCount: Number(project._count?.comments ?? 0) || 0,
  };
}

function timeOf(project) {
  const raw = project.publishedAt || project.updatedAt || project.createdAt;
  const time = raw ? Date.parse(raw) : NaN;
  return Number.isNaN(time) ? 0 : time;
}

async function fetchProjects(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'hashfuture.school showcase proxy (+https://www.hashfuture.school)',
      },
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

  const url = projectsUrl();
  let origin;
  try {
    origin = new URL(url).origin;
  } catch {
    return sendJson(res, 500, { error: 'Showcase source is misconfigured', projects: [] });
  }

  try {
    const upstream = await fetchProjects(url);
    if (!upstream.ok) {
      return sendJson(res, 502, {
        error: `Future Assist responded with ${upstream.status}`,
        projects: [],
      });
    }

    const payload = await upstream.json().catch(() => null);
    const raw = Array.isArray(payload?.projects)
      ? payload.projects
      : Array.isArray(payload)
        ? payload
        : null;

    if (!raw) {
      return sendJson(res, 502, { error: 'Unexpected response from Future Assist', projects: [] });
    }

    const projects = raw
      .filter(isPublic)
      .sort((a, b) => timeOf(b) - timeOf(a))
      .map((project) => normalize(project, origin));

    return sendJson(
      res,
      200,
      {
        projects,
        meta: {
          count: projects.length,
          builders: new Set(projects.map((p) => p.student.name)).size,
          source: 'https://futureassist.hashfuture.school/projects',
          fetchedAt: new Date().toISOString(),
        },
      },
      CACHE_SECONDS
    );
  } catch (err) {
    console.error('[showcase] upstream fetch failed:', err);
    const aborted = err?.name === 'AbortError';
    return sendJson(res, 502, {
      error: aborted ? 'Future Assist timed out' : 'Could not load projects from Future Assist',
      projects: [],
    });
  }
}
