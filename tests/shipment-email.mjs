// Exercises the real PostgreSQL triggers and email worker without sending email.
import assert from "node:assert/strict";
import { readFile, mkdir, mkdtemp, rm } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import path from "node:path";
import { build } from "esbuild";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";

const pg = new PGlite();
await mkdir("work", { recursive: true });
const tmp = await mkdtemp("work/email-");
try {
  await pg.exec("CREATE SCHEMA adexec;");
  for (const name of ["0000_long_iron_patriot", "0001_dashing_the_renegades"])
    await pg.exec(await readFile("postgres/" + name + ".sql", "utf8"));
  globalThis.mailTestDb = drizzle(pg);
  const outfile = path.resolve(tmp, "worker.mjs");
  await build({
    entryPoints: ["app/lib/mail/queue.ts"],
    bundle: true,
    outfile,
    platform: "node",
    format: "esm",
    plugins: [
      {
        name: "database",
        setup(b) {
          b.onResolve({ filter: /^@\/db$/ }, () => ({
            path: "db",
            namespace: "mock",
          }));
          b.onLoad({ filter: /.*/, namespace: "mock" }, () => ({
            contents: "export const getDb=()=>globalThis.mailTestDb;",
          }));
        },
      },
    ],
  });
  const { processMail } = await import(pathToFileURL(outfile));
  const query = async (sql, params = []) => (await pg.query(sql, params)).rows;
  const queued = () =>
    query("SELECT * FROM adexec.email_outbox ORDER BY created_at,id");
  const shipment = async (id, email) =>
    query(
      "INSERT INTO adexec.shipments(id,code,recipient_name,recipient_email,description,service,origin,destination,origin_lat,origin_lng,destination_lat,destination_lng,current_lat,current_lng,current_location,location_updated_at,created_at,updated_at) SELECT $1,$2,'Private name',$3,'Private cargo','Road freight','Pickup','Destination',1,1,2,2,1,1,'Pickup','t','t','t'",
      [id, "ADX-" + id, email],
    );
  const event = async (id, shipmentId, status, location, note) =>
    query(
      "INSERT INTO adexec.events(id,shipment_id,status,location,note,lat,lng,created_at) VALUES ($1,$2,$3,$4,$5,1,2,'2026-11-01T00:00:00Z')",
      [id, shipmentId, status, location, note],
    );
  await shipment("A", "first@example.test");
  await shipment("B", "second@example.test");
  await shipment("C", "");
  await event("a1", "A", "booked", "Pickup", "Shipment booking confirmed.");
  await event("c1", "C", "booked", "Pickup", "Shipment booking confirmed.");
  await query(
    "UPDATE adexec.shipments SET current_lat=3,location_source='gps' WHERE id='A'",
  );
  assert.equal((await queued()).length, 1);
  delete process.env.RESEND_API_KEY;
  assert.equal((await processMail()).configured, false);
  process.env.RESEND_API_KEY = "fixture";
  process.env.EMAIL_FROM = "ADEXEC <dispatch@example.test>";
  const messages = [];
  let failedOnce = true;
  globalThis.fetch = async (url, options) => {
    assert.equal(url, "https://api.resend.com/emails");
    messages.push({
      data: JSON.parse(options.body),
      key: options.headers["Idempotency-Key"],
    });
    return failedOnce
      ? ((failedOnce = false), new Response("{}", { status: 429 }))
      : Response.json({ id: "provider-id" });
  };
  await processMail();
  assert.equal((await queued())[0].status, "pending");
  await query("UPDATE adexec.email_outbox SET next_attempt='2000'");
  await Promise.all([processMail(), processMail()]);
  assert.equal(messages.length, 2);
  assert.deepEqual(messages[0], messages[1]);
  assert.equal((await queued())[0].status, "accepted");
  assert.deepEqual(messages[0].data.to, ["first@example.test"]);
  assert(!messages[0].data.text.includes("Private cargo"));
  await event("a2", "A", "in_transit", "Hub <A>", "Departed");
  await processMail();
  assert(messages.at(-1).data.html.includes("Hub &lt;A&gt;"));
  assert(messages.at(-1).data.text.includes("/track?code=ADX-A"));
  await event("b2", "B", "delivered", "Destination", "Delivered");
  await query(
    "UPDATE adexec.shipments SET recipient_email='changed@example.test' WHERE id='B'",
  );
  await processMail();
  assert(!messages.some((m) => m.data.to.includes("second@example.test")));
  assert((await queued()).some((q) => q.status === "superseded"));
  await query(
    "INSERT INTO adexec.requests(id,name,email,phone,origin,destination,service,description,weight,created_at) VALUES ('REQ-A','Sender','sender@example.test','00000','A','B','Air freight','Private',1,'t')",
  );
  await processMail();
  const quote = messages.find((m) => m.data.to.includes("sender@example.test"));
  assert(quote.data.text.includes("REQ-A"));
  assert(!quote.data.text.includes("/track?"));
  await query("UPDATE adexec.shipments SET code='ADX-NEW' WHERE id='A'");
  await processMail();
  assert(messages.at(-1).data.text.includes("/track?code=ADX-NEW"));
  console.log(
    "PASS: booking, request receipt, milestone, new link, GPS suppression, recipient isolation, HTML escaping, concurrent claims and retry idempotency.",
  );
} finally {
  await pg.close();
  await rm(tmp, { recursive: true, force: true });
}
