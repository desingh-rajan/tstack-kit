/**
 * Admin API Tests for Site Settings
 * Tests the @tstack/admin JSON API
 */

import { assertEquals, assertExists } from "@std/assert";
import { app } from "../../main.ts";
import { db } from "../../config/database.ts";
import { siteSettings } from "./site-setting.model.ts";
import { authTokens } from "../../auth/auth-token.model.ts";

let superadminToken = "";
let settingId = 0;

/**
 * Clean up test data
 */
async function cleanupTestData() {
  try {
    await db.delete(siteSettings);
    await db.delete(authTokens);
  } catch (error) {
    console.error("[CLEANUP] Error cleaning test data:", error);
  }
}

/**
 * Helper to make authenticated requests
 */
async function adminRequest(
  endpoint: string,
  token: string,
  options: RequestInit = {},
) {
  return await app.request(endpoint, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
}

Deno.test("Site Setting Admin API Tests", {
  sanitizeResources: false,
  sanitizeOps: false,
}, async (t) => {
  const BASE_URL = "/ts-admin/site_settings";

  try {
    await cleanupTestData();

    // Setup: Login as superadmin
    await t.step("Setup: Login as superadmin", async () => {
      const res = await app.request("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "superadmin@tonystack.dev",
          password: "SuperSecurePassword123!",
        }),
      });
      const data = await res.json();
      superadminToken = data.data.token;
      assertExists(superadminToken, "Superadmin token should exist");
    });

    // Test JSON API responses
    await t.step("GET /ts-admin/site_settings - List", async () => {
      const res = await adminRequest(BASE_URL, superadminToken);
      assertEquals(res.status, 200);
      const data = await res.json();
      assertEquals(Array.isArray(data.data), true);
      if (data.data.length > 0) {
        settingId = data.data[0].id;
      }
    });

    await t.step("POST /ts-admin/site_settings - Create", async () => {
      const res = await adminRequest(BASE_URL, superadminToken, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          key: "json_test_key",
          category: "features",
          value: { feature_enabled: true },
          isPublic: false,
          description: "JSON test setting",
        }),
      });
      assertEquals(res.status, 201);
      const data = await res.json();
      assertEquals(data.key, "json_test_key");
      settingId = data.id;
    });

    await t.step("GET /ts-admin/site_settings/:id - Show", async () => {
      const res = await adminRequest(
        `${BASE_URL}/${settingId}`,
        superadminToken,
      );
      assertEquals(res.status, 200);
      const data = await res.json();
      assertEquals(data.id, settingId);
    });

    await t.step(
      "GET /ts-admin/site_settings/:id/edit - Entity metadata",
      async () => {
        const res = await adminRequest(
          `${BASE_URL}/${settingId}/edit`,
          superadminToken,
        );
        assertEquals(res.status, 200);
        const data = await res.json();
        assertEquals(data.mode, "edit");
        assertEquals(data.data.id, settingId);
      },
    );

    await t.step(
      "PUT /ts-admin/site_settings/:id - Update",
      async () => {
        const res = await adminRequest(
          `${BASE_URL}/${settingId}`,
          superadminToken,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              description: "Updated description",
            }),
          },
        );
        assertEquals(res.status, 200);
        const data = await res.json();
        assertEquals(data.description, "Updated description");
      },
    );

    await t.step(
      "DELETE /ts-admin/site_settings/:id - Delete",
      async () => {
        const res = await adminRequest(
          `${BASE_URL}/${settingId}`,
          superadminToken,
          {
            method: "DELETE",
          },
        );
        assertEquals(res.status, 200);
      },
    );

    await t.step(
      "POST /ts-admin/site_settings/bulk-delete - Bulk delete",
      async () => {
        // Create test records
        const res1 = await adminRequest(BASE_URL, superadminToken, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            key: "bulk_test_1",
            category: "general",
            value: {},
          }),
        });
        const res2 = await adminRequest(BASE_URL, superadminToken, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            key: "bulk_test_2",
            category: "general",
            value: {},
          }),
        });

        const data1 = await res1.json();
        const data2 = await res2.json();

        // Bulk delete
        const res = await adminRequest(
          `${BASE_URL}/bulk-delete`,
          superadminToken,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              ids: [data1.id, data2.id],
            }),
          },
        );
        assertEquals(res.status, 200);
        const result = await res.json();
        assertEquals(result.count, 2);
      },
    );

    // Test authentication
    await t.step("Unauthorized access should fail", async () => {
      const res = await app.request(BASE_URL);
      assertEquals([401, 500].includes(res.status), true);
    });

    await t.step("Test pagination", async () => {
      const res = await adminRequest(
        `${BASE_URL}?page=1&limit=10`,
        superadminToken,
      );
      assertEquals(res.status, 200);
      const data = await res.json();
      assertExists(data.page, "Should have page");
      assertExists(data.limit, "Should have limit");
      assertExists(data.total, "Should have total");
    });

    await t.step("Test search", async () => {
      const res = await adminRequest(
        `${BASE_URL}?search=test`,
        superadminToken,
      );
      assertEquals(res.status, 200);
    });

    await t.step("Test sorting", async () => {
      const res = await adminRequest(
        `${BASE_URL}?orderBy=key&orderDir=asc`,
        superadminToken,
      );
      assertEquals(res.status, 200);
    });
  } catch (error) {
    throw error;
  } finally {
    await cleanupTestData();
  }
});
