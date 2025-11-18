import { assertEquals, assertExists } from "@std/assert";
import { app } from "../../main.ts";
import { db } from "../../config/database.ts";
import { siteSettings } from "./site-setting.model.ts";
import { authTokens } from "../../auth/auth-token.model.ts";

/**
 * Site Settings API Tests
 *
 * Tests CRUD operations for site configuration management
 * PUBLIC routes: GET (anyone can read)
 * ADMIN routes: POST, PUT, DELETE (superadmin only)
 *
 * Run: deno task test
 * Or: ENVIRONMENT=test deno test --allow-all src/entities/site_settings/site-setting.test.ts
 */

let superadminToken = "";
let siteSettingId = 0;

/**
 * Clean up test site_settings before running tests
 */
async function cleanupTestData() {
  try {
    // Delete all test site settings
    await db.delete(siteSettings);

    // Delete all auth tokens
    await db.delete(authTokens);
  } catch (error) {
    throw error;
  }
}

// Sample site setting data
const sampleSiteSetting = {
  key: "test_config",
  category: "general",
  value: {
    siteName: "Test Site",
    tagline: "Testing Site Configuration",
  },
  isPublic: true,
  description: "Test configuration setting",
};

const updatedSiteSetting = {
  value: {
    siteName: "Updated Test Site",
    tagline: "Updated Tagline",
    newField: "New Value",
  },
  description: "Updated test configuration",
};

async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const response = await app.request(endpoint, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { message: text };
  }
  return { status: response.status, data };
}

Deno.test("Site Settings API Tests", async (t) => {
  try {
    // Clean up test data before starting
    await cleanupTestData();

    await t.step("Login as superadmin", async () => {
      // Use the same hardcoded credentials that seed scripts use in test env
      const isTestEnv = Deno.env.get("ENVIRONMENT") === "test";
      const superadminEmail = isTestEnv
        ? "superadmin@tonystack.dev"
        : (Deno.env.get("SUPERADMIN_EMAIL") || "admin@test.local");
      const superadminPassword = isTestEnv
        ? "SuperSecurePassword123!"
        : (Deno.env.get("SUPERADMIN_PASSWORD") || "AdminPassword123!");

      const result = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: superadminEmail,
          password: superadminPassword,
        }),
      });
      assertEquals(result.status, 200);
      assertExists(result.data.data.token);
      superadminToken = result.data.data.token;
    });

    await t.step(
      "GET /site-settings - list all settings (public, no auth)",
      async () => {
        const result = await apiRequest("/site-settings");
        assertEquals(result.status, 200);
        assertExists(result.data.data);
        assertEquals(Array.isArray(result.data.data), true);
        // Should be empty initially
      },
    );

    await t.step("POST /site-settings - without auth should fail", async () => {
      const result = await apiRequest("/site-settings", {
        method: "POST",
        body: JSON.stringify(sampleSiteSetting),
      });
      assertEquals(result.status, 401);
    });

    await t.step(
      "POST /site-settings - superadmin creates setting",
      async () => {
        const result = await apiRequest("/site-settings", {
          method: "POST",
          headers: { Authorization: `Bearer ${superadminToken}` },
          body: JSON.stringify(sampleSiteSetting),
        });
        assertEquals(result.status, 201);
        assertExists(result.data.data.id);
        siteSettingId = result.data.data.id;
        console.log(`[SUCCESS] Site setting created with ID: ${siteSettingId}`);
      },
    );

    await t.step(
      "GET /site-settings - list all settings (public, with data)",
      async () => {
        const result = await apiRequest("/site-settings");
        assertEquals(result.status, 200);
        assertExists(result.data.data);
        assertEquals(Array.isArray(result.data.data), true);
        assertEquals(result.data.data.length > 0, true);
      },
    );

    await t.step(
      "GET /site-settings/:id - get setting by ID (public, no auth)",
      async () => {
        const result = await apiRequest(`/site-settings/${siteSettingId}`);
        assertEquals(result.status, 200);
        assertEquals(result.data.data.id, siteSettingId);
        assertEquals(result.data.data.key, "test_config");
      },
    );

    await t.step(
      "GET /site-settings/:key - get setting by key (public, no auth)",
      async () => {
        const result = await apiRequest(`/site-settings/test_config`);
        assertEquals(result.status, 200);
        assertEquals(result.data.data.key, "test_config");
        assertEquals(result.data.data.category, "general");
        assertEquals(result.data.data.value.siteName, "Test Site");
      },
    );

    await t.step(
      "GET /site-settings/:id - non-existent ID should fail",
      async () => {
        const result = await apiRequest(`/site-settings/99999`);
        assertEquals(result.status, 404);
      },
    );

    await t.step(
      "GET /site-settings/:key - non-existent key should fail",
      async () => {
        const result = await apiRequest(`/site-settings/non_existent_key`);
        assertEquals(result.status, 404);
      },
    );

    await t.step(
      "PUT /site-settings/:id - without auth should fail",
      async () => {
        const result = await apiRequest(`/site-settings/${siteSettingId}`, {
          method: "PUT",
          body: JSON.stringify(updatedSiteSetting),
        });
        assertEquals(result.status, 401);
      },
    );

    await t.step(
      "PUT /site-settings/:id - superadmin updates setting",
      async () => {
        const result = await apiRequest(`/site-settings/${siteSettingId}`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${superadminToken}` },
          body: JSON.stringify(updatedSiteSetting),
        });
        assertEquals(result.status, 200);
        assertEquals(
          result.data.data.description,
          "Updated test configuration",
        );
      },
    );

    await t.step(
      "PUT /site-settings/:id - non-existent should fail",
      async () => {
        const result = await apiRequest(`/site-settings/99999`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${superadminToken}` },
          body: JSON.stringify(updatedSiteSetting),
        });
        assertEquals(result.status, 404);
      },
    );

    await t.step(
      "DELETE /site-settings/:id - without auth should fail",
      async () => {
        const result = await apiRequest(`/site-settings/${siteSettingId}`, {
          method: "DELETE",
        });
        assertEquals(result.status, 401);
      },
    );

    await t.step(
      "DELETE /site-settings/:id - superadmin deletes setting",
      async () => {
        const result = await apiRequest(`/site-settings/${siteSettingId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${superadminToken}` },
        });
        assertEquals(result.status, 200);
        console.log(`[SUCCESS] Site setting ${siteSettingId} deleted`);
      },
    );

    await t.step("GET /site-settings/:id - verify deleted", async () => {
      const result = await apiRequest(`/site-settings/${siteSettingId}`, {
        headers: { Authorization: `Bearer ${superadminToken}` },
      });
      assertEquals(result.status, 404);
    });

    await t.step(
      "DELETE /site-settings/:id - non-existent should fail",
      async () => {
        const result = await apiRequest(`/site-settings/99999`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${superadminToken}` },
        });
        assertEquals(result.status, 404);
      },
    );

    // NEW TESTS: System settings functionality
    await t.step(
      "GET /site-settings/theme_config - auto-seed system setting",
      async () => {
        const result = await apiRequest(`/site-settings/theme_config`);
        assertEquals(result.status, 200);
        assertExists(result.data.data);
        assertEquals(result.data.data.key, "theme_config");
        assertEquals(result.data.data.isSystem, true);
        assertExists(result.data.data.value.primaryColor);
      },
    );

    await t.step(
      "DELETE /site-settings - cannot delete system setting",
      async () => {
        // Get theme_config ID
        const getResult = await apiRequest(`/site-settings/theme_config`);
        const themeId = getResult.data.data.id;

        // Try to delete (should fail)
        const result = await apiRequest(`/site-settings/${themeId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${superadminToken}` },
        });
        assertEquals(result.status, 400);
      },
    );

    await t.step(
      "PUT /site-settings - validate system setting value",
      async () => {
        // Get theme_config ID
        const getResult = await apiRequest(`/site-settings/theme_config`);
        const themeId = getResult.data.data.id;

        // Try to update with invalid value (should fail validation)
        const result = await apiRequest(`/site-settings/${themeId}`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${superadminToken}` },
          body: JSON.stringify({
            value: {
              primaryColor: "invalid-color", // Should fail hex color validation
            },
          }),
        });
        assertEquals(result.status, 400);
      },
    );

    await t.step(
      "POST /site-settings/theme_config/reset - reset to default",
      async () => {
        const result = await apiRequest(`/site-settings/theme_config/reset`, {
          method: "POST",
          headers: { Authorization: `Bearer ${superadminToken}` },
        });
        assertEquals(result.status, 200);
        assertExists(result.data.data);
        assertEquals(result.data.data.value.primaryColor, "#3b82f6"); // Default value
      },
    );

    await t.step(
      "POST /site-settings/reset-all - reset all system settings",
      async () => {
        const result = await apiRequest(`/site-settings/reset-all`, {
          method: "POST",
          headers: { Authorization: `Bearer ${superadminToken}` },
        });
        assertEquals(result.status, 200);
        assertExists(result.data.data);
        assertEquals(result.data.data.count, 6); // 6 system settings
      },
    );
  } finally {
    // Close database connections to prevent resource leaks
    try {
      await db.$client.end();
    } catch {
      // Ignore errors when closing
    }
  }
});
