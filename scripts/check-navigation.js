// ============================================
// Enforces the navigation rule: every page except the homepage must offer a
// visible route back to the homepage, in two forms:
//
//   npm run check:navigation
//
//   1. An ALWAYS-VISIBLE link in the header, outside any container that a media
//      query can hide (`.nav-links` is hidden below 1240px on some pages, and
//      `.mobile-menu` is hidden until opened). The logo normally satisfies this.
//   2. A LABELLED link back to the homepage in the navigation, mobile menu or
//      footer, so a parent can see an explicit way home rather than guessing that
//      the logo is clickable.
//
// Body-only links do not count: the impact report is nearly 20,000px tall, so a
// link buried in the middle is not a way back.
//
// The homepage itself (index.html) is exempt: it is the destination.
// ============================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const HOME_ISH = /^(?:\/|\.\/|\.\.\/)*(?:index\.html)?$/;

function htmlFiles() {
    const files = fs.readdirSync(ROOT)
        .filter(name => name.endsWith('.html'))
        .map(name => path.join(ROOT, name));
    const globalDir = path.join(ROOT, 'global');
    if (fs.existsSync(globalDir)) {
        fs.readdirSync(globalDir)
            .filter(name => name.endsWith('.html'))
            .forEach(name => files.push(path.join(globalDir, name)));
    }
    return files;
}

function resolvesToHome(href, fromDir) {
    const clean = href.split('#')[0].split('?')[0].trim();
    if (!clean) return false;
    if (!HOME_ISH.test(clean)) return false;
    const target = path.resolve(fromDir, clean || '.');
    try {
        const stat = fs.statSync(target);
        if (stat.isFile()) return path.basename(target).toLowerCase() === 'index.html';
        if (stat.isDirectory()) return fs.existsSync(path.join(target, 'index.html'));
    } catch {
        return false;
    }
    return false;
}

function block(html, className) {
    const match = html.match(new RegExp(`<div class="${className}"[^>]*>([\\s\\S]*?)</div>`));
    return match ? match[1] : '';
}

function anchors(fragment) {
    return [...fragment.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)].map(m => ({
        href: m[1],
        text: m[2].replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim()
    }));
}

const failures = [];
let checked = 0;

for (const file of htmlFiles()) {
    const relative = path.relative(ROOT, file);
    if (path.basename(file).toLowerCase() === 'index.html' && path.dirname(file) === ROOT) continue;

    const html = fs.readFileSync(file, 'utf8');
    const dir = path.dirname(file);
    checked += 1;

    const mainStart = html.indexOf('<main');
    const footerStart = html.lastIndexOf('<footer');
    const header = mainStart === -1 ? html : html.slice(0, mainStart);
    const footer = footerStart === -1 ? '' : html.slice(footerStart);

    // Rule 1: a home link in the header that no media query can hide.
    const hideable = block(header, 'nav-links') + block(header, 'mobile-menu');
    const alwaysVisible = header.replace(hideable, ' ');
    const alwaysVisibleHome = anchors(alwaysVisible).filter(a => resolvesToHome(a.href, dir));

    // Rule 2: an explicit, labelled route home in the nav, mobile menu or footer.
    const labelled = [
        ...anchors(header),
        ...anchors(footer)
    ].filter(a => resolvesToHome(a.href, dir) && a.text.length > 1);

    const problems = [];
    if (!alwaysVisibleHome.length) {
        problems.push('no always-visible home link in the header (a `.nav-links` or `.mobile-menu` link is hidden at some widths)');
    }
    if (!labelled.length) {
        problems.push('no labelled "Home" link in the nav, mobile menu or footer');
    }
    if (problems.length) {
        const anywhere = anchors(html).some(a => resolvesToHome(a.href, dir));
        failures.push(`${relative}: ${problems.join('; ')}${anywhere ? ' (a body-text link exists, which does not count)' : ''}`);
    }
}

if (failures.length) {
    console.error(`\ncheck:navigation FAILED - ${failures.length} page(s) cannot get back to the homepage:\n`);
    failures.forEach(failure => console.error('  x   ' + failure));
    process.exit(1);
}

console.log(`\ncheck:navigation passed - all ${checked} inner pages link back to the homepage from their own navigation.`);
