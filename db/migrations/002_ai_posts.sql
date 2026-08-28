-- Hash Future School: track AI-generated blog posts for the weekly approval workflow.

ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual';

-- Backfill any existing rows that somehow lack a source.
UPDATE posts SET source = 'manual' WHERE source IS NULL OR source = '';

CREATE INDEX IF NOT EXISTS idx_posts_source ON posts (source);
