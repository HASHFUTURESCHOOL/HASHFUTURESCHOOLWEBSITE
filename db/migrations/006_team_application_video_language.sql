-- The 3–5 minute video must be spoken in English, which is the language the
-- review team works in.
--
-- A YouTube link cannot tell us what language is spoken, so the applicant
-- confirms it on the form and we store that confirmation here. The video itself
-- is still watched by a person, who would catch a mismatch.

ALTER TABLE team_applications
  ADD COLUMN IF NOT EXISTS video_language_confirmed BOOLEAN NOT NULL DEFAULT false;
