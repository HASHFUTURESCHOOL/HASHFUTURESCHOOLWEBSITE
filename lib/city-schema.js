// ============================================
// City / region landing pages - single source of truth.
//
// Companion to lib/seo-schema.js (which holds the /global problem pages).
// This module owns the copy, metadata and JSON-LD for:
//
//   /online-school-bengaluru      /online-school-dubai
//   /online-school-mumbai         /online-school-abu-dhabi
//   /online-school-new-delhi      /online-school-uae
//   /online-school-hyderabad      /online-school-qatar
//   /online-school-kolkata        /online-school-oman
//                                 /online-school-saudi-arabia
//                                 /online-school-kuwait
//   /online-school-cities         (hub, also links the existing Kerala page)
//
// scripts/build-city-pages.js renders the HTML; scripts/check-city-pages.js
// fails the build if the output drifts. Each page carries genuinely local
// content (context, timetable, board route, FAQs) rather than a swapped city
// name, so the set does not read as a doorway network.
// ============================================

import { SITE, buildOrganizationNode, wordCount } from './seo-schema.js';

export const CITY_HUB_ROUTE = '/online-school-cities';

const ROUTE = slug => '/online-school-' + slug;

// The existing Kerala page predates this module and keeps its own .html canonical.
export const KERALA_ENTRY = {
    slug: 'kerala',
    city: 'Kerala',
    country: 'India',
    grouping: 'india',
    route: '/online-school-kerala.html',
    href: 'online-school-kerala.html'
};

export const CITY_PAGES = [
    // ---------------------------------------------------------------- India
    {
        slug: 'bengaluru',
        city: 'Bengaluru',
        aliases: ['Bangalore'],
        country: 'India',
        grouping: 'india',
        route: ROUTE('bengaluru'),
        title: 'Online School in Bengaluru | AI-First Alternative to Rote Learning',
        description: 'Hash Future School is a live online school for Bengaluru families, ages 6-17, with NIOS, IGCSE and GED guidance. Small cohorts, 1:8 mentors, real projects - without the commute.',
        keywords: 'online school in bengaluru, best online school bangalore, alternative school bangalore, online schooling karnataka, nios guidance bengaluru, igcse online bangalore, homeschooling bangalore',
        h1Before: 'Online School in',
        h1Highlight: 'Bengaluru',
        heroLead: 'A live online school for Bengaluru families. Your child learns in a small cohort with a mentor who knows their name, builds AI and coding projects instead of memorising, and prepares for a recognised board - without adding two hours of traffic to the school day.',
        directAnswer: 'Hash Future School is a live online school for Bengaluru families with children aged 6-17. Students learn in small cohorts with a 1:8 mentor ratio, build AI and coding projects, and prepare for NIOS, IGCSE or GED - without adding a two-hour commute to the school day.',
        contextTitle: 'What Bengaluru families tell us',
        context: [
            'Bengaluru parents spend their working lives inside the most advanced technology in the country, then send their children to schools where the day is still textbook-and-test. The gap is obvious at home: a child who rebuilds a Minecraft world from scratch has never written a line of code, and a child who explains an idea brilliantly at dinner freezes on a three-hour paper.',
            'Traffic decides more of the family day here than any timetable. Families we work with across Whitefield, Indiranagar, HSR, Hebbal, Jayanagar and Electronic City describe long school commutes followed by a second shift of evening tuition - and very little time left for the interests that make their child interesting.'
        ],
        timetable: 'Bengaluru runs on IST, the same clock as our facilitators, so live sessions sit inside normal school hours rather than late at night. Cohorts are grouped by grade band, a missed session is replaced with a scheduled catch-up rather than a backlog, and the freed-up commute time usually goes back into sport, music or deeper project work.',
        boards: [
            'NIOS: India&rsquo;s national open board, examined through accredited centres across Karnataka, including Bengaluru. Subjects are planned backwards from the course or career your child is aiming at.',
            'IGCSE: private candidates write at Cambridge-approved centres in India. We confirm the centre nearest to you that accepts your child&rsquo;s exact subject list before you commit.',
            'CBSE, ICSE and state board: many Bengaluru families keep their existing school enrolment and learn with us alongside it, where the current school permits.',
            'Timelines: registration windows, entry deadlines, practical arrangements and the exam calendar are managed with you each cycle.'
        ],
        cityFacts: [
            'Time zone: IST (UTC+5:30) - the same clock as our Kochi team.',
            'Live cohorts in normal school hours; no midnight classes.',
            'Ages 6-17 across Lower, Middle and Higher Grades.',
            '1:8 mentor ratio with named facilitators, plus daily parent reporting.'
        ],
        faqs: [
            {
                q: 'Is there a good online school in Bengaluru for a child who finds regular school too slow?',
                a: 'That is the most common reason Bengaluru families contact us. A child who finishes early and coasts needs harder work, not more of the same. Our cohorts allow a learner to move at their own pace in each subject, with project work that is genuinely difficult, while still preparing for a recognised board examination.'
            },
            {
                q: 'Can my child take NIOS exams while living in Bengaluru?',
                a: 'Yes. NIOS examinations are conducted through accredited centres in Karnataka, and Bengaluru families normally write locally. We map the nearest viable centre for your child&rsquo;s subject list, plan the practical requirements, and work backwards from the exam session you are targeting.'
            },
            {
                q: 'We both work full time. How much supervision does online schooling need?',
                a: 'More in the first term, much less afterwards. The initial weeks need a parent to set up the routine and the workspace; after that, involvement shifts to reviewing the portfolio and joining progress conversations. Parents receive a daily report, so you are not relying on your child&rsquo;s account of the day.'
            },
            {
                q: 'Do you teach coding, AI and entrepreneurship, or is this only academic support?',
                a: 'They are part of the timetable, not optional extras. Students work with AI tools under supervision, learn prompt engineering and verification, build and publish web projects, and develop a business idea with real presentation practice. Board preparation is scheduled alongside that work, not instead of it.'
            }
        ],
        related: [
            { href: 'online-school-mumbai', label: 'Online school in Mumbai' },
            { href: 'online-school-hyderabad', label: 'Online school in Hyderabad' },
            { href: 'online-school-kerala.html', label: 'Online school in Kerala (our home state)' }
        ]
    },

    {
        slug: 'mumbai',
        city: 'Mumbai',
        aliases: ['Bombay'],
        country: 'India',
        grouping: 'india',
        route: ROUTE('mumbai'),
        title: 'Online School in Mumbai | Live AI-First Schooling for Ages 6-17',
        description: 'A live online school for Mumbai families. Small cohorts, 1:8 mentors, AI and project work, with NIOS, IGCSE and GED guidance - no commute, no evening tuition second shift.',
        keywords: 'online school in mumbai, best online school mumbai, alternative school mumbai, online schooling maharashtra, nios guidance mumbai, igcse private candidate mumbai, homeschool mumbai',
        h1Before: 'Online School in',
        h1Highlight: 'Mumbai',
        heroLead: 'A live online school for Mumbai families. Small cohorts, mentors who actually know your child, AI and business projects instead of rote homework, and a recognised board pathway at the end of it - with the commuting hours returned to your family.',
        directAnswer: 'Hash Future School is a live online school for Mumbai families with children aged 6-17. Students learn in small cohorts with a 1:8 mentor ratio, build AI, coding and business projects, and prepare for NIOS, IGCSE or GED - with the commuting hours returned to the child.',
        contextTitle: 'What Mumbai families tell us',
        context: [
            'Mumbai compresses school, coaching, activities and travel into a day that starts before sunrise. Parents describe capable children who are permanently tired, and a schedule where the first thing sacrificed is the interest that made the child distinctive in the first place.',
            'The city also has one of the most competitive school admission environments in the country, so families rarely leave a school because they want to. They leave because the child is drowning, because they are relocating, or because a posting has brought them home from abroad and the re-entry was harder than they expected.'
        ],
        timetable: 'Mumbai is on IST, the same clock as our facilitators, so live classes fall inside normal school hours and evenings stay free for sport, music or family. When a child has a competition, a performance or a shoot, the session is attended in the alternative slot rather than missed, and progress is tracked week to week.',
        boards: [
            'NIOS: accredited examination centres operate across Maharashtra, including Mumbai. We plan the subject combination around your child&rsquo;s intended stream or degree.',
            'IGCSE: private candidates write at Cambridge-approved centres in India; we confirm which centre accepts your child&rsquo;s subjects before entries are made.',
            'CBSE, ICSE and state board: many families continue with their existing school enrolment and add our programme alongside it, where the school allows.',
            'Exam logistics: entry deadlines, practicals and the exam calendar are planned with you rather than left to chance.'
        ],
        cityFacts: [
            'Time zone: IST (UTC+5:30) - live classes in normal school hours.',
            'Ages 6-17 across Lower, Middle and Higher Grades.',
            '1:8 mentor ratio with named facilitators.',
            'Daily parent reporting, so the week is visible without asking.',
            'Students join from Andheri, Bandra, Powai, Thane and Navi Mumbai.'
        ],
        faqs: [
            {
                q: 'My child is exhausted by school plus tuition in Mumbai. What are the options?',
                a: 'The usual fix is to remove one of the two, not to add a third. Families typically choose a flexible board pathway so the academic pressure drops, then rebuild the learning habit in a small group where the child can ask questions without an audience. Tuition stops being the second shift.'
            },
            {
                q: 'Can we do NIOS from Mumbai?',
                a: 'Yes. NIOS is India&rsquo;s national open board and examinations are held through accredited centres across Maharashtra, including Mumbai. We guide the enrolment, subject selection, assignments and exam planning, and confirm the nearest centre that matches your child&rsquo;s subjects.'
            },
            {
                q: 'Will my child lose friends if we leave school in Mumbai?',
                a: 'Our students end up with a wider network than a single school gives them. They learn alongside a global community of families, meet their local cohort in person once a month, and build unusually deep bonds — because they collaborate on constructive projects instead of competing against each other. Families usually pair that with local sport, music or a club so social contact is not only online.'
            },
            {
                q: 'How do you handle a child who is academically ahead of their class?',
                a: 'We let them move. Pacing is mastery-based rather than calendar-based, so a child who can demonstrate understanding progresses instead of waiting for the class. Older students typically move into independent projects, internships and board-level work rather than repeating material they already know.'
            }
        ],
        related: [
            { href: 'online-school-bengaluru', label: 'Online school in Bengaluru' },
            { href: 'online-school-new-delhi', label: 'Online school in New Delhi' },
            { href: 'online-school-vs-regular-school.html', label: 'Online school vs regular school, compared' }
        ]
    },

    {
        slug: 'new-delhi',
        city: 'New Delhi',
        aliases: ['Delhi', 'Delhi NCR', 'Gurugram', 'Noida'],
        country: 'India',
        grouping: 'india',
        route: ROUTE('new-delhi'),
        title: 'Online School in New Delhi | Online Schooling Without the NCR Commute',
        description: 'Live online schooling for New Delhi and NCR families, ages 6-17. Small cohorts, 1:8 mentors, AI-first projects and NIOS, IGCSE or GED guidance - without the cross-city commute.',
        keywords: 'online school in delhi, best online school new delhi, alternative school delhi ncr, online schooling gurgaon, online school noida, nios guidance delhi, igcse online delhi, homeschool delhi',
        h1Before: 'Online School in',
        h1Highlight: 'New Delhi',
        heroLead: 'A live online school for New Delhi and NCR families. Small live cohorts, mentors at a 1:8 ratio, real AI and project work, and a recognised board pathway - with no cross-city commute and no coaching second shift.',
        directAnswer: 'Hash Future School is a live online school for New Delhi and NCR families with children aged 6-17. Students join small cohorts with a 1:8 mentor ratio, build AI and project work, and prepare for NIOS, IGCSE or GED - without crossing the city to reach a classroom.',
        contextTitle: 'What Delhi and NCR families tell us',
        context: [
            'Delhi families describe a school day plus a coaching day, often in different parts of the NCR. Children spend the hours between them in traffic, the exam becomes the only measure that matters, and the years between seven and seventeen pass in a schedule nobody actually chose.',
            'The city also throws disruptions at families that a fixed school calendar cannot absorb: severe air-quality days, transport disruption, postings that move the family mid-year, and winter or summer breaks that do not line up with anyone else&rsquo;s plans.'
        ],
        timetable: 'New Delhi is on IST, so sessions are scheduled inside normal school hours. Because we teach live rather than by recorded lecture, a child who misses a session for a competition, an illness or a family reason gets a scheduled catch-up instead of a backlog. The freed time usually goes back into sport, music or a project the child actually chose.',
        boards: [
            'NIOS: accredited examination centres operate across Delhi NCR. We plan subjects against your child&rsquo;s target course, including the subject rules some professional programmes add.',
            'IGCSE: private candidates write at Cambridge-approved centres in India; we confirm the centre that accepts your exact subject list before entries are made.',
            'CBSE and ICSE: Delhi families often keep their current school enrolment alongside our programme, where the school permits it.',
            'University planning: we check eligibility requirements for the specific course or country your child is targeting before subjects are locked.'
        ],
        cityFacts: [
            'Time zone: IST (UTC+5:30) - live sessions in school hours.',
            'Students join from Delhi, Noida, Gurugram, Ghaziabad and Faridabad.',
            'Ages 6-17 across Lower, Middle and Higher Grades.',
            '1:8 mentor ratio, daily parent reports, no evening tuition required.'
        ],
        faqs: [
            {
                q: 'Is online schooling valid for university admissions in Delhi?',
                a: 'What certifies your child is the board, not the mode of instruction. NIOS, CBSE and state board certificates are recognised by Indian universities, and IGCSE is widely accepted with an equivalence step in some cases. For professional courses and entrance exams we check the specific eligibility rules before subjects are chosen.'
            },
            {
                q: 'Can my child stay enrolled in their current Delhi school and learn with you?',
                a: 'Many families do exactly that, where the school allows dual enrolment or does not require daily attendance. It is a good way to test the model without burning any bridges. We will tell you honestly during the discovery call whether your child&rsquo;s situation suits it.'
            },
            {
                q: 'What happens on high-pollution days when schools in Delhi close?',
                a: 'Nothing stops. Our programme is live and online by design, so a school closure, a transport disruption or an extended break does not interrupt the timetable. Cohorts continue on schedule, and students who were already learning with us are unaffected.'
            },
            {
                q: 'How do you keep a frustrated, exam-averse child engaged?',
                a: 'By lowering the cost of starting. Younger students work in short guided tasks with visible results; older ones take on projects they can explain and defend. Mentors use live questioning rather than blank-page homework, and progress is measured by demonstration rather than rank against thirty other children.'
            }
        ],
        related: [
            { href: 'online-school-mumbai', label: 'Online school in Mumbai' },
            { href: 'online-school-bengaluru', label: 'Online school in Bengaluru' },
            { href: 'global/academic-burnout', label: 'Support for academic burnout and school refusal' }
        ]
    },

    {
        slug: 'hyderabad',
        city: 'Hyderabad',
        aliases: ['Secunderabad', 'Cyberabad'],
        country: 'India',
        grouping: 'india',
        route: ROUTE('hyderabad'),
        title: 'Online School in Hyderabad | AI-First Online Schooling for Ages 6-17',
        description: 'Live online schooling for Hyderabad families. Small cohorts, 1:8 mentors, AI, coding and entrepreneurship projects, with NIOS, IGCSE and GED guidance for ages 6-17.',
        keywords: 'online school in hyderabad, best online school hyderabad, alternative school hyderabad, online schooling telangana, nios guidance hyderabad, igcse online hyderabad, homeschool hyderabad',
        h1Before: 'Online School in',
        h1Highlight: 'Hyderabad',
        heroLead: 'A live online school for Hyderabad families. Small cohorts, a 1:8 mentor ratio, and a timetable where AI, coding and entrepreneurship are the curriculum rather than an after-school club - with NIOS, IGCSE or GED at the end of the pathway.',
        directAnswer: 'Hash Future School is a live online school for Hyderabad families with children aged 6-17. Learners join small cohorts with a 1:8 mentor ratio, build AI, coding and entrepreneurship projects, and prepare for NIOS, IGCSE or GED at their own pace.',
        contextTitle: 'What Hyderabad families tell us',
        context: [
            'Hyderabad is a city where parents understand technology professionally, and a growing number are unwilling to accept a school experience built on memorisation. Questions here are sharper than most: what exactly will my child be able to do at eighteen, and what evidence will they have to show for it?',
            'School admissions in the CBSE and international circuit are competitive, and the evening tuition habit is strong. Many families reach us after a year of paying for both a premium school and daily tuition, and seeing very little change in how their child actually thinks or works.'
        ],
        timetable: 'Hyderabad runs on IST, so live classes sit inside normal school hours. Cohorts are grouped by grade band, and the timetable deliberately leaves the evening free for tennis, cricket, dance or serious music practice instead of a tuition slot. Missed sessions are replaced with a scheduled catch-up rather than left as a gap.',
        boards: [
            'NIOS: examined through accredited centres across Telangana, including Hyderabad. Subject combinations are planned around the degree or stream your child is targeting.',
            'IGCSE: private candidates write at Cambridge-approved centres in India; we confirm the nearest centre that accepts your child&rsquo;s subject list.',
            'CBSE, ICSE and Telangana state board: families frequently keep their current enrolment and learn with us alongside it, where the school permits.',
            'Planning: entry deadlines, practical requirements and exam sessions are mapped with you every cycle.'
        ],
        cityFacts: [
            'Time zone: IST (UTC+5:30) - live sessions in school hours.',
            'Students join from Gachibowli, Kondapur, Hitec City, Banjara Hills and Jubilee Hills.',
            'Ages 6-17 across Lower, Middle and Higher Grades.',
            '1:8 mentor ratio with named facilitators and daily parent reporting.'
        ],
        faqs: [
            {
                q: 'Which is better for my child in Hyderabad - NIOS or their current CBSE school?',
                a: 'It depends on why you are considering a change. If the child is thriving and the school is working, staying is usually right. If the problem is pace, pressure, health or a talent that needs hours the school day cannot give, an open board pathway removes the daily conflict while keeping a recognised certificate.'
            },
            {
                q: 'My child is a serious athlete. Can they train and study properly?',
                a: 'That combination is one of the strongest arguments for open schooling. Training hours in the morning or evening, travel to competitions, and recovery time can all be protected, while the academic work continues in live sessions and a scheduled board pathway. Several of our students compete at state and national level.'
            },
            {
                q: 'How do you teach AI to a nine-year-old?',
                a: 'Through guided use, not lectures. Younger children work with supervised tools on small creation tasks - an image, a story, a game, a poster - and learn to say what they asked for and what changed. By the middle grades they are using AI for research and prototyping and explaining their own reasoning in review sessions.'
            },
            {
                q: 'Do you offer IGCSE preparation for students in Hyderabad?',
                a: 'Yes. We prepare learners for IGCSE as private candidates, mapping subject choices to the university or country your child is aiming at, teaching the syllabus with mentor-led classes, then drilling past papers and examiner expectations. The exam is written through a Cambridge-approved centre.'
            }
        ],
        related: [
            { href: 'online-school-bengaluru', label: 'Online school in Bengaluru' },
            { href: 'igcse-private-candidate.html', label: 'IGCSE as a private candidate' },
            { href: 'ai-first-learning.html', label: 'How our AI-first learning model works' }
        ]
    },

    {
        slug: 'kolkata',
        city: 'Kolkata',
        aliases: ['Calcutta'],
        country: 'India',
        grouping: 'india',
        route: ROUTE('kolkata'),
        title: 'Online School in Kolkata | Online Schooling with NIOS & IGCSE Guidance',
        description: 'Live online schooling for Kolkata families, ages 6-17. Small cohorts, 1:8 mentors, AI and project-based learning, with NIOS, IGCSE and GED pathways for children who need a different route.',
        keywords: 'online school in kolkata, online school in kolkatta, best online school kolkata, alternative school kolkata, online schooling west bengal, nios guidance kolkata, igcse private candidate kolkata, homeschool kolkata',
        h1Before: 'Online School in',
        h1Highlight: 'Kolkata',
        heroLead: 'A live online school for Kolkata families. Academic seriousness without the tuition pile-up: small cohorts, a 1:8 mentor ratio, real AI and research projects, and a recognised board pathway for children who need a different route.',
        directAnswer: 'Hash Future School is a live online school for Kolkata families with children aged 6-17. Students learn in small cohorts with a 1:8 mentor ratio, build AI, coding and research projects, and prepare for NIOS, IGCSE or GED without the extra tuition burden.',
        contextTitle: 'What Kolkata families tell us',
        context: [
            'Kolkata&rsquo;s academic culture is deep and competitive. Board results carry real weight, tuition is normal from an early age, and families invest seriously in education. When a child struggles inside that system, parents often hesitate for years before considering another route - because leaving feels like giving something up.',
            'We hear from families in Salt Lake, New Town, Behala, Ballygunge and Barrackpore who have a child doing well in two subjects and failing in three, and no local option that would let them study each subject at the level they are actually at.'
        ],
        timetable: 'Kolkata is on IST, so live sessions run inside normal school hours. Children preparing for board examinations get a scheduled study and past-paper block, while younger learners get project time in the same day rather than homework stacked on top of it. Evenings stay free for sport, music, art or family.',
        boards: [
            'NIOS: accredited examination centres operate across West Bengal, including Kolkata. This is the most common route for families moving away from a high-pressure school day.',
            'IGCSE: private candidates write at Cambridge-approved centres in India; we confirm the nearest centre that accepts your child&rsquo;s subjects before entries.',
            'West Bengal board, ICSE and CBSE: many families continue with their existing enrolment and add our programme alongside it, where the school permits.',
            'Practical subjects: science practical requirements are planned with the exam centre rather than discovered at the last minute.'
        ],
        cityFacts: [
            'Time zone: IST (UTC+5:30) - live classes in school hours.',
            'Ages 6-17 across Lower, Middle and Higher Grades.',
            '1:8 mentor ratio with named facilitators.',
            'Daily parent reporting and scheduled catch-ups for missed sessions.'
        ],
        faqs: [
            {
                q: 'Can my child switch from the West Bengal board or ICSE to NIOS?',
                a: 'Yes, and it is a common move for families whose child is struggling with the pace rather than the subject matter. NIOS is a recognised national board with its own syllabus, assignments and examinations. We plan the subject combination, the age eligibility and the exam session before your child begins.'
            },
            {
                q: 'Will a NIOS certificate be accepted for colleges in West Bengal and elsewhere?',
                a: 'NIOS is a recognised national board under India&rsquo;s Ministry of Education, and its certificates are accepted by Indian universities and higher education institutions. Some professional courses add their own eligibility conditions, such as specific science subjects or practicals, so we check the rules for your child&rsquo;s target course before locking subjects.'
            },
            {
                q: 'How does an online school handle science practicals?',
                a: 'Practicals are arranged through an accredited centre as part of the board requirement, not run from a home kitchen. We confirm the centre&rsquo;s requirements and dates, prepare the student for the practical component, and build the schedule around it so the rest of the term is not disrupted.'
            },
            {
                q: 'Is online schooling suitable for a shy child who rarely speaks up in class?',
                a: 'Often it suits them better than a large classroom. Our groups are small, so there is airtime without an audience: learners start with typed contributions and small-group answers, then move to presenting to their pod and later to larger groups. They also meet their local cohort in person once a month, so confidence built on screen carries into a room.'
            }
        ],
        related: [
            { href: 'online-school-new-delhi', label: 'Online school in New Delhi' },
            { href: 'nios-online-school.html', label: 'NIOS online schooling, explained in full' },
            { href: 'global/social-isolation-safe-community', label: 'Safe learning pods and mentorship' }
        ]
    },

    {
        slug: 'dubai',
        city: 'Dubai',
        aliases: ['UAE', 'Jumeirah', 'Dubai Marina'],
        country: 'United Arab Emirates',
        grouping: 'gulf',
        route: ROUTE('dubai'),
        title: 'Online School in Dubai | Indian Curriculum Online Schooling for Expats',
        description: 'Live online schooling for Indian families in Dubai, ages 6-17. Small cohorts, 1:8 mentors, AI-first projects, and NIOS, IGCSE or GED pathways that survive your next relocation.',
        keywords: 'online school in dubai, online school for indian families in dubai, indian curriculum online dubai, alternative school dubai, nios from uae, igcse private candidate dubai, homeschooling dubai expat',
        h1Before: 'Online School in',
        h1Highlight: 'Dubai',
        heroLead: 'A live online school for Indian families in Dubai. Small cohorts in Gulf-friendly time slots, a 1:8 mentor ratio, real AI and entrepreneurship work, and a board pathway that continues through your next posting - not restarts because of it.',
        directAnswer: 'Hash Future School is a live online school for families in Dubai with children aged 6-17. Students join small cohorts with a 1:8 mentor ratio, learn AI, coding and entrepreneurship, and prepare for NIOS, IGCSE or GED - with timings built around Gulf time.',
        contextTitle: 'What Dubai families tell us',
        context: [
            'Dubai offers Indian families an extraordinary range of schools and an equally serious fee structure, alongside the annual uncertainty of visas, jobs and relocations. Children often change school two or three times before they reach Grade 10, and every move costs them months of settling in and re-making friends.',
            'We work with families across Dubai Marina, JLT, Al Barsha, Jumeirah, Silicon Oasis and Mirdif who want one thing to stay constant while everything else moves: their child&rsquo;s programme, mentors and cohort.'
        ],
        timetable: 'Dubai is on Gulf Standard Time (UTC+4), ninety minutes behind our facilitators in Kerala. Cohorts are grouped by time zone so children in Dubai study in the late afternoon or early evening local time rather than at midnight, and a family that moves back to India or across to another Gulf country keeps the same cohort and mentors.',
        boards: [
            'NIOS: available to learners overseas; the exact examination arrangements are confirmed with the board each cycle, and many families also write in India during a visit. We plan the pathway around what is realistic for your family.',
            'IGCSE: private candidates write at Cambridge-approved centres in the region. We confirm the nearest centre that accepts your child&rsquo;s subject list before you commit to a route.',
            'Indian curriculum continuity: many Dubai families keep the Indian syllabus and their cohort through a relocation, so a posting change does not reset the academic year.',
            'Planning: subject choices are mapped backwards from the university and country your child is likely to target, including any equivalence requirements.'
        ],
        cityFacts: [
            'Time zone: GST (UTC+4) - 1.5 hours behind IST.',
            'Live cohorts grouped by time zone; no midnight classes.',
            'Ages 6-17 across Lower, Middle and Higher Grades.',
            '1:8 mentor ratio, daily parent reports, and one programme across the Emirates.'
        ],
        faqs: [
            {
                q: 'Is there an online school in Dubai that follows the Indian curriculum?',
                a: 'Yes. Hash Future School teaches the Indian curriculum from Kochi, live and online, to families across the UAE. Children keep the Indian syllabus and a small cohort while the family is posted abroad, which makes re-entry to India far easier than switching systems twice.'
            },
            {
                q: 'Can my child take NIOS or IGCSE exams while we live in Dubai?',
                a: 'Both routes are possible, but the details matter. IGCSE private candidates write at Cambridge-approved centres in the region; NIOS examination arrangements for overseas learners are confirmed with the board each cycle. We verify the current arrangements for your child&rsquo;s subjects before you choose a pathway.'
            },
            {
                q: 'What happens to my child&rsquo;s schooling if we move to another country?',
                a: 'Nothing changes except the time slot. Your child stays in the same cohort with the same facilitators and the same board pathway, so a transfer becomes a scheduling adjustment rather than a fresh start. That continuity is the main reason relocating families choose us.'
            },
            {
                q: 'How do your fees compare with private schools in Dubai?',
                a: 'They are not a like-for-like comparison, so we show you both numbers honestly. A school fee carries campus, transport, uniform and often tuition costs around it; our model removes most of those. The admissions team shares the programme fee for your child&rsquo;s grade and what families typically stop paying for.'
            }
        ],
        related: [
            { href: 'online-school-abu-dhabi', label: 'Online school in Abu Dhabi' },
            { href: 'online-school-uae', label: 'Online school across the UAE' },
            { href: 'global/future-ready-accredited-pathways', label: 'Accredited pathways: IGCSE, NIOS and GED' }
        ]
    },

    {
        slug: 'abu-dhabi',
        city: 'Abu Dhabi',
        aliases: ['Al Ain', 'Khalifa City'],
        country: 'United Arab Emirates',
        grouping: 'gulf',
        route: ROUTE('abu-dhabi'),
        title: 'Online School in Abu Dhabi | Indian Curriculum Online Schooling',
        description: 'Live online schooling for Indian families in Abu Dhabi, ages 6-17. Small cohorts, 1:8 mentors, AI-first projects and NIOS, IGCSE or GED pathways with Gulf-friendly timings.',
        keywords: 'online school in abu dhabi, indian curriculum online abu dhabi, alternative school abu dhabi, nios from uae, igcse private candidate abu dhabi, homeschooling abu dhabi',
        h1Before: 'Online School in',
        h1Highlight: 'Abu Dhabi',
        heroLead: 'A live online school for Indian families in Abu Dhabi. Small cohorts, mentors at a 1:8 ratio, AI and entrepreneurship work instead of rote repetition, and a recognised board pathway that does not depend on a school place coming free.',
        directAnswer: 'Hash Future School is a live online school for families in Abu Dhabi with children aged 6-17. Learners join small cohorts with a 1:8 mentor ratio, build AI and entrepreneurship projects, and prepare for NIOS, IGCSE or GED with Gulf-friendly timings.',
        contextTitle: 'What Abu Dhabi families tell us',
        context: [
            'Abu Dhabi families often choose between a small number of Indian-curriculum schools and international schools with waiting lists and long commutes from Khalifa City, Al Reem or Mohammed Bin Zayed City. When a child needs a different pace - faster in one subject, slower in another - there is very little room to move inside a single school.',
            'Postings here also end without much notice. Parents tell us the hardest part of a relocation is not the move itself but watching a child lose a year of confidence while settling into a new school and a new syllabus at the same time.'
        ],
        timetable: 'Abu Dhabi is on Gulf Standard Time (UTC+4), ninety minutes behind our facilitators in Kerala. Cohorts are grouped by time zone so children study in the late afternoon or early evening local time, and a child who travels to India for the summer keeps the same cohort rather than restarting in September.',
        boards: [
            'NIOS: open to learners overseas, with examination arrangements confirmed with the board each cycle. We plan the pathway around what is genuinely workable from Abu Dhabi.',
            'IGCSE: private candidates write at Cambridge-approved centres in the region; we confirm the nearest centre that accepts your child&rsquo;s exact subject list.',
            'Indian curriculum continuity: keep the same syllabus and cohort through a posting change, whether the next move is Dubai, India or another country.',
            'University planning: subjects are chosen against the degree and country your child is targeting, including equivalence requirements.'
        ],
        cityFacts: [
            'Time zone: GST (UTC+4) - 1.5 hours behind IST.',
            'Live cohorts grouped by time zone; no late-night classes.',
            'Ages 6-17 across Lower, Middle and Higher Grades.',
            '1:8 mentor ratio with daily parent reporting.'
        ],
        faqs: [
            {
                q: 'Which online schools in Abu Dhabi follow the Indian curriculum?',
                a: 'Online schools are not tied to a city, so the right question is which one teaches the Indian curriculum live, with real cohorts and a recognised board pathway. Hash Future School teaches from Kochi to families across the Emirates, keeps children on the Indian syllabus, and prepares them for NIOS, IGCSE or GED.'
            },
            {
                q: 'Can my child sit NIOS or IGCSE exams in the UAE?',
                a: 'IGCSE private candidates write at Cambridge-approved centres in the region. NIOS examination arrangements for overseas learners are confirmed with the board each cycle. We check the current options for your child&rsquo;s subjects and tell you plainly what is realistic before you choose a pathway.'
            },
            {
                q: 'My child&rsquo;s school in Abu Dhabi does not offer the subjects they want. What are the options?',
                a: 'An open-schooling pathway usually solves this, because subject combinations are far more flexible than a school timetable allows. We map the subjects against the course your child is aiming at, confirm which board route fits, and then build the weekly plan around those subjects.'
            },
            {
                q: 'How do you keep a child motivated when they are studying at home in the evening?',
                a: 'Small cohorts and visible output do most of the work. Children see the same faces each week, work towards something they present to the group, and earn recognition for creation, research and helping others rather than attendance. Parents get a daily report, so slumps are spotted early.'
            }
        ],
        related: [
            { href: 'online-school-dubai', label: 'Online school in Dubai' },
            { href: 'online-school-qatar', label: 'Online school in Qatar' },
            { href: 'global/future-ready-accredited-pathways', label: 'Accredited pathways: IGCSE, NIOS and GED' }
        ]
    },

    {
        slug: 'uae',
        city: 'the UAE',
        aliases: ['Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain'],
        country: 'United Arab Emirates',
        grouping: 'gulf',
        route: ROUTE('uae'),
        title: 'Online School in the UAE | Indian Curriculum for Expat Families',
        description: 'Live online schooling for Indian families across the UAE, including Sharjah and the Northern Emirates. Ages 6-17, 1:8 mentors, AI-first projects, NIOS/IGCSE/GED pathways.',
        keywords: 'online school in uae, online school for indian families uae, indian curriculum online uae, alternative school sharjah, nios from uae, igcse private candidate uae, expat homeschooling uae',
        h1Before: 'Online School in',
        h1Highlight: 'the UAE',
        heroLead: 'A live online school for Indian families anywhere in the UAE - Dubai, Abu Dhabi, Sharjah and the Northern Emirates. One programme, one cohort, one board pathway, whichever emirate your family is posted to next.',
        directAnswer: 'Hash Future School is a live online school for families across the UAE with children aged 6-17. Students join small cohorts with a 1:8 mentor ratio, learn through AI and project work, and prepare for NIOS, IGCSE or GED in Gulf-friendly time slots.',
        contextTitle: 'What UAE families tell us',
        context: [
            'Dubai and Abu Dhabi have dozens of Indian-curriculum schools. Sharjah, Ajman, Ras Al Khaimah and Fujairah have far fewer, and families outside the two big cities often face long commutes or a short list of options that do not fit their child.',
            'Within a single year, a UAE family may move between emirates for work. For a child, that can mean a new school, a new syllabus and a new set of friends in the middle of a term. One live programme that travels with the family removes most of that disruption.'
        ],
        timetable: 'The UAE is on Gulf Standard Time (UTC+4), ninety minutes behind our facilitators in Kerala. Cohorts are grouped by time zone so children study in the late afternoon or early evening local time, and moving from Sharjah to Dubai - or Dubai to Abu Dhabi - changes nothing except the drive.',
        boards: [
            'NIOS: available to overseas learners, with examination arrangements confirmed with the board each cycle. Many families also write in India during a longer visit.',
            'IGCSE: private candidates write at Cambridge-approved centres in the region; we confirm the centre that accepts your child&rsquo;s subject list.',
            'Indian curriculum continuity: the same syllabus and cohort continue through a change of emirate, school or country.',
            'Planning: subject choices are mapped against the university destination, including equivalence steps where they apply.'
        ],
        cityFacts: [
            'Time zone: GST (UTC+4) - 1.5 hours behind IST.',
            'Families join from all seven emirates, including Sharjah and Ras Al Khaimah.',
            'Ages 6-17 across Lower, Middle and Higher Grades.',
            '1:8 mentor ratio with daily parent reporting.'
        ],
        faqs: [
            {
                q: 'Is there an online school for Indian families anywhere in the UAE, not just Dubai?',
                a: 'Yes. Because the programme is live and online, your location inside the UAE does not matter - only your time zone does. Families join from Dubai, Abu Dhabi, Sharjah, Ajman, Ras Al Khaimah and Fujairah into the same Gulf cohorts with the same facilitators.'
            },
            {
                q: 'We are moving from Sharjah to Dubai mid-year. Does anything change?',
                a: 'Your child&rsquo;s cohort, mentors, syllabus and board pathway all stay the same. Only the journey disappears. That is the practical difference between an online programme and a school place: a move inside the UAE, or out of it, no longer interrupts an academic year.'
            },
            {
                q: 'Can my child study an Indian curriculum while living in the UAE?',
                a: 'Yes, and many families choose it so that returning to India - or moving to another country with an Indian community - does not mean a new education system. Children keep the Indian syllabus and prepare for a recognised board through NIOS, IGCSE or GED.'
            },
            {
                q: 'Which exams can my child take, and how do we choose between them?',
                a: 'We prepare learners for NIOS, Cambridge IGCSE as a private candidate, or GED. The choice depends on where your child is likely to study afterwards, which subjects they need, and how they handle examinations. We work it out backwards from the destination before teaching begins.'
            }
        ],
        related: [
            { href: 'online-school-dubai', label: 'Online school in Dubai' },
            { href: 'online-school-abu-dhabi', label: 'Online school in Abu Dhabi' },
            { href: 'online-school-oman', label: 'Online school in Oman' }
        ]
    },

    {
        slug: 'qatar',
        city: 'Qatar',
        aliases: ['Doha', 'Al Wakrah', 'Lusail'],
        country: 'Qatar',
        grouping: 'gulf',
        route: ROUTE('qatar'),
        title: 'Online School in Qatar | Indian Curriculum Online Schooling for Expats',
        description: 'Live online schooling for Indian families in Qatar, ages 6-17. Small cohorts, 1:8 mentors, AI-first projects and NIOS, IGCSE or GED pathways with Doha-friendly timings.',
        keywords: 'online school in qatar, online school doha, indian curriculum online qatar, alternative school doha, nios from qatar, igcse private candidate qatar, homeschooling qatar',
        h1Before: 'Online School in',
        h1Highlight: 'Qatar',
        heroLead: 'A live online school for Indian families in Qatar. Small cohorts in Doha-friendly time slots, a 1:8 mentor ratio, AI and project-based learning, and a board pathway that holds whether you stay in Qatar or move on next year.',
        directAnswer: 'Hash Future School is a live online school for families in Qatar with children aged 6-17. Learners join small cohorts with a 1:8 mentor ratio, build AI and project portfolios, and prepare for NIOS, IGCSE or GED in time slots that fit Doha.',
        contextTitle: 'What Qatar families tell us',
        context: [
            'Qatar has good Indian-curriculum schools, but seats are limited and the waiting lists can decide a family&rsquo;s year. Children arriving mid-term from India or another Gulf country often land in a class that is already halfway through a syllabus.',
            'Most postings here are three to five years, which is long enough to matter academically and short enough to make continuity the main worry. Parents ask a version of the same question: will my child be able to move back into an Indian school, or into another country, without losing ground?'
        ],
        timetable: 'Qatar is on Arabia Standard Time (UTC+3), two and a half hours behind our facilitators in Kerala. Cohorts are grouped by time zone so children study in the late afternoon or early evening local time, and a family posted home to India mid-year keeps the same cohort rather than re-entering at the wrong point in a syllabus.',
        boards: [
            'NIOS: available to overseas learners, with examination arrangements confirmed with the board each cycle. We plan the route around what works from Qatar.',
            'IGCSE: private candidates write at Cambridge-approved centres in the region; we confirm the nearest centre that accepts your child&rsquo;s subjects.',
            'Indian curriculum continuity: keep the Indian syllabus and your cohort across a posting change, so returning to India is a transition rather than a restart.',
            'Planning: subject combinations are mapped against the course and country your child is likely to target.'
        ],
        cityFacts: [
            'Time zone: AST (UTC+3) - 2.5 hours behind IST.',
            'Cohorts grouped by time zone, with evening-friendly session slots.',
            'Ages 6-17 across Lower, Middle and Higher Grades.',
            '1:8 mentor ratio with daily parent reporting.'
        ],
        faqs: [
            {
                q: 'Is there an online school in Doha for the Indian curriculum?',
                a: 'Yes. Hash Future School teaches the Indian curriculum live from Kochi to families in Doha and across Qatar. Children stay on the Indian syllabus with a small cohort, which keeps the door open to Indian schools and universities, and to other countries with Indian communities.'
            },
            {
                q: 'Can my child write NIOS exams from Qatar?',
                a: 'NIOS is open to learners overseas, though the exact examination arrangements are confirmed with the board each cycle rather than assumed. We check the current options for your child&rsquo;s subjects, including whether a sitting in India during a family visit is the more practical route.'
            },
            {
                q: 'We are in Doha for three years and then returning to India. How does that work?',
                a: 'This is the case our model is built for. Your child keeps the Indian syllabus, the same cohort and the same board pathway throughout the posting, so the return to India is a change of address rather than a change of education system. We plan the board timing around your likely return year.'
            },
            {
                q: 'Do you support students who arrive mid-year from India?',
                a: 'Yes, and we start by working out where the child actually is rather than where the calendar says they should be. Gaps are handled through small-group mastery work, so a mid-year arrival does not become a year of catching up while pretending to keep pace with a class.'
            }
        ],
        related: [
            { href: 'online-school-uae', label: 'Online school across the UAE' },
            { href: 'online-school-saudi-arabia', label: 'Online school in Saudi Arabia' },
            { href: 'global/future-ready-accredited-pathways', label: 'Accredited pathways: IGCSE, NIOS and GED' }
        ]
    },

    {
        slug: 'oman',
        city: 'Oman',
        aliases: ['Muscat', 'Salalah', 'Sohar'],
        country: 'Oman',
        grouping: 'gulf',
        route: ROUTE('oman'),
        title: 'Online School in Oman | Indian Curriculum for Expat Families in Muscat',
        description: 'Live online schooling for Indian families in Oman, ages 6-17. Small cohorts, 1:8 mentors, AI-first projects and NIOS, IGCSE or GED pathways with Muscat-friendly timings.',
        keywords: 'online school in oman, online school muscat, indian curriculum online oman, alternative school muscat, nios from oman, igcse private candidate oman, homeschooling oman',
        h1Before: 'Online School in',
        h1Highlight: 'Oman',
        heroLead: 'A live online school for Indian families in Oman. Small cohorts in Muscat-friendly time slots, mentors at a 1:8 ratio, real AI and research work, and a recognised board pathway that does not depend on a seat opening up.',
        directAnswer: 'Hash Future School is a live online school for families in Oman with children aged 6-17. Students join small cohorts with a 1:8 mentor ratio, learn AI, coding and research skills, and prepare for NIOS, IGCSE or GED on a Muscat timetable.',
        contextTitle: 'What Oman families tell us',
        context: [
            'Muscat has a handful of respected Indian-curriculum schools, and demand for places runs ahead of supply. Families in Ruwi, Al Ghubra, Qurum, Al Khuwair and Seeb describe waiting lists, mid-year arrivals and a very small set of alternatives if the child needs a different pace.',
            'Oman&rsquo;s Indian community is smaller than Dubai&rsquo;s or Doha&rsquo;s, which means fewer tutoring options and fewer families in the same situation nearby. The parents we work with value not being the only family making this choice.'
        ],
        timetable: 'Oman is on Gulf Standard Time (UTC+4), ninety minutes behind our facilitators in Kerala. Live sessions are grouped so children in Muscat study in the late afternoon or early evening, and a family travelling to India for the holidays keeps the same cohort instead of falling a chapter behind.',
        boards: [
            'NIOS: open to learners overseas, with examination arrangements confirmed with the board each cycle rather than assumed.',
            'IGCSE: private candidates write at Cambridge-approved centres in the region; we confirm which centre accepts your child&rsquo;s subject combination.',
            'Indian curriculum continuity: the same syllabus and cohort continue through a posting change or a return to India.',
            'Planning: subjects are mapped to the university destination, including any equivalence documentation that will be needed later.'
        ],
        cityFacts: [
            'Time zone: GST (UTC+4) - 1.5 hours behind IST.',
            'Cohorts grouped by time zone with evening-friendly slots.',
            'Ages 6-17 across Lower, Middle and Higher Grades.',
            '1:8 mentor ratio with daily parent reporting.'
        ],
        faqs: [
            {
                q: 'Are there online schooling options for Indian families in Muscat?',
                a: 'Yes. Because the programme is live and online, your city does not limit the options - only your time zone matters. Families in Muscat join the same Gulf cohorts as families in Dubai and Doha, with the same facilitators, syllabus and board pathway.'
            },
            {
                q: 'My child is on a waiting list for an Indian school in Oman. What can we do meanwhile?',
                a: 'Studying with us in the meantime is not wasted time. Your child stays on the Indian syllabus, keeps a structured week and a peer group, and can move into a school place later without having lost months. Some families choose to continue with us instead of taking the seat when it comes.'
            },
            {
                q: 'Can my child take NIOS or IGCSE exams while living in Oman?',
                a: 'IGCSE private candidates write at Cambridge-approved centres in the region. NIOS arrangements for overseas learners are confirmed with the board each cycle, and many families find writing in India during a visit more practical. We verify the current options before you commit to a pathway.'
            },
            {
                q: 'How do your term dates line up with Indian holidays?',
                a: 'We do not force a school calendar on a travelling family. Sessions run through the year with planned breaks, and because everything is live and recorded for catch-up, a family holiday in India does not put your child behind. Board deadlines are the dates we plan around.'
            }
        ],
        related: [
            { href: 'online-school-uae', label: 'Online school across the UAE' },
            { href: 'online-school-qatar', label: 'Online school in Qatar' },
            { href: 'global/future-ready-accredited-pathways', label: 'Accredited pathways: IGCSE, NIOS and GED' }
        ]
    },

    {
        slug: 'saudi-arabia',
        city: 'Saudi Arabia',
        aliases: ['Riyadh', 'Jeddah', 'Dammam', 'Al Khobar'],
        country: 'Saudi Arabia',
        grouping: 'gulf',
        route: ROUTE('saudi-arabia'),
        title: 'Online School in Saudi Arabia | Indian Curriculum for Expat Families',
        description: 'Live online schooling for Indian families in Saudi Arabia - Riyadh, Jeddah and the Eastern Province. Ages 6-17, 1:8 mentors, AI-first projects, NIOS/IGCSE/GED pathways.',
        keywords: 'online school in saudi arabia, online school riyadh, online school jeddah, indian curriculum online saudi arabia, alternative school riyadh, nios from saudi arabia, expat homeschooling saudi',
        h1Before: 'Online School in',
        h1Highlight: 'Saudi Arabia',
        heroLead: 'A live online school for Indian families in Saudi Arabia. Small cohorts, a 1:8 mentor ratio, AI and entrepreneurship work instead of rote repetition, and a recognised board pathway built around the Saudi school week.',
        directAnswer: 'Hash Future School is a live online school for families in Saudi Arabia with children aged 6-17. Learners join small cohorts with a 1:8 mentor ratio, build AI and entrepreneurial projects, and prepare for NIOS, IGCSE or GED around the Saudi week.',
        contextTitle: 'What Saudi families tell us',
        context: [
            'Families posted to Riyadh, Jeddah, Dammam and Al Khobar usually have Indian-curriculum schooling available, but often only in a few schools, with long commutes from compounds and limited flexibility when a child needs a different pace.',
            'Postings here tend to be long, which is good for stability and hard on a child who is stuck in the wrong academic fit for years. Parents ask us how to change the day-to-day experience without changing country, school record or the family&rsquo;s long-term plans.'
        ],
        timetable: 'Saudi Arabia is on Arabia Standard Time (UTC+3), two and a half hours behind our facilitators in Kerala. The school week here runs Sunday to Thursday rather than India&rsquo;s Monday-to-Friday rhythm, so cohorts are grouped with that in mind and children study in the late afternoon or early evening local time.',
        boards: [
            'NIOS: open to learners overseas, with examination arrangements confirmed with the board each cycle.',
            'IGCSE: private candidates write at Cambridge-approved centres in the region; we confirm the nearest centre that accepts your child&rsquo;s subjects.',
            'Indian curriculum continuity: the same syllabus and cohort continue across a posting change or a move back to India.',
            'Planning: subjects are chosen against the degree and country your child is targeting, not by what is easiest to timetable.'
        ],
        cityFacts: [
            'Time zone: AST (UTC+3) - 2.5 hours behind IST.',
            'School week Sunday to Thursday; cohorts grouped accordingly.',
            'Ages 6-17 across Lower, Middle and Higher Grades.',
            '1:8 mentor ratio with daily parent reporting.'
        ],
        faqs: [
            {
                q: 'Is there an online school for Indian children living in Saudi Arabia?',
                a: 'Yes. Hash Future School teaches the Indian curriculum live from Kochi to families in Riyadh, Jeddah and the Eastern Province. Children keep the Indian syllabus and a small cohort, which protects their options for universities in India and abroad.'
            },
            {
                q: 'How does the Sunday-to-Thursday week work with your timetable?',
                a: 'Cohorts are grouped with the local school week in mind, so sessions fall on working days and the weekend stays free for family time. Children in Saudi Arabia join Gulf time-zone slots in the late afternoon or early evening, and a child who travels to India keeps the same cohort.'
            },
            {
                q: 'Can my child take NIOS or IGCSE exams from Saudi Arabia?',
                a: 'IGCSE private candidates write at Cambridge-approved centres in the region; NIOS arrangements for overseas learners are confirmed with the board each cycle, and a sitting in India during a family visit is often the practical route. We verify both options before you choose a pathway.'
            },
            {
                q: 'We may move to India or the UAE next year. Does the programme transfer?',
                a: 'Completely. Your child keeps the same cohort, facilitators and board pathway, and only the time slot changes. That continuity is deliberate: we built the programme so that a posting change, a return to India or a move between Gulf countries does not cost a child an academic year.'
            }
        ],
        related: [
            { href: 'online-school-uae', label: 'Online school across the UAE' },
            { href: 'online-school-kuwait', label: 'Online school in Kuwait' },
            { href: 'global/future-ready-accredited-pathways', label: 'Accredited pathways: IGCSE, NIOS and GED' }
        ]
    },

    {
        slug: 'kuwait',
        city: 'Kuwait',
        aliases: ['Kuwait City', 'Salmiya', 'Hawally'],
        country: 'Kuwait',
        grouping: 'gulf',
        route: ROUTE('kuwait'),
        title: 'Online School in Kuwait | Indian Curriculum Online Schooling for Expat Families',
        description: 'Live online schooling for Indian families in Kuwait, ages 6-17. Small cohorts, 1:8 mentors, AI-first projects and NIOS, IGCSE or GED pathways with Kuwait-friendly timings.',
        keywords: 'online school in kuwait, online school kuwait city, indian curriculum online kuwait, alternative school kuwait, nios from kuwait, igcse private candidate kuwait, expat homeschooling kuwait',
        h1Before: 'Online School in',
        h1Highlight: 'Kuwait',
        heroLead: 'A live online school for Indian families in Kuwait. Small cohorts in Kuwait-time slots, mentors at a 1:8 ratio, AI, coding and business projects, and a recognised board pathway for families who intend to return to India.',
        directAnswer: 'Hash Future School is a live online school for families in Kuwait with children aged 6-17. Students join small cohorts with a 1:8 mentor ratio, build AI, coding and business projects, and prepare for NIOS, IGCSE or GED on Kuwait time.',
        contextTitle: 'What Kuwait families tell us',
        context: [
            'Kuwait has a smaller Indian-curriculum footprint than Dubai or Doha, with most families concentrated around Kuwait City, Salmiya, Salwa, Hawally and Fahaheel. Fewer schools means fewer options when a child needs a different pace, and fewer families nearby making the same choice.',
            'Most families we work with here intend to return to India eventually, usually for higher education. That makes board choice a long-term decision rather than a convenience, because the certificate has to work in both countries.'
        ],
        timetable: 'Kuwait is on Arabia Standard Time (UTC+3), two and a half hours behind our facilitators in Kerala, and the school week runs Sunday to Thursday. Cohorts are grouped so children study in the late afternoon or early evening local time, while the weekend stays free and a trip to India does not interrupt the syllabus.',
        boards: [
            'NIOS: open to learners overseas, with examination arrangements confirmed with the board each cycle. Often the most practical route for families who will return to India.',
            'IGCSE: private candidates write at Cambridge-approved centres in the region; we confirm the nearest centre that accepts your child&rsquo;s subject list.',
            'Indian curriculum continuity: keep the Indian syllabus and cohort so re-entry to an Indian school or university is a transition, not a restart.',
            'Planning: subject combinations are mapped against the course your child will apply for, in India or elsewhere.'
        ],
        cityFacts: [
            'Time zone: AST (UTC+3) - 2.5 hours behind IST.',
            'School week Sunday to Thursday in Kuwait; cohorts grouped accordingly.',
            'Ages 6-17 across Lower, Middle and Higher Grades.',
            '1:8 mentor ratio with daily parent reporting.'
        ],
        faqs: [
            {
                q: 'Are there online schooling options for Indian families in Kuwait?',
                a: 'Yes. Your location inside Kuwait does not limit the options, because the programme is live and online; only the time zone matters. Children join the same Gulf cohorts as families in Dubai and Doha, with the same facilitators, Indian syllabus and board pathway.'
            },
            {
                q: 'Can my child continue the Indian curriculum while we are in Kuwait?',
                a: 'That is exactly what the programme is built for. Your child stays on the Indian syllabus with a small live cohort, keeps a structured week, and prepares for a recognised board - so returning to India, or applying to Indian universities later, does not depend on re-entering a school at the right moment.'
            },
            {
                q: 'Which exams can my child take from Kuwait - NIOS, IGCSE or GED?',
                a: 'We prepare learners for all three, and the right choice depends on where your child will study next and how they handle examinations. NIOS is usually the most practical route for families returning to India; IGCSE is the stronger fit for international university plans; GED suits older students wanting a test-based credential.'
            },
            {
                q: 'What if we return to India in the middle of a school year?',
                a: 'Nothing breaks. Your child keeps the same cohort and board pathway, and only the session time changes. We plan the board examination timing around your likely return year, which is why families on short postings prefer a pathway that does not depend on a single school&rsquo;s calendar.'
            }
        ],
        related: [
            { href: 'online-school-uae', label: 'Online school across the UAE' },
            { href: 'online-school-qatar', label: 'Online school in Qatar' },
            { href: 'nios-online-school.html', label: 'NIOS online schooling, explained in full' }
        ]
    }
];

// ---------------------------------------------------------------- hub

export const CITY_HUB = {
    route: CITY_HUB_ROUTE,
    title: 'Online School by City | India & the Gulf | Hash Future School',
    description: 'Find how Hash Future School works for families in Bengaluru, Mumbai, New Delhi, Hyderabad, Kolkata, Dubai, Abu Dhabi, the wider UAE, Qatar, Oman, Saudi Arabia, Kuwait and Kerala - live cohorts in your time zone with NIOS, IGCSE or GED pathways.',
    keywords: 'online school by city, online school india, online school for expats, indian curriculum online school abroad, online school gulf, nri online school, international online school',
    h1Before: 'Online School in',
    h1Highlight: 'Your City',
    lead: 'One programme, wherever your family is posted. Live cohorts grouped by time zone, a 1:8 mentor ratio, and NIOS, IGCSE or GED pathways that travel with you - so a relocation or a move back to India does not cost your child an academic year.',
    directAnswer: 'Hash Future School is a live online school for families in India\u2019s metros and across the Gulf, including Bengaluru, Mumbai, New Delhi, Hyderabad, Kolkata, Dubai, Abu Dhabi, Qatar, Oman, Saudi Arabia and Kuwait. Cohorts are grouped by time zone with a 1:8 mentor ratio and recognised board pathways.',
    faqs: [
        {
            q: 'Is there an online school in my city?',
            a: 'Because Hash Future School teaches live and online, your city does not limit your options - your time zone does. We group cohorts by region, so families in Bengaluru, Mumbai, Dubai, Doha or Riyadh all study the same programme with the same 1:8 mentor ratio and the same board pathways, in slots that fit their local day.'
        },
        {
            q: 'How do session timings work across time zones?',
            a: 'Indian cities study on IST inside normal school hours. Gulf cohorts are grouped at Gulf Standard Time or Arabia Standard Time, so children in Dubai, Doha, Riyadh and Kuwait City study in the late afternoon or early evening rather than at midnight. Timings are published per cohort before you enrol.'
        },
        {
            q: 'Can we move cities or countries in the middle of a school year?',
            a: 'Yes, and nothing about the academic programme changes. Your child keeps the same cohort, the same facilitators and the same board pathway; only the session time may shift. That continuity is the main reason relocating and expat families choose a live programme over a school place.'
        },
        {
            q: 'Which board should we choose - NIOS, IGCSE or GED?',
            a: 'It depends on where your child is likely to study next and how they handle examinations. NIOS is usually the most practical route for families returning to India, IGCSE fits international university plans, and GED suits older students who want a faster test-based credential. We map it backwards from the destination.'
        }
    ]
};

// ---------------------------------------------------------------- schema

function areaFor(page) {
    const isCountry = page.city === page.country || page.city.startsWith('the ');
    return isCountry
        ? { '@type': 'Country', name: page.country }
        : { '@type': 'City', name: page.city };
}

export function buildCityJsonLd(page) {
    const url = SITE.url + page.route;
    const pageName = cityTitle(page);
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
                isPartOf: { '@type': 'WebSite', name: SITE.name, url: SITE.url + '/' },
                about: { '@type': 'Thing', name: pageName },
                primaryImageOfPage: { '@type': 'ImageObject', url: SITE.ogImage },
                spatialCoverage: areaFor(page),
                breadcrumb: { '@id': url + '#breadcrumb' },
                mainEntity: { '@id': url + '#faq' }
            },
            {
                '@type': 'BreadcrumbList',
                '@id': url + '#breadcrumb',
                itemListElement: [
                    { '@type': 'ListItem', position: 1, name: 'Home', item: SITE.url + '/' },
                    { '@type': 'ListItem', position: 2, name: 'Online School by City', item: SITE.url + CITY_HUB.route },
                    { '@type': 'ListItem', position: 3, name: pageName, item: url }
                ]
            },
            {
                '@type': 'Service',
                '@id': url + '#service',
                name: pageName,
                serviceType: 'Live online alternative schooling with recognised board pathways',
                description: page.directAnswer,
                provider: { '@id': SITE.url + '/#organization' },
                areaServed: [areaFor(page), { '@type': 'Country', name: page.country }],
                audience: {
                    '@type': 'EducationalAudience',
                    educationalRole: 'student',
                    audienceType: 'Families in ' + page.city + ' with children aged 6 to 17'
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

export function buildCityHead(page) {
    const url = SITE.url + page.route;
    const jsonLd = JSON.stringify(buildCityJsonLd(page), null, 2);
    return `    <title>${page.title}</title>
    <meta name="description" content="${escapeAttr(page.description)}">
    <meta name="keywords" content="${escapeAttr(page.keywords)}">
    <meta name="author" content="${SITE.name}">
    <meta name="robots" content="index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1">
    <meta name="googlebot" content="index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1">
    <meta name="theme-color" content="#FF4B4B">
    <link rel="canonical" href="${url}">
    <link rel="alternate" type="text/markdown" title="LLMs" href="${SITE.url}/llms.txt">
    <link rel="icon" type="image/png" href="favicon.png">
    <link rel="manifest" href="manifest.json">

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

    <link rel="stylesheet" href="styles.css">

    <!-- Structured data: EducationalOrganization + WebPage + BreadcrumbList + Service + FAQPage -->
    <script type="application/ld+json">
${jsonLd}
    </script>`;
}

// ---------------------------------------------------------------- hub schema

export function buildCityHubJsonLd() {
    const url = SITE.url + CITY_HUB.route;
    const items = [...CITY_PAGES, KERALA_ENTRY];
    return {
        '@context': 'https://schema.org',
        '@graph': [
            buildOrganizationNode(),
            {
                '@type': 'CollectionPage',
                '@id': url + '#webpage',
                url,
                name: CITY_HUB.title,
                description: CITY_HUB.description,
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
                    { '@type': 'ListItem', position: 2, name: 'Online School by City', item: url }
                ]
            },
            {
                '@type': 'ItemList',
                '@id': url + '#itemlist',
                name: 'Cities and countries served',
                itemListOrder: 'https://schema.org/ItemListOrderAscending',
                numberOfItems: items.length,
                itemListElement: items.map((page, index) => ({
                    '@type': 'ListItem',
                    position: index + 1,
                    name: 'Online School in ' + page.city,
                    url: SITE.url + page.route
                }))
            },
            {
                '@type': 'FAQPage',
                '@id': url + '#faq',
                mainEntity: CITY_HUB.faqs.map(faq => ({
                    '@type': 'Question',
                    name: faq.q,
                    acceptedAnswer: { '@type': 'Answer', text: faq.a }
                }))
            }
        ]
    };
}

export function buildCityHubHead() {
    const url = SITE.url + CITY_HUB.route;
    const jsonLd = JSON.stringify(buildCityHubJsonLd(), null, 2);
    return `    <title>${CITY_HUB.title}</title>
    <meta name="description" content="${escapeAttr(CITY_HUB.description)}">
    <meta name="keywords" content="${escapeAttr(CITY_HUB.keywords)}">
    <meta name="author" content="${SITE.name}">
    <meta name="robots" content="index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1">
    <meta name="googlebot" content="index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1">
    <meta name="theme-color" content="#FF4B4B">
    <link rel="canonical" href="${url}">
    <link rel="alternate" type="text/markdown" title="LLMs" href="${SITE.url}/llms.txt">
    <link rel="icon" type="image/png" href="favicon.png">
    <link rel="manifest" href="manifest.json">

    <!-- Open Graph / Facebook / WhatsApp -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="${url}">
    <meta property="og:title" content="${escapeAttr(CITY_HUB.title)}">
    <meta property="og:description" content="${escapeAttr(CITY_HUB.description)}">
    <meta property="og:image" content="${SITE.ogImage}">
    <meta property="og:image:width" content="1024">
    <meta property="og:image:height" content="461">
    <meta property="og:site_name" content="${SITE.name}">

    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="${url}">
    <meta property="twitter:title" content="${escapeAttr(CITY_HUB.title)}">
    <meta property="twitter:description" content="${escapeAttr(CITY_HUB.description)}">
    <meta property="twitter:image" content="${SITE.ogImage}">

    <!-- Preconnect & Font -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap"
        rel="stylesheet">

    <link rel="stylesheet" href="styles.css">

    <!-- Structured data: EducationalOrganization + CollectionPage + BreadcrumbList + ItemList -->
    <script type="application/ld+json">
${jsonLd}
    </script>`;
}

function escapeAttr(value) {
    return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

export function cityTitle(page) {
    return 'Online School in ' + page.city;
}

export function cityBySlug(slug) {
    const found = CITY_PAGES.find(p => p.slug === slug || p.route === slug);
    if (!found) throw new Error('Unknown city page slug: ' + slug);
    return found;
}

// Short, self-contained blurbs for the hub cards. Written explicitly rather
// than derived from page copy, because a clipped FAQ sentence reads like a
// fragment on the hub.
export const HUB_BLURBS = {
    bengaluru: 'For tech-city families who want a child building AI projects instead of memorising, without the commute.',
    mumbai: 'Small live cohorts for families squeezed by school, tuition and travel, with NIOS and IGCSE routes.',
    'new-delhi': 'Live sessions inside school hours for Delhi, Noida and Gurugram families, with no coaching second shift.',
    hyderabad: 'Mastery-based pacing and real AI, coding and entrepreneurship work for children in the IT corridor.',
    kolkata: 'A serious academic route without the tuition pile-up, for children who need a different pace.',
    kerala: 'Kochi-based, with NIOS, IGCSE and GED guidance for families across the state.',
    dubai: 'Indian curriculum continuity for Dubai families: Gulf-friendly timings and boards that survive a relocation.',
    'abu-dhabi': 'Live Indian-curriculum schooling for Abu Dhabi families when school places or subject choices do not fit.',
    uae: 'One programme across all seven emirates, so moving from Sharjah to Dubai changes nothing academic.',
    qatar: 'Indian curriculum continuity for Doha families, including mid-year arrivals and three-to-five-year postings.',
    oman: 'Live cohorts and board pathways for Muscat families, useful when Indian school places are oversubscribed.',
    'saudi-arabia': 'For Riyadh, Jeddah and Eastern Province families, with a timetable built around the Sunday-to-Thursday week.',
    kuwait: 'For Kuwait families who intend to return to India, with NIOS guidance and Indian syllabus continuity.'
};

export function hubBlurb(page) {
    return HUB_BLURBS[page.slug] || page.description;
}

// Shared community facts appended to every city page's "At a glance" list.
// Kept here (one wording, one place) rather than repeated across twelve pages.
export const COMMUNITY_FACTS = [
    'Local cohort meet-ups in person once a month.',
    'A global community of families across cities and countries.'
];

export { wordCount };
