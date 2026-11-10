import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./postgres",
  schema: "./db/schema.ts",
  schemaFilter: ["adexec"],
  dialect: "postgresql",
});
