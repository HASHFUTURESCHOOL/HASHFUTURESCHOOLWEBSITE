import { neon } from '@neondatabase/serverless';

let sql;

// Returns a Neon serverless query function. Created lazily so the function
// can cold-start without a DATABASE_URL (e.g. for non-DB routes).
export function getSql() {
  if (!sql) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error('DATABASE_URL is not set');
    }
    sql = neon(url);
  }
  return sql;
}
