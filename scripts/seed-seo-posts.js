// ============================================
// Publishes the editorial posts from the SEO content calendar.
//
//   npm run seed:seo-posts              # publish (points at DATABASE_URL)
//   npm run seed:seo-posts -- --draft   # create as drafts for review in /admin
//
// Body copy lives in content/posts/*.md so it can be reviewed and edited as
// prose. Running the script against the local DATABASE_URL previews the posts on
// the local site; running it with the production URL publishes them.
//
// Every body is gated before insert: the claims guard must pass, the post must
// carry descriptive internal links, and the direct answer must lead.
// ============================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getSql, databaseUrl } from '../lib/db.js';
import { findClaimViolations } from '../lib/claims-guard.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

export const POSTS = [
    {
        slug: 'nios-vs-regular-board',
        file: 'content/posts/nios-vs-regular-board.md',
        title: 'NIOS vs Regular Board: Which Is Better for Your Child in 2026?',
        excerpt: 'An honest comparison of the open board and a conventional school board - daily structure, subject choice, exam timing, university admissions, and which one actually suits your child.',
        category: 'Open Schooling',
        cover_image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1200&h=630&fit=crop',
        mustLink: ['https://www.hashfuture.school/nios-online-school']
    },
    {
        slug: 'how-ai-is-changing-homeschooling-in-india',
        file: 'content/posts/how-ai-is-changing-homeschooling-in-india.md',
        title: 'How AI Is Changing Homeschooling in India',
        excerpt: 'AI did not change what children need to learn, it changed what a parent can realistically deliver at home. What responsible AI use looks like at 9, 12 and 15 - and how to tell help from replacement.',
        category: 'AI & Learning',
        cover_image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200&h=630&fit=crop',
        mustLink: ['https://www.hashfuture.school/ai-first-learning']
    }
];

const MIN_WORDS = 800;
const MAX_WORDS = 1800;
const MIN_INTERNAL_LINKS = 3;

function words(text) {
    return text.replace(/[#*_[\]()]/g, ' ').split(/\s+/).filter(Boolean).length;
}

function directAnswerWords(body) {
    const first = body.split('\n').find(line => line.trim());
    return words(first || '');
}

function gate(post, body) {
    const problems = [];

    for (const violation of findClaimViolations(body).filter(v => v.severity === 'error')) {
        problems.push(`claim lint [${violation.id}]: "${violation.match}" - ${violation.reason}`);
    }

    const count = words(body);
    if (count < MIN_WORDS || count > MAX_WORDS) problems.push(`body is ${count} words (want ${MIN_WORDS}-${MAX_WORDS})`);

    const lead = directAnswerWords(body);
    if (lead > 80) problems.push(`opening answer is ${lead} words; a snippet-friendly answer should be under 80`);

    const internal = [...body.matchAll(/\]\((https:\/\/www\.hashfuture\.school[^)]*)\)/g)].map(m => m[1]);
    if (internal.length < MIN_INTERNAL_LINKS) {
        problems.push(`only ${internal.length} internal links; the strategy calls for at least ${MIN_INTERNAL_LINKS}`);
    }
    for (const required of post.mustLink) {
        if (!internal.some(href => href.startsWith(required))) problems.push(`missing the link to its cluster page (${required})`);
    }

    if (/lorem ipsum|TODO|PLACEHOLDER|FIXME/i.test(body)) problems.push('placeholder text found');
    if (!body.trimEnd().endsWith('](' + 'https://www.hashfuture.school/#enroll)') && !body.includes('https://www.hashfuture.school/#enroll')) {
        problems.push('no demo CTA at the end');
    }

    return { problems, internal };
}

async function main() {
    const draft = process.argv.includes('--draft');
    const target = databaseUrl();
    if (!target) throw new Error('No database URL configured');

    const host = (() => {
        try {
            return new URL(target).host;
        } catch {
            return 'unparseable-url';
        }
    })();

    console.log(`Target database: ${host}`);
    console.log(`Mode: ${draft ? 'draft (unpublished)' : 'published'}\n`);

    const sql = getSql();
    let failed = false;

    for (const post of POSTS) {
        const body = fs.readFileSync(path.join(ROOT, post.file), 'utf8').trim();
        const { problems, internal } = gate(post, body);

        if (problems.length) {
            failed = true;
            console.error(`refusing to insert ${post.slug}:`);
            problems.forEach(problem => console.error('  x ' + problem));
            continue;
        }

        const rows = await sql`
            INSERT INTO posts (title, slug, excerpt, category, cover_image, body, author, published, published_at)
            VALUES (
                ${post.title}, ${post.slug}, ${post.excerpt}, ${post.category}, ${post.cover_image},
                ${body}, ${'Hash Future School'}, ${!draft}, ${draft ? null : new Date().toISOString()}
            )
            ON CONFLICT (slug) DO UPDATE SET
                title = EXCLUDED.title,
                excerpt = EXCLUDED.excerpt,
                category = EXCLUDED.category,
                cover_image = EXCLUDED.cover_image,
                body = EXCLUDED.body,
                published = EXCLUDED.published,
                published_at = COALESCE(posts.published_at, EXCLUDED.published_at),
                updated_at = now()
            RETURNING id, slug, published
        `;
        const saved = rows[0].rows ? rows[0].rows[0] : rows[0];
        console.log(`  ok  ${post.slug}: ${words(body)} words, ${internal.length} internal links -> id ${saved.id}, published=${saved.published}`);
    }

    if (failed) {
        console.error('\nOne or more posts failed their checks and were not written.');
        await close(sql);
        process.exit(1);
    }
    console.log('\nDone. Visit /blog to see them.');
    await close(sql);
    process.exit(0);
}

// The Neon HTTP client has no connection to close; `postgres` (used for local
// development) keeps a pool open, which would otherwise hold the process alive.
async function close(sql) {
    try {
        if (typeof sql.end === 'function') await sql.end({ timeout: 5 });
    } catch {
        /* nothing to close */
    }
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});
