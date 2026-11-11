import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { test } from "node:test";
import { buildSync } from "esbuild";

/**
 * The map helpers are TypeScript, and the project has no test runner, so each
 * module is transpiled with the esbuild that already ships with Vite and then
 * imported. No extra dependency, and the tests exercise the real source.
 */
const dir = mkdtempSync(join(tmpdir(), "adelex-map-"));
let counter = 0;
function load(relative) {
  const out = join(dir, `module-${counter++}.mjs`);
  buildSync({
    entryPoints: [fileURLToPath(new URL(relative, import.meta.url))],
    bundle: true,
    format: "esm",
    platform: "node",
    outfile: out,
    logLevel: "silent",
  });
  return import(pathToFileURL(out).href);
}

const geo = await load("../app/lib/geo.ts");
const tiles = await load("../app/lib/tiles.ts");

const ROTTERDAM = [51.9225, 4.4792];
const BRUSSELS = [50.8503, 4.3517];
const ANTWERP = [51.2194, 4.4025];

test("distanceKm matches known great-circle distances", () => {
  const km = geo.distanceKm(ROTTERDAM, BRUSSELS);
  assert.ok(km > 100 && km < 140, `expected ~120 km, got ${km}`);
  assert.equal(Math.round(geo.distanceKm(ROTTERDAM, ROTTERDAM)), 0);
  // Rotterdam to Antwerp is ~78 km by great circle.
  const antwerp = geo.distanceKm(ROTTERDAM, ANTWERP);
  assert.ok(antwerp > 70 && antwerp < 90, `expected ~78 km, got ${antwerp}`);
});

test("bearing points the right way", () => {
  assert.ok(Math.abs(geo.bearing([0, 0], [10, 0])) < 1, "due north is 0deg");
  assert.ok(Math.abs(geo.bearing([0, 0], [0, 10]) - 90) < 1, "due east is 90deg");
  assert.ok(Math.abs(geo.bearing([10, 0], [-10, 0]) - 180) < 1, "due south is 180deg");
});

test("easeInOut is clamped and symmetric", () => {
  assert.equal(geo.easeInOut(0), 0);
  assert.equal(geo.easeInOut(1), 1);
  assert.equal(geo.easeInOut(-5), 0);
  assert.equal(geo.easeInOut(9), 1);
  assert.ok(Math.abs(geo.easeInOut(0.5) - 0.5) < 1e-9);
});

test("greatCircle keeps the endpoints and bulges outward", () => {
  const arc = geo.greatCircle(ROTTERDAM, BRUSSELS, 16);
  assert.equal(arc.length, 17);
  assert.deepEqual(arc[0], ROTTERDAM);
  assert.deepEqual(arc.at(-1), BRUSSELS);
  const mid = arc[Math.floor(arc.length / 2)];
  // The midpoint of a great circle sits further from the straight line's
  // midpoint than zero: proof we are not drawing a screen-space line.
  const straightMid = [
    (ROTTERDAM[0] + BRUSSELS[0]) / 2,
    (ROTTERDAM[1] + BRUSSELS[1]) / 2,
  ];
  assert.ok(geo.distanceKm(mid, straightMid) > 0);
  assert.ok(geo.distanceKm(mid, ROTTERDAM) > 1);
});

test("greatCircle handles identical points and near-antipodes", () => {
  assert.deepEqual(geo.greatCircle(ROTTERDAM, ROTTERDAM, 8), [ROTTERDAM, ROTTERDAM]);
  const arc = geo.greatCircle([0, 0], [0, 180], 8);
  for (const point of arc) {
    assert.ok(Number.isFinite(point[0]) && Number.isFinite(point[1]));
  }
});

test("routePoints is transport aware", () => {
  const road = geo.routePoints("Road freight", ROTTERDAM, BRUSSELS);
  assert.deepEqual(road, [ROTTERDAM, BRUSSELS]);

  const air = geo.routePoints("Air freight", ROTTERDAM, BRUSSELS);
  assert.ok(air.length > 2, "air legs are curved");

  const sea = geo.routePoints("Ocean freight", ROTTERDAM, BRUSSELS);
  assert.ok(sea.length > 2, "sea legs are curved");

  // Real geometry from dispatch always wins, even for road.
  const planned = [ROTTERDAM, ANTWERP, BRUSSELS];
  assert.deepEqual(geo.routePoints("Road freight", ROTTERDAM, BRUSSELS, planned), planned);
});

test("normaliseRoute rejects junk and keeps valid geometry", () => {
  assert.equal(geo.normaliseRoute(undefined), undefined);
  assert.equal(geo.normaliseRoute(null), undefined);
  assert.equal(geo.normaliseRoute("nope"), undefined);
  assert.equal(geo.normaliseRoute([[51.9, 4.4]]), undefined, "one point is not a route");
  assert.equal(
    geo.normaliseRoute([[51.9, 4.4], [Number.NaN, 4.4]]),
    undefined,
    "non-finite coordinates are dropped",
  );
  assert.deepEqual(geo.normaliseRoute([[51.9, 4.4], ["50.8", "4.3"]]), [
    [51.9, 4.4],
    [50.8, 4.3],
  ]);
});

test("splitRoute cuts the guide at the reported position", () => {
  const onRoute = [51.6, 4.5]; // between Rotterdam and Brussels
  const { travelled, remaining } = geo.splitRoute([ROTTERDAM, BRUSSELS], onRoute);
  assert.deepEqual(travelled, [ROTTERDAM, onRoute]);
  assert.deepEqual(remaining, [onRoute, BRUSSELS]);

  const arc = geo.greatCircle(ROTTERDAM, BRUSSELS, 32);
  const cut = geo.splitRoute(arc, onRoute);
  assert.ok(cut.travelled.length > 2 && cut.remaining.length > 2);
  assert.deepEqual(cut.travelled[0], ROTTERDAM);
  assert.deepEqual(cut.travelled.at(-1), onRoute);
  assert.deepEqual(cut.remaining[0], onRoute);
  assert.deepEqual(cut.remaining.at(-1), BRUSSELS);
  // No step backwards along the route.
  assert.ok(cut.travelled.length + cut.remaining.length === arc.length + 2);
});

test("transitionFor never animates a long jump as movement", () => {
  const near = geo.transitionFor(ANTWERP, [51.23, 4.41]);
  assert.equal(near.mode, "glide");
  assert.ok(near.duration > 0 && near.duration <= 1000);

  const far = geo.transitionFor(ROTTERDAM, BRUSSELS);
  assert.equal(far.mode, "relocate", "a 120 km gap is a jump between reports");

  const still = geo.transitionFor(ANTWERP, ANTWERP);
  assert.equal(still.duration, 0, "nothing moved, nothing to animate");

  assert.equal(geo.transitionFor(ROTTERDAM, BRUSSELS, true).duration, 0);
});

test("tileUrl resolves {s} {z} {x} {y} without duplicates", () => {
  const provider = tiles.TILE_PROVIDERS[0];
  assert.equal(tiles.tileUrl(provider, 5, 16, 10), "https://tile.openstreetmap.org/5/16/10.png");

  const mirror = tiles.TILE_PROVIDERS[1];
  const url = tiles.tileUrl(mirror, 5, 16, 10);
  assert.match(url, /^https:\/\/[abc]\.tile\.openstreetmap\.de\/5\/16\/10\.png$/);
  assert.equal(url, tiles.tileUrl(mirror, 5, 16, 10), "subdomain choice is stable");
});

test("no provider needs an API key", () => {
  for (const provider of tiles.TILE_PROVIDERS) {
    assert.ok(!/carto|api[_-]?key|access_token|\{key\}/i.test(provider.url), provider.url);
  }
});

test("a single tile error never benches a provider", () => {
  const failover = new tiles.TileFailover(undefined, { minSample: 8, failureRate: 0.6 });
  failover.report("osm", false);
  assert.equal(failover.isBenched("osm"), false);
  assert.equal(failover.order()[0].id, "osm");
  assert.equal(failover.degraded(), false);
});

test("a sustained high failure rate benches the provider, with cooldown", () => {
  const failover = new tiles.TileFailover(undefined, {
    minSample: 8,
    failureRate: 0.6,
    cooldownMs: 60_000,
  });
  const now = 1_000_000;
  for (let i = 0; i < 8; i++) failover.report("osm", false, now);
  assert.equal(failover.isBenched("osm", now), true);
  assert.equal(failover.order(now)[0].id, "osm-de", "healthy provider now leads");
  // ...but the benched provider is still available as a last resort.
  assert.equal(failover.order(now).at(-1).id, "osm");
  // Cooldown expires on its own.
  assert.equal(failover.isBenched("osm", now + 60_001), false);
});

test("a successful tile clears a cooldown early", () => {
  const failover = new tiles.TileFailover(undefined, {
    minSample: 4,
    failureRate: 0.75,
    cooldownMs: 60_000,
  });
  const now = 5_000;
  for (let i = 0; i < 4; i++) failover.report("osm", false, now);
  assert.equal(failover.isBenched("osm", now), true);
  failover.report("osm", true, now);
  assert.equal(failover.isBenched("osm", now), false);
});

test("degraded only when every provider is benched, queue never empty", () => {
  const now = 42_000;
  const failover = new tiles.TileFailover(undefined, {
    minSample: 2,
    failureRate: 0.5,
    cooldownMs: 60_000,
  });
  for (const id of ["osm", "osm-de", "osm-fr"])
    for (let i = 0; i < 2; i++) failover.report(id, false, now);
  assert.equal(failover.degraded(now), true);
  assert.equal(failover.order(now).length, tiles.TILE_PROVIDERS.length);
  // Worst case we still get a URL to try, never a blank map and never a loop.
  assert.match(tiles.tileUrl(failover.order(now)[0], 1, 0, 0), /^https:\/\//);
});

test("tile retries are bounded by the provider list", () => {
  const failover = new tiles.TileFailover();
  const tried = [];
  // Mirrors the component: pick the first provider not yet tried for this tile.
  for (let attempt = 0; attempt < 10; attempt++) {
    const next = failover.order().find((p) => !tried.includes(p.id));
    if (!next) break;
    tried.push(next.id);
    failover.report(next.id, false);
  }
  assert.equal(tried.length, tiles.TILE_PROVIDERS.length);
  assert.equal(
    failover.order().find((p) => !tried.includes(p.id)),
    undefined,
    "a tile is never retried on a provider that already failed it",
  );
});

const HOUR = 3_600_000;

test("trailRuns keeps plausible movement in a single solid run", () => {
  const runs = geo.trailRuns(
    [
      { point: ROTTERDAM, at: 0 },
      // 78 km in 1.5 h is about 52 km/h: a believable truck.
      { point: ANTWERP, at: 1.5 * HOUR },
    ],
    { maxKmh: geo.trailLimits("Road freight").maxKmh },
  );
  assert.equal(runs.length, 1);
  assert.equal(runs[0].gap, false);
  assert.equal(runs[0].points.length, 2);
});

test("trailRuns splits an impossible road jump into a gap", () => {
  const runs = geo.trailRuns(
    [
      { point: ROTTERDAM, at: 0 },
      // 123 km in 10 minutes is 738 km/h: the reports are not contiguous.
      { point: BRUSSELS, at: HOUR / 6 },
    ],
    { maxKmh: geo.trailLimits("Road freight").maxKmh },
  );
  assert.equal(runs.length, 2);
  assert.equal(runs[0].gap, false);
  assert.equal(runs[1].gap, true, "the join is flagged, so it can be dashed");
  assert.equal(runs[1].points.length, 1);
});

test("trailRuns judges gaps against the transport mode", () => {
  const leg = [
    { point: ROTTERDAM, at: 0 },
    { point: BRUSSELS, at: HOUR },
  ];
  const road = geo.trailRuns(leg, {
    maxKmh: geo.trailLimits("Road freight").maxKmh,
  });
  assert.equal(road.length, 2, "123 km in an hour is impossible by road");
  const air = geo.trailRuns(leg, {
    maxKmh: geo.trailLimits("Air freight").maxKmh,
  });
  assert.equal(air.length, 1, "the same hop is normal for an aircraft");
  const ocean = geo.trailRuns(leg, {
    maxKmh: geo.trailLimits("Ocean freight").maxKmh,
  });
  assert.equal(ocean.length, 2, "no ship covers that ground in an hour");
});

test("trailRuns falls back to distance when timestamps are unusable", () => {
  const near = geo.trailRuns(
    [
      { point: [51.9225, 4.4792], at: 0 },
      { point: [51.5719, 4.7683], at: 0 },
    ],
    geo.trailLimits("Road freight"),
  );
  assert.equal(near.length, 1, "44 km stays solid without a usable clock");
  const far = geo.trailRuns(
    [
      { point: ROTTERDAM, at: Number.NaN },
      { point: BRUSSELS, at: Number.NaN },
    ],
    geo.trailLimits("Road freight"),
  );
  assert.equal(far.length, 2, "123 km is a gap even with no clock");
});

test("trailRuns drops unusable coordinates and survives empty input", () => {
  assert.deepEqual(geo.trailRuns([], { maxKmh: 100 }), []);
  const runs = geo.trailRuns(
    [
      { point: [Number.NaN, 4], at: 0 },
      { point: ROTTERDAM, at: 0 },
      { point: [51.9225, Number.POSITIVE_INFINITY], at: HOUR },
    ],
    { maxKmh: 100 },
  );
  assert.equal(runs.length, 1);
  assert.equal(runs[0].points.length, 1);
});

test("parseProviders accepts a licensed provider without a code change", () => {
  const list = tiles.parseProviders(
    JSON.stringify([
      {
        id: "maptiler",
        url: "https://api.maptiler.com/maps/streets/{z}/{x}/{y}.png?key=abc",
        attribution: "&copy; MapTiler",
      },
    ]),
  );
  assert.equal(list.length, 1);
  assert.equal(list[0].id, "maptiler");
  assert.equal(list[0].subdomains, undefined);
  assert.match(list[0].attribution, /MapTiler/);
});

test("parseProviders rejects unusable entries instead of breaking the map", () => {
  assert.equal(tiles.parseProviders(""), null);
  assert.equal(tiles.parseProviders("   "), null);
  assert.equal(tiles.parseProviders("not json"), null);
  assert.equal(tiles.parseProviders('{"id":"one"}'), null);
  assert.equal(
    tiles.parseProviders(
      JSON.stringify([
        { id: "plain", url: "http://insecure.test/{z}/{x}/{y}.png" },
      ]),
    ),
    null,
    "tiles must be fetched over HTTPS",
  );
  assert.equal(
    tiles.parseProviders(
      JSON.stringify([{ id: "flat", url: "https://example.test/map.png" }]),
    ),
    null,
    "a template without {z} cannot serve tiles",
  );
  const list = tiles.parseProviders(
    JSON.stringify([
      { id: "bad", url: "http://x.test/{z}" },
      { id: "good", url: "https://y.test/{z}/{x}/{y}.png", subdomains: "abc" },
    ]),
  );
  assert.equal(list.length, 1);
  assert.equal(list[0].id, "good");
  assert.equal(list[0].subdomains, "abc");
  assert.match(list[0].attribution, /openstreetmap\.org\/copyright/);
});

test("built-in providers meet the OpenStreetMap tile policy", () => {
  for (const provider of tiles.DEFAULT_PROVIDERS) {
    assert.match(provider.url, /^https:\/\//, "HTTPS only");
    assert.match(provider.attribution, /openstreetmap\.org\/copyright/);
    assert.match(
      provider.attribution,
      /openstreetmap\.org\/fixthemap/,
      "the policy recommends a 'report a map issue' link",
    );
  }
  const osm = tiles.DEFAULT_PROVIDERS.find((provider) => provider.id === "osm");
  assert.equal(
    osm.url,
    "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    "the policy requires this exact URL form, with no subdomains",
  );
  assert.equal(osm.subdomains, undefined);
});

const LICENSED = JSON.stringify([
  {
    id: "maptiler",
    url: "https://api.maptiler.com/maps/streets/{z}/{x}/{y}.png?key=abc",
    attribution: "&copy; MapTiler",
  },
]);

test("providersFromEnv prefers the Next-style variable over the Vite one", () => {
  const list = tiles.providersFromEnv(
    LICENSED,
    JSON.stringify([{ id: "vite-only", url: "https://v.test/{z}/{x}/{y}.png" }]),
  );
  assert.equal(list.length, 1);
  assert.equal(list[0].id, "maptiler");
});

test("providersFromEnv falls back to the Vite variable", () => {
  const list = tiles.providersFromEnv(
    undefined,
    JSON.stringify([{ id: "vite-only", url: "https://v.test/{z}/{x}/{y}.png" }]),
  );
  assert.equal(list[0].id, "vite-only");
});

test("providersFromEnv ignores unusable configuration", () => {
  // A typo must degrade to working tiles, never to a blank map.
  assert.deepEqual(tiles.providersFromEnv("not json", "also bad"), tiles.DEFAULT_PROVIDERS);
  assert.deepEqual(tiles.providersFromEnv(), tiles.DEFAULT_PROVIDERS);
  // An invalid Next-style value still lets a valid Vite value through.
  const list = tiles.providersFromEnv(
    "not json",
    JSON.stringify([{ id: "vite-only", url: "https://v.test/{z}/{x}/{y}.png" }]),
  );
  assert.equal(list[0].id, "vite-only");
});

test("NEXT_PUBLIC_TILE_PROVIDERS is read from the environment", async () => {
  const previous = process.env.NEXT_PUBLIC_TILE_PROVIDERS;
  process.env.NEXT_PUBLIC_TILE_PROVIDERS = LICENSED;
  try {
    // A fresh bundle is a fresh module instance, so the module-level constant
    // is recomputed — this proves the wiring, not just the parser.
    const configured = await load("../app/lib/tiles.ts");
    assert.equal(configured.TILE_PROVIDERS.length, 1);
    assert.equal(configured.TILE_PROVIDERS[0].id, "maptiler");
    assert.equal(configured.DEFAULT_PROVIDERS.length, 3, "built-ins stay intact");
  } finally {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_TILE_PROVIDERS;
    else process.env.NEXT_PUBLIC_TILE_PROVIDERS = previous;
  }
});



