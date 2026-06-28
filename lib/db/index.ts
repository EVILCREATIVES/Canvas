import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Fallback Neon connection string so the deployed app works even when
// DATABASE_URL is not configured in the hosting environment. Prefer the
// env var when present.
const fallbackConnectionString =
  'postgresql://neondb_owner:npg_Ozkcad5qfQ3R@ep-quiet-frog-ahossves-pooler.c-3.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require';

const sql = neon(process.env.DATABASE_URL || fallbackConnectionString);
export const db = drizzle(sql, { schema });
export * from './schema';
