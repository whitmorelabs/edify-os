/**
 * Migration runner for Edify OS
 *
 * Usage: node apply-migrations.js
 *
 * Requires: DB password from Citlali's password manager.
 * Set environment variable SUPABASE_DB_PASSWORD before running:
 *
 *   $env:SUPABASE_DB_PASSWORD="your-password-here"
 *   node apply-migrations.js
 *
 * Or pass as argument:
 *   node apply-migrations.js "your-password-here"
 *
 * The Supabase project connection pooler URL format:
 *   postgresql://postgres.tuirnficbifoewuijzeq:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
 *
 * Alternatively, run the combined_migration.sql directly in the Supabase dashboard:
 * 1. Go to https://supabase.com/dashboard/project/tuirnficbifoewuijzeq/sql
 * 2. Click "New query"
 * 3. Paste the contents of supabase/combined_migration.sql
 * 4. Click "Run"
 */

const fs = require('fs');
const path = require('path');

const password = process.argv[2] || process.env.SUPABASE_DB_PASSWORD;

if (!password) {
  console.error('Error: No database password provided.');
  console.error('Usage: node apply-migrations.js "your-db-password"');
  console.error('Or set SUPABASE_DB_PASSWORD environment variable.');
  process.exit(1);
}

const PROJECT_REF = 'tuirnficbifoewuijzeq';
const DB_HOST = `db.${PROJECT_REF}.supabase.co`;
const DB_URL = `postgresql://postgres:${encodeURIComponent(password)}@${DB_HOST}:5432/postgres`;

const MIGRATION_DIR = path.join(__dirname, 'migrations');
const migrationFiles = fs.readdirSync(MIGRATION_DIR)
  .filter(f => f.endsWith('.sql'))
  .sort();

console.log(`Found ${migrationFiles.length} migration files:`);
migrationFiles.forEach(f => console.log(`  - ${f}`));
console.log('');
console.log('To apply these migrations:');
console.log('');
console.log('Option A — psql (if installed):');
console.log(`  psql "${DB_URL}" < supabase/combined_migration.sql`);
console.log('');
console.log('Option B — npx supabase db push:');
console.log(`  npx supabase db push --db-url "${DB_URL}"`);
console.log('');
console.log('Option C — Supabase SQL Editor (no tools needed):');
console.log('  1. Go to: https://supabase.com/dashboard/project/tuirnficbifoewuijzeq/sql');
console.log('  2. Click "New query"');
console.log('  3. Paste the entire contents of: supabase/combined_migration.sql');
console.log('  4. Click "Run"');
console.log('');
console.log('The combined_migration.sql file is at: supabase/combined_migration.sql');
