// ============================================
// Global problem-led landing pages - single source of truth.
//
// This module is the equivalent of a <SEOHead /> / <MetaSchema /> component for
// this project. The site is static HTML on Vercel, so rather than a React
// component this file exports the page copy, the meta tags and the JSON-LD
// graph that scripts/build-global-pages.js renders into /global/<slug>.html.
// scripts/check-global-pages.js fails if the generated HTML drifts from here.
//
// If the marketing site is later ported to Next.js, buildJsonLd() drops
// straight into a <script type="application/ld+json"> tag.
// ============================================

export const SITE = {
    name: 'Hash Future School',
    url: 'https://www.hashfuture.school',
    logo: 'https://www.hashfuture.school/favicon.png',
    ogImage: 'https://www.hashfuture.school/images/hero-group.jpg',
    telephone: '+91-9497120591',
    telephoneDisplay: '+91 94971 20591',
    whatsapp: 'https://wa.me/919497120591',
    email: 'learn@hashfuture.school',
    address: {
        streetAddress: 'Peringala P O',
        addressLocality: 'Kochi',
        addressRegion: 'Kerala',
        postalCode: '683565',
        addressCountry: 'IN'
    },
    award: 'Best Innovative School Award, World School Summit Dubai',
    awardBanner: 'Winner: Best Innovative School Award - World School Summit, Dubai',
    sameAs: [
        'https://www.youtube.com/@hashfutureschool',
        'https://www.instagram.com/hashfutureschool/',
        'https://www.linkedin.com/company/hashfutureschool-online/'
    ],
    offerings: [
        { name: 'SuperKids', description: '40-day, 80-hour intensive AI mastery workshop for ages 8-17: 20+ generative AI tools, web apps, public speaking and entrepreneurship.' },
        { name: 'SuperLearn', description: 'Small-group mastery track for learners who need targeted academic support alongside project work.' },
        { name: 'Open Schooling Pathways', description: 'Guided preparation toward recognised external boards - NIOS, Cambridge IGCSE as a private candidate, and GED.' }
    ],
    evidence: {
        source: 'Impact Report, June-August 2026',
        url: 'https://www.hashfuture.school/impact-reports'
    }
};

const ROUTE_PREFIX = '/global/';

export const GLOBAL_PAGES = [
    // ---------------------------------------------------------------- page 1
    {
        slug: 'screen-time-to-creator',
        route: ROUTE_PREFIX + 'screen-time-to-creator',
        title: 'Turning Screen Addiction into Creative AI Literacy | Global Online School',
        description: "Is screen time causing homework meltdowns? Discover how Hash Future School's online programs channel digital obsession into coding, AI mastery, and global projects.",
        keywords: 'screen addiction in kids, global coding school online, AI for children, alternative education online, purposeful technology learning, online school for expats',
        h1Before: 'Turning Screen Addiction into',
        h1Highlight: 'Creative AI Literacy',
        heroLead: 'Premium online alternative school for global families. We take the hours your child already spends on screens and redirect them into building apps, directing AI, and shipping real projects with a global pod - instead of watching someone else play.',
        directAnswer: 'Hash Future School turns screen obsession into creative output. Students aged 6-17 learn to direct AI tools instead of consuming content, building apps, games and global projects in live pods - while our points system actively rewards reduced recreational screen time, research and original work.',
        comparison: {
            caption: 'Traditional industrial schooling compared with the Hash Future School approach',
            rows: [
                ['What technology is for', 'Phones banned at school, then handed back with no instruction on limits or judgement.', 'AI and code are the tools of the work; students are taught disclosure, verification and self-regulation.'],
                ['What a win looks like', 'Marks and rank in a class of forty.', 'A working app, a published project, a pitch delivered to real people.'],
                ['Attention economics', 'The most engaging thing in the room is the phone in the bag.', 'Sessions are built to be more interesting and more social than the feed.'],
                ['Rewards', 'Attendance, compliance, finished homework.', 'A points economy that rewards no recreational screen time, independent research, critical thinking and helping others.'],
                ['Screen-time habit', 'Left to families to police alone.', 'Reported daily to parents, with progress visible instead of guessed.'],
                ['Peer group', 'Whoever is in the nearest classroom.', 'A global cohort of builders, coders, presenters and founders.'],
                ['Evidence of progress', 'Term marksheet.', 'A verified portfolio of projects the child can explain and defend.']
            ]
        },
        curriculum: {
            intro: 'Screen time only becomes a problem when a child is a consumer of other people\u2019s work. Our progression is designed to make them a producer, and the two programmes below are how families start.',
            superKids: 'SuperKids is our 40-day, 80-hour intensive AI mastery workshop for ages 8-17. Students work through 20+ generative AI tools, build and publish web applications, design their own business ideas and present on stage. It is usually the fastest way to convert an obsessed gamer into a builder, because the first session is about making the game, not banning it.',
            superLearn: 'SuperLearn is the small-group mastery track that runs alongside SuperKids and the main school cohorts. It exists for the child with gaps, confidence damage or an uneven profile - the learner who is brilliant with a game engine and three years behind in fractions. Pacing is set by mastery: a learner moves on when they can demonstrate the skill, not when the calendar says so.',
            ai: 'Responsible AI use is taught explicitly rather than assumed. Students learn prompt engineering, source verification, disclosure of AI assistance, and the difference between using a tool and outsourcing thinking. Mentors verify understanding through live questioning and drafts, so a polished output that the child cannot explain fails.',
            pods: 'Learning happens in small international pods, with house teams, student-led committees and a 1:8 mentor ratio. Children present weekly, collaborate on global projects, and build friendships around shared work rather than shared year groups.'
        },
        proofPoints: [
            '41,300 recognition events logged across the June-August 2026 quarter, including a dedicated "NO SCREEN TIME" award category.',
            '4.62 / 5 average student rating across 3,583 end-of-session feedback responses.',
            '101 active students and 237 active parent accounts receiving 6,068 daily parent reports in the quarter.',
            '8 houses and 5 student-led Global Citizenship committees running in the same period.'
        ],
        faqs: [
            {
                q: 'My child is addicted to video games and refuses to study. What actually helps?',
                a: 'Bans fail because they remove the child\u2019s competence without offering a replacement. We redirect it: students learn to build games and apps with AI, present their work, and earn recognition for creation rather than consumption. Most families see the first shift within four to six weeks of a consistent routine.'
            },
            {
                q: 'Can screen time ever be good for my child?',
                a: 'Yes - when the screen is a tool for making rather than a container for someone else\u2019s content. Coding, AI prompting, design and publishing are screen-based, high-skill activities. We measure the difference by output: what did your child create and explain this week?'
            },
            {
                q: 'How does Hash Future School teach children to use AI tools responsibly?',
                a: 'AI literacy is timetabled, not banned or ignored. Students learn which tasks suit AI, how to verify its output, when to disclose its use, and how to keep their own judgement in charge. Mentors check understanding through live questioning and project drafts rather than reviewing polished text.'
            },
            {
                q: 'Is this online school available for expat and NRI families outside India?',
                a: 'Yes. Classes are live and students join from the Gulf, South-East Asia, Europe and North America. We schedule around time zones, and families abroad can combine the programme with Indian open schooling, IGCSE or GED pathways so the credential travels with them.'
            },
            {
                q: 'What ages and grades can join the AI-first programme?',
                a: 'We teach learners aged 6 to 17 across Lower, Middle and Higher Grades. Younger children work with guided tool use and short creation tasks; older students take on independent projects, internships and board examination preparation.'
            }
        ],
        related: [
            { slug: 'ai-first-learning.html', label: 'How our AI-first learning model works' },
            { slug: 'online-school-vs-regular-school.html', label: 'Online school vs regular school, compared' }
        ]
    },

    // ---------------------------------------------------------------- page 2
    {
        slug: 'academic-burnout',
        route: ROUTE_PREFIX + 'academic-burnout',
        title: 'Relief from Academic Burnout & School Refusal | Hash Future School',
        description: 'End homework exhaustion. Hash Future School replaces rote memorization with self-directed, mastery-based learning for students worldwide.',
        keywords: 'school refusal solutions, academic stress in children, international alternative schooling, self-directed learning online, global homeschool support',
        h1Before: 'Relief from Academic Burnout &',
        h1Highlight: 'School Refusal',
        heroLead: 'Premium online alternative school for global families. When a child stops being able to face school, the answer is rarely more pressure, more tuition or a stricter routine. It is a different pace, a smaller room, and work that means something.',
        directAnswer: 'Hash Future School replaces exam-driven pressure with mastery-based pacing: students aged 6-17 progress when they can demonstrate understanding, not when the class calendar says so. Small cohorts, a 1:8 mentor ratio and self-directed project work rebuild confidence for children who have refused or burned out of conventional schooling.',
        comparison: {
            caption: 'Traditional industrial schooling compared with the Hash Future School approach',
            rows: [
                ['Pacing', 'A fixed syllabus for the class, whether the child is ready or not.', 'Mastery-based: a learner advances when they can demonstrate the skill.'],
                ['Assessment', 'Exams, ranks and comparative marks.', 'Projects, portfolios, presentations and mastery checks with feedback.'],
                ['Definition of success', 'Position in the class.', 'Evidence the child can explain, defend and build on.'],
                ['Homework', 'Hours of repetition after a full day of teaching.', 'Work that finishes inside the learning day; the evening belongs to the family.'],
                ['When a child falls behind', 'Catch-up tuition, pressure, and a widening gap.', 'Small-group intervention and re-teaching at the right level, tracked weekly.'],
                ['Role of the adult', 'Teacher transmits, parent polices.', 'Mentor coaches, parent receives daily visibility.'],
                ['The child\u2019s experience', 'Compliance and fatigue.', 'Autonomy, then capability, then confidence.'],
                ['Wellbeing', 'Usually handled after something breaks.', 'Built into the model, with 124 documented interventions in one quarter.']
            ]
        },
        curriculum: {
            intro: 'For a burned-out child, re-engagement is the first academic goal. The structure below is designed to lower the cost of starting again, then rebuild ambition once the child remembers they are capable.',
            superKids: 'SuperKids is a 40-day, 80-hour intensive AI mastery workshop for ages 8-17. It is deliberately a short, high-energy commitment, which makes it a useful re-entry point for a child who has refused longer formats. Students build apps, launch a business idea and present on stage - with visible wins early, because momentum is the medicine.',
            superLearn: 'SuperLearn is the small-group mastery track for learners with gaps, uneven profiles or damaged confidence. Because progress is measured by demonstrated mastery rather than time served, a child who is three years behind in one topic and ahead in another is not forced into a single label. Interventions are logged, follow-ups are scheduled with parents, and re-assessment replaces judgement.',
            ai: 'AI is taught as leverage rather than a shortcut. Students use tools to research, draft and prototype, then defend their reasoning in live sessions. For an anxious learner this removes the blank-page problem while keeping the thinking where it belongs - with the child.',
            pods: 'Cohorts are small and stable, with named facilitators and a 1:8 mentor ratio. Students join house teams, presentations and student-led committees, so belonging is built into the timetable rather than left to chance. Families abroad join the same live sessions from their own time-zone slots.'
        },
        proofPoints: [
            '91.7% mastery scores recorded across 2,300 graded submissions in the June-August 2026 quarter.',
            '14 mentor groups covering 228 mentees, with 124 documented interventions and 118 parent-teacher meetings.',
            '3,583 student feedback responses at an average rating of 4.62 / 5 for the quarter.',
            '6,068 daily parent reports sent during the same period, so families see progress before it becomes a crisis.'
        ],
        faqs: [
            {
                q: 'My child refuses to go to school because of exam stress. What are our options?',
                a: 'Start by removing the daily confrontation: a flexible or open-schooling pathway keeps your child academically active while the pressure is reduced. Then rebuild the learning habit in a small, low-stakes setting. Families usually combine a recognised board pathway with a mentoring programme rather than choosing between them.'
            },
            {
                q: 'What is mastery-based learning and how is it different from grades?',
                a: 'Mastery-based learning asks whether the child can do the thing, not how they ranked while learning it. A student advances when they can demonstrate the skill, and gets re-taught without penalty when they cannot. Marks still exist at board stage; they simply stop being the daily definition of your child.'
            },
            {
                q: 'How long does it take for a burned-out child to re-engage?',
                a: 'Every child differs, but the pattern we see is two to four weeks to establish a routine without resistance, six to eight weeks for confidence to return, and a full term before the child takes real ownership of their work. We track re-engagement through submissions, participation and mentor notes.'
            },
            {
                q: 'Can my child move at their own pace and still get a recognised certificate?',
                a: 'Yes. We guide learners toward NIOS, Cambridge IGCSE as a private candidate, or GED, all of which are examined by the official board through recognised centres. Pacing inside our programme is flexible; the credential comes from the board at the end of the agreed timeline.'
            },
            {
                q: 'Do you support families in different time zones?',
                a: 'Yes. Our cohorts include families across India, the Gulf, South-East Asia, Europe and North America, and schedules are built around time-zone groups. Live sessions are mentored, not passive recordings, and families receive daily visibility into what happened.'
            }
        ],
        related: [
            { slug: 'ai-first-learning.html', label: 'How self-directed learning actually works' },
            { slug: 'online-school-kerala.html', label: 'Online school in Kerala for local families' }
        ]
    },

    // ---------------------------------------------------------------- page 3
    {
        slug: 'social-isolation-safe-community',
        route: ROUTE_PREFIX + 'social-isolation-safe-community',
        title: 'Beyond Bullying: Safe Global Learning Pods & Mentorship | Hash Future School',
        description: 'Move your child away from hostile classroom environments. Explore peer collaboration, international micro-communities, and personalized mentorship.',
        keywords: 'safe school environment, school bullying alternative online, introverted student schooling, global learning pods, international online school community',
        h1Before: 'Beyond Bullying: Safe Global',
        h1Highlight: 'Learning Pods & Mentorship',
        heroLead: 'Premium online alternative school for global families. Your child does not have to earn safety. Small live pods, named mentors and a culture where participation is expected and kindness is rewarded - that is the social design, not an afterthought.',
        directAnswer: 'Hash Future School gives bullied and socially isolated students a safer social world: small live cohorts, house teams, student-led committees and a 1:8 mentoring relationship. Children aged 6-17 belong to a consistent global pod where participation is expected and kindness is rewarded, instead of navigating a hostile corridor alone.',
        comparison: {
            caption: 'Traditional industrial schooling compared with the Hash Future School approach',
            rows: [
                ['Social scale', '40-60 students per class and hundreds per corridor.', 'Small stable cohorts where every name is known to a mentor.'],
                ['Belonging mechanism', 'Left to whoever happens to be friendly that year.', 'House teams, global pods and student-led committees assigned from day one.'],
                ['Response to bullying', 'Investigation after an incident; the child returns to the same room.', 'Small-group moderation, documented interventions, and a change of environment available immediately.'],
                ['Speaking and being seen', 'Public speaking for the confident few.', 'Weekly presentations in small groups, so practice is safe before it is public.'],
                ['The introverted child', 'Often mistaken for disengagement.', 'Text and small-group routes into discussion before whole-room speaking.'],
                ['Parent visibility', 'Termly reports, and a phone call if something goes wrong.', 'Daily reports, named mentors and 118 parent-teacher meetings in one quarter.'],
                ['Friendships', 'Wherever proximity allows.', 'Built around shared projects, houses and global interests.']
            ]
        },
        curriculum: {
            intro: 'Social safety is engineered, not hoped for. The programmes below place every learner in a small, consistent group with an adult who is accountable for them.',
            superKids: 'SuperKids runs as a 40-day, 80-hour intensive for ages 8-17 and is intentionally social: students present daily, pitch in teams and celebrate finishes together. For a child who has been excluded, a short cohort with a clear beginning, middle and end is often a safer first step than committing to a full academic year.',
            superLearn: 'SuperLearn is the small-group mastery track that runs alongside SuperKids and the main cohorts. Groups are kept deliberately small so a hesitant learner gets airtime without an audience, gaps are addressed privately, and confidence is rebuilt through demonstrable wins rather than reassurance.',
            ai: 'Collaboration is part of the AI curriculum, not separate from it. Students co-build projects in global pods, review each other\u2019s work with structured rubrics, and learn digital citizenship: what to post, what to verify, and how to behave when nobody is watching the chat.',
            pods: 'Every learner belongs to a house (Amber, Coral, Emerald, Garnet, Jade, Sapphire, Topaz or Zircon) and can join student-led Global Citizenship committees. Mentors hold a 1:8 relationship with their mentees and log interventions, so a withdrawn child is noticed in weeks, not terms.'
        },
        proofPoints: [
            '8 houses plus 5 student-led Global Citizenship committees running in the June-August 2026 quarter.',
            '14 mentor groups covering 228 mentees, with 124 logged interventions and 118 parent-teacher meetings.',
            '11,977 community messages across 1,104 conversations in the quarter - a live peer community, not a chat that goes quiet.',
            '69 student-run elections, votes and nominations held in the same period.'
        ],
        faqs: [
            {
                q: 'Is an online school a good option for a child who is being bullied?',
                a: 'It often suits them better, because the problem was usually the environment rather than the child. Your child joins a small live cohort that collaborates instead of competing, meets the local cohort in person once a month, and gains a global network of friends and families — so they recover into a wider, kinder social world rather than a smaller one.'
            },
            {
                q: 'How does Hash Future School stop students feeling isolated online?',
                a: 'Because the community is built into the timetable rather than left to chance: small stable cohorts, house teams, student-led committees and a named mentor at a 1:8 ratio — plus an in-person meet-up with the local cohort every month. Students collaborate rather than compete, so the friendships they form tend to be unusually deep.'
            },
            {
                q: 'Are the classes live or recorded?',
                a: 'Live and small. Recorded content turns a classroom into a video library and leaves the child alone with it, which is exactly how online schooling fails the children who most need connection. Our sessions are mentored, interactive and capped, and students see the same faces every week.'
            },
            {
                q: 'How do you keep an online community safe and kind?',
                a: 'Small groups, known adults, camera and participation norms that are taught rather than assumed, structured review of peer work, and documented intervention when behaviour slips. Our facilitators log interventions with follow-up dates instead of noting a concern and moving on.'
            },
            {
                q: 'What if my child is introverted and hesitant to speak on camera?',
                a: 'That is expected, and it is planned for. Learners start with typed contributions and small-group answers, then move to presenting to their pod, and later to larger audiences. Confidence is built through repetition in low-risk settings rather than by being put on the spot early.'
            }
        ],
        related: [
            { slug: 'online-school-vs-regular-school.html', label: 'Online school vs regular school, compared' },
            { slug: 'ai-first-learning.html', label: 'How our learning pods and mentors work' }
        ]
    },

    // ---------------------------------------------------------------- page 4
    {
        slug: 'future-ready-accredited-pathways',
        route: ROUTE_PREFIX + 'future-ready-accredited-pathways',
        title: 'Accredited Open Schooling & Future Skills (IGCSE / NIOS) | Hash Future School',
        description: 'Get recognized global board credentials without 20th-century rote learning. Combine open-schooling pathways with entrepreneurship and AI literacy.',
        keywords: 'international open school admission, alternative board schooling expats, future skills education global, IGCSE open pathway online, NRI online school',
        h1Before: 'Accredited Open Schooling &',
        h1Highlight: 'Future-Ready Skills (IGCSE / NIOS)',
        heroLead: 'Premium online alternative school for global families. Keep the credential universities recognise and drop the 20th-century method of earning it: guided pathways to recognised boards, delivered alongside AI literacy, entrepreneurship and a verified portfolio.',
        directAnswer: 'Hash Future School pairs global board credentials with capability: students prepare for IGCSE, NIOS or GED through official examination centres while building AI fluency, entrepreneurial ventures and verified portfolios. Families receive structured guidance on subjects, deadlines and eligibility, so a future-ready education never costs a recognised qualification.',
        comparison: {
            caption: 'Traditional industrial schooling compared with the Hash Future School approach',
            rows: [
                ['The credential', 'One board, one school, one fixed route.', 'NIOS, Cambridge IGCSE (private candidate) or GED, chosen against your child\u2019s destination.'],
                ['Curriculum relevance', 'A syllabus designed for an industrial labour market.', 'AI fluency, financial literacy, research, communication and entrepreneurship built into the timetable.'],
                ['What universities see', 'Marksheets and a school name.', 'Board results plus verified projects, ventures, publications and presentations.'],
                ['Eligibility guidance', 'Assumed, or discovered too late.', 'Subject choices mapped backwards from the degree, country or exam your child is targeting.'],
                ['Exam logistics', 'Managed by the school administration.', 'Planned with you: centres, entry deadlines, practicals and alternative arrangements.'],
                ['Mobility', 'Disrupted by relocation.', 'The same programme, mentors and cohort continue across countries.'],
                ['Cost of entry', 'Fees plus transport, uniforms and often evening tuition.', 'One programme fee, a device and internet, plus external board exam fees.'],
                ['Long-term outcome', 'A certificate and a ranking.', 'A certificate plus evidence of what the student can actually do.']
            ]
        },
        curriculum: {
            intro: 'Credentials and capability are not a trade-off here. Board preparation is scheduled work inside the same programme that builds the portfolio, and the pathway is chosen against your child\u2019s destination rather than your postcode.',
            superKids: 'SuperKids, our 40-day, 80-hour intensive for ages 8-17, is where many families first see the difference between future-ready work and exam preparation. Students master 20+ generative AI tools, build and publish web applications, develop a business idea and present on stage. It runs comfortably alongside board preparation because the skills reinforce each other.',
            superLearn: 'SuperLearn is the small-group mastery track that runs alongside SuperKids and the main cohorts. It is where specific syllabus gaps and board-stage academic work are handled at the right level, so a student never has to choose between a demanding project programme and passing a recognised examination.',
            ai: 'AI literacy is taught as a professional skill with an ethical spine: responsible use, source verification, disclosure, data awareness, and the judgement to know when a tool should not be used at all. By the higher grades students are producing work that stands on its own merit, not on the polish of a model.',
            pods: 'Learners join global pods and house teams across time zones, which is what makes the pathway practical for NRI and expat families. The same live cohorts continue through relocation, and our team maps the nearest viable examination centre for your district or country.'
        },
        proofPoints: [
            '101 active students and 237 active parent accounts across the June-August 2026 quarter.',
            '795 activities and 2,851 submissions recorded, with 91.7% mastery scores across graded work.',
            'Students entered 26 external competitions and 24 school events in one quarter, including hackathons and olympiads.',
            'Recognition including the Best Innovative School Award at the World School Summit 2024, Dubai.'
        ],
        faqs: [
            {
                q: 'Which accredited boards can my child take through Hash Future School?',
                a: 'We guide and prepare learners for three recognised routes: NIOS (India\u2019s national open schooling board), Cambridge IGCSE as a private candidate, and GED. Your child is entered and examined by the official board through approved centres; the certificate is issued by the board, not by us.'
            },
            {
                q: 'Can expat and NRI families use Indian open schooling from abroad?',
                a: 'Yes. NIOS is accessible to learners overseas, and many families combine it with our live online programme to keep an Indian curriculum moving across relocations. If your child is likelier to need an internationally recognised qualification for university, we will map the IGCSE route instead.'
            },
            {
                q: 'How do open schooling pathways work alongside AI and entrepreneurship learning?',
                a: 'Board preparation is timetabled inside the same programme as a scheduled block, rather than bolted on as evening coaching. Students spend part of the week on syllabus and past-paper work and the rest on projects, ventures and presentations, so both the credential and the portfolio progress together.'
            },
            {
                q: 'Is an IGCSE or NIOS certificate accepted by universities worldwide?',
                a: 'IGCSE is widely recognised by international universities, and NIOS certificates are accepted by Indian universities and many institutions abroad. Requirements differ by country, degree and course - professional programmes often add specific subject rules - so we verify the target course requirements before subjects are locked.'
            },
            {
                q: 'How do we choose the right board for our child\u2019s goals?',
                a: 'We work backwards from the destination: country of study, intended degree or career, and the subjects those require. That determines whether NIOS, IGCSE or GED is the better fit, which subjects to enter, and when entries and practicals must be completed. The plan is set before teaching begins.'
            }
        ],
        related: [
            { slug: 'nios-online-school.html', label: 'NIOS online schooling, explained in full' },
            { slug: 'igcse-private-candidate.html', label: 'IGCSE as a private candidate' }
        ]
    }
];

// ---------------------------------------------------------------- schema

/**
 * The EducationalOrganization node. Required on every page.
 */
export function buildOrganizationNode() {
    return {
        '@type': ['EducationalOrganization', 'School'],
        '@id': SITE.url + '/#organization',
        name: SITE.name,
        alternateName: 'Hash Future School - Global Online Alternative School',
        url: SITE.url + '/',
        logo: SITE.logo,
        image: SITE.ogImage,
        description: 'An AI-first online alternative school for learners aged 6-17, serving families worldwide with project-based learning, self-directed pacing, global learning pods, and guided preparation toward NIOS, IGCSE and GED board examinations.',
        telephone: SITE.telephone,
        email: SITE.email,
        address: {
            '@type': 'PostalAddress',
            ...SITE.address
        },
        areaServed: [
            { '@type': 'Place', name: 'Worldwide' },
            { '@type': 'Country', name: 'India' },
            { '@type': 'Country', name: 'United Arab Emirates' },
            { '@type': 'Country', name: 'Qatar' },
            { '@type': 'Country', name: 'Saudi Arabia' },
            { '@type': 'Country', name: 'Singapore' },
            { '@type': 'Country', name: 'United States' },
            { '@type': 'Country', name: 'United Kingdom' }
        ],
        award: [SITE.award, 'VBA Business Awards recognition, Kerala, India'],
        knowsLanguage: ['en', 'ml'],
        sameAs: SITE.sameAs,
        contactPoint: [
            {
                '@type': 'ContactPoint',
                telephone: SITE.telephone,
                contactType: 'admissions',
                areaServed: 'Worldwide',
                availableLanguage: ['en', 'ml'],
                email: SITE.email
            }
        ],
        hasOfferCatalog: {
            '@type': 'OfferCatalog',
            name: 'Global programmes and schooling pathways',
            itemListElement: SITE.offerings.map((offering, index) => ({
                '@type': 'Offer',
                position: index + 1,
                itemOffered: {
                    '@type': 'Service',
                    name: offering.name,
                    description: offering.description,
                    provider: { '@id': SITE.url + '/#organization' },
                    audience: {
                        '@type': 'EducationalAudience',
                        educationalRole: 'student',
                        audienceType: 'Learners aged 6 to 17 and their families'
                    }
                }
            }))
        }
    };
}

/**
 * Full JSON-LD @graph for one global landing page.
 */
export function buildJsonLd(page) {
    const url = SITE.url + page.route;
    const pageName = pageTitle(page);
    return {
        '@context': 'https://schema.org',
        '@graph': [
            buildOrganizationNode(),
            {
                '@type': 'WebPage',
                '@id': url + '#webpage',
                url,
                name: page.title,
                description: page.description,
                inLanguage: 'en',
                isPartOf: {
                    '@type': 'WebSite',
                    name: SITE.name,
                    url: SITE.url + '/'
                },
                about: { '@type': 'Thing', name: pageName },
                primaryImageOfPage: { '@type': 'ImageObject', url: SITE.ogImage },
                breadcrumb: { '@id': url + '#breadcrumb' },
                mainEntity: { '@id': url + '#faq' }
            },
            {
                '@type': 'BreadcrumbList',
                '@id': url + '#breadcrumb',
                itemListElement: [
                    { '@type': 'ListItem', position: 1, name: 'Home', item: SITE.url + '/' },
                    { '@type': 'ListItem', position: 2, name: 'Global Programmes', item: SITE.url + '/global/' },
                    { '@type': 'ListItem', position: 3, name: pageName, item: url }
                ]
            },
            {
                '@type': 'Service',
                '@id': url + '#service',
                name: pageName,
                serviceType: 'Premium online alternative schooling for global families',
                description: page.directAnswer,
                provider: { '@id': SITE.url + '/#organization' },
                areaServed: { '@type': 'Place', name: 'Worldwide' },
                audience: {
                    '@type': 'EducationalAudience',
                    educationalRole: 'student',
                    audienceType: 'Global, NRI and expat families with children aged 6 to 17'
                },
                availableChannel: {
                    '@type': 'ServiceChannel',
                    serviceUrl: SITE.url + '/#enroll',
                    servicePhone: SITE.telephone
                }
            },
            {
                '@type': 'FAQPage',
                '@id': url + '#faq',
                mainEntity: page.faqs.map(faq => ({
                    '@type': 'Question',
                    name: faq.q,
                    acceptedAnswer: { '@type': 'Answer', text: faq.a }
                }))
            }
        ]
    };
}

/**
 * The <head> block for a global page: meta tags, social cards and JSON-LD.
 * `depth` is how many directories deep the page sits (1 for /global/<page>).
 */
export function buildHead(page, depth = 1) {
    const up = '../'.repeat(depth);
    const url = SITE.url + page.route;
    const jsonLd = JSON.stringify(buildJsonLd(page), null, 2);
    return `    <title>${page.title}</title>
    <meta name="description" content="${escapeAttr(page.description)}">
    <meta name="keywords" content="${escapeAttr(page.keywords)}">
    <meta name="author" content="${SITE.name}">
    <meta name="robots" content="index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1">
    <meta name="googlebot" content="index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1">
    <meta name="theme-color" content="#FF4B4B">
    <link rel="canonical" href="${url}">
    <link rel="alternate" type="text/markdown" title="LLMs" href="${SITE.url}/llms.txt">
    <link rel="icon" type="image/png" href="${up}favicon.png">
    <link rel="manifest" href="${up}manifest.json">

    <!-- Open Graph / Facebook / WhatsApp -->
    <meta property="og:type" content="article">
    <meta property="og:url" content="${url}">
    <meta property="og:title" content="${escapeAttr(page.title)}">
    <meta property="og:description" content="${escapeAttr(page.description)}">
    <meta property="og:image" content="${SITE.ogImage}">
    <meta property="og:image:width" content="1024">
    <meta property="og:image:height" content="461">
    <meta property="og:site_name" content="${SITE.name}">

    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="${url}">
    <meta property="twitter:title" content="${escapeAttr(page.title)}">
    <meta property="twitter:description" content="${escapeAttr(page.description)}">
    <meta property="twitter:image" content="${SITE.ogImage}">

    <!-- Preconnect & Font -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap"
        rel="stylesheet">

    <link rel="stylesheet" href="${up}styles.css">

    <!-- Structured data: EducationalOrganization + WebPage + BreadcrumbList + Service + FAQPage -->
    <script type="application/ld+json">
${jsonLd}
    </script>`;
}

function escapeAttr(value) {
    return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

export function pageBySlug(slug) {
    const found = GLOBAL_PAGES.find(p => p.slug === slug || p.route === slug);
    if (!found) throw new Error('Unknown global page slug: ' + slug);
    return found;
}

export function pageTitle(page) {
    return page.h1Before + ' ' + page.h1Highlight;
}

export function wordCount(text) {
    return String(text).trim().split(/\s+/).filter(Boolean).length;
}

// ---------------------------------------------------------------- hub page

/**
 * The /global hub. It exists so the breadcrumb trail on every problem page
 * points at a real URL, and so crawlers (including AI crawlers) get one page
 * that lists the four problem areas we support.
 */
export const GLOBAL_HUB = {
    route: '/global',
    title: 'Global Programmes for Families Worldwide | Hash Future School',
    description: 'Four focused programmes for global, NRI and expat families: screen time into AI creation, recovery from academic burnout and school refusal, safe learning pods beyond bullying, and accredited open schooling pathways (IGCSE / NIOS).',
    keywords: 'global online school, online school for expats, NRI online school, international alternative schooling, open schooling pathways, global learning pods',
    h1Before: 'Global Support for',
    h1Highlight: 'Families Worldwide',
    lead: 'Premium online alternative school for global families. Whatever brought you here - a child lost to screens, a child who cannot face school, a child who was hurt by one, or a family who needs a recognised credential without the 20th-century method - start with the situation, not the syllabus.'
};

export function buildHubJsonLd() {
    const url = SITE.url + GLOBAL_HUB.route;
    return {
        '@context': 'https://schema.org',
        '@graph': [
            buildOrganizationNode(),
            {
                '@type': 'CollectionPage',
                '@id': url + '#webpage',
                url,
                name: GLOBAL_HUB.title,
                description: GLOBAL_HUB.description,
                inLanguage: 'en',
                isPartOf: { '@type': 'WebSite', name: SITE.name, url: SITE.url + '/' },
                breadcrumb: { '@id': url + '#breadcrumb' },
                mainEntity: { '@id': url + '#itemlist' }
            },
            {
                '@type': 'BreadcrumbList',
                '@id': url + '#breadcrumb',
                itemListElement: [
                    { '@type': 'ListItem', position: 1, name: 'Home', item: SITE.url + '/' },
                    { '@type': 'ListItem', position: 2, name: 'Global Programmes', item: url }
                ]
            },
            {
                '@type': 'ItemList',
                '@id': url + '#itemlist',
                name: 'Problem-led support for global families',
                itemListOrder: 'https://schema.org/ItemListOrderAscending',
                numberOfItems: GLOBAL_PAGES.length,
                itemListElement: GLOBAL_PAGES.map((page, index) => ({
                    '@type': 'ListItem',
                    position: index + 1,
                    name: pageTitle(page),
                    description: page.description,
                    url: SITE.url + page.route
                }))
            }
        ]
    };
}

export function buildHubHead(depth = 1) {
    const up = '../'.repeat(depth);
    const url = SITE.url + GLOBAL_HUB.route;
    const jsonLd = JSON.stringify(buildHubJsonLd(), null, 2);
    return `    <title>${GLOBAL_HUB.title}</title>
    <meta name="description" content="${escapeAttr(GLOBAL_HUB.description)}">
    <meta name="keywords" content="${escapeAttr(GLOBAL_HUB.keywords)}">
    <meta name="author" content="${SITE.name}">
    <meta name="robots" content="index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1">
    <meta name="googlebot" content="index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1">
    <meta name="theme-color" content="#FF4B4B">
    <link rel="canonical" href="${url}">
    <link rel="alternate" type="text/markdown" title="LLMs" href="${SITE.url}/llms.txt">
    <link rel="icon" type="image/png" href="${up}favicon.png">
    <link rel="manifest" href="${up}manifest.json">

    <!-- Open Graph / Facebook / WhatsApp -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="${url}">
    <meta property="og:title" content="${escapeAttr(GLOBAL_HUB.title)}">
    <meta property="og:description" content="${escapeAttr(GLOBAL_HUB.description)}">
    <meta property="og:image" content="${SITE.ogImage}">
    <meta property="og:image:width" content="1024">
    <meta property="og:image:height" content="461">
    <meta property="og:site_name" content="${SITE.name}">

    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="${url}">
    <meta property="twitter:title" content="${escapeAttr(GLOBAL_HUB.title)}">
    <meta property="twitter:description" content="${escapeAttr(GLOBAL_HUB.description)}">
    <meta property="twitter:image" content="${SITE.ogImage}">

    <!-- Preconnect & Font -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap"
        rel="stylesheet">

    <link rel="stylesheet" href="${up}styles.css">

    <!-- Structured data: EducationalOrganization + CollectionPage + BreadcrumbList + ItemList -->
    <script type="application/ld+json">
${jsonLd}
    </script>`;
}
