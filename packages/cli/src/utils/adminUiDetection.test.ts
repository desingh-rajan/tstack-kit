/**
 * Tests for adminUiDetection utility
 *
 * Tests the detectAdminUiProject function's naming convention logic.
 * Uses temp directories to simulate filesystem state.
 *
 * sanitizeResources: false because detectAdminUiProject calls getProject()
 * which opens and caches a KV store handle.
 */

import { assertEquals } from "@std/assert";
import { join } from "@std/path";
import { detectAdminUiProject } from "./adminUiDetection.ts";

Deno.test({
  name: "detectAdminUiProject",
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async (t) => {
    await t.step(
      "derives admin-ui name from api project path",
      async () => {
        const fakeDir = join(
          Deno.env.get("TMPDIR") || "/tmp",
          `tstack-test-${Date.now()}-1`,
        );
        const apiPath = join(fakeDir, "shop-api");

        const info = await detectAdminUiProject(apiPath);

        assertEquals(info.name, "shop-admin-ui");
        assertEquals(info.path, join(fakeDir, "shop-admin-ui"));
        assertEquals(info.relativeFromApi, "../shop-admin-ui");
        assertEquals(info.exists, false);
      },
    );

    await t.step("strips -api suffix correctly", async () => {
      const fakeDir = join(
        Deno.env.get("TMPDIR") || "/tmp",
        `tstack-test-${Date.now()}-2`,
      );
      const apiPath = join(fakeDir, "myapp-api");

      const info = await detectAdminUiProject(apiPath);

      assertEquals(info.name, "myapp-admin-ui");
    });

    await t.step(
      "handles project name without -api suffix",
      async () => {
        const fakeDir = join(
          Deno.env.get("TMPDIR") || "/tmp",
          `tstack-test-${Date.now()}-3`,
        );
        const apiPath = join(fakeDir, "backend");

        const info = await detectAdminUiProject(apiPath);

        assertEquals(info.name, "backend-admin-ui");
      },
    );

    await t.step(
      "returns exists=true when directory is present",
      async () => {
        const tmpDir = await Deno.makeTempDir({
          prefix: "tstack-detect-test-",
        });

        try {
          const apiDir = join(tmpDir, "test-api");
          const adminUiDir = join(tmpDir, "test-admin-ui");
          await Deno.mkdir(apiDir);
          await Deno.mkdir(adminUiDir);

          const info = await detectAdminUiProject(apiDir);

          assertEquals(info.exists, true);
          assertEquals(info.name, "test-admin-ui");
        } finally {
          await Deno.remove(tmpDir, { recursive: true });
        }
      },
    );
  },
});
