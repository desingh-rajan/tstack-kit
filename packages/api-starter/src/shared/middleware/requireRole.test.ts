/**
 * Tests for requireRole middleware
 *
 * Uses Hono test client to exercise role-based access control.
 * No database needed -- user is injected via a preceding middleware.
 */

import { assertEquals } from "@std/assert";
import { Hono } from "hono";
import {
  requireAdmin,
  requireModerator,
  requireRole,
  requireSuperadmin,
} from "./requireRole.ts";

// deno-lint-ignore no-explicit-any
type AppEnv = { Variables: { user: any } };

/**
 * Helper: create a Hono app that injects a fake user, applies requireRole,
 * and has a protected endpoint.
 */
function createRoleApp(
  allowedRoles: string[],
  fakeUser?: { role: string } | null,
) {
  const app = new Hono<AppEnv>();

  // Simulate requireAuth by setting user in context
  app.use("*", async (c, next) => {
    if (fakeUser !== undefined) {
      c.set("user", fakeUser);
    }
    await next();
  });

  app.get("/protected", requireRole(allowedRoles as never[]), (c) => {
    return c.json({ message: "allowed" });
  });

  // Global error handler to translate thrown ForbiddenError to JSON
  app.onError((err, c) => {
    const status = (err as { statusCode?: number }).statusCode || 500;
    return c.json({ message: err.message }, status as never);
  });

  return app;
}

Deno.test("requireRole middleware", async (t) => {
  await t.step("allows user with matching role", async () => {
    const app = createRoleApp(["admin"], { role: "admin" });
    const res = await app.request("/protected");
    assertEquals(res.status, 200);
    const body = await res.json();
    assertEquals(body.message, "allowed");
  });

  await t.step("allows user when one of multiple roles matches", async () => {
    const app = createRoleApp(["admin", "moderator"], { role: "moderator" });
    const res = await app.request("/protected");
    assertEquals(res.status, 200);
  });

  await t.step("rejects user with wrong role", async () => {
    const app = createRoleApp(["superadmin"], { role: "user" });
    const res = await app.request("/protected");
    assertEquals(res.status, 403);
  });

  await t.step("rejects when no user is set", async () => {
    const app = createRoleApp(["admin"], null);
    const res = await app.request("/protected");
    assertEquals(res.status, 403);
  });

  await t.step("rejects when user is undefined", async () => {
    // Don't set user at all
    const app = createRoleApp(["admin"]);
    const res = await app.request("/protected");
    assertEquals(res.status, 403);
  });
});

Deno.test("convenience role middlewares", async (t) => {
  function makeApp(
    middleware: ReturnType<typeof requireRole>,
    role: string,
  ) {
    const app = new Hono<AppEnv>();
    app.use("*", async (c, next) => {
      c.set("user", { role });
      await next();
    });
    app.get("/x", middleware, (c) => c.json({ ok: true }));
    app.onError((err, c) => {
      const status = (err as { statusCode?: number }).statusCode || 500;
      return c.json({ error: err.message }, status as never);
    });
    return app;
  }

  await t.step("requireSuperadmin allows superadmin", async () => {
    const res = await makeApp(requireSuperadmin, "superadmin").request("/x");
    assertEquals(res.status, 200);
  });

  await t.step("requireSuperadmin rejects admin", async () => {
    const res = await makeApp(requireSuperadmin, "admin").request("/x");
    assertEquals(res.status, 403);
  });

  await t.step("requireAdmin allows admin and superadmin", async () => {
    assertEquals(
      (await makeApp(requireAdmin, "admin").request("/x")).status,
      200,
    );
    assertEquals(
      (await makeApp(requireAdmin, "superadmin").request("/x")).status,
      200,
    );
    assertEquals(
      (await makeApp(requireAdmin, "user").request("/x")).status,
      403,
    );
  });

  await t.step("requireModerator allows moderator and above", async () => {
    assertEquals(
      (await makeApp(requireModerator, "moderator").request("/x")).status,
      200,
    );
    assertEquals(
      (await makeApp(requireModerator, "admin").request("/x")).status,
      200,
    );
    assertEquals(
      (await makeApp(requireModerator, "superadmin").request("/x")).status,
      200,
    );
    assertEquals(
      (await makeApp(requireModerator, "user").request("/x")).status,
      403,
    );
  });
});
