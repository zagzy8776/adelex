/**
 * Geometry helpers for the tracking map.
 *
 * Everything here is pure so it can be unit tested without a browser or
 * Leaflet. Coordinates are `[lat, lng]` in decimal degrees, matching Leaflet's
 * `LatLngTuple`.
 */
export type Point = [number, number];

const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;
const EARTH_KM = 6371.0088;

/** Great-circle distance in kilometres. */
export function distanceKm(a: Point, b: Point): number {
  const lat1 = a[0] * RAD,
    lat2 = b[0] * RAD;
  const dLat = lat2 - lat1,
    dLng = (b[1] - a[1]) * RAD;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Compass bearing from `from` to `to`, in degrees clockwise from north. */
export function bearing(from: Point, to: Point): number {
  const lat1 = from[0] * RAD,
    lat2 = to[0] * RAD;
  const dLng = (to[1] - from[1]) * RAD;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  if (!x && !y) return 0;
  return ((Math.atan2(y, x) * DEG) + 360) % 360;
}

/** Smoothstep: eases in and out, with no overshoot. */
export function easeInOut(t: number): number {
  const clamped = t < 0 ? 0 : t > 1 ? 1 : t;
  return clamped * clamped * (3 - 2 * clamped);
}

/**
 * Points along the great circle between `a` and `b` (spherical linear
 * interpolation). Used for air and sea legs, where a straight screen-space
 * line would be plainly wrong — a Mercator straight line distorts the path and
 * an equatorial route is not the shortest one.
 */
export function greatCircle(a: Point, b: Point, steps = 48): Point[] {
  const count = Math.max(1, Math.floor(steps));
  const lat1 = a[0] * RAD,
    lng1 = a[1] * RAD,
    lat2 = b[0] * RAD,
    lng2 = b[1] * RAD;
  const h =
    Math.sin((lat2 - lat1) / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin((lng2 - lng1) / 2) ** 2;
  const d = 2 * Math.asin(Math.min(1, Math.sqrt(h)));
  if (d < 1e-9 || !Number.isFinite(d)) return [a, b];
  const sinD = Math.sin(d);
  const out: Point[] = [];
  for (let i = 0; i <= count; i++) {
    const f = i / count;
    const A = Math.sin((1 - f) * d) / sinD,
      B = Math.sin(f * d) / sinD;
    const x = A * Math.cos(lat1) * Math.cos(lng1) + B * Math.cos(lat2) * Math.cos(lng2);
    const y = A * Math.cos(lat1) * Math.sin(lng1) + B * Math.cos(lat2) * Math.sin(lng2);
    const z = A * Math.sin(lat1) + B * Math.sin(lat2);
    out.push([
      Math.atan2(z, Math.hypot(x, y)) * DEG,
      Math.atan2(y, x) * DEG,
    ]);
  }
  out[0] = a;
  out[out.length - 1] = b;
  return out;
}

function finitePoint(value: unknown): value is Point {
  return (
    Array.isArray(value) &&
    value.length >= 2 &&
    Number.isFinite(Number(value[0])) &&
    Number.isFinite(Number(value[1]))
  );
}

/** Validates an unknown value (e.g. from JSON) into a clean route. */
export function normaliseRoute(value: unknown): Point[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const points = value.filter(finitePoint).map((p): Point => [Number(p[0]), Number(p[1])]);
  return points.length > 1 ? points : undefined;
}

/**
 * The full path a shipment is expected to take.
 *
 * - A route supplied by dispatch (`planned`) always wins: it is real geometry,
 *   so it can follow roads for a road shipment.
 * - Air and ocean legs use a great-circle arc, which is the shape those legs
 *   actually take.
 * - Road and express legs without routing data fall back to a straight guide.
 *   This is a guide, never a claim of road navigation.
 */
export function routePoints(
  service: string,
  from: Point,
  to: Point,
  planned?: Point[],
): Point[] {
  if (planned && planned.length > 1) return planned;
  if (service === "Air freight" || service === "Ocean freight")
    return greatCircle(from, to, 64);
  return [from, to];
}

function nearestIndex(points: Point[], at: Point): number {
  let best = 0,
    bestDistance = Infinity;
  for (let i = 0; i < points.length; i++) {
    const d = distanceKm(points[i], at);
    if (d < bestDistance) {
      bestDistance = d;
      best = i;
    }
  }
  return best;
}

/**
 * Splits a route at the last reported position so the travelled part and the
 * remaining part share the same shape (no sudden kink where the marker is).
 */
export function splitRoute(
  points: Point[],
  at: Point,
): { travelled: Point[]; remaining: Point[] } {
  if (points.length < 2) return { travelled: [at], remaining: [at] };
  if (points.length === 2)
    return { travelled: [points[0], at], remaining: [at, points[1]] };
  const i = nearestIndex(points, at);
  return {
    travelled: [...points.slice(0, i + 1), at],
    remaining: [at, ...points.slice(i + 1)],
  };
}

/** One reported position and the moment it was reported (epoch ms). */
export type TrailReport = { point: Point; at: number };

/**
 * A stretch of connected reported positions. `gap` marks a run that begins with
 * a join we cannot account for: the two reports are further apart than the time
 * between them allows, so the line joining them is *not* observed travel. It is
 * drawn as a dashed join instead of a solid path.
 */
export type TrailRun = { points: Point[]; gap: boolean };

export type TrailOptions = {
  /** Fastest speed still plausible for the mode, km/h. */
  maxKmh: number;
  /** Shortest distance that can ever count as a jump, km. */
  minGapKm?: number;
  /** Jump distance used when the timestamps cannot be trusted, km. */
  unknownGapKm?: number;
};

/**
 * Plausible speeds and "always suspicious" distances per transport mode. A truck
 * is not doing 300 km/h; a ship is not doing 60 km/h; an aircraft is not doing
 * 2,000 km/h. Anything faster than the mode allows means reports are missing
 * between those two points, not that the vehicle teleported.
 */
export function trailLimits(service: string): {
  maxKmh: number;
  unknownGapKm: number;
} {
  if (service === "Air freight") return { maxKmh: 1000, unknownGapKm: 800 };
  if (service === "Ocean freight") return { maxKmh: 45, unknownGapKm: 500 };
  return { maxKmh: 110, unknownGapKm: 60 };
}

/**
 * Groups reported positions into runs that can be drawn as observed travel.
 *
 * A jump is flagged when the implied speed between two reports exceeds what the
 * mode could possibly have done. With no usable timestamps there is nothing to
 * compare against, so the mode's conservative distance threshold is used.
 */
export function trailRuns(
  reports: TrailReport[],
  { maxKmh, minGapKm = 20, unknownGapKm = 60 }: TrailOptions,
): TrailRun[] {
  const runs: TrailRun[] = [];
  let previous: TrailReport | null = null;
  for (const report of reports) {
    const [lat, lng] = report.point;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    const last = runs[runs.length - 1];
    if (!last || !previous) {
      runs.push({ points: [report.point], gap: false });
      previous = report;
      continue;
    }
    const km = distanceKm(previous.point, report.point);
    const hours = (report.at - previous.at) / 3_600_000;
    const gap =
      km >= minGapKm &&
      (hours > 0 ? km / hours > maxKmh : km >= unknownGapKm);
    if (gap) runs.push({ points: [report.point], gap: true });
    else last.points.push(report.point);
    previous = report;
  }
  return runs;
}

export type Transition = { mode: "glide" | "relocate"; duration: number };

/** Beyond this the two reports are too far apart to animate as movement. */
export const GLIDE_LIMIT_KM = 30;

/**
 * How to present a new reported position.
 *
 * A few kilometres is plausible movement between two reports, so it is
 * animated briefly. Anything further apart is a *jump* between reports and is
 * applied instantly with an attention pulse instead — animating 400 km over a
 * second would imply the vehicle physically travelled it.
 */
export function transitionFor(
  from: Point,
  to: Point,
  reducedMotion = false,
): Transition {
  if (reducedMotion) return { mode: "relocate", duration: 0 };
  const km = distanceKm(from, to);
  // Unchanged position (a poll with no new report): nothing to animate.
  if (!Number.isFinite(km) || km < 0.005)
    return { mode: "relocate", duration: 0 };
  if (km <= GLIDE_LIMIT_KM) return { mode: "glide", duration: 700 };
  return { mode: "relocate", duration: 900 };
}
