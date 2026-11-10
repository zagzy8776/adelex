import { and, asc, desc, eq, inArray, lte, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { emailOutbox, shipments } from "@/db/schema";
import { serverValue } from "@/runtime/host";
import { emailMessage, type MailDetails } from "./message";

export function emailConfigured() {
  return !!(serverValue("RESEND_API_KEY") && serverValue("EMAIL_FROM"));
}
type Job = typeof emailOutbox.$inferSelect;
async function deliver(job: Job) {
  const db = getDb(),
    lease = crypto.randomUUID(),
    now = Date.now();
  // A conditional lease lets dispatch, cron and request handlers safely share the same queue.
  const [claim] = await db
    .update(emailOutbox)
    .set({
      status: "sending",
      lease,
      nextAttempt: new Date(now + 120000).toISOString(),
      attempts: sql`${emailOutbox.attempts}+1`,
    })
    .where(
      and(
        eq(emailOutbox.id, job.id),
        inArray(emailOutbox.status, ["pending", "sending"]),
        lte(emailOutbox.nextAttempt, new Date(now).toISOString()),
      ),
    )
    .returning();
  if (!claim) return;
  const finish = (
    status: string,
    lastError: string | null,
    providerId: string | null = null,
    next = now,
  ) =>
    db
      .update(emailOutbox)
      .set({
        status,
        lastError,
        providerId,
        lease: null,
        nextAttempt: new Date(next).toISOString(),
      })
      .where(and(eq(emailOutbox.id, claim.id), eq(emailOutbox.lease, lease)));
  if (now - Date.parse(claim.createdAt) > 23 * 3600000) {
    await finish("expired", "Update is over 23 hours old.");
    return;
  }
  const details = JSON.parse(claim.payload) as MailDetails;
  if (claim.shipmentId) {
    const [s] = await db
      .select({ email: shipments.recipientEmail, code: shipments.code })
      .from(shipments)
      .where(eq(shipments.id, claim.shipmentId))
      .limit(1);
    if (
      !s ||
      s.email.trim().toLowerCase() !== claim.recipient ||
      s.code !== details.reference
    ) {
      await finish("superseded", "Recipient or tracking link changed.");
      return;
    }
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      signal: AbortSignal.timeout(6000),
      headers: {
        Authorization: "Bearer " + serverValue("RESEND_API_KEY"),
        "Content-Type": "application/json",
        "Idempotency-Key": "adexec/" + claim.id,
      },
      body: JSON.stringify({
        from: serverValue("EMAIL_FROM"),
        to: [claim.recipient],
        ...(serverValue("EMAIL_REPLY_TO")
          ? { reply_to: serverValue("EMAIL_REPLY_TO") }
          : {}),
        ...emailMessage(claim.kind, details),
      }),
    });
    if (res.ok) {
      const data = (await res.json()) as { id?: string };
      if (!data.id) throw Error();
      await finish("accepted", null, data.id);
      return;
    }
    const retry =
      res.status >= 500 || [403, 401, 408, 429].includes(res.status);
    await finish(
      retry && claim.attempts < 6 ? "pending" : "failed",
      "Provider HTTP " + res.status,
      null,
      now + Math.min(3600000, 60000 * 2 ** claim.attempts),
    );
  } catch {
    await finish(
      claim.attempts < 6 ? "pending" : "failed",
      "Email service unavailable",
      null,
      now + Math.min(3600000, 60000 * 2 ** claim.attempts),
    );
  }
}
export async function processMail(
  scope?: { shipmentId?: string; requestId?: string },
  limit = 6,
) {
  if (!emailConfigured()) return { configured: false, checked: 0 };
  const db = getDb(),
    due = new Date().toISOString();
  await db
    .update(emailOutbox)
    .set({
      status: "expired",
      lastError: "Update is over 23 hours old.",
      lease: null,
    })
    .where(
      and(
        inArray(emailOutbox.status, ["pending", "sending"]),
        lte(
          emailOutbox.createdAt,
          new Date(Date.now() - 23 * 3600000).toISOString(),
        ),
      ),
    );
  const filter = scope?.shipmentId
    ? eq(emailOutbox.shipmentId, scope.shipmentId)
    : scope?.requestId
      ? eq(emailOutbox.id, "request:" + scope.requestId)
      : undefined;
  const jobs = await db
    .select()
    .from(emailOutbox)
    .where(
      and(
        filter,
        inArray(emailOutbox.status, ["pending", "sending"]),
        lte(emailOutbox.nextAttempt, due),
      ),
    )
    .orderBy(asc(emailOutbox.createdAt), asc(emailOutbox.id))
    .limit(limit);
  for (const job of jobs) await deliver(job);
  return { configured: true, checked: jobs.length };
}
// An email outage must never roll back a successful booking or imply it failed.
export async function notifyCustomer(scope: {
  shipmentId?: string;
  requestId?: string;
}) {
  try {
    await processMail(scope, 2);
  } catch {
    console.error("Customer email queued for retry");
  }
}
export async function mailOverview() {
  const db = getDb();
  return {
    configured: emailConfigured(),
    rows: await db
      .select({
        id: emailOutbox.id,
        kind: emailOutbox.kind,
        recipient: emailOutbox.recipient,
        status: emailOutbox.status,
        createdAt: emailOutbox.createdAt,
        lastError: emailOutbox.lastError,
      })
      .from(emailOutbox)
      .orderBy(desc(emailOutbox.createdAt))
      .limit(25),
  };
}
