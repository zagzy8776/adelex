import { eq, desc } from "drizzle-orm";
import { getDb } from "@/db";
import { shipments, events } from "@/db/schema";
import { handle, json, HttpError, rateLimit } from "@/app/lib/server";
import {
  demoShipment,
  normalizeCode,
  validCode,
  publicShipment,
} from "@/app/lib/domain";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  return handle(async () => {
    const code = normalizeCode(
      new URL(request.url).searchParams.get("code") || "",
    );
    if (code === "ADX-DEMO") return json({ shipment: demoShipment() });
    if (!validCode(code))
      throw new HttpError(
        404,
        "Shipment not found. Check your tracking number and try again.",
      );
    const db = getDb();
    const shipment = await db
      .select()
      .from(shipments)
      .where(eq(shipments.code, code))
      .limit(1)
      .then((rows) => rows[0]);
    if (!shipment) {
      await rateLimit(request, "tracking-misses", 60, 60);
      throw new HttpError(
        404,
        "Shipment not found. Check your tracking number and try again.",
      );
    }
    const history = await db
      .select()
      .from(events)
      .where(eq(events.shipmentId, shipment.id))
      .orderBy(desc(events.createdAt))
      .limit(150);
    return json({
      shipment: {
        ...publicShipment(shipment),
        events: history.map(({ shipmentId, ...event }) => event),
      },
    });
  });
}
