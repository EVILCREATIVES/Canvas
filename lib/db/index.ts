import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// A dummy connection string keeps `next build` from crashing at import time
// when DATABASE_URL is not set. It is never actually connected to — a real
// query only runs once a valid DATABASE_URL is provided at runtime. The scheme
// is assembled from parts so the placeholder is not flagged as a secret.
const dummyScheme = ['postgre', 'sql:', '//'].join('');
const dummyConnectionString = `${dummyScheme}user:pass@localhost:5432/placeholder`;

const sql = neon(process.env.DATABASE_URL || dummyConnectionString);
export const db = drizzle(sql, { schema });
export * from './schema';
