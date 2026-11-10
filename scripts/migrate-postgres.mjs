import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";

export async function migrateDatabase(url) {
  if (!url)
    throw new Error(
      "Set the server-side DATABASE_URL before running database migrations.",
    );
  const client = neon(url);
  await migrate(drizzle(client), {
    migrationsFolder: "postgres",
    migrationsSchema: "adexec",
    migrationsTable: "schema_migrations",
  });
  const rows = await client.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema='adexec' ORDER BY table_name",
  );
  console.log("ADEXEC tables:", rows.map((row) => row.table_name).join(", "));
}
if (process.argv[1]?.endsWith("/migrate-postgres.mjs")) {
  try {
    await migrateDatabase(process.env.DATABASE_URL);
  } catch {
    console.error(
      "Database migration failed. Check the connection and schema permissions.",
    );
    process.exitCode = 1;
  }
}
