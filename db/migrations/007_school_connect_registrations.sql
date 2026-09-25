-- IIT Madras School Connect registrations.
--
-- This table is for students who do NOT study at Hash Future School — mostly
-- Indian families in the UAE, Saudi Arabia, Oman, Qatar, Kuwait and Bahrain,
-- plus other globally mobile families — who want to take an IIT Madras School
-- Connect course. IIT Madras only enrols students through a partner school, so
-- the family registers with us, we review the registration, and on approval we
-- assign a Hash Future School student ID and email it to the student + parents.
-- That ID is what lets the learner enrol as a Hash Future School student.
--
-- Workflow: new -> verified -> approved (assigns school_id, sends the enrolment
-- email) | rejected | archived.

CREATE TABLE IF NOT EXISTS school_connect_registrations (
  id                    BIGSERIAL PRIMARY KEY,
  ref                   TEXT UNIQUE,              -- e.g. HFS-SC-2026-0012
  school_id             TEXT UNIQUE,              -- Hash Future School ID, set on approval

  -- Student
  student_name          TEXT NOT NULL,
  date_of_birth         DATE,
  age                   INT,
  gender                TEXT,
  nationality           TEXT,
  student_email         TEXT NOT NULL,
  student_phone         TEXT NOT NULL,
  student_whatsapp      TEXT,

  -- Present schooling (they are enrolled elsewhere — that is the point)
  current_school        TEXT NOT NULL,
  school_city           TEXT,
  school_country        TEXT,
  grade                 TEXT,                     -- Class IX | Class X | Class XI | Class XII | Other
  curriculum            TEXT,

  -- Identification details, used to verify School Connect eligibility
  id_type               TEXT,
  id_number             TEXT,
  id_country            TEXT,

  -- Parents / guardians. The first parent is required: approval mail goes to the
  -- student and to the parents.
  parent_name           TEXT NOT NULL,
  parent_relation       TEXT,
  parent_email          TEXT NOT NULL,
  parent_phone          TEXT NOT NULL,
  parent_occupation     TEXT,
  parent2_name          TEXT,
  parent2_relation      TEXT,
  parent2_email         TEXT,
  parent2_phone         TEXT,
  parent2_occupation    TEXT,

  -- Where the family is and how to reach them
  country               TEXT,
  city                  TEXT,
  timezone              TEXT,
  preferred_language    TEXT,

  -- Background: what the student is into, and where they are heading
  interests             JSONB NOT NULL DEFAULT '[]'::jsonb,  -- course / field interests
  about                 TEXT,
  goal                  TEXT,
  prior_experience      TEXT,
  heard_about           TEXT,
  batch_preference      TEXT,                     -- what the family is aiming for

  -- Consent
  consent_registration  BOOLEAN NOT NULL DEFAULT false,
  consent_emails        BOOLEAN NOT NULL DEFAULT false,

  -- Review workflow
  status                TEXT NOT NULL DEFAULT 'new',  -- new | verified | approved | rejected | archived
  reviewer_notes        TEXT,
  reviewed_by           TEXT,
  approved_at           TIMESTAMPTZ,
  enrollment_email_at   TIMESTAMPTZ,
  enrollment_email_state TEXT,                        -- sent | failed | skipped
  enrollment_note       TEXT,                         -- reviewer text added to the approval email

  source                TEXT DEFAULT 'iit-madras-school-connect',
  user_agent            TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_school_connect_created ON school_connect_registrations (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_school_connect_status ON school_connect_registrations (status);
CREATE INDEX IF NOT EXISTS idx_school_connect_email ON school_connect_registrations (student_email);
CREATE INDEX IF NOT EXISTS idx_school_connect_country ON school_connect_registrations (school_country);
