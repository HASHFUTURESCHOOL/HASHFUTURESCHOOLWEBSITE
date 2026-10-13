/**
 * Public read-only site data — one function for the two endpoints that serve it.
 *
 *   GET /api/site-data/content  ← /api/content   (editable homepage snippets)
 *   GET /api/posts              ← /api/site-data/posts (blog list and single posts)
 *   POST /api/site-data/search  ← the site search's "Ask AI" answer
 *
 * Both used to be separate files. This project sits at Vercel's limit of 12
 * serverless functions, so they were merged; `rewrites` in vercel.json keep the
 * old URLs working, which is why no page or link had to change.
 *
 * Both are also cached at the edge now. They are read-only public data, and the
 * uncached version cost every visitor a function invocation plus a database round
 * trip (measured: ~354ms versus ~135ms when the edge answers).
 */

import { getSql } from '../../lib/db.js';
import { ok, bad, notFound, send, serverError } from '../../lib/http.js';
import { chatCompletion } from '../../lib/deepseek.js';
import { geminiConfigured, generateAnswer } from '../../lib/gemini.js';
import {
  futureAssistSiteSearchUrl,
  futureAssistSiteSearchDisabled,
} from '../../lib/future-assist.js';

// Blog content changes deliberately and rarely; site snippets are edited in the
// CMS, so they get a shorter window. `stale-while-revalidate` means a visitor
// never waits for the refresh.
const CACHE = {
  posts: 'public, s-maxage=300, stale-while-revalidate=600',
  content: 'public, s-maxage=60, stale-while-revalidate=300',
};

export default async function handler(req, res) {
  const view = Array.isArray(req.query?.view) ? req.query.view[0] : req.query?.view;

  // Search answers a question, so it takes a POST body; everything else here is
  // read-only and takes a GET.
  if (view === 'search') {
    if (req.method !== 'POST') return bad(res, 'Method not allowed', 405);
    return search(req, res);
  }

  if (req.method !== 'GET') {
    return bad(res, 'Method not allowed', 405);
  }

  if (view === 'posts') return posts(req, res);
  if (view === 'content') return content(req, res);
  return notFound(res, 'Unknown view');
}

/** The blog: a list, a category, or one post by slug. */
async function posts(req, res) {
  const url = new URL(req.url, `http://${req.headers?.host || 'localhost'}`);
  const slug = url.searchParams.get('slug');
  const category = url.searchParams.get('category');

  try {
    const sql = getSql();

    if (slug) {
      const rows = await sql`
        SELECT * FROM posts
        WHERE slug = ${slug} AND published = true
        LIMIT 1
      `;
      if (!rows.length) return notFound(res, 'Post not found');
      return ok(res, { post: rows[0] }, { cacheControl: CACHE.posts });
    }

    const rows = category
      ? await sql`
          SELECT id, title, slug, excerpt, category, cover_image, author, published_at
          FROM posts
          WHERE published = true AND category = ${category}
          ORDER BY published_at DESC
        `
      : await sql`
          SELECT id, title, slug, excerpt, category, cover_image, author, published_at
          FROM posts
          WHERE published = true
          ORDER BY published_at DESC
        `;

    return ok(res, { posts: rows }, { cacheControl: CACHE.posts });
  } catch (err) {
    return serverError(res, err);
  }
}

/** Editable text snippets used across the site. */
async function content(req, res) {
  try {
    const sql = getSql();
    const rows = await sql`SELECT key, value FROM site_content`;
    const snippets = {};
    for (const row of rows) {
      snippets[row.key] = row.value;
    }
    return ok(res, { content: snippets }, { cacheControl: CACHE.content });
  } catch (err) {
    return serverError(res, err);
  }
}

/* --------------------------------------------------------------- site search */

/**
 * The "Ask AI" half of the site search.
 *
 * The panel does the retrieval: it matches the question against
 * search-index.json in the browser and sends the best passages here. That keeps
 * this function small — no index to bundle, no vector store — and means search
 * still works when the model does not.
 *
 * The model is told to answer only from those passages, so it cannot invent a
 * fee, a date or a policy that the site does not state.
 */

const MAX_QUESTION = 300;
const MAX_SOURCES = 5;
const MAX_SOURCE_CHARS = 900;

// Best effort on a serverless platform (each instance keeps its own count), but
// enough to stop a loop from burning the model budget.
const RATE_LIMIT = { windowMs: 60_000, max: 12 };
const hits = new Map();

function rateLimited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter(at => now - at < RATE_LIMIT.windowMs);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 500) {
    for (const [key, value] of hits) {
      if (!value.some(at => now - at < RATE_LIMIT.windowMs)) hits.delete(key);
    }
  }
  return recent.length > RATE_LIMIT.max;
}

const clean = (value, max) => String(value == null ? '' : value).replace(/\s+/g, ' ').trim().slice(0, max);

function safeUrl(value) {
  const url = clean(value, 300);
  if (!url) return '';
  // Only this site's own pages: a model answer must never send a family off-site.
  if (/^https?:\/\//i.test(url)) return /^https?:\/\/(www\.)?hashfuture\.school\//i.test(url) ? url : '';
  return url.startsWith('/') && !url.startsWith('//') ? url : '';
}

async function search(req, res) {
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const question = clean(body.q, MAX_QUESTION);
  const sources = (Array.isArray(body.sources) ? body.sources : [])
    .slice(0, MAX_SOURCES)
    .map(source => ({
      title: clean(source?.title, 160),
      url: safeUrl(source?.url),
      text: clean(source?.text, MAX_SOURCE_CHARS),
    }))
    .filter(source => source.title && source.url && source.text);

  if (question.length < 3) return bad(res, 'Ask a question first');
  if (!sources.length) return bad(res, 'No matching pages to answer from');

  const ip = String(req.headers?.['x-forwarded-for'] || '').split(',')[0].trim()
    || req.socket?.remoteAddress || 'unknown';
  if (rateLimited(ip)) {
    return send(res, 429, {
      error: 'That is a lot of questions at once — please wait a moment and try again.',
    });
  }

  const passages = sources
    .map((source, index) => `[${index + 1}] ${source.title} (${source.url})\n${source.text}`)
    .join('\n\n');

  const question_ = `Question: ${question}\n\nPassages:\n${passages}`;

  // Which provider answers, in order: Gemini on this deployment, then DeepSeek on
  // this deployment, then Future Assist, which holds both keys. A provider that
  // fails — no key, a rate limit, a timeout — hands over to the next, so the
  // visitor gets an answer from whichever one is healthy.
  if (geminiConfigured()) {
    try {
      const answer = await generateAnswer({ system: SYSTEM_PROMPT, prompt: question_ });
      return send(res, 200, shapeAnswer(answer, sources, 'gemini'));
    } catch (err) {
      console.error('[site-search] Gemini could not answer:', err?.message || err);
    }
  }

  if (process.env.DEEPSEEK_API_KEY) {
    try {
      const answer = await chatCompletion({
        temperature: 0.2,
        max_tokens: 420,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: question_ },
        ],
      });
      return send(res, 200, shapeAnswer(answer, sources, 'deepseek'));
    } catch (err) {
      console.error('[site-search] DeepSeek could not answer:', err?.message || err);
    }
  }

  if (futureAssistSiteSearchDisabled()) {
    return send(res, 503, { error: 'The assistant is switched off right now.' });
  }
  const forwarded = await answerViaFutureAssist(question, sources);
  if (forwarded) return send(res, 200, forwarded);
  return send(res, 503, { error: 'The assistant is unavailable right now.' });
}

/** The prompt every provider gets. The rule that matters: the site's words only. */
const SYSTEM_PROMPT = [
  'You are the assistant inside the Hash Future School website (hashfuture.school), a school in Kochi, Kerala that teaches families worldwide online.',
  'Answer the visitor\'s question using ONLY the numbered passages given to you. They are the site\'s own words.',
  'If the passages do not answer the question, say plainly that the site does not cover it yet, point at the closest passage, and suggest WhatsApp +91 94971 20591 or learn@hashfuture.school.',
  'Never invent fees, dates, deadlines, policies, addresses or contact details.',
  'Write 2 to 5 short sentences, or up to three short bullet points. Warm, plain English, no filler, no headings.',
  'Cite the passages you used with their numbers in square brackets, like [1].',
].join(' ');

/**
 * The answer, trimmed to what the panel shows, with the pages the model actually
 * cited. `provider` is for us, not the visitor: the panel ignores what it does not
 * know, and it makes a live check say which path answered.
 */
function shapeAnswer(answer, sources, provider) {
  const cited = [...new Set((String(answer).match(/\[(\d)\]/g) || [])
    .map(marker => Number(marker.replace(/\D/g, '')) - 1)
    .filter(index => index >= 0 && index < sources.length))]
    .map(index => sources[index]);

  return {
    answer: clean(answer, 1400).replace(/\s*(\[\d\])/g, ' $1'),
    sources: (cited.length ? cited : sources.slice(0, 3)).map(source => ({
      title: source.title,
      url: source.url,
    })),
    provider,
  };
}

/**
 * The same question, asked of Future Assist — the deployment that holds the model
 * key. Returns null when it cannot answer, so the panel falls back to the pages
 * it already found rather than showing an error it cannot explain.
 */
async function answerViaFutureAssist(question, sources) {
  const url = futureAssistSiteSearchUrl();
  const headers = { 'Content-Type': 'application/json' };
  const key = (process.env.FUTURE_ASSIST_SITE_SEARCH_KEY
    || process.env.FUTURE_ASSIST_SCHOOL_CONNECT_KEY
    || '').trim();
  if (key) headers['x-hfs-sync-key'] = key;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ q: question, sources }),
      // An interactive answer: the visitor is watching the panel.
      signal: AbortSignal.timeout(18000),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data?.answer) {
      console.error(`[site-search] Future Assist answered ${response.status}: ${data?.error || 'no answer'}`);
      return null;
    }
    return {
      answer: data.answer,
      sources: Array.isArray(data.sources) ? data.sources : [],
      provider: 'future-assist',
    };
  } catch (err) {
    console.error(`[site-search] could not reach Future Assist (${url}):`, err?.message || err);
    return null;
  }
}
