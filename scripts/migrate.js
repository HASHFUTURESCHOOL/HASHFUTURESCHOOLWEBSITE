import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { neon } from '@neondatabase/serverless';

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

const sql = neon(DATABASE_URL);

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
  await sql.unsafe(sqlText);
}

console.log('Migrations applied successfully.');
