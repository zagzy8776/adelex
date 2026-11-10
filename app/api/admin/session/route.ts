import {
  assertOrigin,
  body,
  handle,
  HttpError,
  json,
  rateLimit,
} from "@/app/lib/server";
import {
  accessKey,
  issueSession,
  matchesKey,
  sessionCookie,
} from "@/app/lib/admin-session";
import { sitesHost, serverValue } from "@/runtime/host";
export async function POST(request: Request) {
  return handle(async () => {
    assertOrigin(request);
    if (sitesHost) throw new HttpError(404, "Unavailable.");
    const input = await body(request);
    if (input.action === "logout") {
      const response = json({ ok: true });
      response.headers.set("Set-Cookie", sessionCookie(""));
      return response;
    }
    if (!accessKey() || !serverValue("ADMIN_OWNER_EMAIL"))
      throw new HttpError(503, "Dispatch sign-in has not been configured.");
    await rateLimit(request, "admin-login", 8, 900);
    if (typeof input.key !== "string" || !(await matchesKey(input.key)))
      throw new HttpError(401, "The dispatch access key is incorrect.");
    const response = json({ ok: true });
    response.headers.set("Set-Cookie", sessionCookie(await issueSession()));
    return response;
  });
}
