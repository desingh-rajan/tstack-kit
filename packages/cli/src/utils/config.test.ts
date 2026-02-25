/**
 * Tests for config utility
 *
 * Tests loadConfig, saveConfig, and ensureConfig using a temp directory
 * so production configs are never touched.
 */

import { assertEquals, assertExists } from "@std/assert";
import { join } from "@std/path";

Deno.test({
  name: "config utility functions",
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async (t) => {
    const originalHome = Deno.env.get("HOME");
    const tmpHome = await Deno.makeTempDir({ prefix: "tstack-config-test-" });
    Deno.env.set("HOME", tmpHome);

    // Dynamic import with cache-busting query for a fresh module instance.
    const { ensureConfig, loadConfig, saveConfig } = await import(
      `./config.ts?t=${Date.now()}`
    );

    try {
      await t.step(
        "loadConfig returns empty object when no file exists",
        async () => {
          const config = await loadConfig();
          assertEquals(config, {});
        },
      );

      await t.step("saveConfig creates config file", async () => {
        await saveConfig({
          sudoPassword: "test123",
          defaultDbUser: "testuser",
          defaultDbPassword: "testpass",
        });

        const configPath = join(tmpHome, ".tonystack", "config.json");
        const stat = await Deno.stat(configPath);
        assertExists(stat);
      });

      await t.step("loadConfig reads saved config", async () => {
        const config = await loadConfig();
        assertEquals(config.sudoPassword, "test123");
        assertEquals(config.defaultDbUser, "testuser");
        assertEquals(config.defaultDbPassword, "testpass");
      });

      await t.step(
        "ensureConfig does not overwrite existing config",
        async () => {
          await ensureConfig();
          const config = await loadConfig();
          assertEquals(config.sudoPassword, "test123");
        },
      );

      await t.step("saveConfig overwrites previous config", async () => {
        await saveConfig({ defaultDbUser: "newuser" });
        const config = await loadConfig();
        assertEquals(config.defaultDbUser, "newuser");
        assertEquals(config.sudoPassword, undefined);
      });
    } finally {
      if (originalHome) {
        Deno.env.set("HOME", originalHome);
      } else {
        Deno.env.delete("HOME");
      }
      await Deno.remove(tmpHome, { recursive: true }).catch(() => {});
    }
  },
});
