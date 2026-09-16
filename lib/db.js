import { neon } from '@neondatabase/serverless';
import { createRequire } from 'node:module';

let sql;

// Vercel's Postgres/Neon integrations do not all use the same variable name, and
// a project can end up with the connection string present under an alias while
// DATABASE_URL is empty. Pooled URLs are preferred over non-pooling ones.
export const DATABASE_URL_VARS = [
  'DATABASE_URL',
  'POSTGRES_URL',
  'DATABASE_POSTGRES_URL',
  'NEON_DATABASE_URL',
  'POSTGRES_PRISMA_URL',
  'POSTGRES_URL_NON_POOLING',
  'DATABASE_POSTGRES_URL_NON_POOLING',
];

export function databaseUrl() {
  // 1. The names Vercel's integrations are known to use.
  for (const name of DATABASE_URL_VARS) {
    const value = process.env[name];
    if (value && String(value).trim()) return String(value).trim();
  }

  // 2. Anything else that is unambiguously a Postgres connection string. The
  //    integration lets you choose a custom prefix (e.g. STORAGE_URL), so
  //    hard-coding names is not enough. Pooled URLs are preferred over
  //    non-pooling ones, which are the wrong choice for serverless functions.
  const matches = Object.entries(process.env)
    .filter(([, value]) => typeof value === 'string' && /^postgres(ql)?:\/\//.test(value.trim()))
    .sort(([a], [b]) => Number(/NON_POOLING/i.test(a)) - Number(/NON_POOLING/i.test(b)));

  if (matches.length) return matches[0][1].trim();

  return null;
}

// Which environment variables hold a Postgres URL — names only, never values.
export function configuredDatabaseVars() {
  const names = new Set(
    DATABASE_URL_VARS.filter((name) => Boolean(process.env[name] && String(process.env[name]).trim()))
  );
  for (const [name, value] of Object.entries(process.env)) {
    if (typeof value === 'string' && /^postgres(ql)?:\/\//.test(value.trim())) names.add(name);
  }
  return [...names];
}

// Neon's serverless driver talks to Neon's HTTP proxy, so it cannot reach a
// plain Postgres. Local development therefore connects over a normal socket.
// Production always uses a Neon URL, and `postgres` is a devDependency, so that
// branch never loads there.
function createClient(url) {
  const isLocalPostgres = /@(localhost|127\.0\.0\.1|\[::1\])(:\d+)?\//.test(url);
  if (!isLocalPostgres) return neon(url);

  const require = createRequire(import.meta.url);
  const postgres = require('postgres');
  return postgres(url, { max: 5 });
}

// Returns a query function. Created lazily so the function can cold-start
// without a DATABASE_URL (e.g. for non-DB routes).
export function getSql() {
  if (!sql) {
    const url = databaseUrl();
    if (!url) {
      throw new Error(`No database URL is set (looked for ${DATABASE_URL_VARS.join(', ')})`);
    }
    sql = createClient(url);
  }
  return sql;
}

/**
 * Runs a raw SQL string (used by the migration runner, which executes whole
 * .sql files rather than parameterised queries).
 *
 * The two clients differ here: the socket client exposes `.unsafe()` for raw
 * SQL, while Neon's HTTP client has no `.unsafe()` and instead accepts the SQL
 * string as its first argument.
 */
export async function runSql(text) {
  const client = getSql();
  if (typeof client.unsafe === 'function') return client.unsafe(text);
  return client(text);
}
