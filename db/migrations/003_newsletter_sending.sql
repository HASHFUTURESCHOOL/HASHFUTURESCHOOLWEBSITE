-- Hash Future School: weekly newsletter delivery.
--
-- newsletter_content  : editable subject + body (markdown) used as the template.
-- newsletter_campaigns  : one row per newsletter run (manual or weekly cron).
-- newsletter_send_log   : per-recipient result for every campaign.

CREATE TABLE IF NOT EXISTS newsletter_content (
  id         TEXT PRIMARY KEY,              -- e.g. 'weekly'
  subject    TEXT NOT NULL DEFAULT 'Your Weekly Hash Future School Newsletter',
  body_md    TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS newsletter_campaigns (
  id             BIGSERIAL PRIMARY KEY,
  subject        TEXT NOT NULL,
  body_html      TEXT,
  body_text      TEXT,
  status         TEXT NOT NULL DEFAULT 'draft',  -- draft | sending | sent | partial | failed
  trigger        TEXT NOT NULL DEFAULT 'manual', -- manual | cron
  recipient_count INTEGER NOT NULL DEFAULT 0,
  sent_count     INTEGER NOT NULL DEFAULT 0,
  failed_count   INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at        TIMESTAMPTZ,
  error          TEXT,
  meta           JSONB
);

CREATE TABLE IF NOT EXISTS newsletter_send_log (
  id            BIGSERIAL PRIMARY KEY,
  campaign_id   BIGINT NOT NULL REFERENCES newsletter_campaigns(id) ON DELETE CASCADE,
  subscriber_id BIGINT REFERENCES newsletter_subscribers(id) ON DELETE SET NULL,
  email         TEXT NOT NULL,
  status        TEXT NOT NULL,               -- sent | failed
  error         TEXT,
  sent_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_newsletter_campaigns_created
  ON newsletter_campaigns (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_newsletter_send_log_campaign
  ON newsletter_send_log (campaign_id);

-- Seed the default weekly newsletter content (placeholder; admins edit it in the
-- Admin CMS once the final format and contents are decided).
INSERT INTO newsletter_content (id, subject, body_md) VALUES (
  'weekly',
  'Your Weekly Hash Future School Newsletter',
  E'Welcome to this week''s newsletter from **Hash Future School**.\n\nHere is what''s happening this week:\n\n- Latest updates from our community\n- Insights on future-ready learning for your child\n- A highlight worth sharing\n\nWe''ll be shaping the full format and contents here soon. For now, that''s the short version. Stay tuned!\n\nHave questions or ideas? Just reply to this email — we''d love to hear from you.'
) ON CONFLICT (id) DO NOTHING;
