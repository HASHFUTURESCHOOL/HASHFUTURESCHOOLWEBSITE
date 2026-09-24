// ============================================
// Scans every HTML page for claim language that breaks our promises:
// accreditation claims, guarantees, outcome promises, hardcoded fees and
// unsourceable statistics.
//
//   npm run check:claims
//
// Errors in generated pages (global/, online-school-*) fail the run. Findings on
// hand-written legacy pages are reported for awareness, since editing those is a
// separate decision.
// ============================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GLOBAL_PAGES, GLOBAL_HUB } from '../lib/seo-schema.js';
import { CITY_PAGES, CITY_HUB, KERALA_ENTRY } from '../lib/city-schema.js';
import { findClaimViolations } from '../lib/claims-guard.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// Pages produced by the generators: a violation here is an error.
const generated = new Set([
    ...GLOBAL_PAGES.map(page => 'global/' + page.slug + '.html'),
    'global/index.html',
    ...CITY_PAGES.map(page => 'online-school-' + page.slug + '.html'),
    'online-school-cities.html'
]);

const files = [
    ...fs.readdirSync(ROOT).filter(name => name.endsWith('.html')).map(name => path.join(ROOT, name)),
    ...fs.readdirSync(path.join(ROOT, 'global')).filter(name => name.endsWith('.html')).map(name => path.join(ROOT, 'global', name))
];

const errors = [];
const notices = [];

for (const file of files) {
    const relative = path.relative(ROOT, file);
    const violations = findClaimViolations(fs.readFileSync(file, 'utf8'));
    const isGenerated = generated.has(relative);
    for (const violation of violations) {
        const line = `${relative} [${violation.id}] "${violation.match}"`;
        if (violation.severity === 'error' && isGenerated) {
            errors.push(line + ' -> ' + violation.reason + '\n        context: ' + violation.context);
        } else {
            notices.push(line + ' (' + violation.severity + ', ' + (isGenerated ? 'generated page, advisory' : 'hand-written page') + ')');
        }
    }
}

if (notices.length) {
    console.log('\nAdvisory findings on hand-written pages (not failures):\n');
    notices.forEach(notice => console.log('  i   ' + notice));
}

if (errors.length) {
    console.error(`\ncheck:claims FAILED with ${errors.length} claim problem(s) on generated pages:\n`);
    errors.forEach(error => console.error('  x   ' + error));
    process.exit(1);
}

console.log(`\ncheck:claims passed - ${files.length} pages scanned, no accreditation, guarantee or fee claims on generated pages.`);
