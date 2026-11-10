import { notifyCustomer } from "@/app/lib/mail/queue";
import { getDb } from "@/db";
import { requests } from "@/db/schema";
import { handle, json, assertOrigin, body, rateLimit } from "@/app/lib/server";
import { requestSchema } from "@/app/lib/domain";
export async function POST(request: Request) {
  return handle(async () => {
    assertOrigin(request);
    await rateLimit(request, "quote", 5, 3600);
    const { website, ...data } = requestSchema.parse(await body(request));
    const id = "REQ-" + crypto.randomUUID().slice(0, 8).toUpperCase();
    await getDb()
      .insert(requests)
      .values({
        ...data,
        id,
        status: "new",
        createdAt: new Date().toISOString(),
      });
    await notifyCustomer({ requestId: id });
    return json({ id }, 201);
  });
}
