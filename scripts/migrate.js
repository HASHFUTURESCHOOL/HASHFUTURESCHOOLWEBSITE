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
const sqlPath = join(__dirname, '..', 'db', 'migrations', '001_init.sql');
const sqlText = readFileSync(sqlPath, 'utf8');

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL is not set. Add it to .env (see .env.example).');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

console.log('Applying migration 001_init.sql...');
await sql.unsafe(sqlText);
console.log('Migration applied successfully.');
