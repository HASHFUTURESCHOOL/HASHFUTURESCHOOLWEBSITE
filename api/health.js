import { ok } from '../lib/http.js';
import { getSql, databaseUrl, configuredDatabaseVars } from '../lib/db.js';

/**
 * Liveness plus a coarse database check, so a deploy can be verified without
 * opening the admin CMS. Deliberately reports only booleans — never connection
 * strings or raw database error text, since this endpoint is public.
 */
export default async function handler(req, res) {
  const health = {
    ok: true,
    time: new Date().toISOString(),
    db: { configured: false, connected: false, varsPresent: configuredDatabaseVars() },
  };

  if (databaseUrl()) {
    health.db.configured = true;
    try {
      const sql = getSql();
      const rows = await sql`
        select
          to_regclass('public.posts') is not null             as posts,
          to_regclass('public.newsletter_subscribers') is not null as subscribers,
          to_regclass('public.site_content') is not null      as site_content,
          to_regclass('public.team_applications') is not null as team_applications,
          -- Column-level detail for the table that changes most often, so a
          -- half-applied migration is visible rather than guessed at.
          (select count(*) from information_schema.columns
            where table_schema = 'public' and table_name = 'team_applications'
              and column_name = 'video_url') > 0                as team_applications_video_url,
          (select count(*) from information_schema.columns
            where table_schema = 'public' and table_name = 'team_applications'
              and column_name = 'video_language_confirmed') > 0 as team_applications_video_language_confirmed
      `;
      health.db.connected = true;
      health.db.tables = rows[0];
    } catch (err) {
      // Log the detail where only we can see it; return a short code outward.
      console.error('[health] database check failed:', err);
      health.ok = false;
      health.db.error =
        typeof err?.code === 'string' ? err.code : err?.name === 'Error' ? 'unreachable' : 'unknown';
    }
  }

  return ok(res, health);
}
