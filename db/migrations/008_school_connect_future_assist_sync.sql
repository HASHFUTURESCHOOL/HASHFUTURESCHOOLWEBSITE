-- Future Assist sync state for IIT Madras School Connect registrations.
--
-- Every registration is mirrored server-to-server into Future Assist, where the
-- IIT School Connect programme desk reads it (table school_connect_registrations
-- in the Future Assist database). These columns record what happened to that
-- mirror so the admin CMS can show it and retry when it failed — the same
-- arrangement team_applications uses for /api/join.

ALTER TABLE school_connect_registrations
  ADD COLUMN IF NOT EXISTS future_assist_id TEXT,
  ADD COLUMN IF NOT EXISTS future_assist_state TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS future_assist_error TEXT,
  ADD COLUMN IF NOT EXISTS future_assist_synced_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_school_connect_fa_state
  ON school_connect_registrations (future_assist_state);
