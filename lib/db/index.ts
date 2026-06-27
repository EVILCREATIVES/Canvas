/**
 * Neon serverless Postgres client + Drizzle ORM instance.
 *
 * Uses the HTTP driver so it works in both Edge and Node runtimes on Vercel.
 */
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "./schema";

const url =
  process.env.DATABASE_URL ??
  // A syntactically valid placeholder so the driver doesn't throw at import
  // time during `next build` page-data collection. Any real query against
  // this URL will fail loudly at runtime, which is what we want.
  "postgres" + "://placeholder:placeholder@" + "localhost:5432/placeholder";

if (!process.env.DATABASE_URL && process.env.NODE_ENV !== "test") {
  // eslint-disable-next-line no-console
  console.warn("[db] DATABASE_URL is not set — queries will fail at runtime.");
}

const sql = neon(url);

export const db = drizzle(sql, { schema });
export { schema };
export type Database = typeof db;
