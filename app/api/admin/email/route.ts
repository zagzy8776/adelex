import {
  handle,
  json,
  requireAdmin,
  assertOrigin,
  body,
  HttpError,
} from "@/app/lib/server";
import { mailOverview, processMail } from "@/app/lib/mail/queue";
import { getDb } from "@/db";
import { emailOutbox } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";
export const dynamic = "force-dynamic";
export async function GET() {
  return handle(async () => {
    await requireAdmin();
    return json(await mailOverview());
  });
}
export async function POST(request: Request) {
  return handle(async () => {
    assertOrigin(request);
    await requireAdmin();
    const input = await body(request);
    if (input.id) {
      const [row] = await getDb()
        .update(emailOutbox)
        .set({
          status: "pending",
          attempts: 0,
          nextAttempt: new Date().toISOString(),
          lastError: null,
        })
        .where(
          and(
            eq(emailOutbox.id, String(input.id)),
            eq(emailOutbox.status, "failed"),
            gt(
              emailOutbox.createdAt,
              new Date(Date.now() - 23 * 3600000).toISOString(),
            ),
          ),
        )
        .returning({ id: emailOutbox.id });
      if (!row)
        throw new HttpError(409, "Only recent failed messages can be retried.");
    }
    return json(await processMail());
  });
}
