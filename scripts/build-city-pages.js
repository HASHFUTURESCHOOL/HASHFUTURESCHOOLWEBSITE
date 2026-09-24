// ============================================
// Renders the city / region landing pages to the site root:
//
//   npm run build:city
//
// Produces /online-school-<slug>.html for every page in lib/city-schema.js plus
// the /online-school-cities.html hub. Copy, metadata and JSON-LD come from the
// module; navigation and footer come from lib/page-chrome.js.
// ============================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    CITY_PAGES, CITY_HUB, KERALA_ENTRY,
    buildCityHead, buildCityHubHead, hubBlurb, COMMUNITY_FACTS
} from '../lib/city-schema.js';
import { SITE } from '../lib/seo-schema.js';
import { topBar, nav, footer } from '../lib/page-chrome.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const esc = value => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const CHEVRON = '<svg class="faq-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M6 9l6 6 6-6" /></svg>';

// The model comparison is the same everywhere because it contrasts schooling
// models, not cities. Local content carries the differentiation.
const COMPARISON_ROWS = [
    ['The school day', 'Fixed campus hours, plus travel, plus evening tuition.', 'Live mentor-led sessions in your time zone, with the rest of the day for projects and life.'],
    ['Pacing', 'One syllabus speed for the whole class.', 'Mastery-based: a learner moves on when they can demonstrate the skill.'],
    ['Attention per child', 'Thirty to sixty students per teacher.', 'A 1:8 mentor ratio with named facilitators.'],
    ['Technology', 'Banned, or taught as a separate subject.', 'AI, code and data used daily to research, build and verify, with disclosure taught explicitly.'],
    ['Evidence of learning', 'Term marksheet and rank.', 'A verified portfolio of projects the child can explain and defend.'],
    ['Certification', 'One board, one school, one route.', 'NIOS, Cambridge IGCSE (private candidate) or GED, chosen against your child\u2019s destination.'],
    ['Mobility', 'A relocation resets the school, the syllabus and the friends.', 'The same cohort, facilitators and pathway continue across a move.']
];

function cityFooterColumns() {
    return [
        {
            heading: 'Cities',
            links: [
                { href: 'online-school-cities', label: 'All cities & regions' },
                { href: 'online-school-bengaluru', label: 'Bengaluru' },
                { href: 'online-school-mumbai', label: 'Mumbai' },
                { href: 'online-school-new-delhi', label: 'New Delhi' },
                { href: 'online-school-hyderabad', label: 'Hyderabad' },
                { href: 'online-school-kolkata', label: 'Kolkata' },
                { href: 'online-school-kerala.html', label: 'Kerala' }
            ]
        },
        {
            heading: 'Gulf & expat',
            links: [
                { href: 'online-school-dubai', label: 'Dubai' },
                { href: 'online-school-abu-dhabi', label: 'Abu Dhabi' },
                { href: 'online-school-uae', label: 'UAE (all emirates)' },
                { href: 'online-school-qatar', label: 'Qatar' },
                { href: 'online-school-oman', label: 'Oman' },
                { href: 'online-school-saudi-arabia', label: 'Saudi Arabia' },
                { href: 'online-school-kuwait', label: 'Kuwait' }
            ]
        },
        {
            heading: 'Pathways',
            links: [
                { href: 'nios-online-school.html', label: 'NIOS Guidance' },
                { href: 'igcse-private-candidate.html', label: 'IGCSE Pathway' },
                { href: 'ai-first-learning.html', label: 'AI-First Learning' },
                { href: 'online-school-vs-regular-school.html', label: 'Online vs Regular School' },
                { href: 'global', label: 'Global Programmes' }
            ]
        },
        {
            heading: 'Legal',
            links: [
                { href: 'privacy.html', label: 'Privacy Policy' },
                { href: 'terms.html', label: 'Terms of Service' },
                { href: 'refund-policy.html', label: 'Refund Policy' }
            ]
        }
    ];
}

function trustBanner() {
    return `            <div class="global-trust-banner" role="note">
                <span class="trust-badge-icon" aria-hidden="true">🏆</span>
                <p><strong>${esc(SITE.awardBanner)}</strong><span class="trust-sub">Recognised for innovation in learning design, 2024 - teaching families across India and the Gulf from Kochi, Kerala.</span></p>
            </div>`;
}

// ---------------------------------------------------------------- sections

function hero(page) {
    return `    <!-- Hero -->
    <header class="gl-hero">
        <div class="container">
            <nav class="gl-breadcrumb" aria-label="Breadcrumb">
                <ol>
                    <li><a href="index.html">Home</a></li>
                    <li><a href="online-school-cities">Online School by City</a></li>
                    <li aria-current="page">${esc(page.city)}</li>
                </ol>
            </nav>
            <p class="gl-eyebrow">Premium Online Alternative School &middot; ${esc(page.country)}</p>
            <h1>${esc(page.h1Before)} <span class="highlight">${esc(page.h1Highlight)}</span></h1>
            <p class="gl-hero-lead">${esc(page.heroLead)}</p>

${trustBanner()}

            <div class="gl-cta-row">
                <a href="index.html#enroll" class="btn-primary btn-large"><span>Schedule a Global Discovery Call</span></a>
                <a href="#local-context" class="btn-secondary btn-large">Explore the Learning Model</a>
            </div>
            <p class="gl-hero-meta">Ages 6-17 &middot; Live cohorts in your time zone &middot; 1:8 mentor ratio &middot; NIOS / IGCSE / GED board pathways</p>
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

function localContext(page) {
    const paragraphs = page.context.map(p => `                <p>${p}</p>`).join('\n');
    return `    <!-- Local context -->
    <section class="gl-section gl-section-alt" id="local-context" aria-labelledby="local-heading">
        <div class="container">
            <div class="section-header">
                <span class="section-badge">Local context</span>
                <h2 id="local-heading">${esc(page.contextTitle)}</h2>
            </div>
            <div class="prose-block gl-prose">
${paragraphs}
            </div>
        </div>
    </section>`;
}

function timetable(page) {
    const facts = [...page.cityFacts, ...COMMUNITY_FACTS].map(fact => `                    <li>${fact}</li>`).join('\n');
    return `    <!-- Timings and local facts -->
    <section class="gl-section" aria-labelledby="timing-heading">
        <div class="container">
            <div class="gl-split">
                <div>
                    <div class="section-header section-header-left">
                        <span class="section-badge">Timings</span>
                        <h2 id="timing-heading">How the day works for <span class="highlight">${esc(page.city)}</span></h2>
                    </div>
                    <div class="prose-block">
                        <p>${esc(page.timetable)}</p>
                    </div>
                </div>
                <aside class="gl-facts" aria-label="Key facts">
                    <h3>At a glance</h3>
                    <ul class="pathway-list">
${facts}
                    </ul>
                </aside>
            </div>
        </div>
    </section>`;
}

function boards(page) {
    const items = page.boards.map(item => `                    <li>${item}</li>`).join('\n');
    return `    <!-- Boards and exam route -->
    <section class="gl-section gl-section-alt" aria-labelledby="boards-heading">
        <div class="container">
            <div class="section-header">
                <span class="section-badge">Boards &amp; credentials</span>
                <h2 id="boards-heading">The <span class="highlight">${esc(page.city)}</span> exam route</h2>
                <p class="section-subtitle">Hash Future School guides and prepares learners for external boards. We are not an accredited board, a NIOS study centre or a Cambridge-registered school &mdash; the certificate is issued by the board, through its official centres.</p>
            </div>
            <ul class="pathway-list gl-prose">
${items}
            </ul>
        </div>
    </section>`;
}

function comparison() {
    const rows = COMPARISON_ROWS.map(([dimension, traditional, alternative]) => `                    <tr>
                        <th scope="row">${esc(dimension)}</th>
                        <td>${esc(traditional)}</td>
                        <td class="is-us">${esc(alternative)}</td>
                    </tr>`).join('\n');
    return `    <!-- Comparison -->
    <section class="gl-section" aria-labelledby="comparison-heading">
        <div class="container">
            <div class="section-header">
                <span class="section-badge">Problem vs model</span>
                <h2 id="comparison-heading">Traditional schooling vs <span class="highlight">Hash Future School</span></h2>
            </div>
            <div class="compare-wrap">
                <table class="compare-table">
                    <caption>Two ways to organise a childhood: the industrial model compared with a live, mastery-based online programme.</caption>
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

function evidence(page) {
    const points = [
        '101 active students and 237 active parent accounts, with 6,068 daily parent reports sent in the quarter.',
        '2,851 submissions recorded and 91.7% mastery scores across graded work.',
        '14 mentor groups covering 228 mentees, with 124 documented interventions and 118 parent-teacher meetings.',
        '4.62 / 5 average student rating across 3,583 end-of-session feedback responses.',
        'Students entered 26 external competitions and 24 school events in a single quarter.',
        esc(SITE.awardBanner) + '.'
    ].map(point => `                    <li>${point}</li>`).join('\n');
    return `    <!-- Evidence -->
    <section class="gl-section gl-section-alt" aria-labelledby="evidence-heading">
        <div class="container">
            <div class="section-header">
                <span class="section-badge">Evidence, not adjectives</span>
                <h2 id="evidence-heading">What families in <span class="highlight">${esc(page.city)}</span> are joining</h2>
                <p class="section-subtitle">Figures taken from Hash Future School&rsquo;s published ${esc(SITE.evidence.source)}.</p>
            </div>
            <ul class="pathway-list gl-prose">
${points}
            </ul>
            <p class="gl-note"><a class="gl-inline-link" href="impact-reports">Read the full impact report &rarr;</a></p>
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
    return `    <!-- FAQ -->
    <section class="faq-section" id="faq" aria-labelledby="faq-heading">
        <div class="container">
            <div class="section-header">
                <span class="section-badge">Parent questions</span>
                <h2 id="faq-heading">What ${esc(page.city)} families ask <span class="highlight">before enrolling</span></h2>
            </div>
            <div class="faq-container">
${items}
            </div>
        </div>
    </section>`;
}

function related(page) {
    const cards = page.related.map(item => `                <a class="link-card" href="${item.href}">
                    <h3>${esc(item.label)}</h3>
                    <span class="link-card-arrow">Read more &rarr;</span>
                </a>`).join('\n');
    return `    <!-- Related reading -->
    <section class="gl-section" aria-labelledby="related-heading">
        <div class="container">
            <div class="section-header">
                <span class="section-badge">Related</span>
                <h2 id="related-heading">Keep reading for <span class="highlight">${esc(page.city)}</span> families</h2>
            </div>
            <div class="link-card-grid">
${cards}
                <a class="link-card" href="online-school-cities">
                    <h3>Every city and region we serve</h3>
                    <span class="link-card-arrow">See all locations &rarr;</span>
                </a>
            </div>
        </div>
    </section>`;
}

function cta(page) {
    return `    <!-- CTA -->
    <section class="cta-section" id="enroll">
        <div class="container">
            <div class="cta-content">
                <h2>Schedule a <span class="highlight">Global Discovery Call</span></h2>
                <p>Tell us what your child is dealing with and where in ${esc(page.city)} you are based. We will map the pathway, the live session times for your time zone, and the board options that fit your family&rsquo;s plans &mdash; honestly, including when we are not the right answer.</p>
                <div class="cta-buttons">
                    <a href="index.html#enroll" class="btn-primary btn-large"><span>Schedule a Global Discovery Call</span></a>
                    <a href="${SITE.whatsapp}" target="_blank" rel="noopener" class="btn-secondary btn-large">WhatsApp ${SITE.telephoneDisplay}</a>
                </div>
                <p class="cta-subtext">Live cohorts in your time zone &middot; Ages 6-17 &middot; 1:8 mentor ratio &middot; ${esc(SITE.awardBanner)}</p>
            </div>
        </div>
    </section>`;
}

// ---------------------------------------------------------------- hub

function hubCardsFor(grouping) {
    const entries = grouping === 'india'
        ? [...CITY_PAGES.filter(p => p.grouping === 'india'), KERALA_ENTRY]
        : CITY_PAGES.filter(p => p.grouping === grouping);
    return entries.map(page => {
        const href = page.href || ('online-school-' + page.slug);
        return `                <a class="link-card" href="${href}">
                    <h3>Online School in ${esc(page.city)}</h3>
                    <p>${esc(hubBlurb(page))}</p>
                    <span class="link-card-arrow">Open ${esc(page.city)} page &rarr;</span>
                </a>`;
    }).join('\n');
}

function hubFaqs() {
    return CITY_HUB.faqs.map((faq, index) => {
        const n = index + 1;
        return `                <div class="faq-item">
                    <h3 class="faq-heading">
                        <button type="button" class="faq-question" id="hub-faq-q-${n}" aria-expanded="false" aria-controls="hub-faq-a-${n}">
                            <span class="faq-label">${esc(faq.q)}</span>
                            ${CHEVRON}
                        </button>
                    </h3>
                    <div class="faq-answer" id="hub-faq-a-${n}" role="region" aria-labelledby="hub-faq-q-${n}">
                        <p>${esc(faq.a)}</p>
                    </div>
                </div>`;
    }).join('\n');
}

function renderHub() {
    return `<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
${buildCityHubHead()}
</head>

<body>
${topBar()}

${nav('')}

<main id="main">
    <!-- Hero -->
    <header class="gl-hero">
        <div class="container">
            <nav class="gl-breadcrumb" aria-label="Breadcrumb">
                <ol>
                    <li><a href="index.html">Home</a></li>
                    <li aria-current="page">Online School by City</li>
                </ol>
            </nav>
            <p class="gl-eyebrow">Premium Online Alternative School &middot; India &amp; the Gulf</p>
            <h1>${esc(CITY_HUB.h1Before)} <span class="highlight">${esc(CITY_HUB.h1Highlight)}</span></h1>
            <p class="gl-hero-lead">${esc(CITY_HUB.lead)}</p>

${trustBanner()}

            <div class="gl-cta-row">
                <a href="index.html#enroll" class="btn-primary btn-large"><span>Schedule a Global Discovery Call</span></a>
                <a href="#india" class="btn-secondary btn-large">Explore the Learning Model</a>
            </div>
            <p class="gl-hero-meta">Ages 6-17 &middot; Live cohorts grouped by time zone &middot; 1:8 mentor ratio &middot; NIOS / IGCSE / GED board pathways</p>
        </div>
    </header>

    <!-- Direct answer block -->
    <section class="gl-section" aria-labelledby="hub-answer-heading">
        <div class="container">
            <h2 id="hub-answer-heading" class="visually-hidden">In short</h2>
            <div class="answer-block">
                <p class="answer-label">In short</p>
                <p class="answer-text"><strong>${esc(CITY_HUB.directAnswer)}</strong></p>
            </div>
        </div>
    </section>

    <!-- India -->
    <section class="gl-section gl-section-alt" id="india" aria-labelledby="india-heading">
        <div class="container">
            <div class="section-header">
                <span class="section-badge">India</span>
                <h2 id="india-heading">India: metro and state <span class="highlight">coverage</span></h2>
                <p class="section-subtitle">Live cohorts on IST, inside normal school hours, with NIOS, IGCSE or GED guidance planned around your child&rsquo;s destination.</p>
            </div>
            <div class="link-card-grid">
${hubCardsFor('india')}
            </div>
        </div>
    </section>

    <!-- Gulf -->
    <section class="gl-section" id="gulf" aria-labelledby="gulf-heading">
        <div class="container">
            <div class="section-header">
                <span class="section-badge">Gulf &amp; expat families</span>
                <h2 id="gulf-heading">The Gulf: one programme <span class="highlight">across borders</span></h2>
                <p class="section-subtitle">Gulf cohorts are grouped by local time, so children study in the late afternoon or early evening &mdash; and a change of country does not change the syllabus, the mentors or the board pathway.</p>
            </div>
            <div class="link-card-grid">
${hubCardsFor('gulf')}
            </div>
        </div>
    </section>

    <!-- What stays the same -->
    <section class="gl-section gl-section-alt" aria-labelledby="constant-heading">
        <div class="container">
            <div class="section-header">
                <span class="section-badge">The model</span>
                <h2 id="constant-heading">What stays the same <span class="highlight">wherever you are</span></h2>
            </div>
            <div class="gl-card-grid">
                <article class="gl-card">
                    <h3>Live, not recorded</h3>
                    <p>Small cohorts taught live by named facilitators. Recorded content turns a classroom into a video library and leaves the child alone with it &mdash; which is exactly how online schooling fails.</p>
                </article>
                <article class="gl-card">
                    <h3>1:8 mentors, and a monthly meet-up</h3>
                    <p>Every learner has a mentor who knows their work and their week, with daily reporting to parents. The local cohort also meets in person once a month, so friendships are not only on screen.</p>
                </article>
                <article class="gl-card">
                    <h3>AI, code and entrepreneurship</h3>
                    <p>Technology is part of the curriculum, taught with disclosure, verification and judgement &mdash; not as an optional club and not something to be banned.</p>
                </article>
                <article class="gl-card">
                    <h3>Recognised board pathways</h3>
                    <p>Guided preparation toward NIOS, Cambridge IGCSE (private candidate) or GED, examined by the official board through its own centres.</p>
                </article>
            </div>
        </div>
    </section>

    <!-- Evidence -->
    <section class="gl-section" aria-labelledby="hub-evidence-heading">
        <div class="container">
            <div class="section-header">
                <span class="section-badge">Evidence, not adjectives</span>
                <h2 id="hub-evidence-heading">What our own reporting <span class="highlight">shows</span></h2>
                <p class="section-subtitle">Figures taken from Hash Future School&rsquo;s published ${esc(SITE.evidence.source)}.</p>
            </div>
            <ul class="pathway-list gl-prose">
                <li>101 active students and 237 active parent accounts, with 6,068 daily parent reports sent in the quarter.</li>
                <li>2,851 submissions recorded and 91.7% mastery scores across graded work.</li>
                <li>14 mentor groups covering 228 mentees, with 124 documented interventions and 118 parent-teacher meetings.</li>
                <li>4.62 / 5 average student rating across 3,583 end-of-session feedback responses.</li>
                <li>${esc(SITE.awardBanner)}.</li>
            </ul>
            <p class="gl-note"><a class="gl-inline-link" href="impact-reports">Read the full impact report &rarr;</a></p>
        </div>
    </section>

    <!-- FAQ -->
    <section class="faq-section" id="faq" aria-labelledby="faq-heading">
        <div class="container">
            <div class="section-header">
                <span class="section-badge">Parent questions</span>
                <h2 id="faq-heading">City and time-zone <span class="highlight">questions</span></h2>
            </div>
            <div class="faq-container">
${hubFaqs()}
            </div>
        </div>
    </section>

    <!-- CTA -->
    <section class="cta-section" id="enroll">
        <div class="container">
            <div class="cta-content">
                <h2>Schedule a <span class="highlight">Global Discovery Call</span></h2>
                <p>Tell us what your child is dealing with and where you are based. We will map the pathway, the live session times for your time zone, and the board options that fit your family&rsquo;s plans &mdash; honestly, including when we are not the right answer.</p>
                <div class="cta-buttons">
                    <a href="index.html#enroll" class="btn-primary btn-large"><span>Schedule a Global Discovery Call</span></a>
                    <a href="${SITE.whatsapp}" target="_blank" rel="noopener" class="btn-secondary btn-large">WhatsApp ${SITE.telephoneDisplay}</a>
                </div>
                <p class="cta-subtext">Live cohorts grouped by time zone &middot; Ages 6-17 &middot; 1:8 mentor ratio</p>
            </div>
        </div>
    </section>
</main>

${footer({ prefix: '', columns: cityFooterColumns() })}
`;
}

function renderPage(page) {
    return `<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
${buildCityHead(page)}
</head>

<body>
${topBar()}

${nav('')}

<main id="main">
${hero(page)}

${directAnswer(page)}

${localContext(page)}

${timetable(page)}

${boards(page)}

${comparison()}

${evidence(page)}

${faqs(page)}

${related(page)}

${cta(page)}
</main>

${footer({ prefix: '', columns: cityFooterColumns() })}
`;
}

function main() {
    const written = [];
    for (const page of CITY_PAGES) {
        const file = path.join(ROOT, page.slug === 'kerala' ? 'online-school-kerala.html' : `online-school-${page.slug}.html`);
        fs.writeFileSync(file, renderPage(page), 'utf8');
        written.push(path.relative(ROOT, file));
    }
    const hubFile = path.join(ROOT, 'online-school-cities.html');
    fs.writeFileSync(hubFile, renderHub(), 'utf8');
    written.push(path.relative(ROOT, hubFile));
    console.log('Built ' + written.length + ' city / region pages:');
    written.forEach(file => console.log('  ' + file));
    console.log('Routes (cleanUrls): ' + [CITY_HUB.route, ...CITY_PAGES.map(p => p.route)].join(', '));
}

main();
