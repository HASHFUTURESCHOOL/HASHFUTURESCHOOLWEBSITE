// ============================================
// Verifies the generated city / region landing pages.
//
//   npm run check:city
//
// Fails (exit code 1) if a page is missing, truncated, has a canonical that does
// not match its clean route, carries JSON-LD that differs from
// lib/city-schema.js, has a direct answer outside the 40-50 word window, has an
// FAQ answer that disagrees with its schema, breaks the semantic/accessibility
// contract, links to a file that does not exist, or if the city hub does not
// cover every page.
// ============================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    CITY_PAGES, CITY_HUB, KERALA_ENTRY,
    buildCityJsonLd, buildCityHubJsonLd
} from '../lib/city-schema.js';
import { SITE, wordCount } from '../lib/seo-schema.js';
import { findClaimViolations } from '../lib/claims-guard.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const failures = [];
const notes = [];

const fail = (label, message) => failures.push(`${label}: ${message}`);

function decode(text) {
    return String(text)
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;|&rsquo;|&lsquo;/g, "'")
        .replace(/&mdash;/g, '-')
        .replace(/&middot;/g, '.')
        .replace(/&rarr;/g, '->');
}

const normalise = text => decode(text).replace(/\s+/g, ' ').trim();
const count = (haystack, needle) => haystack.split(needle).length - 1;

function fileFor(page) {
    return path.join(ROOT, page.slug === 'kerala' ? 'online-school-kerala.html' : `online-school-${page.slug}.html`);
}

function resolveLocal(target, fromDir) {
    const direct = path.resolve(fromDir, target);
    const candidates = [direct, direct + '.html', path.join(direct, 'index.html')];
    return candidates.some(candidate => {
        try {
            return fs.statSync(candidate).isFile();
        } catch {
            return false;
        }
    });
}

function checkSharedContract(label, html, { table = true } = {}) {
    if (!html.trimEnd().endsWith('</html>')) fail(label, 'output looks truncated (no closing </html>)');
    if (count(html, '<!DOCTYPE html>') !== 1) fail(label, 'expected exactly one <!DOCTYPE html>');
    if (count(html, '<main id="main">') !== 1) fail(label, 'expected exactly one <main id="main">');
    if (count(html, '<h1') !== 1) fail(label, 'expected exactly one <h1>');
    const required = ['<header class="gl-hero">', '<section', '<h2', '<h3', '<p', '<ul', '<footer'];
    if (table) required.push('<table', '<caption', '<tbody');
    for (const tag of required) {
        if (!html.includes(tag)) fail(label, `missing required semantic element ${tag}>`);
    }
    if (/lorem ipsum|TODO|PLACEHOLDER|FIXME|undefined|\[object Object\]/i.test(html)) {
        fail(label, 'placeholder, undefined or unrendered value found in output');
    }
    if (!html.includes(SITE.awardBanner)) fail(label, 'World School Summit trust banner is missing');
    if (!html.includes('Schedule a Global Discovery Call')) fail(label, 'primary global CTA is missing');
    if (!html.includes('class="skip-link"')) fail(label, 'skip link is missing');
    if (count(html, '<img ') !== count(html, ' alt=')) fail(label, 'every <img> must carry an alt attribute');
    const unscoped = [...html.matchAll(/<th (?!scope=)/g)];
    if (unscoped.length) fail(label, `${unscoped.length} table header cell(s) missing a scope attribute`);

    for (const violation of findClaimViolations(html).filter(v => v.severity === 'error')) {
        fail(label, `claim lint [${violation.id}]: "${violation.match}" - ${violation.reason}`);
    }
}

function checkFaqs(label, html, faqs, idPrefix = 'faq') {
    const section = html.split('class="faq-section"')[1] || '';
    const questions = [...section.matchAll(/<span class="faq-label">([\s\S]*?)<\/span>/g)].map(m => normalise(m[1]));
    const answers = [...section.matchAll(/<div class="faq-answer"[^>]*>\s*<p>([\s\S]*?)<\/p>/g)].map(m => normalise(m[1]));
    if (questions.length !== faqs.length) fail(label, `visible FAQ count (${questions.length}) does not match the module (${faqs.length})`);
    if (answers.length !== faqs.length) fail(label, `visible FAQ answer count (${answers.length}) does not match the module (${faqs.length})`);
    faqs.forEach((faq, index) => {
        if (questions[index] && normalise(faq.q) !== questions[index]) fail(label, `FAQ ${index + 1} question does not match the schema module`);
        if (answers[index] && normalise(faq.a) !== answers[index]) fail(label, `FAQ ${index + 1} answer does not match the schema module`);
    });
    const buttons = [...section.matchAll(/<button type="button" class="faq-question" id="([^"]+)" aria-expanded="[^"]*" aria-controls="([^"]+)">/g)];
    if (buttons.length !== faqs.length) fail(label, `FAQ buttons missing aria-expanded/aria-controls (${buttons.length} of ${faqs.length})`);
    for (const [, , controls] of buttons) {
        if (!section.includes(`id="${controls}"`)) fail(label, `aria-controls="${controls}" points at no element`);
    }
    if (buttons.length && !buttons.every(([, id]) => id.startsWith(idPrefix))) {
        fail(label, `unexpected FAQ id prefix (expected "${idPrefix}")`);
    }
}

function checkLinks(label, html, fromDir) {
    for (const [, href] of [...html.matchAll(/(href|src)="([^"]+)"/g)].map(m => [m[1], m[2]])) {
        if (/^(https?:|mailto:|tel:|#|data:)/.test(href)) continue;
        const clean = href.split('#')[0].split('?')[0];
        if (!clean) continue;
        if (!resolveLocal(clean, fromDir)) fail(label, `broken link: ${href}`);
    }
}

// ---------------------------------------------------------------- city pages

for (const page of CITY_PAGES) {
    const label = page.route;
    const file = fileFor(page);
    if (!fs.existsSync(file)) {
        fail(label, 'generated file is missing - run `npm run build:city`');
        continue;
    }
    const html = fs.readFileSync(file, 'utf8');
    const dir = path.dirname(file);
    const canonical = SITE.url + page.route;

    checkSharedContract(label, html);

    if (!html.includes(`<link rel="canonical" href="${canonical}">`)) fail(label, `canonical must be ${canonical}`);
    if (!html.includes(`<title>${page.title}</title>`)) fail(label, 'title tag does not match the schema module');
    const desc = html.match(/<meta name="description" content="([^"]*)">/);
    if (!desc || normalise(desc[1]) !== normalise(page.description)) fail(label, 'meta description does not match the schema module');
    const keywords = html.match(/<meta name="keywords" content="([^"]*)">/);
    if (!keywords || normalise(keywords[1]) !== normalise(page.keywords)) fail(label, 'meta keywords do not match the schema module');

    const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
    if (blocks.length !== 1) fail(label, `expected exactly one JSON-LD block, found ${blocks.length}`);
    let parsed = null;
    for (const block of blocks) {
        try {
            parsed = JSON.parse(block[1]);
        } catch (error) {
            fail(label, `JSON-LD does not parse: ${error.message}`);
        }
    }
    if (parsed) {
        if (JSON.stringify(parsed) !== JSON.stringify(buildCityJsonLd(page))) {
            fail(label, 'embedded JSON-LD differs from lib/city-schema.js');
        }
        const graph = parsed['@graph'] || [];
        const types = graph.map(node => node['@type']).flat();
        for (const required of ['EducationalOrganization', 'WebPage', 'BreadcrumbList', 'Service', 'FAQPage']) {
            if (!types.includes(required)) fail(label, `JSON-LD graph is missing a ${required} node`);
        }
        const service = graph.find(node => node['@type'] === 'Service');
        const served = service?.areaServed || [];
        if (!served.some(area => area.name === page.city || area.name === page.country)) {
            fail(label, 'Service areaServed does not name the city or country');
        }
        const org = graph.find(node => [node['@type']].flat().includes('EducationalOrganization'));
        if (!org?.award?.some(a => a.includes('World School Summit'))) {
            fail(label, 'EducationalOrganization award is missing the World School Summit recognition');
        }
    }

    const answer = html.match(/<p class="answer-text"><strong>([\s\S]*?)<\/strong><\/p>/);
    if (!answer) {
        fail(label, 'direct answer block is missing');
    } else {
        const words = wordCount(decode(answer[1]));
        if (words < 40 || words > 50) fail(label, `direct answer is ${words} words (must be 40-50)`);
        else notes.push(`${label}: ${words} words`);
        if (normalise(answer[1]) !== normalise(page.directAnswer)) fail(label, 'direct answer does not match the schema module');
    }

    checkFaqs(label, html, page.faqs);
    checkLinks(label, html, dir);
}

// ---------------------------------------------------------------- hub page

{
    const label = CITY_HUB.route;
    const hubFile = path.join(ROOT, 'online-school-cities.html');
    if (!fs.existsSync(hubFile)) {
        fail(label, 'hub page online-school-cities.html is missing - run `npm run build:city`');
    } else {
        const html = fs.readFileSync(hubFile, 'utf8');
        const canonical = SITE.url + CITY_HUB.route;
        checkSharedContract(label, html, { table: false });
        if (!html.includes(`<link rel="canonical" href="${canonical}">`)) fail(label, `canonical must be ${canonical}`);
        if (!html.includes(`<title>${CITY_HUB.title}</title>`)) fail(label, 'title tag does not match the schema module');

        const answer = html.match(/<p class="answer-text"><strong>([\s\S]*?)<\/strong><\/p>/);
        if (!answer) {
            fail(label, 'direct answer block is missing');
        } else {
            const words = wordCount(decode(answer[1]));
            if (words < 40 || words > 50) fail(label, `direct answer is ${words} words (must be 40-50)`);
            else notes.push(`${label}: ${words} words`);
        }

        const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
        let parsed = null;
        if (blocks.length !== 1) fail(label, `expected exactly one JSON-LD block, found ${blocks.length}`);
        for (const block of blocks) {
            try {
                parsed = JSON.parse(block[1]);
            } catch (error) {
                fail(label, `JSON-LD does not parse: ${error.message}`);
            }
        }
        if (parsed) {
            if (JSON.stringify(parsed) !== JSON.stringify(buildCityHubJsonLd())) {
                fail(label, 'embedded JSON-LD differs from lib/city-schema.js');
            }
            const graph = parsed['@graph'] || [];
            const types = graph.map(node => node['@type']).flat();
            for (const required of ['EducationalOrganization', 'CollectionPage', 'BreadcrumbList', 'ItemList', 'FAQPage']) {
                if (!types.includes(required)) fail(label, `JSON-LD graph is missing a ${required} node`);
            }
            const itemList = graph.find(node => node['@type'] === 'ItemList');
            const expectedItems = [...CITY_PAGES, KERALA_ENTRY];
            if (!itemList || itemList.numberOfItems !== expectedItems.length) {
                fail(label, `ItemList should cover all ${expectedItems.length} pages`);
            } else {
                const urls = itemList.itemListElement.map(item => item.url);
                for (const page of expectedItems) {
                    const url = SITE.url + page.route;
                    if (!urls.includes(url)) fail(label, `ItemList is missing ${url}`);
                }
            }
        }

        checkFaqs(label, html, CITY_HUB.faqs, 'hub-faq');
        checkLinks(label, html, ROOT);

        // Every city page must be linked from the hub.
        for (const page of [...CITY_PAGES, KERALA_ENTRY]) {
            const href = page.href || ('online-school-' + page.slug);
            if (!html.includes(`href="${href}"`)) fail(label, `hub does not link to ${href}`);
        }
        // ...and the Kerala page must still exist, since the hub links it.
        if (!fs.existsSync(path.join(ROOT, 'online-school-kerala.html'))) {
            fail(label, 'online-school-kerala.html is missing but linked from the hub');
        }
    }
}

// ------------------------------------------------- homepage entry points

{
    const label = 'index.html';
    const indexPath = path.join(ROOT, 'index.html');
    if (!fs.existsSync(indexPath)) {
        fail(label, 'index.html is missing');
    } else {
        const html = fs.readFileSync(indexPath, 'utf8');
        if (!html.includes('href="online-school-cities"')) fail(label, 'homepage does not link to the city hub');
        for (const page of CITY_PAGES) {
            const href = `online-school-${page.slug}`;
            if (!html.includes(`href="${href}"`)) fail(label, `homepage does not link to ${page.route}`);
        }
    }
}

// ---------------------------------------------------------------- report

if (notes.length && !failures.length) notes.forEach(note => console.log('  ok  ' + note));

if (failures.length) {
    console.error(`\ncheck:city FAILED with ${failures.length} problem(s):\n`);
    failures.forEach(failure => console.error('  x   ' + failure));
    process.exit(1);
}

console.log(`\ncheck:city passed - ${CITY_PAGES.length} city pages + hub, JSON-LD, FAQ parity, direct answers, semantics and links verified.`);
