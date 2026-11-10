import { notifyCustomer } from "@/app/lib/mail/queue";
import { sitesHost } from "@/runtime/host";
import { and, eq, desc } from "drizzle-orm";
import { getDb } from "@/db";
import { admins, shipments, events, requests, settings } from "@/db/schema";
import {
  handle,
  json,
  HttpError,
  assertOrigin,
  body,
  requireAdmin,
  adminState,
  hash,
} from "@/app/lib/server";
import {
  shipmentSchema,
  updateSchema,
  settingsSchema,
  trackingCode,
} from "@/app/lib/domain";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  return handle(async () => {
    const url = new URL(request.url);
    if (url.searchParams.get("session") === "1") {
      const s = await adminState();
      return json({
        sitesHost,
        authorized: s.authorized,
        canClaim: s.canClaim,
        signedIn: !!s.user,
        name: s.user?.displayName,
      });
    }
    await requireAdmin();
    const db = getDb();
    const offset = Number(url.searchParams.get("offset") || 0);
    if (!Number.isSafeInteger(offset) || offset < 0)
      throw new HttpError(400, "Invalid page offset.");
    const id = url.searchParams.get("id");
    if (id) {
      const s = await db
        .select()
        .from(shipments)
        .where(eq(shipments.id, id))
        .limit(1)
        .then((rows) => rows[0]);
      if (!s) throw new HttpError(404, "Shipment not found.");
      const { driverTokenHash, ...safe } = s;
      return json({
        shipment: {
          ...safe,
          events: await db
            .select()
            .from(events)
            .where(eq(events.shipmentId, id))
            .orderBy(desc(events.createdAt), desc(events.id))
            .limit(150)
            .offset(offset),
        },
      });
    }
    const rows = await db
      .select()
      .from(shipments)
      .orderBy(desc(shipments.createdAt), desc(shipments.id))
      .limit(200)
      .offset(offset);
    return json({
      shipments: rows.map(({ driverTokenHash, ...s }) => s),
      requests: await db
        .select()
        .from(requests)
        .orderBy(desc(requests.createdAt), desc(requests.id))
        .limit(200)
        .offset(offset),
      settings: (await db
        .select()
        .from(settings)
        .limit(1)
        .then((rows) => rows[0])) || {
        contactEmail: "",
        contactPhone: "",
        address: "",
        businessHours: "",
      },
    });
  });
}
export async function POST(request: Request) {
  return handle(async () => {
    assertOrigin(request);
    const input = await body(request);
    const db = getDb();
    if (input.action === "claim") {
      const state = await adminState();
      if (!state.user || !state.canClaim)
        throw new HttpError(403, "Administrator setup is unavailable.");
      await db
        .insert(admins)
        .values({
          id: "owner",
          userId: state.user.userId,
          email: state.user.email,
          createdAt: new Date().toISOString(),
        })
        .onConflictDoNothing();
      await requireAdmin();
      return json({ ok: true });
    }
    await requireAdmin();
    const now = new Date().toISOString();
    if (input.action === "create") {
      const data = shipmentSchema.parse(input.data);
      const id = crypto.randomUUID();
      const code = trackingCode();
      await db.batch([
        db.insert(shipments).values({
          ...data,
          id,
          code,
          currentLat: data.originLat,
          currentLng: data.originLng,
          currentLocation: data.origin,
          status: "booked",
          locationSource: "admin",
          locationUpdatedAt: now,
          createdAt: now,
          updatedAt: now,
        }),
        db.insert(events).values({
          id: crypto.randomUUID(),
          shipmentId: id,
          status: "booked",
          location: data.origin,
          note: "Shipment booking confirmed.",
          lat: data.originLat,
          lng: data.originLng,
          source: "admin",
          createdAt: now,
        }),
      ]);
      await notifyCustomer({ shipmentId: id });
      return json({ id, code }, 201);
    }
    if (input.action === "edit-details") {
      const data = shipmentSchema.parse(input.data);
      const [saved] = await db
        .update(shipments)
        .set({ ...data, updatedAt: now })
        .where(
          and(
            eq(shipments.id, String(input.id)),
            eq(shipments.updatedAt, String(input.expectedUpdatedAt)),
          ),
        )
        .returning({ code: shipments.code });
      if (!saved)
        throw new HttpError(
          409,
          "This shipment changed. Reopen it before editing.",
        );
      await notifyCustomer({ shipmentId: String(input.id) });
      return json(saved);
    }
    if (input.action === "replace-code") {
      const [saved] = await db
        .update(shipments)
        .set({ code: trackingCode(), updatedAt: now })
        .where(
          and(
            eq(shipments.id, String(input.id)),
            eq(shipments.code, String(input.previousCode)),
          ),
        )
        .returning({ code: shipments.code });
      if (!saved)
        throw new HttpError(
          409,
          "The tracking number has changed. Reopen the shipment.",
        );
      await notifyCustomer({ shipmentId: String(input.id) });
      return json(saved);
    }
    if (input.action === "correct-note") {
      if (
        typeof input.note !== "string" ||
        input.note.length > 1000 ||
        typeof input.previousNote !== "string"
      )
        throw new HttpError(400, "Enter a note of up to 1,000 characters.");
      const [saved] = await db
        .update(events)
        .set({ note: input.note.trim() })
        .where(
          and(
            eq(events.id, String(input.eventId)),
            eq(events.shipmentId, String(input.id)),
            eq(events.note, input.previousNote),
          ),
        )
        .returning({ id: events.id });
      if (!saved)
        throw new HttpError(
          409,
          "This milestone has changed. Reopen the shipment.",
        );
      await notifyCustomer({ shipmentId: String(input.id) });
      return json({ ok: true });
    }
    if (input.action === "update") {
      const data = updateSchema.parse(input.data);
      const s = await db
        .select()
        .from(shipments)
        .where(eq(shipments.id, String(input.id)))
        .limit(1)
        .then((rows) => rows[0]);
      if (!s) throw new HttpError(404, "Shipment not found.");
      const terminal = ["delivered", "cancelled"].includes(data.status);
      await db.batch([
        db
          .update(shipments)
          .set({
            status: data.status,
            eta: data.eta,
            currentLat: data.lat,
            currentLng: data.lng,
            currentLocation: data.location,
            locationSource: "admin",
            locationUpdatedAt: now,
            updatedAt: now,
            ...(terminal
              ? { driverTokenHash: null, driverTokenExpiresAt: null }
              : {}),
          })
          .where(eq(shipments.id, s.id)),
        db.insert(events).values({
          id: crypto.randomUUID(),
          shipmentId: s.id,
          status: data.status,
          location: data.location,
          note: data.note,
          lat: data.lat,
          lng: data.lng,
          source: "admin",
          createdAt: now,
        }),
      ]);
      await notifyCustomer({ shipmentId: String(input.id) });
      return json({ ok: true });
    }
    if (input.action === "settings") {
      const data = settingsSchema.parse(input.data);
      await db
        .insert(settings)
        .values({ ...data, id: "business" })
        .onConflictDoUpdate({ target: settings.id, set: data });
      return json({ ok: true });
    }
    if (input.action === "request-status") {
      if (!["new", "contacted", "closed"].includes(input.status))
        throw new HttpError(400, "Invalid request status.");
      const rows = await db
        .update(requests)
        .set({ status: input.status })
        .where(eq(requests.id, String(input.id)))
        .returning({ id: requests.id });
      if (!rows.length) throw new HttpError(404, "Request not found.");
      return json({ ok: true });
    }
    if (input.action === "driver-link" || input.action === "revoke-driver") {
      const s = await db
        .select()
        .from(shipments)
        .where(eq(shipments.id, String(input.id)))
        .limit(1)
        .then((rows) => rows[0]);
      if (!s) throw new HttpError(404, "Shipment not found.");
      if (input.action === "revoke-driver") {
        await db
          .update(shipments)
          .set({ driverTokenHash: null, driverTokenExpiresAt: null })
          .where(eq(shipments.id, s.id));
        return json({ ok: true });
      }
      if (["delivered", "cancelled"].includes(s.status))
        throw new HttpError(400, "This shipment is already completed.");
      const token = crypto.randomUUID() + crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 48 * 3600000).toISOString();
      await db
        .update(shipments)
        .set({
          driverTokenHash: await hash(token),
          driverTokenExpiresAt: expiresAt,
        })
        .where(eq(shipments.id, s.id));
      return json({ token, expiresAt });
    }
    throw new HttpError(400, "Unknown action.");
  });
}
