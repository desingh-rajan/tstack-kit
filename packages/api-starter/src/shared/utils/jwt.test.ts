/**
 * Tests for JWT utility functions
 *
 * Tests createToken, verifyToken, and extractTokenFromHeader.
 * The module-level initialization (secret loading, env checks) runs on import.
 */

import { assertEquals, assertRejects } from "@std/assert";
import { createToken, extractTokenFromHeader, verifyToken } from "./jwt.ts";

Deno.test("createToken and verifyToken", async (t) => {
  await t.step("creates a valid JWT and verifies it", async () => {
    const payload = { userId: 42, email: "test@example.com" };
    const token = await createToken(payload);

    assertEquals(typeof token, "string");
    assertEquals(token.split(".").length, 3); // header.payload.signature

    const decoded = await verifyToken(token);
    assertEquals(decoded.userId, 42);
    assertEquals(decoded.email, "test@example.com");
  });

  await t.step("preserves numeric userId exactly", async () => {
    const payload = { userId: 999999, email: "big@id.com" };
    const token = await createToken(payload);
    const decoded = await verifyToken(token);

    assertEquals(decoded.userId, 999999);
  });

  await t.step("rejects tampered token", async () => {
    const token = await createToken({
      userId: 1,
      email: "legit@example.com",
    });

    // Corrupt the signature portion
    const tampered = token.slice(0, -5) + "XXXXX";

    await assertRejects(
      () => verifyToken(tampered),
      Error,
      "Invalid token",
    );
  });

  await t.step("rejects garbage string", async () => {
    await assertRejects(
      () => verifyToken("not.a.jwt"),
      Error,
      "Invalid token",
    );
  });

  await t.step("rejects empty string", async () => {
    await assertRejects(
      () => verifyToken(""),
      Error,
      "Invalid token",
    );
  });
});

Deno.test("extractTokenFromHeader", async (t) => {
  await t.step("extracts token from valid Bearer header", () => {
    const token = extractTokenFromHeader("Bearer abc123");
    assertEquals(token, "abc123");
  });

  await t.step("returns null for undefined header", () => {
    assertEquals(extractTokenFromHeader(undefined), null);
  });

  await t.step("returns null for empty string", () => {
    assertEquals(extractTokenFromHeader(""), null);
  });

  await t.step("returns null for non-Bearer scheme", () => {
    assertEquals(extractTokenFromHeader("Basic abc123"), null);
  });

  await t.step("returns null for Bearer without token", () => {
    assertEquals(extractTokenFromHeader("Bearer"), null);
  });

  await t.step("returns null for extra segments", () => {
    assertEquals(extractTokenFromHeader("Bearer abc 123"), null);
  });

  await t.step("is case-sensitive for Bearer prefix", () => {
    assertEquals(extractTokenFromHeader("bearer abc123"), null);
    assertEquals(extractTokenFromHeader("BEARER abc123"), null);
  });
});
