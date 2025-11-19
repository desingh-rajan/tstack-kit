import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { assertEquals, assertExists } from "@std/assert";
import { app } from "../main.ts";
import { db } from "../config/database.ts";
import { users } from "./user.model.ts";
import { authTokens } from "./auth-token.model.ts";
import { hashPassword } from "../shared/utils/password.ts";
import { sql } from "drizzle-orm";

/**
 * Authentication & Admin API Tests
 *
 * TESTING PATTERNS DEMONSTRATED:
 * ================================
 *
 * 1. BDD-Style Organization (describe/it):
 *    - Clear test structure with nested contexts
 *    - Self-documenting test names
 *    - Logical grouping by feature
 *
 * 2. Test Isolation (beforeAll/afterAll):
 *    - Setup creates fresh test data before suite
 *    - Teardown removes all test data after suite
 *    - No dependencies on external seeds or fixtures
 *    - Each test suite is self-contained
 *
 * 3. HTTP Testing Without Server:
 *    - Tests Hono app directly via request() API
 *    - No need to start actual HTTP server
 *    - Faster test execution
 *    - Easier debugging
 *
 * 4. Test Data Management:
 *    - Constants for reusable test credentials
 *    - Module-level variables for shared test state
 *    - Clear separation between setup data and test data
 *
 * 5. Assertion Best Practices:
 *    - Test both success and failure paths
 *    - Verify response status codes
 *    - Check response structure and content
 *    - Validate side effects (e.g., soft deletes)
 *
 * 6. Security Testing:
 *    - Test authentication flows
 *    - Verify authorization rules
 *    - Check token validation
 *    - Test password change workflows
 *
 * LEARNING RESOURCES:
 * ===================
 * - Deno Testing: https://deno.com/manual/basics/testing
 * - BDD Style: https://jsr.io/@std/testing/doc/bdd
 * - Hono Testing: https://hono.dev/getting-started/testing
 */

// ==============================================================================
// TEST STATE
// ==============================================================================
// Module-level variables store shared state across tests within this suite.
// This is acceptable because tests run sequentially and build upon each other.

let authToken = ""; // Regular user's JWT token
let adminToken = ""; // Superadmin's JWT token
let testUserId = 0; // ID of the created regular user
let testAdminId = 0; // ID of the created admin user

// ==============================================================================
// TEST CONFIGURATION
// ==============================================================================
// Constants for test credentials - centralized for easy maintenance

const SUPERADMIN_EMAIL = "test-superadmin@test.local";
const SUPERADMIN_PASSWORD = "TestSuperAdmin123!";

// ==============================================================================
// HELPER FUNCTIONS
// ==============================================================================

/**
 * Helper function to make API requests via Hono app
 *
 * This function demonstrates testing HTTP handlers without starting a server.
 * Benefits:
 * - Faster test execution (no network overhead)
 * - No port conflicts
 * - Easier debugging (direct function calls)
 *
 * @param endpoint - API endpoint path (e.g., "/auth/login")
 * @param options - Fetch API options (method, body, headers)
 * @returns Object containing HTTP status and parsed response data
 */
async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const response = await app.request(endpoint, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  let data;
  const contentType = response.headers.get("Content-Type");
  if (contentType?.includes("application/json")) {
    data = await response.json();
  } else {
    const text = await response.text();
    data = { message: text };
  }

  return { status: response.status, data };
}

// ==============================================================================
// TEST SUITE
// ==============================================================================

describe("Auth API", () => {
  // ----------------------------------------------------------------------------
  // SETUP & TEARDOWN
  // ----------------------------------------------------------------------------

  /**
   * Setup Hook: Runs once before all tests in this suite
   *
   * Creates minimal test data needed by multiple tests.
   * Only creates data that is truly shared - individual tests
   * create their own specific data.
   *
   * IMPORTANT: Always clean up in afterAll() to avoid test pollution.
   */
  beforeAll(async () => {
    console.log("\n[SETUP] Creating test data...");

    // Create superadmin for admin API tests
    const hashedPassword = await hashPassword(SUPERADMIN_PASSWORD);
    await db.insert(users).values({
      email: SUPERADMIN_EMAIL,
      username: "test-superadmin",
      password: hashedPassword,
      role: "superadmin",
      isActive: true,
      isEmailVerified: true,
    });

    console.log(`[SETUP] Superadmin created: ${SUPERADMIN_EMAIL}`);
  });

  // Teardown: Clean up after all tests
  afterAll(async () => {
    console.log("\n[CLEANUP] Removing test data...");

    // Delete all tokens
    await db.delete(authTokens);

    // Delete all test users
    await db.execute(
      sql`DELETE FROM users WHERE email LIKE '%@test.local' OR email LIKE '%@example.com'`,
    );

    console.log("[CLEANUP] Test data removed");

    // Close DB connection
    try {
      await db.$client.end();
    } catch {
      // Ignore
    }
  });

  describe("Registration", () => {
    it("should register a new user", async () => {
      const { status, data } = await apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email: "testuser@example.com",
          password: "TestPass123!",
          username: "testuser",
        }),
      });

      assertEquals(status, 201);
      assertEquals(data.status, "success");
      assertExists(data.data.user);
      assertExists(data.data.token);
      assertEquals(data.data.user.email, "testuser@example.com");

      // Save for later tests
      authToken = data.data.token;
      testUserId = data.data.user.id;
    });

    it("should reject duplicate registration", async () => {
      const { status, data } = await apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email: "testuser@example.com",
          password: "TestPass123!",
          username: "testuser2",
        }),
      });

      assertEquals(status, 400);
      assertEquals(data.status, "error");
    });
  });

  describe("Login", () => {
    it("should login superadmin", async () => {
      const { status, data } = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: SUPERADMIN_EMAIL,
          password: SUPERADMIN_PASSWORD,
        }),
      });

      assertEquals(status, 200);
      assertEquals(data.status, "success");
      assertExists(data.data.token);
      assertEquals(data.data.user.email, SUPERADMIN_EMAIL);

      adminToken = data.data.token;
    });

    it("should reject wrong password", async () => {
      const { status, data } = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: "testuser@example.com",
          password: "WrongPassword123!",
        }),
      });

      assertEquals(status, 401);
      assertEquals(data.status, "error");
    });
  });

  describe("Protected Routes", () => {
    it("should get current user with valid token", async () => {
      const { status, data } = await apiRequest("/auth/me", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      assertEquals(status, 200);
      assertEquals(data.status, "success");
      assertEquals(data.data.email, "testuser@example.com");
      assertEquals(data.data.password, undefined);
    });

    it("should reject access without token", async () => {
      const { status, data } = await apiRequest("/auth/me", {
        method: "GET",
      });

      assertEquals(status, 401);
      assertEquals(data.status, "error");
    });

    it("should reject invalid token", async () => {
      const { status, data } = await apiRequest("/auth/me", {
        method: "GET",
        headers: {
          Authorization: "Bearer invalid-token-12345",
        },
      });

      assertEquals(status, 401);
      assertEquals(data.status, "error");
    });
  });

  describe("Password Change", () => {
    it("should change password", async () => {
      const { status, data } = await apiRequest("/auth/change-password", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          currentPassword: "TestPass123!",
          newPassword: "NewTestPass123!",
        }),
      });

      assertEquals(status, 200);
      assertEquals(data.status, "success");
    });

    it("should reject old password after change", async () => {
      const { status, data } = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: "testuser@example.com",
          password: "TestPass123!",
        }),
      });

      assertEquals(status, 401);
      assertEquals(data.status, "error");
    });

    it("should login with new password", async () => {
      const { status, data } = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: "testuser@example.com",
          password: "NewTestPass123!",
        }),
      });

      assertEquals(status, 200);
      assertEquals(data.status, "success");
      authToken = data.data.token;
    });
  });

  describe("Admin API", () => {
    it("should create admin user", async () => {
      const { status, data } = await apiRequest("/admin/users", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          email: "admin1@example.com",
          username: "admin1",
          password: "AdminPass123!",
        }),
      });

      assertEquals(status, 201);
      assertEquals(data.status, "success");
      testAdminId = data.data.id;
    });

    it("should list all users (paginated)", async () => {
      const { status, data } = await apiRequest(
        "/admin/users?page=1&limit=10",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        },
      );

      assertEquals(status, 200);
      assertEquals(data.status, "success");
      assertExists(data.data.users);
      assertExists(data.data.total);
    });

    it("should get user by ID", async () => {
      const { status, data } = await apiRequest(`/admin/users/${testUserId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      assertEquals(status, 200);
      assertEquals(data.status, "success");
      assertEquals(data.data.id, testUserId);
    });

    it("should update user", async () => {
      const { status, data } = await apiRequest(`/admin/users/${testUserId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          username: "testuser_updated",
          isActive: true,
        }),
      });

      assertEquals(status, 200);
      assertEquals(data.status, "success");
      assertEquals(data.data.username, "testuser_updated");
    });

    it("should delete user (soft delete)", async () => {
      const { status, data } = await apiRequest(`/admin/users/${testAdminId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      assertEquals(status, 200);
      assertEquals(data.status, "success");
    });

    it("should verify user is deactivated after deletion", async () => {
      const { status, data } = await apiRequest(`/admin/users/${testAdminId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      assertEquals(status, 200);
      assertEquals(data.data.isActive, false);
    });
  });

  describe("Logout", () => {
    it("should logout user", async () => {
      const { status, data } = await apiRequest("/auth/logout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      assertEquals(status, 200);
      assertEquals(data.status, "success");
    });

    it("should reject access with revoked token", async () => {
      const { status, data } = await apiRequest("/auth/me", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      assertEquals(status, 401);
      assertEquals(data.status, "error");
    });
  });
});
