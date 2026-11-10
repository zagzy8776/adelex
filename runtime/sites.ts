import { env } from "cloudflare:workers";
export const sitesHost: boolean = true;
export function serverValue(key: string) {
  return (env as unknown as Record<string, string | undefined>)[key];
}
