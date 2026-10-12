// ============================================
// Renders the grouped navigation into every page that carries the shared
// navbar.
//
//   npm run nav:apply
//
// Thirty-odd pages share the same header markup, so the menu lives in one place
// (lib/page-chrome.js — the same module the city and global page builders use)
// and this script copies it into the pages on disk. It replaces two blocks only:
//
//   <div class="nav-links"> … </div>          the desktop menu
//   <div class="mobile-menu" id="mobileMenu"> … </div>
//
// Everything else — the logo, the CTA, the page's own scripts — is left exactly
// as it was, and the script is idempotent: running it twice changes nothing.
// It also makes sure each page loads search.css and search.js.
// ============================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { navLinksHtml, mobileMenuHtml } from '../lib/page-chrome.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const DRY_RUN = process.argv.includes('--dry-run');

/** Every page that ships the shared navbar, with the path back to the site root. */
function pages() {
    const found = [];

    fs.readdirSync(ROOT)
        .filter(name => name.endsWith('.html'))
        .forEach(name => found.push({ file: path.join(ROOT, name), prefix: '' }));

    const globalDir = path.join(ROOT, 'global');
    if (fs.existsSync(globalDir)) {
        fs.readdirSync(globalDir)
            .filter(name => name.endsWith('.html'))
            .forEach(name => found.push({ file: path.join(globalDir, name), prefix: '../' }));
    }

    return found;
}

/**
 * Replaces the element that starts on `openLine` (matched by `matcher`) with
 * `replacement`, closing at the next line that holds nothing but `</div>` at the
 * same indentation as the opening tag. Line based on purpose: the menu nests
 * divs, and a regular expression would stop at the first inner `</div>`.
 */
function replaceBlock(html, matcher, replacement) {
    const lines = html.split('\n');
    const start = lines.findIndex(line => matcher.test(line));
    if (start === -1) return { html, replaced: false };

    const indent = lines[start].match(/^\s*/)[0];
    let end = -1;
    for (let i = start + 1; i < lines.length; i += 1) {
        if (lines[i].trim() === '</div>' && lines[i].startsWith(`${indent}</div>`)) {
            end = i;
            break;
        }
    }
    if (end === -1) return { html, replaced: false };

    const next = [...lines.slice(0, start), ...replacement.split('\n'), ...lines.slice(end + 1)];
    return { html: next.join('\n'), replaced: true };
}

function ensureSearchAssets(html, prefix) {
    let next = html;

    if (!next.includes('search.css')) {
        const link = `    <link rel="stylesheet" href="${prefix}search.css">`;
        // Sit next to the main stylesheet where there is one, so the two load
        // together; otherwise just join the end of the head.
        next = /<link[^>]*href="[^"]*styles\.css[^"]*"[^>]*>/.test(next)
            ? next.replace(/(<link[^>]*href="[^"]*styles\.css[^"]*"[^>]*>)/, `$1\n${link}`)
            : next.replace(/(\n\s*<\/head>)/, `\n${link}$1`);
    }

    if (!next.includes('search.js')) {
        next = next.replace(/(\n\s*<\/body>)/, `\n    <script src="${prefix}search.js" defer></script>$1`);
    }

    return next;
}

let changed = 0;
let skipped = 0;

for (const page of pages()) {
    const original = fs.readFileSync(page.file, 'utf8');
    const name = path.relative(ROOT, page.file);

    if (!/class="nav-links"/.test(original)) {
        // The event pages (IJEC, Future Talks, Apply to Speak) carry their own
        // navigation, so there is no grouped menu to write — but if one of them
        // shows the search button it still needs search.css and search.js.
        if (/data-hf-search-open/.test(original)) {
            const withAssets = ensureSearchAssets(original, page.prefix);
            if (withAssets !== original) {
                changed += 1;
                console.log(`  ${name} (search assets only)`);
                if (!DRY_RUN) fs.writeFileSync(page.file, withAssets, 'utf8');
                continue;
            }
        }
        skipped += 1;
        continue;
    }

    let html = original;

    // Keep whatever this page already calls its booking CTA: the generated city
    // and global pages say "Schedule a Global Discovery Call" (most of their
    // readers are overseas), the hand-written ones say "Book a Free Demo".
    const ctaLabel = (original.match(/class="[^"]*nav-cta[^"]*"[^>]*>([^<]+)</) || [])[1]?.trim()
        || 'Book a Free Demo';

    const desktop = replaceBlock(html, /<div class="nav-links">/, navLinksHtml(page.prefix, '            '));
    html = desktop.html;

    const mobile = replaceBlock(
        html,
        /<div class="mobile-menu" id="mobileMenu">/,
        mobileMenuHtml(page.prefix, { ctaLabel, indent: '    ' })
    );
    html = mobile.html;

    html = ensureSearchAssets(html, page.prefix);

    if (html === original) {
        skipped += 1;
        continue;
    }

    changed += 1;
    console.log(`  ${name}${desktop.replaced ? '' : ' (no desktop menu found)'}${mobile.replaced ? '' : ' (no mobile menu found)'}`);
    if (!DRY_RUN) fs.writeFileSync(page.file, html, 'utf8');
}

console.log(`\n${DRY_RUN ? 'Would update' : 'Updated'} ${changed} page(s); ${skipped} already in order.`);
