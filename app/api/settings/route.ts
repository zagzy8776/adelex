import { getDb } from "@/db";
import { settings } from "@/db/schema";
import { handle, json } from "@/app/lib/server";
export const dynamic = "force-dynamic";
export async function GET() {
  return handle(async () =>
    json({
      settings: (await getDb()
        .select()
        .from(settings)
        .limit(1)
        .then((rows) => rows[0])) || {
        contactEmail: "",
        contactPhone: "",
        address: "",
        businessHours: "",
      },
    }),
  );
}
