-- Hash Future School: Vercel-native Postgres (Neon) schema

CREATE TABLE IF NOT EXISTS posts (
  id          BIGSERIAL PRIMARY KEY,
  title       TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  excerpt     TEXT,
  category    TEXT,
  cover_image TEXT,
  body        TEXT NOT NULL,
  author      TEXT NOT NULL DEFAULT 'Hash Future School',
  published   BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id             BIGSERIAL PRIMARY KEY,
  email          TEXT NOT NULL UNIQUE,
  name           TEXT,
  status         TEXT NOT NULL DEFAULT 'active',   -- active | unsubscribed
  subscribed_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  unsubscribed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS site_content (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  section    TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_posts_published_at ON posts (published_at DESC);
CREATE INDEX IF NOT EXISTS idx_subs_status ON newsletter_subscribers (status);

-- Seed: existing blog cards become real posts
INSERT INTO posts (title, slug, excerpt, category, cover_image, body, published, published_at) VALUES
  (
    'Why Financial Literacy Matters for Kids',
    'why-financial-literacy-matters-for-kids',
    'Financial independence isn''t just for adults. Learn how teaching money skills early can transform a child''s future.',
    'Education',
    'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&h=400&fit=crop',
    E'Financial independence isn''t just for adults. It starts early.\n\nWhen children understand saving, budgeting, and earning, they build habits that last a lifetime. At Hash Future School, students manage mock stock portfolios, run micro-businesses, and plan real purchases — turning money into a practical life skill rather than an abstract subject.\n\nHere is how we make financial literacy stick:\n\n- **Start with earning.** Allowances tied to real responsibilities teach the value of work.\n- **Introduce saving goals.** Short, achievable targets create momentum.\n- **Gamify budgeting.** A virtual wallet and a class "shop" make trade-offs tangible.\n- **Talk about investing early.** Simple portfolio simulations demystify the stock market.\n\nMoney skills are not a separate subject — they are woven into daily learning, projects, and entrepreneurship. That is the difference between memorising formulas and building a future.',
    true,
    now()
  ),
  (
    'The Rise of Alternative Education',
    'the-rise-of-alternative-education',
    'More families are choosing self-directed learning over traditional schooling. Here''s why.',
    'Homeschooling',
    'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&h=400&fit=crop',
    E'More families are choosing self-directed learning over traditional schooling. Here''s why.\n\nAlternative education is growing because it prioritises curiosity, autonomy, and real-world relevance over rote memorisation.\n\nFamilies choose this path to:\n\n- **Personalise pace.** Students move faster where they shine and slow down where they need time.\n- **Learn by doing.** Projects, businesses, and creative work replace passive lectures.\n- **Build who they are.** Self-directed learners develop confidence, discipline, and a genuine love of learning.\n\nAt Hash Future School, we blend flexible online schooling with AI tools, mentor guidance, and real projects — so students are prepared not just for exams, but for life.',
    true,
    now()
  )
ON CONFLICT (slug) DO NOTHING;

-- Seed: a few editable homepage snippets to demonstrate the CMS
INSERT INTO site_content (key, value, section) VALUES
  ('hero_tagline', 'World''s First Premier AI-First Progressive Online School', 'hero'),
  ('hero_subtitle', 'A skill-based K-12 online school & homeschooling alternative offering tailored pathways from early curiosity to independent startup creation.', 'hero'),
  ('outcomes_heading', 'Outcomes That Matter', 'outcomes')
ON CONFLICT (key) DO NOTHING;
