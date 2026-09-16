-- Team applications: the "proof of work" applications submitted from /join.
--
-- These are people who want to join the ecosystem. Unlike a CV upload, we store
-- what they have actually done (achievements), what they want to change, and
-- what they want to contribute, so the review team can judge contribution
-- rather than credentials.

CREATE TABLE IF NOT EXISTS team_applications (
  id                  BIGSERIAL PRIMARY KEY,
  ref                 TEXT UNIQUE,                -- e.g. HFS-JOIN-2026-0007

  -- Who they are
  full_name           TEXT NOT NULL,
  email               TEXT NOT NULL,
  phone               TEXT,
  location            TEXT,
  age                 TEXT,
  links               TEXT,

  -- Proof of work
  achievements        JSONB NOT NULL DEFAULT '[]'::jsonb,  -- [{title, when, what, link}]
  skills              JSONB NOT NULL DEFAULT '[]'::jsonb,
  proof_of_work       TEXT,
  education           TEXT,

  -- Vision
  world_change        TEXT NOT NULL,
  contribution        TEXT NOT NULL,
  role_interest       TEXT,
  commitment          TEXT,
  availability        TEXT,
  hearsay             TEXT,
  extra               TEXT,

  -- Review workflow
  status              TEXT NOT NULL DEFAULT 'new',   -- new | shortlisted | in-conversation | invited | hired | archived
  reviewer_notes      TEXT,
  score               INT,

  -- Future Assist sync
  future_assist_id    TEXT,
  future_assist_state TEXT NOT NULL DEFAULT 'pending',  -- pending | synced | failed | disabled
  future_assist_error TEXT,

  source              TEXT DEFAULT 'website',
  user_agent          TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_team_applications_created ON team_applications (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_team_applications_status ON team_applications (status);
CREATE INDEX IF NOT EXISTS idx_team_applications_email ON team_applications (email);
