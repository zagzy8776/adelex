import {
  pgSchema,
  text,
  integer,
  doublePrecision,
  index,
} from "drizzle-orm/pg-core";
const logistics = pgSchema("adexec");
export const admins = logistics.table("admins", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  email: text("email").notNull(),
  createdAt: text("created_at").notNull(),
});
export const shipments = logistics.table(
  "shipments",
  {
    id: text("id").primaryKey(),
    code: text("code").notNull().unique(),
    // Sender information
    senderName: text("sender_name").notNull().default(""),
    senderEmail: text("sender_email").notNull().default(""),
    senderPhone: text("sender_phone").notNull().default(""),
    senderAddress: text("sender_address").notNull().default(""),
    // Recipient information
    recipientName: text("recipient_name").notNull(),
    recipientEmail: text("recipient_email").notNull().default(""),
    recipientPhone: text("recipient_phone").notNull().default(""),
    recipientAddress: text("recipient_address").notNull().default(""),
    description: text("description").notNull(),
    service: text("service").notNull(),
    origin: text("origin").notNull(),
    destination: text("destination").notNull(),
    originLat: doublePrecision("origin_lat").notNull(),
    originLng: doublePrecision("origin_lng").notNull(),
    destinationLat: doublePrecision("destination_lat").notNull(),
    destinationLng: doublePrecision("destination_lng").notNull(),
    currentLat: doublePrecision("current_lat").notNull(),
    currentLng: doublePrecision("current_lng").notNull(),
    currentLocation: text("current_location").notNull(),
    status: text("status").notNull().default("booked"),
    eta: text("eta").notNull().default(""),
    weight: doublePrecision("weight").notNull().default(0),
    pieces: integer("pieces").notNull().default(1),
    locationSource: text("location_source").notNull().default("admin"),
    locationUpdatedAt: text("location_updated_at").notNull(),
    driverTokenHash: text("driver_token_hash"),
    driverTokenExpiresAt: text("driver_token_expires_at"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => [index("shipments_created_idx").on(t.createdAt)],
);
export const events = logistics.table(
  "events",
  {
    id: text("id").primaryKey(),
    shipmentId: text("shipment_id")
      .notNull()
      .references(() => shipments.id, { onDelete: "cascade" }),
    status: text("status").notNull(),
    location: text("location").notNull(),
    note: text("note").notNull(),
    lat: doublePrecision("lat").notNull(),
    lng: doublePrecision("lng").notNull(),
    source: text("source").notNull().default("admin"),
    createdAt: text("created_at").notNull(),
  },
  (t) => [index("events_shipment_idx").on(t.shipmentId, t.createdAt)],
);
export const requests = logistics.table("requests", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  origin: text("origin").notNull(),
  destination: text("destination").notNull(),
  service: text("service").notNull(),
  description: text("description").notNull(),
  weight: doublePrecision("weight").notNull(),
  status: text("status").notNull().default("new"),
  createdAt: text("created_at").notNull(),
});
export const settings = logistics.table("settings", {
  id: text("id").primaryKey(),
  contactEmail: text("contact_email").notNull().default(""),
  contactPhone: text("contact_phone").notNull().default(""),
  address: text("address").notNull().default(""),
  businessHours: text("business_hours").notNull().default(""),
});
export const rateLimits = logistics.table("rate_limits", {
  key: text("key").primaryKey(),
  hits: integer("hits").notNull(),
  resetAt: integer("reset_at").notNull(),
});

export const emailOutbox = logistics.table(
  "email_outbox",
  {
    id: text("id").primaryKey(),
    recipient: text("recipient").notNull(),
    shipmentId: text("shipment_id"),
    kind: text("kind").notNull(),
    payload: text("payload").notNull(),
    status: text("status").notNull().default("pending"),
    attempts: integer("attempts").notNull().default(0),
    createdAt: text("created_at").notNull(),
    nextAttempt: text("next_attempt").notNull(),
    lease: text("lease"),
    providerId: text("provider_id"),
    lastError: text("last_error"),
  },
  (t) => [index("email_outbox_pending_idx").on(t.status, t.nextAttempt)],
);
