// Default server runtime for native Next.js. Vite selects sites.ts for the existing Worker.
export const sitesHost: boolean = false;
export function serverValue(key: string) {
  return process.env[key];
}
