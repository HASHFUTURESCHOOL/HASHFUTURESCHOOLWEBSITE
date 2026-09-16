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

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL is not set. Add it to .env (see .env.example).');
  process.exit(1);
}

// Uses the same client as the API routes, so a local postgres:// URL and a
// Neon URL both work here (see lib/db.js).
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
