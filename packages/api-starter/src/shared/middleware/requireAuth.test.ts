/**
 * Tests for requireAuth middleware
 *
 * Integration-level tests that verify authentication middleware behaviour
 * through the Hono app. Runs as part of the api-starter test suite
 * (requires database via _test_setup.ts).
 *
 * Uses /ts-admin/* routes which require authentication by default.
 */

import { describe, it } from "@std/testing/bdd";
import { assertEquals } from "@std/assert";
import { app } from "../../main.ts";

describe("requireAuth middleware", {
  sanitizeOps: false,
  sanitizeResources: false,
}, () => {
  it("rejects request with no Authorization header", async () => {
    const res = await app.request("/ts-admin/products");
    assertEquals(res.status, 401);
  });

  it("rejects request with empty Authorization header", async () => {
    const res = await app.request("/ts-admin/products", {
      headers: { Authorization: "" },
    });
    assertEquals(res.status, 401);
  });

  it("rejects request with non-Bearer scheme", async () => {
    const res = await app.request("/ts-admin/products", {
      headers: { Authorization: "Basic dXNlcjpwYXNz" },
    });
    assertEquals(res.status, 401);
  });

  it("rejects request with invalid JWT", async () => {
    const res = await app.request("/ts-admin/products", {
      headers: { Authorization: "Bearer invalid.jwt.token" },
    });
    assertEquals(res.status, 401);
  });

  it("rejects request with well-formed but unregistered JWT", async () => {
    const { createToken } = await import("../utils/jwt.ts");
    const token = await createToken({
      userId: 999999,
      email: "ghost@example.com",
    });

    const res = await app.request("/ts-admin/products", {
      headers: { Authorization: `Bearer ${token}` },
    });
    assertEquals(res.status, 401);
  });
});
