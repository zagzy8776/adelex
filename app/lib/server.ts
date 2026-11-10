import { serverValue, sitesHost } from "@/runtime/host";
import { eq, lt, sql } from "drizzle-orm";
import { ZodError } from "zod";
import { getDb } from "@/db";
import { admins, rateLimits } from "@/db/schema";
import { getChatGPTUser } from "@/app/chatgpt-auth";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
export async function handle(fn: () => Promise<Response>) {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof HttpError) return json({ error: e.message }, e.status);
    if (e instanceof ZodError)
      return json(
        {
          error: e.issues
            .map((i) => `${i.path.join(".")}: ${i.message}`)
            .join("; "),
        },
        400,
      );
    if (e instanceof SyntaxError)
      return json({ error: "Invalid request body." }, 400);
    console.error(
      "Shipment request failed",
      e instanceof Error ? e.name : "Error",
    );
    return json(
      { error: "We could not complete this request. Please try again." },
      500,
    );
  }
}
export function assertOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin)
    throw new HttpError(
      403,
      "This action must be submitted from this website.",
    );
}
export async function body(request: Request) {
  if (Number(request.headers.get("content-length") || 0) > 24000)
    throw new HttpError(413, "Request is too large.");
  const text = await request.text();
  if (text.length > 24000) throw new HttpError(413, "Request is too large.");
  return JSON.parse(text);
}
export async function adminState() {
  const user = await getChatGPTUser();
  if (!user) return { user: null, authorized: false, canClaim: false };
  if (!sitesHost) return { user, authorized: true, canClaim: false };
  const ownerEmail = serverValue("ADMIN_OWNER_EMAIL");
  const db = getDb();
  const owner = await db
    .select()
    .from(admins)
    .where(eq(admins.id, "owner"))
    .limit(1)
    .then((rows) => rows[0]);
  return {
    user,
    authorized: owner?.userId === user.userId,
    canClaim:
      !owner &&
      !!ownerEmail &&
      ownerEmail.trim().toLowerCase() === user.email.trim().toLowerCase(),
  };
}
export async function requireAdmin() {
  const state = await adminState();
  if (!state.user)
    throw new HttpError(
      401,
      "Please sign in to access the operations dashboard.",
    );
  if (!state.authorized)
    throw new HttpError(
      403,
      "This account does not have administrator access.",
    );
  return state.user;
}
export async function hash(value: string) {
  const bytes = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(bytes), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
}
export async function rateLimit(
  request: Request,
  scope: string,
  max: number,
  windowSeconds: number,
) {
  const db = getDb();
  const now = Math.floor(Date.now() / 1000);
  const ip =
    (sitesHost
      ? request.headers.get("cf-connecting-ip")
      : request.headers.get("x-vercel-forwarded-for")?.split(",")[0]) ||
    "local";
  const key = scope + ":" + (await hash(ip));
  const [counter] = await db
    .insert(rateLimits)
    .values({ key, hits: 1, resetAt: now + windowSeconds })
    .onConflictDoUpdate({
      target: rateLimits.key,
      set: {
        hits: sql`CASE WHEN ${rateLimits.resetAt} <= ${now} THEN 1 ELSE ${rateLimits.hits}+1 END`,
        resetAt: sql`CASE WHEN ${rateLimits.resetAt} <= ${now} THEN ${now + windowSeconds} ELSE ${rateLimits.resetAt} END`,
      },
    })
    .returning({ hits: rateLimits.hits });
  if (counter.hits > max)
    throw new HttpError(
      429,
      "Too many requests. Please wait before trying again.",
    );
  if (Math.random() < 0.02)
    await db.delete(rateLimits).where(lt(rateLimits.resetAt, now));
}
