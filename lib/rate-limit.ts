import { headers } from "next/headers";

const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_PER_WINDOW = 5;

// Module-level Map persists for the lifetime of the Node.js process.
// Cleared on deploy/restart, which is acceptable for this use case.
const hits = new Map<string, number[]>();

export type RateLimitResult = { allowed: boolean; remaining: number };

export function checkRateLimit(ip: string): RateLimitResult {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    return { allowed: false, remaining: 0 };
  }
  recent.push(now);
  hits.set(ip, recent);
  return { allowed: true, remaining: MAX_PER_WINDOW - recent.length };
}

export async function getClientIp(): Promise<string> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  if (fwd) {
    const first = fwd.split(",")[0]?.trim();
    if (first) return first;
  }
  return h.get("x-real-ip") ?? "unknown";
}

export async function getUserAgent(): Promise<string | null> {
  const h = await headers();
  return h.get("user-agent") ?? null;
}
