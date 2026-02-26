/**
 * isSafeRedirect Tests
 *
 * Validates the open-redirect prevention helper.
 * Run manually: deno test --allow-all lib/auth.test.ts
 */

import { assertEquals } from "@std/assert";
import { isSafeRedirect } from "./auth.ts";

Deno.test("isSafeRedirect - allows relative paths", () => {
  assertEquals(isSafeRedirect("/dashboard"), true);
  assertEquals(isSafeRedirect("/orders/123"), true);
  assertEquals(isSafeRedirect("/auth/login?next=/foo"), true);
  assertEquals(isSafeRedirect("/a/b/c/d"), true);
});

Deno.test("isSafeRedirect - allows root", () => {
  assertEquals(isSafeRedirect("/"), true);
});

Deno.test("isSafeRedirect - blocks protocol-relative URLs", () => {
  assertEquals(isSafeRedirect("//evil.com"), false);
  assertEquals(isSafeRedirect("//evil.com/path"), false);
});

Deno.test("isSafeRedirect - blocks absolute URLs", () => {
  assertEquals(isSafeRedirect("https://evil.com"), false);
  assertEquals(isSafeRedirect("http://evil.com"), false);
  assertEquals(isSafeRedirect("ftp://evil.com"), false);
});

Deno.test("isSafeRedirect - blocks javascript: protocol", () => {
  assertEquals(isSafeRedirect("javascript:alert(1)"), false);
});

Deno.test("isSafeRedirect - blocks data: protocol", () => {
  assertEquals(
    isSafeRedirect("data:text/html,<script>alert(1)</script>"),
    false,
  );
});

Deno.test("isSafeRedirect - blocks empty string", () => {
  assertEquals(isSafeRedirect(""), false);
});

Deno.test("isSafeRedirect - blocks backslash URLs", () => {
  assertEquals(isSafeRedirect("\\/\\/evil.com"), false);
  assertEquals(isSafeRedirect("\\evil.com"), false);
  assertEquals(isSafeRedirect("/path\\..\\.."), false);
});
