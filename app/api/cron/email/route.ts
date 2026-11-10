import { serverValue } from "@/runtime/host";
import { handle, json, HttpError } from "@/app/lib/server";
import { processMail } from "@/app/lib/mail/queue";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
export async function GET(request: Request) {
  return handle(async () => {
    const key = serverValue("CRON_SECRET");
    if (!key || request.headers.get("authorization") !== "Bearer " + key)
      throw new HttpError(401, "Unauthorised.");
    return json(await processMail(undefined, 6));
  });
}
