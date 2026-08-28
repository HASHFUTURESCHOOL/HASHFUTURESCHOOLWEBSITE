import { chatCompletion } from './deepseek.js';
import { slugify } from './slug.js';

const CATEGORIES = [
  'Education',
  'Homeschooling',
  'Parenting',
  'Future Skills',
  'Entrepreneurship',
  'Financial Literacy',
];

const CONTEXT =
  'Hash Future School is the world\u2019s first premier AI-first progressive online school for students aged 6\u201317. It offers personalised project-based learning, a homeschooling alternative, financial literacy, entrepreneurship mentoring, and NIOS/IGCSE/GED board guidance. The readers are parents and educators in India and beyond.';

const TOPICS = [
  {
    hint: 'Why financial literacy should start in childhood',
    angle: 'Explain how simple money habits, saving goals, and earning through small projects build lifelong financial confidence.',
    category: 'Financial Literacy',
  },
  {
    hint: 'Homeschooling vs traditional school: an honest comparison',
    angle: 'Compare flexibility, socialisation, academic rigour, and cost, and help parents decide what fits their child.',
    category: 'Homeschooling',
  },
  {
    hint: 'Raising AI-literate kids in an AI-first world',
    angle: 'Practical ways to introduce children to AI tools safely and productively at home and in school.',
    category: 'Future Skills',
  },
  {
    hint: 'What project-based learning actually looks like',
    angle: 'Walk through real projects and how they build critical thinking, collaboration, and ownership.',
    category: 'Education',
  },
  {
    hint: 'How to spot and nurture your child\u2019s passion early',
    angle: 'Signs to watch for and low-pressure ways to help children explore their interests.',
    category: 'Parenting',
  },
  {
    hint: 'Entrepreneurship for kids: starting a micro-business',
    angle: 'A step-by-step framework for a child\u2019s first small business, from idea to first sale.',
    category: 'Entrepreneurship',
  },
  {
    hint: 'Building self-directed learners',
    angle: 'Strategies that shift responsibility for learning to the child while keeping the parent as a guide.',
    category: 'Education',
  },
  {
    hint: 'The future of work: skills kids need beyond exams',
    angle: 'Why creativity, adaptability, and digital literacy matter as much as marks for the careers of 2030 and beyond.',
    category: 'Future Skills',
  },
  {
    hint: 'Screen time, learning apps, and balance for young learners',
    angle: 'A balanced, non-judgemental guide to using technology for learning without over-reliance.',
    category: 'Parenting',
  },
  {
    hint: 'Choosing the right board for your child: NIOS vs IGCSE vs GED',
    angle: 'Compare open schooling options and how each fits different goals, timelines, and learning styles.',
    category: 'Homeschooling',
  },
];

const CATEGORY_COVERS = {
  Education:
    'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1200&h=630&fit=crop',
  Homeschooling:
    'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200&h=630&fit=crop',
  Parenting:
    'https://images.unsplash.com/photo-1476703993599-0035a21b17a9?w=1200&h=630&fit=crop',
  'Future Skills':
    'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&h=630&fit=crop',
  Entrepreneurship:
    'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=630&fit=crop',
  'Financial Literacy':
    'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200&h=630&fit=crop',
};

const DEFAULT_COVER =
  'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200&h=630&fit=crop';

/** Rotate topics deterministically by week so the weekly job stays fresh but predictable. */
export function weeklyTopicIndex() {
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  return Math.floor(Date.now() / weekMs) % TOPICS.length;
}

function pickTopic(index) {
  if (Number.isInteger(index) && index >= 0 && index < TOPICS.length) {
    return TOPICS[index];
  }
  return TOPICS[Math.floor(Math.random() * TOPICS.length)];
}

function buildPrompt(topic) {
  const today = new Date().toISOString().slice(0, 10);
  return [
    `Blog topic: ${topic.hint}`,
    `Angle to cover: ${topic.angle}`,
    `Suggested category: ${topic.category}`,
    '',
    `Write a fresh, original blog post (600\u2013900 words) for ${today}.`,
  ].join('\n');
}

function extractJson(text) {
  let t = String(text || '').trim();
  // Remove markdown/code fences that models often wrap JSON in.
  t = t.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  const start = t.indexOf('{');
  const end = t.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('Could not find a JSON object in the model output');
  }
  return JSON.parse(t.slice(start, end + 1));
}

function cleanCoverImage(url, fallbackCategory) {
  const fallback =
    CATEGORY_COVERS[fallbackCategory] || CATEGORY_COVERS.Education || DEFAULT_COVER;
  if (typeof url !== 'string') return fallback;
  const trimmed = url.trim();
  if (!/^https?:\/\//i.test(trimmed)) return fallback;
  return trimmed;
}

function normaliseCategory(value) {
  const raw = String(value || '').trim();
  if (!raw) return 'Education';
  return CATEGORIES.find((c) => c.toLowerCase() === raw.toLowerCase()) || raw;
}

/**
 * Generate a complete blog post object via DeepSeek.
 * @returns {Promise<{title:string, slug:string, excerpt:string, category:string, cover_image:string, author:string, body:string}>}
 */
export async function generateBlogPost({ topicIndex } = {}) {
  const topic = pickTopic(topicIndex);
  const system = [
    `You are a senior content writer for Hash Future School. ${CONTEXT}`,
    'Write an engaging, SEO-friendly, parent-focused blog post in Markdown.',
    'Return ONLY a JSON object with no extra commentary, using exactly this shape:',
    '{',
    '  "title": "string",',
    '  "excerpt": "string (max 160 characters, plain, no markdown)",',
    '  "category": "one of ' + CATEGORIES.join(' | ') + '",',
    '  "cover_image": "a full https URL to a relevant Unsplash photo",',
    '  "author": "Hash Future School",',
    '  "body": "markdown string"',
    '}',
    'Rules for the body: 600-900 words; use ## H2 section headings; use "-" bullet lists; use **bold** for key terms; be warm, practical, and evidence-based; do not invent statistics or testimonials; do not include a title heading (# ) inside the body.',
  ].join('\n');

  const content = await chatCompletion({
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: buildPrompt(topic) },
    ],
    temperature: 0.8,
    max_tokens: 1800,
  });

  const raw = extractJson(content);
  const title = String(raw.title || '').trim();
  const body = String(raw.body || '').trim();

  if (!title || !body) {
    throw new Error('Generated post is missing a title or body');
  }

  const category = normaliseCategory(raw.category);
  const coverImage = cleanCoverImage(raw.cover_image, category);

  return {
    title: title.slice(0, 200),
    slug: slugify(title) || 'blog-post',
    excerpt: String(raw.excerpt || '').trim().slice(0, 160),
    category,
    cover_image: coverImage,
    author: String(raw.author || 'Hash Future School').slice(0, 120),
    body,
  };
}

/**
 * Generate a blog post and insert it as a draft awaiting admin approval.
 * The draft is created with published=false and source='ai'.
 *
 * @param {object} options
 * @param {import('@neondatabase/serverless').NeonQueryFunction} options.sql
 * @param {number} [options.topicIndex]
 * @returns {Promise<object>} The inserted row.
 */
export async function generateAndSaveDraft({ sql, topicIndex } = {}) {
  if (!sql) throw new Error('generateAndSaveDraft requires a sql query function');
  const post = await generateBlogPost({ topicIndex });

  const baseSlug = (post.slug || 'blog-post').slice(0, 70);
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const suffix = attempt === 0 ? '' : `-${attempt + 1}`;
    const slug = `${baseSlug}${suffix}`;
    try {
      const rows = await sql`
        INSERT INTO posts
          (title, slug, excerpt, category, cover_image, body, author, published, published_at, source)
        VALUES
          (${post.title}, ${slug}, ${post.excerpt}, ${post.category}, ${post.cover_image}, ${post.body}, ${post.author}, false, null, 'ai')
        RETURNING id, title, slug, category, author, published, source, created_at
      `;
      return rows[0];
    } catch (err) {
      // Unique violation on slug, pick the next suffix.
      if (err?.code === '23505') continue;
      throw err;
    }
  }
  throw new Error('Could not create a unique slug for the generated post');
}

export { CATEGORIES, TOPICS };
