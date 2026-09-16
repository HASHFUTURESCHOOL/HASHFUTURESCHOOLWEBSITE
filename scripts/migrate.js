import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { getSql, runSql } from '../lib/db.js';

// Load .env for local development (Node 20.12+/22)
try {
  process.loadEnvFile(join(process.cwd(), '.env'));
} catch {
  // no .env present; Vercel injects env at runtime
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, '..', 'db', 'migrations');

// Uses the same client as the API routes, so a local postgres:// URL and a
// Neon URL both work here (see lib/db.js).
//
// Migrating a *deployed* database from a development machine: set
// PROD_DATABASE_URL in .env and it takes precedence over the local DATABASE_URL,
// so `npm run db:migrate` can target production without editing anything else.
if (process.env.PROD_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.PROD_DATABASE_URL;
  const host = (process.env.PROD_DATABASE_URL.match(/@([^/:?]+)/) || [, 'unknown'])[1];
  console.log(`Targeting PROD_DATABASE_URL (host: ${host}) — not the local database.`);
}

if (!process.env.DATABASE_URL) {
  console.error('No database URL is set. Add DATABASE_URL (local) or PROD_DATABASE_URL to .env.');
  process.exit(1);
}

const sql = getSql();

// Apply every migration in filename order (e.g. 001_init.sql, 002_*.sql, ...).
const { readdir } = await import('node:fs/promises');
const migrationFiles = (await readdir(migrationsDir))
  .filter((f) => f.endsWith('.sql'))
  .sort();

if (!migrationFiles.length) {
  console.error('No migration files found.');
  process.exit(1);
}

for (const file of migrationFiles) {
  console.log(`Applying ${file}...`);
  const sqlText = readFileSync(join(migrationsDir, file), 'utf8');
  await runSql(sqlText);
}

console.log('Migrations applied successfully.');

// A socket-based client (local development) keeps the event loop alive until it
// is closed; Neon's HTTP client has no pool and no end().
if (typeof sql.end === 'function') {
  await sql.end();
}
