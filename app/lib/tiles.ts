/**
 * Basemap failover for the tracking map.
 *
 * Design goals, in order:
 * 1. No API key required by default: only OpenStreetMap community tiles are
 *    listed. (CARTO's public raster endpoints answer keyless requests with a
 *    watermarked placeholder, so they are deliberately absent.)
 * 2. A single missing tile must never be read as "provider is down". Health is
 *    judged on a rolling window per provider, and only trips a cooldown when
 *    the failure *rate* is high across several attempts.
 * 3. No endless retrying: a benched provider is moved to the back of the queue
 *    for a cooldown period, and is only used again if everything else fails. A
 *    single tile is retried at most once per provider, so a broken tile can
 *    never turn into a request storm.
 * 4. Successful tiles are never discarded — the map swaps the template for new
 *    tiles only, keeping what has already loaded.
 *
 * ## Provider terms (read before production traffic)
 *
 * Community tile servers are donated infrastructure. They are best-effort, carry
 * no SLA, and may be rate-limited or blocked without notice. The OpenStreetMap
 * Foundation tile policy additionally allows withdrawal at any time for
 * commercial services that cannot absorb the load. This module respects the
 * parts an application controls:
 *
 * - the required URL form `https://tile.openstreetmap.org/{z}/{x}/{y}.png`, over
 *   HTTPS, with no subdomains;
 * - visible attribution, plus the recommended "Report a map issue" link
 *   (`fixthemap`), both rendered in Leaflet's attribution control;
 * - no `Cache-Control: no-cache` / `Pragma` headers (Leaflet sends none, so the
 *   browser honours the server's caching headers);
 * - no prefetching: only tiles inside the current viewport are requested;
 * - retries bounded by the provider list, never unbounded.
 *
 * What an application cannot promise is capacity. For real production volume,
 * point the provider list at a licensed provider (MapTiler, Stadia,
 * Thunderforest, or your own tiles) — that is configuration, not a code change.
 * The value is a JSON array, which is unambiguous because attribution strings
 * themselves contain `;` and `&`:
 *
 *   NEXT_PUBLIC_TILE_PROVIDERS=[{"id":"maptiler","url":"https://api.maptiler.com/maps/streets/{z}/{x}/{y}.png?key=KEY","attribution":"&copy; MapTiler"}]
 *
 * Configured providers come first, so healthy licensed tiles are used before
 * any community fallback. Invalid entries are ignored rather than shipped.
 *
 * The same value can be supplied under either bundler this project builds with:
 * `NEXT_PUBLIC_TILE_PROVIDERS` (Next's webpack build, which inlines
 * `process.env.NEXT_PUBLIC_*`) or `VITE_TILE_PROVIDERS` (the Vite/vinext build,
 * which exposes `import.meta.env.VITE_*`). The Next-style variable wins when
 * both are set.
 */
export type TileProvider = {
  id: string;
  url: string;
  subdomains?: string;
  attribution: string;
};

const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' +
  ' &middot; <a href="https://www.openstreetmap.org/fixthemap" target="_blank" rel="noopener">Report a map issue</a>';

/**
 * Three independent operators on separate infrastructure, all key-free.
 *
 * Order is priority. If a deployment needs more capacity, set the provider list
 * (see above) rather than editing this list. Exported so tests and callers can
 * distinguish "what ships" from "what is configured".
 */
export const DEFAULT_PROVIDERS: TileProvider[] = [
  {
    id: "osm",
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: OSM_ATTRIBUTION,
  },
  {
    id: "osm-de",
    url: "https://{s}.tile.openstreetmap.de/{z}/{x}/{y}.png",
    subdomains: "abc",
    attribution: OSM_ATTRIBUTION,
  },
  {
    id: "osm-fr",
    url: "https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png",
    subdomains: "abc",
    attribution: OSM_ATTRIBUTION,
  },
];

/**
 * Parses a `VITE_TILE_PROVIDERS` override: a JSON array of
 * `{ id, url, subdomains?, attribution? }`. Invalid entries are skipped; if
 * nothing usable remains the caller falls back to the built-in list.
 */
export function parseProviders(value?: string): TileProvider[] | null {
  if (!value || !value.trim()) return null;
  let raw: unknown;
  try {
    raw = JSON.parse(value);
  } catch {
    return null;
  }
  if (!Array.isArray(raw)) return null;
  const providers: TileProvider[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const { id, url, subdomains, attribution } = item as Record<string, unknown>;
    // Only absolute HTTPS templates with a tile placeholder are usable.
    if (typeof id !== "string" || !id) continue;
    if (typeof url !== "string" || !url.startsWith("https://")) continue;
    if (!url.includes("{z}")) continue;
    providers.push({
      id,
      url,
      subdomains:
        typeof subdomains === "string" && subdomains ? subdomains : undefined,
      attribution:
        typeof attribution === "string" && attribution
          ? attribution
          : OSM_ATTRIBUTION,
    });
  }
  return providers.length ? providers : null;
}

type ViteEnv = { env?: Record<string, string | undefined> };
/** Vite substitutes `import.meta.env` at build time; undefined elsewhere. */
const viteEnv = (import.meta as unknown as ViteEnv).env;

/**
 * The Next-style variable, which webpack inlines at build time.
 *
 * `process` does not exist in the browser under Vite, so it is probed with
 * `typeof` rather than referenced directly; the literal `process.env.NEXT_PUBLIC_*`
 * read below is what Next's build replaces.
 */
function nextPublicProviders(): string | undefined {
  return typeof process === "undefined"
    ? undefined
    : process.env.NEXT_PUBLIC_TILE_PROVIDERS;
}

/**
 * The same variable as inlined by Vite. `envPrefix` in `vite.config.ts` exposes
 * `NEXT_PUBLIC_*` alongside `VITE_*`, so the Next-style name works on this build
 * path too; the older `VITE_TILE_PROVIDERS` is still honoured.
 */
function viteProviders(): string | undefined {
  return viteEnv?.NEXT_PUBLIC_TILE_PROVIDERS ?? viteEnv?.VITE_TILE_PROVIDERS;
}

/**
 * Resolves the active provider list from configuration, preferring the
 * Next-style variable, then the Vite one, then the built-ins. Split out so the
 * precedence is testable without touching a real build.
 */
export function providersFromEnv(
  nextValue?: string,
  viteValue?: string,
): TileProvider[] {
  return (
    parseProviders(nextValue) ?? parseProviders(viteValue) ?? DEFAULT_PROVIDERS
  );
}

/** Active providers: configuration when present, else the built-ins. */
export const TILE_PROVIDERS: TileProvider[] = providersFromEnv(
  nextPublicProviders(),
  viteProviders(),
);

/** Resolves one tile URL, picking a stable subdomain when the template has {s}. */
export function tileUrl(
  provider: TileProvider,
  z: number,
  x: number,
  y: number,
): string {
  let url = provider.url;
  if (url.includes("{s}")) {
    const subs = (provider.subdomains || "abc").split("");
    const index = Math.abs((z * 31 + x + y) % subs.length);
    url = url.replace("{s}", subs[index]);
  }
  return url
    .replace("{z}", String(z))
    .replace("{x}", String(x))
    .replace("{y}", String(y));
}

export type FailoverOptions = {
  /** How long a benched provider stays out of the queue. */
  cooldownMs?: number;
  /** Number of recent results considered per provider. */
  windowSize?: number;
  /** Minimum sample before a provider can be benched at all. */
  minSample?: number;
  /** Failure ratio (0–1) within the window that benches a provider. */
  failureRate?: number;
};

type Health = { results: boolean[]; benchedUntil: number };

export class TileFailover {
  private readonly providers: TileProvider[];
  private readonly health = new Map<string, Health>();
  private readonly cooldownMs: number;
  private readonly windowSize: number;
  private readonly minSample: number;
  private readonly failureRate: number;

  constructor(providers: TileProvider[] = TILE_PROVIDERS, options: FailoverOptions = {}) {
    this.providers = providers.length ? providers : TILE_PROVIDERS;
    this.cooldownMs = options.cooldownMs ?? 300_000;
    this.windowSize = Math.max(2, options.windowSize ?? 12);
    this.minSample = Math.max(1, options.minSample ?? 8);
    this.failureRate = Math.min(1, Math.max(0, options.failureRate ?? 0.6));
    for (const provider of this.providers)
      this.health.set(provider.id, { results: [], benchedUntil: 0 });
  }

  /** Records the outcome of one tile request for one provider. */
  report(id: string, ok: boolean, now = Date.now()): void {
    const health = this.health.get(id);
    if (!health) return;
    health.results.push(ok);
    if (health.results.length > this.windowSize) health.results.shift();
    if (ok) {
      // A fresh tile proves the provider is serving again: end any cooldown.
      health.benchedUntil = 0;
      return;
    }
    if (health.results.length < this.minSample) return;
    const failures = health.results.filter((result) => !result).length;
    if (failures / health.results.length >= this.failureRate)
      health.benchedUntil = now + this.cooldownMs;
  }

  isBenched(id: string, now = Date.now()): boolean {
    const health = this.health.get(id);
    return !!health && health.benchedUntil > now;
  }

  /**
   * Providers in the order they should be tried: healthy ones first in
   * configured priority, then benched ones as a last resort. Never empty.
   */
  order(now = Date.now()): TileProvider[] {
    const healthy = this.providers.filter((p) => !this.isBenched(p.id, now));
    const benched = this.providers
      .filter((p) => this.isBenched(p.id, now))
      .sort(
        (a, b) =>
          (this.health.get(a.id)?.benchedUntil ?? 0) -
          (this.health.get(b.id)?.benchedUntil ?? 0),
      );
    return [...healthy, ...benched];
  }

  /** True when every provider is in cooldown, i.e. no basemap is usable. */
  degraded(now = Date.now()): boolean {
    return this.providers.every((p) => this.isBenched(p.id, now));
  }

  /** Diagnostic snapshot, handy in tests and console debugging. */
  stats(now = Date.now()) {
    return this.providers.map((p) => {
      const health = this.health.get(p.id);
      const results = health?.results ?? [];
      return {
        id: p.id,
        attempts: results.length,
        failures: results.filter((result) => !result).length,
        benched: this.isBenched(p.id, now),
      };
    });
  }
}
