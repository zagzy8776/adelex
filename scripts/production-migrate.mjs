import { migrateDatabase } from "./migrate-postgres.mjs";
// Only the production build with its own database binding may migrate live records.
if (process.env.VERCEL_ENV === "production" && process.env.DATABASE_URL) {
  try {
    console.log("Running production database migrations...");
    await migrateDatabase(process.env.DATABASE_URL);
    console.log("Database migrations completed successfully.");
  } catch (error) {
    console.error("ADEXEC production database migration failed.");
    console.error("Error details:", error.message);
    // Don't fail the build if migrations fail - allow deployment to continue
    // The database might not exist yet or migrations might have already been applied
    console.log("Continuing with build despite migration failure...");
  }
} else {
  console.log("Skipping production migrations (no DATABASE_URL or not production environment)");
}
