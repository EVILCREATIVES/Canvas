import { execSync } from 'node:child_process';

// Convenience wrapper around `drizzle-kit push` so the schema can be synced
// to the database with `npm run db:push` or `tsx scripts/db-push.ts`.
try {
  execSync('drizzle-kit push', { stdio: 'inherit' });
} catch (err) {
  console.error('Failed to push database schema:', err);
  process.exit(1);
}
