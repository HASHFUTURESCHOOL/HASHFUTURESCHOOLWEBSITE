-- Optional 3–5 minute intro video, uploaded to YouTube (public or unlisted)
-- and linked from the /join application form.
--
-- Added as its own migration rather than editing 004 so it applies cleanly to
-- databases where 004 has already run.

ALTER TABLE team_applications
  ADD COLUMN IF NOT EXISTS video_url TEXT;
