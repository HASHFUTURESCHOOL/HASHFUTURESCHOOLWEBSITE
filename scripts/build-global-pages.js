// ============================================
// Renders the global problem-led landing pages into /global/<slug>.html
//
//   npm run build:global
//
// With `cleanUrls: true` in vercel.json, /global/screen-time-to-creator.html is
// served at /global/screen-time-to-creator, which is the canonical URL emitted
// by lib/seo-schema.js. Copy, metadata and JSON-LD all come from that module,
// and the navigation/footer markup comes from lib/page-chrome.js, so there is
// exactly one place to edit either.
// ============================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GLOBAL_PAGES, GLOBAL_HUB, SITE, buildHead, buildHubHead, pageTitle } from '../lib/seo-schema.js';
import { topBar, nav, footer } from '../lib/page-chrome.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'global');
const PREFIX = '../';

const esc = value => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const CHEVRON = '<svg class="faq-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M6 9l6 6 6-6" /></svg>';

export const GLOBAL_LINKS = [
    ['screen-time-to-creator', 'Screen time → AI creation'],
    ['academic-burnout', 'Academic burnout & school refusal'],
    ['social-isolation-safe-community', 'Safe learning pods & mentorship'],
    ['future-ready-accredited-pathways', 'Accredited pathways (IGCSE / NIOS)']
];

function footerColumns() {
    return [
        {
            heading: 'Global Support',
            links: GLOBAL_LINKS.map(([slug, label]) => ({ href: './' + slug, label }))
        },
        {
            heading: 'Pathways',
            links: [
                { href: PREFIX + 'online-school-cities', label: 'Online School by City' },
                { href: PREFIX + 'online-school-kerala.html', label: 'Online School in Kerala' },
                { href: PREFIX + 'nios-online-school.html', label: 'NIOS Guidance' },
                { href: PREFIX + 'igcse-private-candidate.html', label: 'IGCSE Pathway' },
                { href: PREFIX + 'ai-first-learning.html', label: 'AI-First Learning' },
                { href: PREFIX + 'online-school-vs-regular-school.html', label: 'Online vs Regular School' }
            ]
        },
        {
            heading: 'Resources',
            links: [
                { href: PREFIX + 'super-kids.html', label: 'SuperKids' },
                { href: PREFIX + 'student-projects.html', label: 'Project Showcase' },
                { href: PREFIX + 'impact-reports', label: 'Impact Reports' },
                { href: PREFIX + 'blog.html', label: 'Blog' },
                { href: PREFIX + 'about.html', label: 'About Us' }
            ]
        },
        {
            heading: 'Legal',
            links: [
                { href: PREFIX + 'privacy.html', label: 'Privacy Policy' },
                { href: PREFIX + 'terms.html', label: 'Terms of Service' },
                { href: PREFIX + 'refund-policy.html', label: 'Refund Policy' }
            ]
        }
    ];
}

// ---------------------------------------------------------------- sections

function hero(page) {
    return `    <!-- Hero -->
    <header class="gl-hero">
        <div class="container">
            <nav class="gl-breadcrumb" aria-label="Breadcrumb">
                <ol>
                    <li><a href="${PREFIX}index.html">Home</a></li>
                    <li><a href="./${GLOBAL_PAGES[0].slug}">Global Programmes</a></li>
                    <li aria-current="page">${esc(pageTitle(page))}</li>
                </ol>
            </nav>
            <p class="gl-eyebrow">Premium Online Alternative School for Global Families</p>
            <h1>${esc(page.h1Before)} <span class="highlight">${esc(page.h1Highlight)}</span></h1>
            <p class="gl-hero-lead">${esc(page.heroLead)}</p>

            <div class="global-trust-banner" role="note">
                <span class="trust-badge-icon" aria-hidden="true">🏆</span>
                <p><strong>${esc(SITE.awardBanner)}</strong><span class="trust-sub">Recognised for innovation in learning design, 2024 - serving families in India, the Gulf, South-East Asia, Europe and North America.</span></p>
            </div>

            <div class="gl-cta-row">
                <a href="${PREFIX}index.html#enroll" class="btn-primary btn-large"><span>Schedule a Global Discovery Call</span></a>
                <a href="#learning-model" class="btn-secondary btn-large">Explore the Learning Model</a>
            </div>
            <p class="gl-hero-meta">Ages 6-17 &middot; Live cohorts across time zones &middot; 1:8 mentor ratio &middot; NIOS / IGCSE / GED board pathways</p>
        </div>
    </header>`;
}

function directAnswer(page) {
    return `    <!-- Direct answer block (LLM / featured-snippet magnet) -->
    <section class="gl-section" aria-labelledby="direct-answer-heading">
        <div class="container">
            <h2 id="direct-answer-heading" class="visually-hidden">In short</h2>
            <div class="answer-block">
                <p class="answer-label">In short</p>
                <p class="answer-text"><strong>${esc(page.directAnswer)}</strong></p>
            </div>
        </div>
    </section>`;
}

function comparison(page) {
    const rows = page.comparison.rows.map(([dimension, traditional, alternative]) => `                    <tr>
                        <th scope="row">${esc(dimension)}</th>
                        <td>${esc(traditional)}</td>
                        <td class="is-us">${esc(alternative)}</td>
                    </tr>`).join('\n');

    return `    <!-- Comparison: traditional industrial schooling vs Hash Future School -->
    <section class="gl-section gl-section-alt" id="comparison" aria-labelledby="comparison-heading">
        <div class="container">
            <div class="section-header">
                <span class="section-badge">Problem vs model</span>
                <h2 id="comparison-heading">Traditional Industrial Schooling vs <span class="highlight">Hash Future School</span></h2>
            </div>
            <div class="compare-wrap">
                <table class="compare-table">
                    <caption>${esc(page.comparison.caption)}</caption>
                    <thead>
                        <tr>
                            <th scope="col">What matters</th>
                            <th scope="col">Traditional industrial schooling</th>
                            <th scope="col">The Hash Future School approach</th>
                        </tr>
                    </thead>
                    <tbody>
${rows}
                    </tbody>
                </table>
            </div>
        </div>
    </section>`;
}

function curriculum(page) {
    return `    <!-- Curriculum integration: SuperKids & SuperLearn -->
    <section class="gl-section" id="learning-model" aria-labelledby="model-heading">
        <div class="container">
            <div class="section-header">
                <span class="section-badge">Curriculum integration</span>
                <h2 id="model-heading">How students progress through <span class="highlight">SuperKids &amp; SuperLearn</span></h2>
                <p class="section-subtitle">${esc(page.curriculum.intro)}</p>
            </div>

            <div class="gl-card-grid">
                <article class="gl-card">
                    <h3>SuperKids: the 40-day intensive</h3>
                    <p>${esc(page.curriculum.superKids)}</p>
                </article>
                <article class="gl-card">
                    <h3>SuperLearn: the mastery track</h3>
                    <p>${esc(page.curriculum.superLearn)}</p>
                </article>
                <article class="gl-card">
                    <h3>Using AI tools responsibly</h3>
                    <p>${esc(page.curriculum.ai)}</p>
                </article>
                <article class="gl-card">
                    <h3>Collaborating in global pods</h3>
                    <p>${esc(page.curriculum.pods)}</p>
                </article>
            </div>

            <div class="gl-progression">
                <h3>Typical progression across the programme</h3>
                <ol>
                    <li><strong>Re-engage:</strong> a short, high-energy sprint (usually SuperKids) rebuilds the habit of showing up and finishing something.</li>
                    <li><strong>Stabilise:</strong> small-group mastery work in SuperLearn closes gaps at the right level, without labels or penalties.</li>
                    <li><strong>Create:</strong> project studios, AI labs and presentation practice turn skills into a portfolio a child can explain.</li>
                    <li><strong>Certify:</strong> board preparation is scheduled into the week and examined through NIOS, Cambridge IGCSE or GED at the agreed stage.</li>
                </ol>
                <p class="gl-note">Exact sequencing depends on your child&rsquo;s age, grade band and goals. Lower, Middle and Higher Grade pathways differ in how much of the week goes to creation, mastery work and board preparation.</p>
            </div>
        </div>
    </section>`;
}

function evidence(page) {
    const proof = page.proofPoints.map(point => `                    <li>${esc(point)}</li>`).join('\n');
    return `    <!-- Evidence -->
    <section class="gl-section gl-section-alt" id="evidence" aria-labelledby="evidence-heading">
        <div class="container">
            <div class="section-header">
                <span class="section-badge">Evidence, not adjectives</span>
                <h2 id="evidence-heading">What our own reporting <span class="highlight">shows</span></h2>
                <p class="section-subtitle">Figures taken from Hash Future School&rsquo;s published ${esc(SITE.evidence.source)}.</p>
            </div>
            <ul class="pathway-list">
${proof}
            </ul>
            <p class="gl-note"><a class="gl-inline-link" href="${PREFIX}impact-reports">Read the full impact report &rarr;</a></p>
        </div>
    </section>`;
}

function faqs(page) {
    const items = page.faqs.map((faq, index) => {
        const n = index + 1;
        return `                <div class="faq-item">
                    <h3 class="faq-heading">
                        <button type="button" class="faq-question" id="faq-q-${n}" aria-expanded="false" aria-controls="faq-a-${n}">
                            <span class="faq-label">${esc(faq.q)}</span>
                            ${CHEVRON}
                        </button>
                    </h3>
                    <div class="faq-answer" id="faq-a-${n}" role="region" aria-labelledby="faq-q-${n}">
                        <p>${esc(faq.a)}</p>
                    </div>
                </div>`;
    }).join('\n');

    return `    <!-- FAQ: high-intent conversational queries -->
    <section class="faq-section" id="faq" aria-labelledby="faq-heading">
        <div class="container">
            <div class="section-header">
                <span class="section-badge">Parent questions</span>
                <h2 id="faq-heading">What families ask us <span class="highlight">before enrolling</span></h2>
            </div>
            <div class="faq-container">
${items}
            </div>
        </div>
    </section>`;
}

function related(page) {
    const relatedCards = page.related.map(item => `                <a class="link-card" href="${PREFIX}${item.slug}">
                    <h3>${esc(item.label)}</h3>
                    <span class="link-card-arrow">Read more &rarr;</span>
                </a>`).join('\n');

    const siblings = GLOBAL_LINKS
        .filter(([slug]) => slug !== page.slug)
        .map(([slug, label]) => `                <a class="link-card" href="./${slug}">
                    <h3>${esc(label)}</h3>
                    <span class="link-card-arrow">Open this support page &rarr;</span>
                </a>`).join('\n');

    return `    <!-- Related reading -->
    <section class="gl-section" aria-labelledby="related-heading">
        <div class="container">
            <div class="section-header">
                <span class="section-badge">Related reading</span>
                <h2 id="related-heading">Go deeper on the <span class="highlight">detail</span></h2>
            </div>
            <div class="link-card-grid">
${relatedCards}
            </div>
        </div>
    </section>

    <!-- Other global support topics -->
    <section class="gl-section gl-section-alt" aria-labelledby="global-topics-heading">
        <div class="container">
            <div class="section-header">
                <span class="section-badge">Global programmes</span>
                <h2 id="global-topics-heading">Other support topics for <span class="highlight">global families</span></h2>
            </div>
            <div class="link-card-grid">
${siblings}
            </div>
        </div>
    </section>`;
}

function cta() {
    return `    <!-- CTA -->
    <section class="cta-section" id="enroll">
        <div class="container">
            <div class="cta-content">
                <h2>Schedule a <span class="highlight">Global Discovery Call</span></h2>
                <p>Tell us what your child is going through and where you are based. We will map the pathway, the live session times for your time zone, and the board options that fit your family&rsquo;s plans &mdash; honestly, including when we are not the right answer.</p>
                <div class="cta-buttons">
                    <a href="${PREFIX}index.html#enroll" class="btn-primary btn-large"><span>Schedule a Global Discovery Call</span></a>
                    <a href="${SITE.whatsapp}" target="_blank" rel="noopener" class="btn-secondary btn-large">WhatsApp ${SITE.telephoneDisplay}</a>
                </div>
                <p class="cta-subtext">Live cohorts across time zones &middot; Ages 6-17 &middot; 1:8 mentor ratio &middot; ${esc(SITE.awardBanner)}</p>
            </div>
        </div>
    </section>`;
}

// ---------------------------------------------------------------- assemble

function renderPage(page) {
    return `<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
${buildHead(page, 1)}
</head>

<body>
${topBar()}

${nav(PREFIX)}

<main id="main">
${hero(page)}

${directAnswer(page)}

${comparison(page)}

${curriculum(page)}

${evidence(page)}

${faqs(page)}

${related(page)}

${cta(page)}
</main>

${footer({ prefix: PREFIX, columns: footerColumns() })}
`;
}

// ---------------------------------------------------------------- hub page

function hubProblemCards() {
    const blurbs = {
        'screen-time-to-creator': 'Gaming and scrolling turned into coding, AI direction and shipped projects.',
        'academic-burnout': 'Mastery-based pacing and small cohorts for children who cannot face school.',
        'social-isolation-safe-community': 'Small live pods, houses and named mentors instead of a hostile corridor.',
        'future-ready-accredited-pathways': 'IGCSE, NIOS and GED prepared for properly, alongside AI and entrepreneurship.'
    };
    return GLOBAL_PAGES.map(page => `                <a class="link-card" href="./${page.slug}">
                    <h3>${esc(pageTitle(page))}</h3>
                    <p>${esc(blurbs[page.slug] || page.description)}</p>
                    <span class="link-card-arrow">Open this page &rarr;</span>
                </a>`).join('\n');
}

function renderHub() {
    return `<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
${buildHubHead(1)}
</head>

<body>
${topBar()}

${nav(PREFIX)}

<main id="main">
    <!-- Hero -->
    <header class="gl-hero">
        <div class="container">
            <nav class="gl-breadcrumb" aria-label="Breadcrumb">
                <ol>
                    <li><a href="${PREFIX}index.html">Home</a></li>
                    <li aria-current="page">Global Programmes</li>
                </ol>
            </nav>
            <p class="gl-eyebrow">Premium Online Alternative School for Global Families</p>
            <h1>${esc(GLOBAL_HUB.h1Before)} <span class="highlight">${esc(GLOBAL_HUB.h1Highlight)}</span></h1>
            <p class="gl-hero-lead">${esc(GLOBAL_HUB.lead)}</p>

            <div class="global-trust-banner" role="note">
                <span class="trust-badge-icon" aria-hidden="true">🏆</span>
                <p><strong>${esc(SITE.awardBanner)}</strong><span class="trust-sub">Recognised for innovation in learning design, 2024 - serving families in India, the Gulf, South-East Asia, Europe and North America.</span></p>
            </div>

            <div class="gl-cta-row">
                <a href="${PREFIX}index.html#enroll" class="btn-primary btn-large"><span>Schedule a Global Discovery Call</span></a>
                <a href="#topics" class="btn-secondary btn-large">Explore the Learning Model</a>
            </div>
            <p class="gl-hero-meta">Ages 6-17 &middot; Live cohorts across time zones &middot; 1:8 mentor ratio &middot; NIOS / IGCSE / GED board pathways</p>
        </div>
    </header>

    <!-- Direct answer block -->
    <section class="gl-section" aria-labelledby="hub-answer-heading">
        <div class="container">
            <h2 id="hub-answer-heading" class="visually-hidden">In short</h2>
            <div class="answer-block">
                <p class="answer-label">In short</p>
                <p class="answer-text"><strong>Hash Future School is an AI-first online alternative school for learners aged 6-17, teaching live small-group cohorts across time zones. Global families come to us for four reasons: screen addiction, academic burnout or school refusal, social isolation and bullying, and accredited board pathways.</strong></p>
            </div>
        </div>
    </section>

    <!-- Topics -->
    <section class="gl-section gl-section-alt" id="topics" aria-labelledby="topics-heading">
        <div class="container">
            <div class="section-header">
                <span class="section-badge">Start with your situation</span>
                <h2 id="topics-heading">Four problems global families <span class="highlight">actually arrive with</span></h2>
            </div>
            <div class="link-card-grid">
${hubProblemCards()}
            </div>
        </div>
    </section>

    <!-- How it works -->
    <section class="gl-section" aria-labelledby="hub-model-heading">
        <div class="container">
            <div class="section-header">
                <span class="section-badge">The model</span>
                <h2 id="hub-model-heading">One programme, three <span class="highlight">layers</span></h2>
                <p class="section-subtitle">Every pathway runs on the same operating system: a short intensive to re-engage, small-group mastery work to stabilise, and board preparation to certify.</p>
            </div>
            <div class="gl-card-grid">
                <article class="gl-card">
                    <h3>SuperKids</h3>
                    <p>${esc(SITE.offerings[0].description)}</p>
                </article>
                <article class="gl-card">
                    <h3>SuperLearn</h3>
                    <p>${esc(SITE.offerings[1].description)}</p>
                </article>
                <article class="gl-card">
                    <h3>Open Schooling Pathways</h3>
                    <p>${esc(SITE.offerings[2].description)}</p>
                </article>
                <article class="gl-card">
                    <h3>Global pods and mentors</h3>
                    <p>Small international cohorts, house teams, student-led committees and a 1:8 mentor ratio, running live across time zones.</p>
                </article>
            </div>
        </div>
    </section>

    <!-- Evidence -->
    <section class="gl-section gl-section-alt" aria-labelledby="hub-evidence-heading">
        <div class="container">
            <div class="section-header">
                <span class="section-badge">Evidence, not adjectives</span>
                <h2 id="hub-evidence-heading">What our own reporting <span class="highlight">shows</span></h2>
                <p class="section-subtitle">Figures taken from Hash Future School&rsquo;s published ${esc(SITE.evidence.source)}.</p>
            </div>
            <ul class="pathway-list">
                <li>101 active students and 237 active parent accounts, with 6,068 daily parent reports sent in the quarter.</li>
                <li>2,851 submissions recorded and 91.7% mastery scores across graded work.</li>
                <li>14 mentor groups covering 228 mentees, with 124 documented interventions and 118 parent-teacher meetings.</li>
                <li>4.62 / 5 average student rating across 3,583 end-of-session feedback responses.</li>
                <li>${esc(SITE.awardBanner)}.</li>
            </ul>
            <p class="gl-note"><a class="gl-inline-link" href="${PREFIX}impact-reports">Read the full impact report &rarr;</a></p>
        </div>
    </section>

    <!-- CTA -->
    <section class="cta-section" id="enroll">
        <div class="container">
            <div class="cta-content">
                <h2>Schedule a <span class="highlight">Global Discovery Call</span></h2>
                <p>Tell us what your child is going through and where you are based. We will map the pathway, the live session times for your time zone, and the board options that fit your family&rsquo;s plans &mdash; honestly, including when we are not the right answer.</p>
                <div class="cta-buttons">
                    <a href="${PREFIX}index.html#enroll" class="btn-primary btn-large"><span>Schedule a Global Discovery Call</span></a>
                    <a href="${SITE.whatsapp}" target="_blank" rel="noopener" class="btn-secondary btn-large">WhatsApp ${SITE.telephoneDisplay}</a>
                </div>
                <p class="cta-subtext">Live cohorts across time zones &middot; Ages 6-17 &middot; 1:8 mentor ratio</p>
            </div>
        </div>
    </section>
</main>

${footer({ prefix: PREFIX, columns: footerColumns() })}
`;
}

function main() {
    fs.mkdirSync(OUT_DIR, { recursive: true });
    const written = [];
    for (const page of GLOBAL_PAGES) {
        const file = path.join(OUT_DIR, page.slug + '.html');
        fs.writeFileSync(file, renderPage(page), 'utf8');
        written.push(path.relative(ROOT, file));
    }
    const hubFile = path.join(OUT_DIR, 'index.html');
    fs.writeFileSync(hubFile, renderHub(), 'utf8');
    written.push(path.relative(ROOT, hubFile));
    console.log('Built ' + written.length + ' global landing pages:');
    written.forEach(file => console.log('  ' + file));
    console.log('Routes (cleanUrls): ' + [GLOBAL_HUB.route, ...GLOBAL_PAGES.map(p => p.route)].join(', '));
}

main();
