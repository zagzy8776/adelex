import { serverValue, sitesHost } from "@/runtime/host";
export const adminCookie = "adexec_dispatch";
const lifetime = 8 * 60 * 60;
export function accessKey() {
  const key = serverValue("ADMIN_ACCESS_KEY");
  return !sitesHost && key && key.length >= 32 ? key : null;
}
async function sign(value: string) {
  const key = accessKey();
  if (!key) return null;
  const encoder = new TextEncoder();
  const signingKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return Array.from(
    new Uint8Array(
      await crypto.subtle.sign("HMAC", signingKey, encoder.encode(value)),
    ),
    (b) => b.toString(16).padStart(2, "0"),
  ).join("");
}
export async function matchesKey(candidate: string) {
  if (candidate.length < 32 || candidate.length > 512 || !accessKey())
    return false;
  const digest = async (s: string) =>
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)),
    );
  const [a, b] = await Promise.all([digest(candidate), digest(accessKey()!)]);
  return a.reduce((diff, byte, i) => diff | (byte ^ b[i]), 0) === 0;
}
export async function issueSession() {
  const payload =
    Math.floor(Date.now() / 1000) + lifetime + "." + crypto.randomUUID();
  return payload + "." + (await sign(payload));
}
export async function sessionValid(value: string) {
  const parts = value.split(".");
  if (
    parts.length !== 3 ||
    !/^\d+$/.test(parts[0]) ||
    !/^[-\da-f]{36}$/.test(parts[1]) ||
    !/^\w{64}$/.test(parts[2])
  )
    return false;
  const now = Math.floor(Date.now() / 1000),
    exp = Number(parts[0]);
  return (
    exp > now &&
    exp <= now + lifetime &&
    (await sign(parts[0] + "." + parts[1])) === parts[2]
  );
}
export function sessionCookie(value: string) {
  return (
    adminCookie +
    "=" +
    value +
    "; Path=/; HttpOnly; SameSite=Strict; Max-Age=" +
    (value ? lifetime : 0) +
    (process.env.NODE_ENV === "production" ? "; Secure" : "")
  );
}
