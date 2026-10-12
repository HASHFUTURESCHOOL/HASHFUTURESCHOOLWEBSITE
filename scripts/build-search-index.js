// ============================================
// Builds search-index.json — the text of every page on the site, ready for the
// in-page search.
//
//   npm run search:index
//
// The site is static, so the browser cannot read the other pages without
// fetching them all. This script does that reading once, here, and writes a
// small JSON file the search panel loads in one request:
//
//   { "url": "/about", "title": "About Us", "headings": [...],
//     "sections": [{ "heading": "...", "text": "..." }], "text": "..." }
//
// Navigation, footers, scripts and the booking dialog are stripped: the index
// is what a visitor can read, not the chrome around it. Run it after changing a
// page's copy — the local dev server also refreshes it on start, so the file in
// git stays honest.
// ============================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// The CMS (noindex) and the blog post shell (its content is fetched at runtime
// and is folded in by the search panel itself) are not pages to read.
const SKIP = new Set(['admin.html', 'blog-post.html']);

const MAX_SECTION_CHARS = 520;
const MAX_SECTIONS = 24;

const decode = value => String(value)
    .replace(/&nbsp;/g, ' ')
    .replace(/&mdash;|&ndash;/g, '—')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&middot;/g, '·')
    .replace(/&hellip;/g, '…');

const text = value => decode(value)
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** Drops a whole element, including its content, by tag name. */
const dropTag = (html, tag) => html.replace(new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?</${tag}>`, 'gi'), ' ');

/** Drops one element by an attribute match (the booking dialog, the CMS bar). */
const dropByAttribute = (html, pattern) => {
    const start = html.search(pattern);
    if (start === -1) return html;
    // Walk forward to the matching close of the element that starts here.
    const tagMatch = html.slice(start).match(/^<(\w+)/);
    if (!tagMatch) return html;
    const tag = tagMatch[1];
    let depth = 0;
    let index = start;
    const open = new RegExp(`<${tag}\\b`, 'gi');
    const close = new RegExp(`</${tag}>`, 'gi');
    const events = [];
    let hit;
    while ((hit = open.exec(html))) events.push({ at: hit.index, type: 'open' });
    while ((hit = close.exec(html))) events.push({ at: hit.index, type: 'close' });
    events.sort((a, b) => a.at - b.at || (a.type === 'close' ? -1 : 1));
    for (const event of events) {
        if (event.at < index) continue;
        if (event.type === 'open') depth += 1;
        else {
            depth -= 1;
            if (depth === 0) {
                return html.slice(0, start) + ' ' + html.slice(event.at + tag.length + 3);
            }
        }
    }
    return html;
};

function readableBody(html) {
    let body = html;
    body = body.replace(/<!--[\s\S]*?-->/g, ' ');
    ['script', 'style', 'noscript', 'template', 'svg', 'nav', 'footer', 'aside', 'form'].forEach(tag => {
        body = dropTag(body, tag);
    });
    body = dropByAttribute(body, /<div[^>]*id="admissionModal"/);
    body = body.replace(/<a[^>]*class="[^"]*skip-link[^"]*"[^>]*>[\s\S]*?<\/a>/gi, ' ');
    body = dropByAttribute(body, /<div[^>]*class="[^"]*top-bar/);
    body = dropByAttribute(body, /<div[^>]*class="[^"]*mobile-menu/);
    body = dropByAttribute(body, /<div[^>]*class="[^"]*sticky/);
    const match = body.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    return match ? match[1] : body;
}

/**
 * Turns the readable body into (heading, text) sections.
 *
 * The copy on these pages is not all paragraphs: a lot of it is `<div><strong>…`
 * rows — the IJEC timeline, the fee cards, the city facts. So the body is
 * flattened at block boundaries first and then cut into sections wherever one of
 * the page's own headings appears, which keeps the timeline text searchable
 * instead of silently dropping it.
 */
function sectionsFrom(body) {
    const headingTexts = [...body.matchAll(/<h[1-4]\b[^>]*>([\s\S]*?)<\/h[1-4]>/gi)]
        .map(match => text(match[1]).toLowerCase())
        .filter(Boolean);

    const flattened = decode(body
        .replace(/<\/(p|div|li|section|tr|h[1-6]|article|blockquote|td|dt|dd|figcaption)>/gi, '\n')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]*>/g, ' '))
        .split('\n')
        .map(line => line.replace(/\s+/g, ' ').trim())
        .filter(line => line.length > 1);

    const pieces = [];
    let current = { heading: '', text: '' };

    const push = () => {
        // A long run of text with no heading in it — a batch table, a fee list —
        // becomes several sections rather than being cut off at the cap, so the
        // last row of the table is as searchable as the first.
        let value = current.text.trim();
        while (value.length > 60) {
            pieces.push({ heading: current.heading, text: value.slice(0, MAX_SECTION_CHARS) });
            value = value.slice(MAX_SECTION_CHARS).trim();
        }
        current = { heading: current.heading, text: '' };
    };

    for (const line of flattened) {
        const lower = line.toLowerCase();
        const isHeading = headingTexts.includes(lower) && line.length <= 120;
        if (isHeading) {
            push();
            current = { heading: line.slice(0, 120), text: '' };
        } else {
            current.text += (current.text ? ' ' : '') + line;
            if (current.text.length > MAX_SECTION_CHARS * 2) push();
        }
    }
    push();

    // Long pages: keep the sections with the most substance, in page order.
    if (pieces.length > MAX_SECTIONS) {
        const keep = new Set(
            pieces.map((piece, index) => ({ index, weight: piece.text.length + (piece.heading ? 120 : 0) }))
                .sort((a, b) => b.weight - a.weight)
                .slice(0, MAX_SECTIONS)
                .map(entry => entry.index)
        );
        return pieces.filter((_, index) => keep.has(index));
    }
    return pieces;
}

function buildPage(file, url) {
    const html = fs.readFileSync(file, 'utf8');
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const descriptionMatch = html.match(/<meta\s+name="description"\s+content="([^"]*)"/i)
        || html.match(/<meta\s+content="([^"]*)"\s+name="description"/i);

    const body = readableBody(html);
    const sections = sectionsFrom(body);

    const headings = [...new Set(sections.map(section => section.heading).filter(Boolean))].slice(0, 12);

    return {
        url,
        // The address is a keyword nobody puts in the copy — a family searching
        // "ijec" is looking for /ijec, and the page never says "ijec" in a
        // heading. Split the slug so that works.
        keywords: url.split(/[/\-]/).map(part => part.trim().toLowerCase()).filter(part => part.length > 2),
        title: text(titleMatch ? titleMatch[1] : path.basename(file, '.html')).slice(0, 160),
        description: text(descriptionMatch ? descriptionMatch[1] : '').slice(0, 300),
        headings,
        sections,
        // One flat field keeps the matcher simple and fast; sections keep the
        // kind of page (report vs programme) out of the scoring.
        text: sections.map(section => `${section.heading ? section.heading + ': ' : ''}${section.text}`).join(' ').slice(0, 2400),
    };
}

const pages = [];

for (const name of fs.readdirSync(ROOT).filter(name => name.endsWith('.html')).sort()) {
    if (SKIP.has(name)) continue;
    const file = path.join(ROOT, name);
    const url = name === 'index.html' ? '/' : `/${name.replace(/\.html$/, '')}`;
    pages.push(buildPage(file, url));
}

const globalDir = path.join(ROOT, 'global');
if (fs.existsSync(globalDir)) {
    for (const name of fs.readdirSync(globalDir).filter(name => name.endsWith('.html')).sort()) {
        const file = path.join(globalDir, name);
        pages.push(buildPage(file, `/global/${name.replace(/\.html$/, '')}`));
    }
}

const document = {
    generatedAt: new Date().toISOString(),
    generator: 'scripts/build-search-index.js',
    pages,
};

const outFile = path.join(ROOT, 'search-index.json');
const serialised = `${JSON.stringify(document, null, 1)}\n`;
const previous = fs.existsSync(outFile) ? fs.readFileSync(outFile, 'utf8') : '';

// The timestamp must not make every run a change, or the file in git would look
// dirty after any local start. Compare without it.
const stripTimestamp = value => value.replace(/"generatedAt": "[^"]*",\n/, '');
if (stripTimestamp(previous) === stripTimestamp(serialised)) {
    console.log(`search-index.json already current — ${pages.length} pages.`);
} else {
    fs.writeFileSync(outFile, serialised, 'utf8');
    console.log(`Wrote search-index.json — ${pages.length} pages, ${Math.round(serialised.length / 1024)} KB.`);
}
