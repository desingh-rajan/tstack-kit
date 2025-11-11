import { assertEquals } from "@std/assert";
import { extractVersion, fetchLatestVersion } from "./versionFetcher.ts";

Deno.test("extractVersion - extracts version from JSR specifier", () => {
  const version = extractVersion("jsr:@std/dotenv@^0.225.0");
  assertEquals(version, "0.225.0");
});

Deno.test("extractVersion - extracts version from npm specifier", () => {
  const version = extractVersion("npm:jose@^5.9.6");
  assertEquals(version, "5.9.6");
});

Deno.test("extractVersion - extracts version with tilde", () => {
  const version = extractVersion("npm:zod@~3.23.0");
  assertEquals(version, "3.23.0");
});

Deno.test("extractVersion - returns 'latest' for invalid specifier", () => {
  const version = extractVersion("invalid-specifier");
  assertEquals(version, "latest");
});

Deno.test("fetchLatestVersion - returns fallback on network error", {
  sanitizeResources: false,
  sanitizeOps: false,
}, async () => {
  // Using a non-existent package to trigger fallback
  const version = await fetchLatestVersion(
    "npm",
    "this-package-definitely-does-not-exist-12345",
    "1.0.0",
  );
  assertEquals(version, "1.0.0");
});

Deno.test("fetchLatestVersion - fetches real version from npm", async () => {
  // Test with a real package - zod
  const version = await fetchLatestVersion("npm", "zod", "1.0.0");
  // Should get a version that's not the fallback and looks like a semver
  assertEquals(typeof version, "string");
  assertEquals(
    version !== "1.0.0",
    true,
    "Should fetch real version, not fallback",
  );
  // Version should match semver pattern (x.y.z)
  assertEquals(/^\d+\.\d+\.\d+/.test(version), true);
});

Deno.test("fetchLatestVersion - fetches real version from JSR", async () => {
  // Test with a real package - @std/dotenv
  const version = await fetchLatestVersion("jsr", "@std/dotenv", "0.1.0");
  // Should get a version that's not the fallback
  assertEquals(typeof version, "string");
  assertEquals(
    version !== "0.1.0",
    true,
    "Should fetch real version, not fallback",
  );
  // Version should match semver pattern
  assertEquals(/^\d+\.\d+\.\d+/.test(version), true);
});

Deno.test("fetchLatestVersion - caching works", async () => {
  // First call - fetches from network
  const version1 = await fetchLatestVersion("npm", "zod", "1.0.0");

  // Second call - should use cache (much faster)
  const cacheStartTime = Date.now();
  const version2 = await fetchLatestVersion("npm", "zod", "1.0.0");
  const cachedCallTime = Date.now() - cacheStartTime;

  // Both should return the same version
  assertEquals(version1, version2);

  // Cached call should be significantly faster (< 50ms vs potentially 100ms+)
  // Note: This is a loose check as timing can vary based on system load
  assertEquals(
    cachedCallTime < 50,
    true,
    `Cached call should be very fast (was ${cachedCallTime}ms)`,
  );
});
