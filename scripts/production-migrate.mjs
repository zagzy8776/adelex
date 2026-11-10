import { migrateDatabase } from "./migrate-postgres.mjs";
// Only the production build with its own database binding may migrate live records.
if (process.env.VERCEL_ENV === "production" && process.env.DATABASE_URL) {
  try {
    await migrateDatabase(process.env.DATABASE_URL);
  } catch {
    console.error("ADEXEC production database migration failed.");
    process.exitCode = 1;
  }
}
