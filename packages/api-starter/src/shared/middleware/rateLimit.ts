import { Context, Next } from "hono";
import { ApiResponse } from "../utils/response.ts";

/**
 * Rate Limiting Configuration
 */
export interface RateLimitOptions {
  /** Time window in milliseconds */
  windowMs: number;
  /** Maximum requests per window */
  max: number;
  /** Custom message when rate limit exceeded */
  message?: string;
  /** Skip rate limiting for certain requests */
  skip?: (c: Context) => boolean | Promise<boolean>;
  /** Custom key generator (default: IP address) */
  keyGenerator?: (c: Context) => string;
}

/**
 * In-memory rate limit store
 * For production with multiple instances, use Redis instead
 */
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();
const RATE_LIMIT_MAX_ENTRIES = 10_000;

// Clean up expired entries periodically (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Get client IP address from request
 */
function getClientIp(c: Context): string {
  // Check common proxy headers
  const forwarded = c.req.header("x-forwarded-for");
  if (forwarded) {
    // Take the first IP in the list (original client)
    return forwarded.split(",")[0].trim();
  }

  const realIp = c.req.header("x-real-ip");
  if (realIp) {
    return realIp;
  }

  // Fallback - in Hono, we don't have direct socket access
  // This will be "unknown" in most cases without proxy headers
  return "unknown";
}

/**
 * Rate Limiting Middleware Factory
 *
 * Creates a rate limiter with configurable window and max requests.
 * Uses in-memory store by default (suitable for single-instance deployments).
 *
 * @example
 * // Basic usage - 100 requests per 15 minutes
 * app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
 *
 * @example
 * // Contact form - 3 requests per 10 minutes
 * app.post('/contact', rateLimit({
 *   windowMs: 10 * 60 * 1000,
 *   max: 3,
 *   message: 'Too many submissions. Please try again later.'
 * }));
 *
 * @example
 * // Skip rate limiting for authenticated users
 * app.use(rateLimit({
 *   windowMs: 60 * 1000,
 *   max: 10,
 *   skip: (c) => !!c.get('user')
 * }));
 */
export function rateLimit(options: RateLimitOptions) {
  const {
    windowMs,
    max,
    message = "Too many requests, please try again later.",
    skip,
    keyGenerator = getClientIp,
  } = options;

  return async (c: Context, next: Next) => {
    // Check if we should skip rate limiting
    if (skip) {
      const shouldSkip = await skip(c);
      if (shouldSkip) {
        return next();
      }
    }

    const key = keyGenerator(c);
    const now = Date.now();

    // Get or create rate limit entry
    let entry = rateLimitStore.get(key);

    if (!entry || entry.resetTime < now) {
      // Evict oldest entries if store is at capacity
      if (rateLimitStore.size >= RATE_LIMIT_MAX_ENTRIES) {
        const firstKey = rateLimitStore.keys().next().value;
        if (firstKey !== undefined) rateLimitStore.delete(firstKey);
      }
      // Create new entry or reset expired one
      entry = {
        count: 1,
        resetTime: now + windowMs,
      };
      rateLimitStore.set(key, entry);
    } else {
      // Increment existing entry
      entry.count++;
    }

    // Set rate limit headers
    const remaining = Math.max(0, max - entry.count);
    const resetSeconds = Math.ceil((entry.resetTime - now) / 1000);

    c.header("X-RateLimit-Limit", String(max));
    c.header("X-RateLimit-Remaining", String(remaining));
    c.header("X-RateLimit-Reset", String(resetSeconds));

    // Check if rate limit exceeded
    if (entry.count > max) {
      c.header("Retry-After", String(resetSeconds));
      return c.json(
        ApiResponse.error(message),
        429,
      );
    }

    return next();
  };
}

/**
 * Reset rate limit for a specific key (useful for testing or admin actions)
 */
export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key);
}

/**
 * Clear all rate limit entries (useful for testing)
 */
export function clearRateLimits(): void {
  rateLimitStore.clear();
}
