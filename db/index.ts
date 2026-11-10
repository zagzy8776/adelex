import { serverValue } from "@/runtime/host";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

export function getDb() {
  const url = serverValue("DATABASE_URL");
  if (!url) throw new Error("Shipment storage is unavailable.");
  return drizzle(neon(url), { schema });
}
