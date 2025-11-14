/**
 * Admin API Tests for Site Settings
 * Tests the @tstack/admin CRUD interface (HTML + JSON responses)
 */

import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
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
    console.log("[CLEANUP] Test site settings and tokens cleaned successfully");
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

Deno.test("Site Setting Admin API Tests", async (t) => {
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

    // Test HTML responses
    await t.step("GET /ts-admin/site_settings - List page (HTML)", async () => {
      const res = await adminRequest(BASE_URL, superadminToken);
      assertEquals(res.status, 200);
      assertEquals(res.headers.get("content-type")?.includes("text/html"), true);
    });

    await t.step("GET /ts-admin/site_settings/new - New form (HTML)", async () => {
      const res = await adminRequest(`${BASE_URL}/new`, superadminToken);
      assertEquals(res.status, 200);
      assertEquals(res.headers.get("content-type")?.includes("text/html"), true);
    });

    await t.step("POST /ts-admin/site_settings - Create (HTML form)", async () => {
      const formData = new FormData();
      formData.append("key", "test_key");
      formData.append("category", "general");
      formData.append("value", JSON.stringify({ enabled: true }));
      formData.append("isPublic", "true");
      formData.append("description", "Test setting");

      const res = await adminRequest(BASE_URL, superadminToken, {
        method: "POST",
        body: formData,
      });
      // Should redirect to list page or return 200
      assertEquals([200, 302].includes(res.status), true);
    });

    // Test JSON API responses
    await t.step("GET /ts-admin/site_settings - List (JSON)", async () => {
      const res = await adminRequest(BASE_URL, superadminToken, {
        headers: {
          Accept: "application/json",
        },
      });
      assertEquals(res.status, 200);
      const data = await res.json();
      assertEquals(Array.isArray(data.data), true);
      if (data.data.length > 0) {
        settingId = data.data[0].id;
      }
    });

    await t.step("POST /ts-admin/site_settings - Create (JSON)", async () => {
      const res = await adminRequest(BASE_URL, superadminToken, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
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

    await t.step("GET /ts-admin/site_settings/:id - Show (JSON)", async () => {
      const res = await adminRequest(`${BASE_URL}/${settingId}`, superadminToken, {
        headers: {
          Accept: "application/json",
        },
      });
      assertEquals(res.status, 200);
      const data = await res.json();
      assertEquals(data.id, settingId);
    });

    await t.step("GET /ts-admin/site_settings/:id/edit - Edit form (HTML)", async () => {
      const res = await adminRequest(`${BASE_URL}/${settingId}/edit`, superadminToken);
      assertEquals(res.status, 200);
      assertEquals(res.headers.get("content-type")?.includes("text/html"), true);
    });

    await t.step("PUT /ts-admin/site_settings/:id - Update (JSON)", async () => {
      const res = await adminRequest(`${BASE_URL}/${settingId}`, superadminToken, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          description: "Updated description",
        }),
      });
      assertEquals(res.status, 200);
      const data = await res.json();
      assertEquals(data.description, "Updated description");
    });

    await t.step("DELETE /ts-admin/site_settings/:id - Delete (JSON)", async () => {
      const res = await adminRequest(`${BASE_URL}/${settingId}`, superadminToken, {
        method: "DELETE",
        headers: {
          Accept: "application/json",
        },
      });
      assertEquals(res.status, 200);
    });

    await t.step("POST /ts-admin/site_settings/bulk-delete - Bulk delete", async () => {
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
      const res = await adminRequest(`${BASE_URL}/bulk-delete`, superadminToken, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ids: [data1.id, data2.id],
        }),
      });
      assertEquals(res.status, 200);
      const result = await res.json();
      assertEquals(result.count, 2);
    });

    // Test authentication
    await t.step("Unauthorized access should fail", async () => {
      const res = await app.request(BASE_URL);
      assertEquals([401, 500].includes(res.status), true);
    });

    await t.step("Test pagination", async () => {
      const res = await adminRequest(`${BASE_URL}?page=1&limit=10`, superadminToken, {
        headers: {
          Accept: "application/json",
        },
      });
      assertEquals(res.status, 200);
      const data = await res.json();
      assertEquals(typeof data.pagination, "object");
    });

    await t.step("Test search", async () => {
      const res = await adminRequest(`${BASE_URL}?search=test`, superadminToken, {
        headers: {
          Accept: "application/json",
        },
      });
      assertEquals(res.status, 200);
    });

    await t.step("Test sorting", async () => {
      const res = await adminRequest(
        `${BASE_URL}?orderBy=key&orderDir=asc`,
        superadminToken,
        {
          headers: {
            Accept: "application/json",
          },
        },
      );
      assertEquals(res.status, 200);
    });
  } catch (error) {
    console.log("[FAILURE] Site setting admin tests failed:", error);
    throw error;
  } finally {
    await cleanupTestData();
  }
});
