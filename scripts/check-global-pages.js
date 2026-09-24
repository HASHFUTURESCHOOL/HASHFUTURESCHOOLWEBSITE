// ============================================
// Verifies the generated /global/*.html pages.
//
//   npm run check:global
//
// Fails (exit code 1) if any page is missing, truncated, has a canonical that
// does not match its clean route, carries JSON-LD that differs from
// lib/seo-schema.js, has a direct answer outside the 40-50 word window, has an
// FAQ answer that disagrees with its schema, breaks the semantic HTML contract,
// or links to a file that does not exist.
// ============================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GLOBAL_PAGES, GLOBAL_HUB, SITE, buildJsonLd, buildHubJsonLd, wordCount } from '../lib/seo-schema.js';
import { findClaimViolations } from '../lib/claims-guard.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'global');

const failures = [];
const notes = [];

function fail(page, message) {
    failures.push(`${page}: ${message}`);
}

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

function normalise(text) {
    return decode(text).replace(/\s+/g, ' ').trim();
}

function countMatches(haystack, needle) {
    return haystack.split(needle).length - 1;
}

function resolveLocal(target, fromDir) {
    // Extension-less links are served by Vercel cleanUrls.
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

for (const page of GLOBAL_PAGES) {
    const file = path.join(OUT_DIR, page.slug + '.html');
    const label = page.route;

    if (!fs.existsSync(file)) {
        fail(label, 'generated file is missing - run `npm run build:global`');
        continue;
    }

    const html = fs.readFileSync(file, 'utf8');
    const targetDir = path.dirname(file);

    // --- structure -------------------------------------------------------
    if (!html.trimEnd().endsWith('</html>')) fail(label, 'output looks truncated (no closing </html>)');
    if (countMatches(html, '<!DOCTYPE html>') !== 1) fail(label, 'expected exactly one <!DOCTYPE html>');
    if (countMatches(html, '<main id="main">') !== 1) fail(label, 'expected exactly one <main id="main">');
    if (countMatches(html, '<h1') !== 1) fail(label, 'expected exactly one <h1>');
    for (const tag of ['<header class="gl-hero">', '<section', '<h2', '<h3', '<p', '<ul', '<ol', '<table', '<caption', '<tbody', '<footer']) {
        if (!html.includes(tag)) fail(label, `missing required semantic element ${tag}>`);
    }
    if (/lorem ipsum|TODO|PLACEHOLDER|FIXME|XXX_/i.test(html)) fail(label, 'placeholder text found in output');

    for (const violation of findClaimViolations(html).filter(v => v.severity === 'error')) {
        fail(label, `claim lint [${violation.id}]: "${violation.match}" - ${violation.reason}`);
    }

    // --- head / meta -----------------------------------------------------
    const canonical = `https://www.hashfuture.school${page.route}`;
    if (!html.includes(`<link rel="canonical" href="${canonical}">`)) {
        fail(label, `canonical link missing or not the clean route (${canonical})`);
    }
    if (!html.includes(`<title>${page.title}</title>`)) fail(label, 'title tag does not match the schema module');
    const metaDesc = html.match(/<meta name="description" content="([^"]*)">/);
    if (!metaDesc || normalise(metaDesc[1]) !== normalise(page.description)) {
        fail(label, 'meta description does not match the schema module');
    }
    const metaKeywords = html.match(/<meta name="keywords" content="([^"]*)">/);
    if (!metaKeywords || normalise(metaKeywords[1]) !== normalise(page.keywords)) {
        fail(label, 'meta keywords do not match the schema module');
    }

    // --- JSON-LD ---------------------------------------------------------
    const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
    if (blocks.length !== 1) fail(label, `expected exactly one JSON-LD block, found ${blocks.length}`);
    let parsedLd = null;
    for (const block of blocks) {
        try {
            parsedLd = JSON.parse(block[1]);
        } catch (error) {
            fail(label, `JSON-LD does not parse: ${error.message}`);
        }
    }
    if (parsedLd) {
        const expected = buildJsonLd(page);
        if (JSON.stringify(parsedLd) !== JSON.stringify(expected)) {
            fail(label, 'embedded JSON-LD differs from lib/seo-schema.js');
        }
        const graph = parsedLd['@graph'] || [];
        const types = graph.map(node => node['@type']);
        const flatTypes = types.flat();
        for (const required of ['EducationalOrganization', 'WebPage', 'BreadcrumbList', 'Service', 'FAQPage']) {
            if (!flatTypes.includes(required)) fail(label, `JSON-LD graph is missing a ${required} node`);
        }
        const org = graph.find(node => [node['@type']].flat().includes('EducationalOrganization'));
        if (!org || !Array.isArray(org.award) || !org.award.some(a => a.includes('World School Summit'))) {
            fail(label, 'EducationalOrganization award is missing the World School Summit recognition');
        }
        if (!org || !org.areaServed || !org.areaServed.some(a => a.name === 'Worldwide')) {
            fail(label, 'EducationalOrganization areaServed is not global');
        }
        if (!org || !org.hasOfferCatalog || org.hasOfferCatalog.itemListElement.length !== SITE.offerings.length) {
            fail(label, 'EducationalOrganization hasOfferCatalog does not list every programme');
        }
    }

    // --- FAQ: schema vs visible text -------------------------------------
    const faqSection = html.split('class="faq-section"')[1] || '';
    const visibleQuestions = [...faqSection.matchAll(/<span class="faq-label">([\s\S]*?)<\/span>/g)].map(m => normalise(m[1]));
    const visibleAnswers = [...faqSection.matchAll(/<div class="faq-answer"[^>]*>\s*<p>([\s\S]*?)<\/p>/g)].map(m => normalise(m[1]));
    if (page.faqs.length < 4 || page.faqs.length > 5) fail(label, `expected 4-5 FAQs, module has ${page.faqs.length}`);
    if (visibleQuestions.length !== page.faqs.length) {
        fail(label, `visible FAQ count (${visibleQuestions.length}) does not match the module (${page.faqs.length})`);
    }
    if (visibleAnswers.length !== page.faqs.length) {
        fail(label, `visible FAQ answer count (${visibleAnswers.length}) does not match the module (${page.faqs.length})`);
    }
    page.faqs.forEach((faq, index) => {
        if (visibleQuestions[index] && normalise(faq.q) !== visibleQuestions[index]) {
            fail(label, `FAQ ${index + 1} question text does not match the schema module`);
        }
        if (visibleAnswers[index] && normalise(faq.a) !== visibleAnswers[index]) {
            fail(label, `FAQ ${index + 1} answer does not match the schema module`);
        }
    });

    // --- FAQ accessibility ------------------------------------------------
    const buttons = [...faqSection.matchAll(/<button type="button" class="faq-question" id="([^"]+)" aria-expanded="[^"]*" aria-controls="([^"]+)">/g)];
    if (buttons.length !== page.faqs.length) {
        fail(label, `FAQ buttons are missing aria-expanded/aria-controls (${buttons.length} of ${page.faqs.length})`);
    }
    for (const [, , controls] of buttons) {
        if (!faqSection.includes(`id="${controls}"`)) fail(label, `aria-controls="${controls}" points at no element`);
    }
    if (!html.includes('class="skip-link"')) fail(label, 'skip link is missing');
    if (countMatches(html, '<img ') !== countMatches(html, ' alt=')) {
        fail(label, 'every <img> must carry an alt attribute');
    }
    const tableHeads = [...html.matchAll(/<th (?!scope=)/g)];
    if (tableHeads.length) fail(label, `${tableHeads.length} table header cell(s) missing a scope attribute`);

    // --- direct answer ----------------------------------------------------
    const answer = html.match(/<p class="answer-text"><strong>([\s\S]*?)<\/strong><\/p>/);
    if (!answer) {
        fail(label, 'direct answer block is missing');
    } else {
        const words = wordCount(decode(answer[1]));
        if (words < 40 || words > 50) fail(label, `direct answer is ${words} words (must be 40-50)`);
        else notes.push(`${label}: direct answer ${words} words`);
        if (normalise(answer[1]) !== normalise(page.directAnswer)) {
            fail(label, 'direct answer text does not match the schema module');
        }
    }

    // --- trust banner ------------------------------------------------------
    if (!html.includes(SITE.awardBanner)) fail(label, 'World School Summit trust banner is missing');
    if (!html.includes('Schedule a Global Discovery Call')) fail(label, 'primary global CTA is missing');

    // --- links and assets --------------------------------------------------
    for (const [attr, href] of [...html.matchAll(/(href|src)="([^"]+)"/g)].map(m => [m[1], m[2]])) {
        if (/^(https?:|mailto:|tel:|#|data:)/.test(href)) continue;
        const clean = href.split('#')[0].split('?')[0];
        if (!clean) continue;
        if (!resolveLocal(clean, targetDir)) fail(label, `broken ${attr}: ${href}`);
    }
}

// ---------------------------------------------------------------- report

// ---------------------------------------------------------------- hub page

{
    const label = GLOBAL_HUB.route;
    const hubFile = path.join(OUT_DIR, 'index.html');
    if (!fs.existsSync(hubFile)) {
        fail(label, 'hub page global/index.html is missing - run `npm run build:global`');
    } else {
        const html = fs.readFileSync(hubFile, 'utf8');
        const targetDir = path.dirname(hubFile);
        const canonical = SITE.url + GLOBAL_HUB.route;

        if (!html.trimEnd().endsWith('</html>')) fail(label, 'output looks truncated (no closing </html>)');
        if (countMatches(html, '<main id="main">') !== 1) fail(label, 'expected exactly one <main id="main">');
        if (countMatches(html, '<h1') !== 1) fail(label, 'expected exactly one <h1>');
        if (!html.includes(`<link rel="canonical" href="${canonical}">`)) fail(label, `canonical must be ${canonical}`);
        if (!html.includes(SITE.awardBanner)) fail(label, 'World School Summit trust banner is missing');
        if (/lorem ipsum|TODO|PLACEHOLDER|FIXME/i.test(html)) fail(label, 'placeholder text found in output');

        for (const violation of findClaimViolations(html).filter(v => v.severity === 'error')) {
            fail(label, `claim lint [${violation.id}]: "${violation.match}" - ${violation.reason}`);
        }

        const hubAnswer = html.match(/<p class="answer-text"><strong>([\s\S]*?)<\/strong><\/p>/);
        if (!hubAnswer) {
            fail(label, 'direct answer block is missing');
        } else {
            const words = wordCount(decode(hubAnswer[1]));
            if (words < 40 || words > 50) fail(label, `direct answer is ${words} words (must be 40-50)`);
            else notes.push(`${label}: direct answer ${words} words`);
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
            if (JSON.stringify(parsed) !== JSON.stringify(buildHubJsonLd())) {
                fail(label, 'embedded JSON-LD differs from lib/seo-schema.js');
            }
            const graph = parsed['@graph'] || [];
            const flatTypes = graph.map(node => node['@type']).flat();
            for (const required of ['EducationalOrganization', 'CollectionPage', 'BreadcrumbList', 'ItemList']) {
                if (!flatTypes.includes(required)) fail(label, `JSON-LD graph is missing a ${required} node`);
            }
            const itemList = graph.find(node => node['@type'] === 'ItemList');
            if (!itemList || itemList.numberOfItems !== GLOBAL_PAGES.length) {
                fail(label, 'ItemList does not cover every problem page');
            } else {
                const listedUrls = itemList.itemListElement.map(item => item.url);
                for (const page of GLOBAL_PAGES) {
                    const url = SITE.url + page.route;
                    if (!listedUrls.includes(url)) fail(label, `ItemList is missing ${url}`);
                }
            }
        }

        for (const [attr, href] of [...html.matchAll(/(href|src)="([^"]+)"/g)].map(m => [m[1], m[2]])) {
            if (/^(https?:|mailto:|tel:|#|data:)/.test(href)) continue;
            const clean = href.split('#')[0].split('?')[0];
            if (!clean) continue;
            if (!resolveLocal(clean, targetDir)) fail(label, `broken ${attr}: ${href}`);
        }
    }
}

// ---------------------------------------------------------------- report

// ------------------------------------------------- homepage entry points

{
    const label = 'index.html';
    const indexPath = path.join(ROOT, 'index.html');
    if (!fs.existsSync(indexPath)) {
        fail(label, 'index.html is missing');
    } else {
        const html = fs.readFileSync(indexPath, 'utf8');
        for (const page of GLOBAL_PAGES) {
            const href = 'global/' + page.slug;
            if (!html.includes(`href="${href}"`)) fail(label, `homepage does not link to ${page.route}`);
        }
        if (!html.includes('href="global"')) fail(label, 'homepage does not link to the /global hub');
        for (const [, href] of [...html.matchAll(/href="([^"]+)"/g)].map(m => [m[1], m[1]])) {
            if (href !== 'global' && !href.startsWith('global/')) continue;
            const clean = href.split('#')[0].split('?')[0];
            if (!resolveLocal(clean, ROOT)) fail(label, `broken link: ${href}`);
        }
    }
}

// ---------------------------------------------------------------- report

if (notes.length && !failures.length) notes.forEach(note => console.log('  ok  ' + note));

if (failures.length) {
    console.error(`\ncheck:global FAILED with ${failures.length} problem(s):\n`);
    failures.forEach(failure => console.error('  x   ' + failure));
    process.exit(1);
}

console.log(`\ncheck:global passed - ${GLOBAL_PAGES.length} pages, JSON-LD, FAQ parity, direct answers, semantics and links all verified.`);
