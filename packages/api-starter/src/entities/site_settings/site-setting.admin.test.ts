/**
 * REFERENCE IMPLEMENTATION: Site Settings Admin Panel Tests (BDD Style)
 *
 * This test demonstrates testing admin panel routes for site settings management.
 * Tests the @tstack/admin v2.0.0+ JSON API interface.
 *
 * TESTING PATTERNS DEMONSTRATED:
 * ================================
 *
 * 1. BDD Test Structure:
 *    - describe(): Logical grouping of related test scenarios
 *    - it(): Individual test cases with clear "should..." naming
 *    - beforeAll(): Suite-level setup (create test users/data once)
 *    - afterAll(): Suite-level cleanup (destroy all test data)
 *
 * 2. Admin Panel Testing:
 *    - CRUD operations via admin interface
 *    - Pagination, search, and sorting
 *    - System settings management
 *    - Validation and constraints
 *
 * 3. Test Isolation:
 *    - Each test suite creates its own test data
 *    - No dependencies on seed scripts or fixtures
 *    - Clean slate before and after tests
 *
 * 4. HTTP Testing Best Practices:
 *    - Direct app.request() calls (no server startup)
 *    - Authenticated requests with Bearer tokens
 *    - JSON response validation
 *
 * LEARN MORE:
 * ===========
 * - BDD Testing: https://docs.deno.com/runtime/fundamentals/testing/#bdd-style
 * - Admin Package: https://jsr.io/@tstack/admin
 */

import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { assertEquals, assertExists } from "@std/assert";
import { app } from "../../main.ts";
import { db } from "../../config/database.ts";
import { siteSettings } from "./site-setting.model.ts";
import { authTokens } from "../../auth/auth-token.model.ts";
import { users } from "../../auth/user.model.ts";
import { like } from "drizzle-orm";

// ============================================================================
// MODULE-LEVEL STATE
// ============================================================================

let superadminToken = "";
let superadminUserId = 0;
let testSettingId = 0;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Makes an authenticated request to the admin panel API
 */
async function adminRequest(
  endpoint: string,
  token: string,
  options: RequestInit = {},
): Promise<Response> {
  return await app.request(endpoint, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
}

/**
 * Creates a test user directly in the database with specified role
 */
async function createTestUser(
  email: string,
  name: string,
  password: string,
  role: "superadmin" | "admin" | "user" = "user",
): Promise<{ token: string; userId: number }> {
  const { hashPassword } = await import("../../shared/utils/password.ts");

  const [user] = await db.insert(users).values({
    email,
    username: name.replace(/\s+/g, "").toLowerCase(),
    password: await hashPassword(password),
    role,
    isActive: true,
    isEmailVerified: true,
  }).returning();

  const loginRes = await app.request("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const loginData = await loginRes.json();
  return {
    token: loginData.data?.token,
    userId: user.id,
  };
}

// ============================================================================
// SITE SETTINGS ADMIN API TEST SUITE
// ============================================================================

describe("Site Settings Admin Panel API", () => {
  const BASE_URL = "/ts-admin/site_settings";

  // --------------------------------------------------------------------------
  // SETUP & TEARDOWN
  // --------------------------------------------------------------------------

  beforeAll(async () => {
    // Clean up any leftover test data first
    await db.delete(siteSettings);
    await db.delete(authTokens);
    await db.delete(users).where(like(users.email, "%@test.local"));

    // Create superadmin user
    const superadmin = await createTestUser(
      "superadmin@test.local",
      "Test Superadmin",
      "SuperSecure123!",
      "superadmin",
    );
    superadminToken = superadmin.token;
    superadminUserId = superadmin.userId;
  });

  afterAll(async () => {
    // Clean up all test data
    await db.delete(siteSettings);
    await db.delete(authTokens);
    await db.delete(users).where(like(users.email, "%@test.local"));

    // Close DB connection
    try {
      await db.$client.end();
    } catch {
      // Ignore
    }
  });

  // --------------------------------------------------------------------------
  // LIST & METADATA
  // --------------------------------------------------------------------------

  describe("List and Metadata", () => {
    it("should return JSON list of settings", async () => {
      const res = await adminRequest(BASE_URL, superadminToken);

      assertEquals(res.status, 200);

      const data = await res.json();
      assertExists(data.data);
      assertEquals(Array.isArray(data.data), true);
    });

    it("should return entity metadata for create form", async () => {
      const res = await adminRequest(`${BASE_URL}/new`, superadminToken);

      assertEquals(res.status, 200);

      const data = await res.json();
      assertExists(data.entityName);
      assertEquals(data.mode, "create");
      assertExists(data.columns);
    });

    it("should support pagination", async () => {
      const res = await adminRequest(
        `${BASE_URL}?page=1&limit=10`,
        superadminToken,
      );

      assertEquals(res.status, 200);

      const data = await res.json();
      assertEquals(data.page, 1);
      assertEquals(data.limit, 10);
    });

    it("should support search", async () => {
      const res = await adminRequest(
        `${BASE_URL}?search=test`,
        superadminToken,
      );

      assertEquals(res.status, 200);

      const data = await res.json();
      assertExists(data.data);
    });

    it("should support sorting", async () => {
      const res = await adminRequest(
        `${BASE_URL}?sortBy=key&sortOrder=asc`,
        superadminToken,
      );

      assertEquals(res.status, 200);

      const data = await res.json();
      assertExists(data.data);
    });
  });

  // --------------------------------------------------------------------------
  // CREATE OPERATIONS
  // --------------------------------------------------------------------------

  describe("Create Operations", () => {
    it("should create setting via JSON API", async () => {
      const res = await adminRequest(BASE_URL, superadminToken, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "admin_test_setting",
          category: "features",
          value: { feature_enabled: true },
          isPublic: false,
          description: "Admin panel test setting",
        }),
      });

      assertEquals(res.status, 201);

      const data = await res.json();
      assertExists(data.id);
      assertEquals(data.key, "admin_test_setting");
      testSettingId = data.id;
    });
  });

  // --------------------------------------------------------------------------
  // READ OPERATIONS
  // --------------------------------------------------------------------------

  describe("Read Operations", () => {
    it("should return single setting as JSON", async () => {
      const res = await adminRequest(
        `${BASE_URL}/${testSettingId}`,
        superadminToken,
      );

      assertEquals(res.status, 200);

      const data = await res.json();
      assertEquals(data.key, "admin_test_setting");
    });

    it("should return entity metadata with data for edit form", async () => {
      const res = await adminRequest(
        `${BASE_URL}/${testSettingId}/edit`,
        superadminToken,
      );

      assertEquals(res.status, 200);

      const data = await res.json();
      assertExists(data.entityName);
      assertEquals(data.mode, "edit");
      assertExists(data.data);
      assertEquals(data.data.key, "admin_test_setting");
    });
  });

  // --------------------------------------------------------------------------
  // UPDATE OPERATIONS
  // --------------------------------------------------------------------------

  describe("Update Operations", () => {
    it("should update setting description", async () => {
      const res = await adminRequest(
        `${BASE_URL}/${testSettingId}`,
        superadminToken,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            key: "admin_test_setting",
            category: "features",
            value: { feature_enabled: true },
            description: "Updated admin test setting",
          }),
        },
      );

      assertEquals(res.status, 200);

      // Verify by fetching
      const getRes = await adminRequest(
        `${BASE_URL}/${testSettingId}`,
        superadminToken,
      );
      const data = await getRes.json();
      assertEquals(data.description, "Updated admin test setting");
    });

    it("should update setting value", async () => {
      const res = await adminRequest(
        `${BASE_URL}/${testSettingId}`,
        superadminToken,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            key: "admin_test_setting",
            category: "features",
            value: { feature_enabled: false, new_feature: true },
          }),
        },
      );

      assertEquals(res.status, 200);

      // Verify by fetching
      const getRes = await adminRequest(
        `${BASE_URL}/${testSettingId}`,
        superadminToken,
      );
      const data = await getRes.json();
      assertEquals(data.value.feature_enabled, false);
      assertEquals(data.value.new_feature, true);
    });
  });

  // --------------------------------------------------------------------------
  // DELETE OPERATIONS
  // --------------------------------------------------------------------------

  describe("Delete Operations", () => {
    it("should delete single setting", async () => {
      const res = await adminRequest(
        `${BASE_URL}/${testSettingId}`,
        superadminToken,
        { method: "DELETE" },
      );

      assertEquals(res.status, 200);

      // Verify deletion
      const getRes = await adminRequest(
        `${BASE_URL}/${testSettingId}`,
        superadminToken,
      );
      assertEquals(getRes.status, 404);
    });

    it("should bulk delete multiple settings", async () => {
      // Create two settings
      const res1 = await adminRequest(BASE_URL, superadminToken, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "bulk_delete_1",
          category: "general",
          value: {},
        }),
      });
      const id1 = (await res1.json()).id;

      const res2 = await adminRequest(BASE_URL, superadminToken, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "bulk_delete_2",
          category: "general",
          value: {},
        }),
      });
      const id2 = (await res2.json()).id;

      // Bulk delete
      const res = await adminRequest(
        `${BASE_URL}/bulk-delete`,
        superadminToken,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: [id1, id2] }),
        },
      );

      assertEquals(res.status, 200);

      const data = await res.json();
      assertEquals(data.count, 2);
    });
  });

  // --------------------------------------------------------------------------
  // SYSTEM SETTINGS
  // --------------------------------------------------------------------------

  describe("System Settings Management", () => {
    it("should prevent deletion of system settings", async () => {
      // Get theme_config (system setting)
      const getRes = await app.request("/site-settings/theme_config");
      const getSetting = await getRes.json();
      const themeId = getSetting.data.id;

      // Try to delete via admin panel
      const res = await adminRequest(
        `${BASE_URL}/${themeId}`,
        superadminToken,
        { method: "DELETE" },
      );

      assertEquals(res.status, 400);
    });

    it("should validate system setting values on update", async () => {
      // Get theme_config
      const getRes = await app.request("/site-settings/theme_config");
      const getSetting = await getRes.json();
      const themeId = getSetting.data.id;

      // Try invalid color
      const res = await adminRequest(
        `${BASE_URL}/${themeId}`,
        superadminToken,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            value: { primaryColor: "invalid-color" },
          }),
        },
      );

      assertEquals(res.status, 400);
    });

    it("should reset system setting to defaults", async () => {
      const res = await adminRequest(
        "/site-settings/theme_config/reset",
        superadminToken,
        { method: "POST" },
      );

      assertEquals(res.status, 200);

      const data = await res.json();
      assertEquals(data.data.value.primaryColor, "#3b82f6"); // Default
    });

    it("should reset all system settings", async () => {
      const res = await adminRequest(
        "/site-settings/reset-all",
        superadminToken,
        { method: "POST" },
      );

      assertEquals(res.status, 200);

      const data = await res.json();
      assertEquals(data.data.count, 6);
    });
  });
});
