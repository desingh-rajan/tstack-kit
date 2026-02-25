/**
 * Tests for rate limiting middleware
 *
 * Tests the rateLimit factory, header injection, eviction, and reset helpers.
 * Uses Hono test client for realistic middleware testing.
 */

import { assertEquals } from "@std/assert";
import { Hono } from "hono";
import { clearRateLimits, rateLimit, resetRateLimit } from "./rateLimit.ts";

function createTestApp(options: Parameters<typeof rateLimit>[0]) {
  const app = new Hono();
  app.use("*", rateLimit(options));
  app.get("/test", (c) => c.text("ok"));
  return app;
}

Deno.test("rateLimit middleware", async (t) => {
  await t.step("allows requests under the limit", async () => {
    clearRateLimits();
    const app = createTestApp({ windowMs: 60_000, max: 5 });

    const res = await app.request("/test", {
      headers: { "x-forwarded-for": "10.0.0.1" },
    });

    assertEquals(res.status, 200);
    assertEquals(res.headers.get("X-RateLimit-Limit"), "5");
    assertEquals(res.headers.get("X-RateLimit-Remaining"), "4");
  });

  await t.step("blocks requests over the limit", async () => {
    clearRateLimits();
    const app = createTestApp({ windowMs: 60_000, max: 2 });

    // Use unique IP
    const headers = { "x-forwarded-for": "10.0.0.2" };

    await app.request("/test", { headers });
    await app.request("/test", { headers });
    const res = await app.request("/test", { headers });

    assertEquals(res.status, 429);
    const body = await res.json();
    assertEquals(body.status, "error");
  });

  await t.step("sets Retry-After header when rate limited", async () => {
    clearRateLimits();
    const app = createTestApp({ windowMs: 60_000, max: 1 });
    const headers = { "x-forwarded-for": "10.0.0.3" };

    await app.request("/test", { headers });
    const res = await app.request("/test", { headers });

    assertEquals(res.status, 429);
    const retryAfter = res.headers.get("Retry-After");
    assertEquals(retryAfter !== null, true);
  });

  await t.step("uses custom message", async () => {
    clearRateLimits();
    const app = createTestApp({
      windowMs: 60_000,
      max: 1,
      message: "Slow down!",
    });
    const headers = { "x-forwarded-for": "10.0.0.4" };

    await app.request("/test", { headers });
    const res = await app.request("/test", { headers });

    const body = await res.json();
    assertEquals(body.message, "Slow down!");
  });

  await t.step("skip function bypasses rate limiting", async () => {
    clearRateLimits();
    const app = createTestApp({
      windowMs: 60_000,
      max: 1,
      skip: (c) => c.req.header("x-skip") === "true",
    });
    const headers = { "x-forwarded-for": "10.0.0.5", "x-skip": "true" };

    // These should all succeed because skip returns true
    const res1 = await app.request("/test", { headers });
    const res2 = await app.request("/test", { headers });
    const res3 = await app.request("/test", { headers });

    assertEquals(res1.status, 200);
    assertEquals(res2.status, 200);
    assertEquals(res3.status, 200);
  });

  await t.step("custom keyGenerator overrides IP-based key", async () => {
    clearRateLimits();
    const app = createTestApp({
      windowMs: 60_000,
      max: 1,
      keyGenerator: (c) => c.req.header("x-api-key") || "anon",
    });

    // Different IPs but same API key - should be rate limited together
    const res1 = await app.request("/test", {
      headers: { "x-forwarded-for": "10.0.0.6", "x-api-key": "shared-key" },
    });
    const res2 = await app.request("/test", {
      headers: { "x-forwarded-for": "10.0.0.7", "x-api-key": "shared-key" },
    });

    assertEquals(res1.status, 200);
    assertEquals(res2.status, 429);
  });

  await t.step("different IPs are tracked independently", async () => {
    clearRateLimits();
    const app = createTestApp({ windowMs: 60_000, max: 1 });

    const res1 = await app.request("/test", {
      headers: { "x-forwarded-for": "10.0.0.20" },
    });
    const res2 = await app.request("/test", {
      headers: { "x-forwarded-for": "10.0.0.21" },
    });

    assertEquals(res1.status, 200);
    assertEquals(res2.status, 200);
  });
});

Deno.test("resetRateLimit", async (t) => {
  await t.step("allows requests again after reset", async () => {
    clearRateLimits();
    const app = createTestApp({ windowMs: 60_000, max: 1 });
    const headers = { "x-forwarded-for": "10.0.0.30" };

    await app.request("/test", { headers });
    const blocked = await app.request("/test", { headers });
    assertEquals(blocked.status, 429);

    resetRateLimit("10.0.0.30");

    const unblocked = await app.request("/test", { headers });
    assertEquals(unblocked.status, 200);
  });
});

Deno.test("clearRateLimits", async (t) => {
  await t.step("clears all rate limit state", async () => {
    const app = createTestApp({ windowMs: 60_000, max: 1 });
    const headers = { "x-forwarded-for": "10.0.0.40" };

    await app.request("/test", { headers });
    clearRateLimits();

    const res = await app.request("/test", { headers });
    assertEquals(res.status, 200);
  });
});
