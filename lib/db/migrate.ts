/**
 * Run pending Drizzle migrations against the DATABASE_URL.
 * Usage:  pnpm db:migrate
 */
import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required to run migrations");

  const sql = neon(url);
  const db = drizzle(sql);
  await migrate(db, { migrationsFolder: "./lib/db/migrations" });
  // eslint-disable-next-line no-console
  console.log("✅ Migrations applied");
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("❌ Migration failed", err);
  process.exit(1);
});
