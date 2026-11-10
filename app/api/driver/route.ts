import { and, eq, lt } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { shipments } from "@/db/schema";
import {
  handle,
  json,
  HttpError,
  body,
  hash,
  assertOrigin,
  rateLimit,
} from "@/app/lib/server";
import { coordinate } from "@/app/lib/domain";
const payload = z.object({
  id: z.string().uuid(),
  token: z.string().min(60).max(100),
  action: z.enum(["inspect", "position"]),
  lat: coordinate.lat.optional(),
  lng: coordinate.lng.optional(),
  accuracy: z.number().min(0).max(2000).optional(),
  timestamp: z.string().datetime().optional(),
});
export async function POST(request: Request) {
  return handle(async () => {
    assertOrigin(request);
    await rateLimit(request, "driver", 30, 60);
    const data = payload.parse(await body(request));
    const db = getDb();
    const tokenHash = await hash(data.token);
    const s = await db
      .select()
      .from(shipments)
      .where(
        and(
          eq(shipments.id, data.id),
          eq(shipments.driverTokenHash, tokenHash),
        ),
      )
      .limit(1)
      .then((rows) => rows[0]);
    if (
      !s ||
      !s.driverTokenExpiresAt ||
      Date.parse(s.driverTokenExpiresAt) < Date.now()
    )
      throw new HttpError(
        403,
        "This driver link is invalid or expired. Ask dispatch for a new link.",
      );
    if (["delivered", "cancelled", "on_hold"].includes(s.status))
      throw new HttpError(
        409,
        "Location sharing is paused for this shipment. Contact dispatch.",
      );
    if (data.action === "inspect")
      return json({
        code: s.code,
        origin: s.origin,
        destination: s.destination,
        expiresAt: s.driverTokenExpiresAt,
      });
    if (
      data.lat === undefined ||
      data.lng === undefined ||
      data.accuracy === undefined ||
      !data.timestamp
    )
      throw new HttpError(400, "A GPS position and accuracy are required.");
    const time = Date.parse(data.timestamp);
    if (Date.now() - time > 120000 || time > Date.now() + 30000)
      throw new HttpError(
        400,
        "GPS reading is too old. Request a fresh location.",
      );
    const saved = await db
      .update(shipments)
      .set({
        currentLat: data.lat,
        currentLng: data.lng,
        currentLocation: "Driver-reported GPS position",
        locationSource: "gps",
        locationUpdatedAt: data.timestamp,
        updatedAt: new Date().toISOString(),
      })
      .where(
        and(
          eq(shipments.id, s.id),
          eq(shipments.driverTokenHash, tokenHash),
          eq(shipments.status, s.status),
          lt(shipments.locationUpdatedAt, data.timestamp),
        ),
      )
      .returning({ id: shipments.id });
    return json({ ok: true, updated: saved.length > 0 });
  });
}
