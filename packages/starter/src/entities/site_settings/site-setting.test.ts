/**
 * REFERENCE IMPLEMENTATION: Site Settings API Tests (BDD Style)
 *
 * This test demonstrates testing a hybrid API with both public and protected routes:
 * - PUBLIC routes: GET endpoints (anyone can read settings)
 * - PROTECTED routes: POST/PUT/DELETE (superadmin only)
 *
 * Site settings support:
 * - Custom user-defined settings
 * - System-managed settings with validation
 * - JSON value storage
 * - Key-based and ID-based access
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
 * 2. Hybrid Route Testing:
 *    - Public read access (no authentication)
 *    - Protected write access (authentication required)
 *    - Role-based permissions (superadmin only)
 *
 * 3. System Settings:
 *    - Auto-seeding on first access
 *    - Validation of structured data
 *    - Reset functionality
 *    - Protection from deletion
 *
 * 4. Test Isolation:
 *    - Each test suite creates its own test data
 *    - No dependencies on seed scripts or fixtures
 *    - Clean slate before and after tests
 *
 * 5. HTTP Testing Best Practices:
 *    - Direct app.request() calls (no server startup)
 *    - Authenticated and unauthenticated requests
 *    - JSON response validation
 *
 * 6. Professional Documentation:
 *    - Comprehensive inline comments
 *    - Learning resources for developers
 *    - Industry-standard patterns
 *
 * LEARN MORE:
 * ===========
 * - BDD Testing: https://docs.deno.com/runtime/fundamentals/testing/#bdd-style
 * - Hono Testing: https://hono.dev/docs/guides/testing
 * - PostgreSQL JSON: https://www.postgresql.org/docs/current/datatype-json.html
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
let regularUserToken = "";
let testSettingId = 0;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Makes an API request with optional authentication
 * @param endpoint - The API endpoint
 * @param token - Optional Bearer token for authentication
 * @param options - Additional request options
 * @returns Response object
 */
async function apiRequest(
  endpoint: string,
  token?: string,
  options: RequestInit = {},
): Promise<Response> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...options.headers as Record<string, string>,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return await app.request(endpoint, {
    ...options,
    headers,
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
// SITE SETTINGS API TEST SUITE
// ============================================================================

describe("Site Settings API", () => {
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

    // Create regular user
    const regular = await createTestUser(
      "regular@test.local",
      "Test User",
      "UserSecure123!",
      "user",
    );
    regularUserToken = regular.token;
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
  // PUBLIC READ ACCESS
  // --------------------------------------------------------------------------

  describe("Public Read Access", () => {
    it("should allow unauthenticated users to list settings", async () => {
      const response = await apiRequest("/site-settings");

      assertEquals(response.status, 200);

      const json = await response.json();
      assertExists(json.data);
      assertEquals(Array.isArray(json.data), true);
    });

    it("should allow unauthenticated users to get setting by ID", async () => {
      // First create a setting
      const createRes = await apiRequest(
        "/site-settings",
        superadminToken,
        {
          method: "POST",
          body: JSON.stringify({
            key: "test_public_setting",
            category: "general",
            value: { enabled: true },
            isPublic: true,
            description: "Public test setting",
          }),
        },
      );
      const createData = await createRes.json();
      testSettingId = createData.data.id;

      // Now read it without auth
      const response = await apiRequest(`/site-settings/${testSettingId}`);

      assertEquals(response.status, 200);

      const json = await response.json();
      assertEquals(json.data.id, testSettingId);
      assertEquals(json.data.key, "test_public_setting");
    });

    it("should allow unauthenticated users to get setting by key", async () => {
      const response = await apiRequest("/site-settings/test_public_setting");

      assertEquals(response.status, 200);

      const json = await response.json();
      assertEquals(json.data.key, "test_public_setting");
      assertEquals(json.data.value.enabled, true);
    });

    it("should return 404 for non-existent setting ID", async () => {
      const response = await apiRequest("/site-settings/99999");
      assertEquals(response.status, 404);
    });

    it("should return 404 for non-existent setting key", async () => {
      const response = await apiRequest("/site-settings/non_existent_key");
      assertEquals(response.status, 404);
    });
  });

  // --------------------------------------------------------------------------
  // PROTECTED WRITE ACCESS
  // --------------------------------------------------------------------------

  describe("Protected Write Access", () => {
    it("should reject create without authentication", async () => {
      const response = await apiRequest("/site-settings", undefined, {
        method: "POST",
        body: JSON.stringify({
          key: "unauthorized_setting",
          category: "test",
          value: {},
        }),
      });

      assertEquals(response.status, 401);
    });

    it("should reject create from non-superadmin user", async () => {
      const response = await apiRequest(
        "/site-settings",
        regularUserToken,
        {
          method: "POST",
          body: JSON.stringify({
            key: "unauthorized_setting",
            category: "general",
            value: {},
          }),
        },
      );

      assertEquals(response.status, 403);
    });

    it("should allow superadmin to create setting", async () => {
      const response = await apiRequest(
        "/site-settings",
        superadminToken,
        {
          method: "POST",
          body: JSON.stringify({
            key: "superadmin_setting",
            category: "features",
            value: { feature: "enabled" },
            isPublic: false,
            description: "Admin-only setting",
          }),
        },
      );

      assertEquals(response.status, 201);

      const json = await response.json();
      assertExists(json.data.id);
      assertEquals(json.data.key, "superadmin_setting");
    });
  });

  // --------------------------------------------------------------------------
  // UPDATE OPERATIONS
  // --------------------------------------------------------------------------

  describe("Update Operations", () => {
    it("should reject update without authentication", async () => {
      const response = await apiRequest(
        `/site-settings/${testSettingId}`,
        undefined,
        {
          method: "PUT",
          body: JSON.stringify({
            value: { updated: true },
          }),
        },
      );

      assertEquals(response.status, 401);
    });

    it("should reject update from non-superadmin user", async () => {
      const response = await apiRequest(
        `/site-settings/${testSettingId}`,
        regularUserToken,
        {
          method: "PUT",
          body: JSON.stringify({
            value: { updated: true },
          }),
        },
      );

      assertEquals(response.status, 403);
    });

    it("should allow superadmin to update setting", async () => {
      const response = await apiRequest(
        `/site-settings/${testSettingId}`,
        superadminToken,
        {
          method: "PUT",
          body: JSON.stringify({
            value: { enabled: false, updated: true },
            description: "Updated test setting",
          }),
        },
      );

      assertEquals(response.status, 200);

      const json = await response.json();
      assertEquals(json.data.description, "Updated test setting");
      assertEquals(json.data.value.updated, true);
    });

    it("should return 404 when updating non-existent setting", async () => {
      const response = await apiRequest(
        "/site-settings/99999",
        superadminToken,
        {
          method: "PUT",
          body: JSON.stringify({ value: {} }),
        },
      );

      assertEquals(response.status, 404);
    });
  });

  // --------------------------------------------------------------------------
  // DELETE OPERATIONS
  // --------------------------------------------------------------------------

  describe("Delete Operations", () => {
    it("should reject delete without authentication", async () => {
      const response = await apiRequest(
        `/site-settings/${testSettingId}`,
        undefined,
        { method: "DELETE" },
      );

      assertEquals(response.status, 401);
    });

    it("should reject delete from non-superadmin user", async () => {
      const response = await apiRequest(
        `/site-settings/${testSettingId}`,
        regularUserToken,
        { method: "DELETE" },
      );

      assertEquals(response.status, 403);
    });

    it("should allow superadmin to delete setting", async () => {
      const response = await apiRequest(
        `/site-settings/${testSettingId}`,
        superadminToken,
        { method: "DELETE" },
      );

      assertEquals(response.status, 200);

      // Verify deletion
      const getResponse = await apiRequest(`/site-settings/${testSettingId}`);
      assertEquals(getResponse.status, 404);
    });

    it("should return 404 when deleting non-existent setting", async () => {
      const response = await apiRequest(
        "/site-settings/99999",
        superadminToken,
        { method: "DELETE" },
      );

      assertEquals(response.status, 404);
    });
  });

  // --------------------------------------------------------------------------
  // SYSTEM SETTINGS
  // --------------------------------------------------------------------------

  describe("System Settings", () => {
    it("should auto-seed system setting on first access", async () => {
      const response = await apiRequest("/site-settings/theme_config");

      assertEquals(response.status, 200);

      const json = await response.json();
      assertEquals(json.data.key, "theme_config");
      assertEquals(json.data.isSystem, true);
      assertExists(json.data.value.primaryColor);
    });

    it("should prevent deletion of system settings", async () => {
      // Get theme_config ID
      const getRes = await apiRequest("/site-settings/theme_config");
      const getJson = await getRes.json();
      const themeId = getJson.data.id;

      // Try to delete
      const response = await apiRequest(
        `/site-settings/${themeId}`,
        superadminToken,
        { method: "DELETE" },
      );

      assertEquals(response.status, 400);
    });

    it("should validate system setting values", async () => {
      // Get theme_config ID
      const getRes = await apiRequest("/site-settings/theme_config");
      const getJson = await getRes.json();
      const themeId = getJson.data.id;

      // Try to update with invalid color
      const response = await apiRequest(
        `/site-settings/${themeId}`,
        superadminToken,
        {
          method: "PUT",
          body: JSON.stringify({
            value: {
              primaryColor: "invalid-color", // Should fail hex validation
            },
          }),
        },
      );

      assertEquals(response.status, 400);
    });

    it("should reset system setting to defaults", async () => {
      const response = await apiRequest(
        "/site-settings/theme_config/reset",
        superadminToken,
        { method: "POST" },
      );

      assertEquals(response.status, 200);

      const json = await response.json();
      assertEquals(json.data.value.primaryColor, "#3b82f6"); // Default
    });

    it("should reset all system settings", async () => {
      const response = await apiRequest(
        "/site-settings/reset-all",
        superadminToken,
        { method: "POST" },
      );

      assertEquals(response.status, 200);

      const json = await response.json();
      assertEquals(json.data.count, 6); // 6 system settings
    });
  });
});
