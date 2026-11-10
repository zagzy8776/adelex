import { z } from "zod";
export const statuses = [
  "booked",
  "collected",
  "in_transit",
  "out_for_delivery",
  "delivered",
  "on_hold",
  "cancelled",
] as const;
export const statusLabels: Record<string, string> = {
  booked: "Booked",
  collected: "Collected",
  in_transit: "In transit",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  on_hold: "On hold",
  cancelled: "Cancelled",
};
export const services = [
  "Road freight",
  "Air freight",
  "Ocean freight",
  "Express delivery",
] as const;
const line = z.string().trim().min(2).max(160);
export const coordinate = {
  lat: z.number().finite().min(-85).max(85),
  lng: z.number().finite().min(-180).max(180),
};
const optionalEmail = z.union([
  z.literal(""),
  z.string().trim().email().max(180),
]);
const date = z.union([z.literal(""), z.string().datetime()]);
export const shipmentSchema = z.object({
  // Sender information
  senderName: line,
  senderEmail: optionalEmail.default(""),
  senderPhone: z.string().trim().max(40).default(""),
  senderAddress: z.string().trim().max(300).default(""),
  // Recipient information
  recipientName: line,
  recipientEmail: optionalEmail.default(""),
  recipientPhone: z.string().trim().max(40).default(""),
  recipientAddress: z.string().trim().max(300).default(""),
  description: z.string().trim().min(2).max(1000),
  service: z.enum(services),
  origin: line,
  destination: line,
  originLat: coordinate.lat,
  originLng: coordinate.lng,
  destinationLat: coordinate.lat,
  destinationLng: coordinate.lng,
  eta: date.default(""),
  weight: z.number().finite().min(0).max(1000000),
  pieces: z.number().int().min(1).max(100000),
});
export const updateSchema = z.object({
  status: z.enum(statuses),
  location: line,
  note: z.string().trim().max(1000),
  lat: coordinate.lat,
  lng: coordinate.lng,
  eta: date,
});
export const requestSchema = z.object({
  name: line,
  email: z.string().trim().email().max(180),
  phone: z.string().trim().min(5).max(40),
  origin: line,
  destination: line,
  service: z.enum(services),
  description: z.string().trim().min(5).max(2000),
  weight: z.number().finite().min(0.01).max(1000000),
  website: z.string().max(0).optional(),
});
export const settingsSchema = z.object({
  contactEmail: optionalEmail,
  contactPhone: z.string().trim().max(40),
  address: z.string().trim().max(300),
  businessHours: z.string().trim().max(160),
});
export type Shipment = z.infer<typeof shipmentSchema> & {
  id: string;
  code: string;
  status: string;
  currentLat: number;
  currentLng: number;
  currentLocation: string;
  locationSource: string;
  locationUpdatedAt: string;
  createdAt: string;
  updatedAt: string;
  events?: ShipmentEvent[];
  demo?: boolean;
  driverTokenExpiresAt?: string | null;
};
export type ShipmentEvent = {
  id: string;
  status: string;
  location: string;
  note: string;
  lat: number;
  lng: number;
  source: string;
  createdAt: string;
};
export type PublicShipment = Omit<
  Shipment,
  | "recipientName"
  | "recipientEmail"
  | "recipientPhone"
  | "recipientAddress"
  | "senderName"
  | "senderEmail"
  | "senderPhone"
  | "senderAddress"
>;
export type BusinessSettings = z.infer<typeof settingsSchema>;
export function publicShipment(s: Record<string, unknown>) {
  const fields = [
    "code",
    "description",
    "service",
    "origin",
    "destination",
    "originLat",
    "originLng",
    "destinationLat",
    "destinationLng",
    "currentLat",
    "currentLng",
    "currentLocation",
    "status",
    "eta",
    "weight",
    "pieces",
    "locationSource",
    "locationUpdatedAt",
    "createdAt",
    "updatedAt",
  ];
  return Object.fromEntries(fields.map((key) => [key, s[key]]));
}
const referenceAlphabet = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
export function trackingCode() {
  const random = crypto.getRandomValues(new Uint8Array(20));
  const groups = Array.from(random, (b) => referenceAlphabet[b & 31])
    .join("")
    .match(/.{5}/g)!;
  return ["ADX", ...groups].join("-");
}
export function normalizeCode(code: string) {
  const raw = code.trim().toUpperCase();
  if (raw === "ADX-DEMO") return raw;
  if (/^ADX(?:[ -][0-9A-HJKMNP-TV-Z]{5}){4}$/.test(raw))
    return raw.replaceAll(" ", "-");
  return raw;
}
export function validCode(code: string) {
  return (
    /^ADX-(?:[0-9A-HJKMNP-TV-Z]{5}-){3}[0-9A-HJKMNP-TV-Z]{5}$/.test(code) ||
    /^ADX-[0-9A-F]{20}$/.test(code)
  );
}
export function positionAge(timestamp: string, now = Date.now()) {
  return Math.max(0, now - new Date(timestamp).getTime());
}
export function isFreshGPS(
  source: string,
  timestamp: string,
  now = Date.now(),
) {
  return source === "gps" && positionAge(timestamp, now) < 120000;
}
export function displayDate(value: string, withTime = false) {
  if (!value) return "To be confirmed";
  return new Date(value).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}
export const exampleJourney = [
  { location: "Rotterdam, Netherlands", lat: 51.9225, lng: 4.4792 },
  { location: "Breda, Netherlands", lat: 51.5719, lng: 4.7683 },
  { location: "Antwerp, Belgium", lat: 51.2194, lng: 4.4025 },
  { location: "Brussels, Belgium", lat: 50.8503, lng: 4.3517 },
];
export function demoShipment(): PublicShipment {
  const now = Date.now();
  const at = (h: number) => new Date(now - h * 3600000).toISOString();
  return {
    id: "demo",
    code: "ADX-DEMO",
    description: "Commercial goods · sample shipment",
    service: "Road freight",
    origin: exampleJourney[0].location,
    destination: exampleJourney[3].location,
    originLat: exampleJourney[0].lat,
    originLng: exampleJourney[0].lng,
    destinationLat: exampleJourney[3].lat,
    destinationLng: exampleJourney[3].lng,
    currentLat: exampleJourney[2].lat,
    currentLng: exampleJourney[2].lng,
    currentLocation: exampleJourney[2].location,
    status: "in_transit",
    eta: at(-24),
    weight: 24,
    pieces: 3,
    locationSource: "demo",
    locationUpdatedAt: at(0.2),
    createdAt: at(48),
    updatedAt: at(0.2),
    demo: true,
    events: [
      {
        id: "d3",
        status: "in_transit",
        location: exampleJourney[2].location,
        note: "Shipment is continuing to the destination hub.",
        lat: exampleJourney[2].lat,
        lng: exampleJourney[2].lng,
        source: "demo",
        createdAt: at(0.2),
      },
      {
        id: "d2",
        status: "collected",
        location: exampleJourney[0].location,
        note: "Shipment collected and prepared for departure.",
        lat: exampleJourney[0].lat,
        lng: exampleJourney[0].lng,
        source: "demo",
        createdAt: at(24),
      },
      {
        id: "d1",
        status: "booked",
        location: exampleJourney[0].location,
        note: "Shipment booking confirmed.",
        lat: exampleJourney[0].lat,
        lng: exampleJourney[0].lng,
        source: "demo",
        createdAt: at(48),
      },
    ],
  };
}
