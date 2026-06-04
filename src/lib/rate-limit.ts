/**
 * In-memory rate limiter.
 *
 * Two independent limits:
 *  - Per-IP:  max N requests per UTC day
 *  - Global:  max M requests per UTC day across all IPs
 *
 * Trade-off: resets on server restart and doesn't work across multiple
 * instances. Acceptable for a single-instance portfolio demo; production
 * would use Redis (e.g. Upstash) for persistence and multi-instance support.
 */

interface Bucket {
  count: number;
  day: number; // UTC day number (Math.floor(Date.now() / 86_400_000))
}

const ipBuckets = new Map<string, Bucket>();
let globalBucket: Bucket = { count: 0, day: 0 };

function today(): number {
  return Math.floor(Date.now() / 86_400_000);
}

function getOrReset(bucket: Bucket): Bucket {
  const d = today();
  return bucket.day === d ? bucket : { count: 0, day: d };
}

export interface RateLimitResult {
  allowed: boolean;
  reason?: "ip_limit" | "global_limit";
}

export function checkRateLimit(ip: string): RateLimitResult {
  const perIpLimit = Number(process.env.RATE_LIMIT_PER_IP ?? 20);
  const globalLimit = Number(process.env.RATE_LIMIT_GLOBAL ?? 500);

  // Check + increment global bucket first (cheaper rejection path).
  globalBucket = getOrReset(globalBucket);
  if (globalBucket.count >= globalLimit) {
    return { allowed: false, reason: "global_limit" };
  }

  // Check + increment per-IP bucket.
  const ipBucket = getOrReset(ipBuckets.get(ip) ?? { count: 0, day: 0 });
  if (ipBucket.count >= perIpLimit) {
    return { allowed: false, reason: "ip_limit" };
  }

  // Both checks passed — commit the increments.
  ipBucket.count += 1;
  ipBuckets.set(ip, ipBucket);
  globalBucket.count += 1;

  return { allowed: true };
}
