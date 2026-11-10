// Run with DATABASE_URL set to a Neon test database:
// node tests/customer-tracking.mjs
// Every run uses an isolated schema and removes only that schema on completion.
import assert from "node:assert/strict";
import { randomUUID, randomBytes } from "node:crypto";
import { mkdir, readFile, mkdtemp, rm } from "node:fs/promises";
import { build } from "esbuild";
import { neon } from "@neondatabase/serverless";
delete process.env.RESEND_API_KEY;
const client = neon(process.env.DATABASE_URL);
const schema = "adexec_qa_" + randomUUID().replaceAll("-", "");
const journal = JSON.parse(
  await readFile("postgres/meta/_journal.json", "utf8"),
);
const sql = (
  await Promise.all(
    journal.entries.map((e) => readFile("postgres/" + e.tag + ".sql", "utf8")),
  )
).join("\n--> statement-breakpoint\n");
await mkdir("work", { recursive: true });
const tmp = await mkdtemp("work/qa-");
const file = tmp + "/api.mjs";
const queries = [
  "CREATE SCHEMA " + schema,
  ...sql.replaceAll('"adexec"', schema).split("--> statement-breakpoint"),
];
await client.transaction(queries.map((q) => client.query(q)));
try {
  process.env.ADMIN_OWNER_EMAIL = "dispatch@example.test";
  process.env.ADMIN_ACCESS_KEY = randomBytes(32).toString("hex");
  globalThis.testCookie = "";
  globalThis.testHeaders = new Headers({
    "oai-authenticated-user-email": "dispatch@example.test",
    "oai-authenticated-user-id": "forged",
  });
  await build({
    stdin: {
      resolveDir: process.cwd(),
      contents: `export * as admin from './app/api/admin/route';export * as tracking from './app/api/track/route';export * as session from './app/api/admin/session/route';export * as domain from './app/lib/domain';`,
    },
    bundle: true,
    platform: "node",
    format: "esm",
    outfile: file,
    plugins: [
      {
        name: "isolated-test",
        setup(b) {
          b.onLoad({ filter: /db\/schema\.ts$/ }, async (a) => ({
            loader: "ts",
            contents: (await readFile(a.path, "utf8")).replace(
              'pgSchema("adexec")',
              'pgSchema("' + schema + '")',
            ),
          }));
          b.onResolve({ filter: /^next\/(headers|navigation)$/ }, (a) => ({
            path: a.path,
            namespace: "fixture",
          }));
          b.onLoad({ filter: /.*/, namespace: "fixture" }, ({ path }) => ({
            contents:
              path === "next/headers"
                ? "export const headers=async()=>globalThis.testHeaders;export const cookies=async()=>({get:()=>({value:globalThis.testCookie})});"
                : 'export const redirect=()=>{throw Error("redirect");};',
            loader: "js",
          }));
        },
      },
    ],
  });
  const { admin, tracking, session, domain } = await import(
    new URL("../" + file, import.meta.url)
  );
  const request = (path, body) =>
    new Request(
      "https://shipping.test" + path,
      body === undefined
        ? {}
        : {
            method: "POST",
            headers: {
              origin: "https://shipping.test",
              "content-type": "application/json",
            },
            body: JSON.stringify(body),
          },
    );
  const post = async (route, data, status) => {
    const res = await route.POST(request("/api", data));
    const body = await res.json();
    assert.equal(res.status, status, body.error);
    return body;
  };
  const read = async (code, status = 200) => {
    const r = await tracking.GET(
      request("/api/track?code=" + encodeURIComponent(code)),
    );
    assert.equal(r.status, status);
    return (await r.json()).shipment;
  };
  assert.equal((await admin.GET(request("/api/admin"))).status, 401);
  await post(session, { key: "invalid" }, 401);
  const login = await session.POST(
    request("/api/admin/session", { key: process.env.ADMIN_ACCESS_KEY }),
  );
  assert.equal(login.status, 200);
  globalThis.testCookie = login.headers
    .get("set-cookie")
    .split(";")[0]
    .split("=")[1];
  assert.equal((await admin.GET(request("/api/admin"))).status, 200);
  const booking = {
    recipientName: "Recipient A",
    recipientEmail: "a@example.test",
    description: "Cargo A",
    service: "Road freight",
    origin: "Rotterdam",
    destination: "Brussels",
    originLat: 51.92,
    originLng: 4.48,
    destinationLat: 50.85,
    destinationLng: 4.35,
    weight: 10,
    pieces: 1,
  };
  const [a, b] = await Promise.all([
    post(admin, { action: "create", data: booking }, 201),
    post(
      admin,
      {
        action: "create",
        data: {
          ...booking,
          description: "Cargo B",
          recipientEmail: "b@example.test",
        },
      },
      201,
    ),
  ]);
  assert.notEqual(a.code, b.code);
  assert.match(a.code, /^ADX-(?:[0-9A-Z]{5}-){3}[0-9A-Z]{5}$/);
  assert(domain.validCode("ADX-0123456789ABCDEF1234"));
  const before = await read(b.code);
  await post(
    admin,
    {
      action: "update",
      id: a.id,
      data: {
        status: "in_transit",
        location: "Antwerp, Belgium",
        note: "Arrived at transfer depot",
        lat: 51.2194,
        lng: 4.4025,
        eta: "",
      },
    },
    200,
  );
  const after = await read(a.code);
  assert.equal(after.currentLocation, "Antwerp, Belgium");
  assert.equal(after.events[0].note, "Arrived at transfer depot");
  assert.equal(after.description, "Cargo A");
  assert.deepEqual(await read(b.code), before);
  for (const key of [
    "id",
    "recipientName",
    "recipientEmail",
    "recipientPhone",
    "driverTokenHash",
  ])
    assert(!(key in after));
  assert(after.events.every((e) => !("shipmentId" in e)));
  await read(a.code.slice(0, -1), 404);
  const replacement = await post(
    admin,
    { action: "replace-code", id: a.id, previousCode: a.code },
    200,
  );
  await read(a.code, 404);
  assert.equal(
    (await read(replacement.code)).currentLocation,
    "Antwerp, Belgium",
  );
  console.log(
    "Passed: two separate shipments, dispatch update visible only on the matching reference, private fields excluded, legacy format accepted, old link revoked, forged headers rejected, administrator login verified.",
  );
} finally {
  await client.query("DROP SCHEMA " + schema + " CASCADE");
  await rm(tmp, { recursive: true, force: true });
}
