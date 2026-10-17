interface RateLimitRecord {
  count: number;
  resetTime: number;
}

// In-memory store (per-runtime instance)
const ipStore = new Map<string, RateLimitRecord>();

// Cleanup stale records periodically
let lastCleanup = Date.now();
function cleanupStaleRecords(now: number) {
  if (now - lastCleanup < 60000) return; // run at most once a minute
  lastCleanup = now;
  ipStore.forEach((record, ip) => {
    if (record.resetTime <= now) {
      ipStore.delete(ip);
    }
  });
}

/**
 * Checks in-memory per-IP rate limiting.
 * Default: 20 requests per minute per IP.
 */
export function checkRateLimit(
  request: Request,
  maxRequests = 20,
  windowMs = 60000
): { allowed: boolean; remaining: number; reset: number } {
  const now = Date.now();
  cleanupStaleRecords(now);

  // Extract client IP address
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = (forwardedFor ? forwardedFor.split(',')[0].trim() : null) || realIp || '127.0.0.1';

  const record = ipStore.get(ip);

  if (!record || record.resetTime <= now) {
    ipStore.set(ip, {
      count: 1,
      resetTime: now + windowMs,
    });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      reset: Math.ceil(windowMs / 1000),
    };
  }

  if (record.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      reset: Math.ceil((record.resetTime - now) / 1000),
    };
  }

  record.count += 1;
  return {
    allowed: true,
    remaining: maxRequests - record.count,
    reset: Math.ceil((record.resetTime - now) / 1000),
  };
}
