/**
 * Contact form server-side proxy
 * Forwards contact submissions to the backend API,
 * avoiding CORS issues and hiding the API URL from the client.
 */

import { define } from "@/utils.ts";
import { SSR_API_URL } from "@/lib/api.ts";

/** Simple in-memory rate limiter: max 5 submissions per IP per minute */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 5;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

export const handler = define.handlers({
  async POST(ctx) {
    try {
      // Rate limit by IP
      const ip = ctx.req.headers.get("x-forwarded-for") ??
        ctx.info.remoteAddr.hostname;
      if (isRateLimited(ip)) {
        return Response.json(
          { message: "Too many requests. Please try again later." },
          { status: 429 },
        );
      }

      const body = await ctx.req.json();

      // Server-side validation
      if (
        typeof body !== "object" || body === null ||
        typeof body.email !== "string" || !body.email.trim() ||
        typeof body.message !== "string" || !body.message.trim()
      ) {
        return Response.json(
          { message: "Email and message are required." },
          { status: 400 },
        );
      }

      const response = await fetch(`${SSR_API_URL}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      return new Response(JSON.stringify(data), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    } catch {
      return new Response(
        JSON.stringify({ message: "Failed to submit contact form" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
  },
});
