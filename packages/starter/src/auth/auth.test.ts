import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { app } from "../main.ts";
import { db } from "../config/database.ts";
import { users } from "./user.model.ts";
import { authTokens } from "./auth-token.model.ts";
import { sql } from "drizzle-orm";

/**
 * Authentication & Admin API Tests
 *
 * Tests run against the Hono app directly (no server needed!)
 * Uses ENVIRONMENT=test environment automatically.
 * Tests superadmin login, JWT tokens, and admin endpoints.
 *
 * Run: deno task test
 * Or: ENVIRONMENT=test deno test --allow-all tests/auth.test.ts
 */

let authToken = "";
let adminToken = "";
let testUserId = 0;
let testAdminId = 0;

/**
 * Clean up test data before running tests
 * Removes all auth tokens and test users (keeps seeded superadmin and alpha)
 */
async function cleanupTestData() {
  try {
    // Delete all auth tokens
    await db.delete(authTokens);

    // Delete test users (keep seeded superadmin and alpha users)
    const superadminEmail = Deno.env.get("SUPERADMIN_EMAIL") ||
      "test-admin@test.local";
    const alphaEmail = Deno.env.get("ALPHA_EMAIL") || "test-user@test.local";

    await db.execute(sql`
      DELETE FROM ${users} 
      WHERE email NOT IN (${superadminEmail}, ${alphaEmail})
    `);

    console.log("[CLEANUP] Test data cleaned successfully");
  } catch (error) {
    console.error("[CLEANUP] Error cleaning test data:", error);
    throw error;
  }
}

/**
 * Helper function to make API requests via Hono app
 * No server required - tests run directly against the app!
 */
async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const response = await app.request(endpoint, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  // Get response text first, then try to parse as JSON
  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { message: text };
  }

  return { status: response.status, data };
}

Deno.test("Auth API Tests", async (t) => {
  try {
    // Clean up test data before starting
    await cleanupTestData();

    // ============================================
    // 1. REGISTER NEW USER
    // ============================================
    await t.step("1. Register new user", async () => {
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
      assertEquals(data.data.user.username, "testuser");

      // Save token and user ID for later tests
      authToken = data.data.token;
      testUserId = data.data.user.id;

      console.log("[SUCCESS] User registered successfully");
      console.log(`   User ID: ${testUserId}`);
      console.log(`   Token: ${authToken.substring(0, 20)}...`);
    });

    // ============================================
    // 2. REGISTER DUPLICATE USER (SHOULD FAIL)
    // ============================================
    await t.step("2. Register duplicate user (should fail)", async () => {
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
      console.log("[SUCCESS] Duplicate registration blocked correctly");
    });

    // ============================================
    // 3. LOGIN WITH SUPERADMIN
    // ============================================
    await t.step("3. Login with superadmin", async () => {
      const superadminEmail = Deno.env.get("SUPERADMIN_EMAIL") ||
        "test-admin@test.local";
      const superadminPassword = Deno.env.get("SUPERADMIN_PASSWORD") ||
        "TestPassword123!";

      const { status, data } = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: superadminEmail,
          password: superadminPassword,
        }),
      });

      assertEquals(status, 200);
      assertEquals(data.status, "success");
      assertExists(data.data.token);
      assertEquals(data.data.user.email, superadminEmail);

      // Save admin token for admin API tests
      adminToken = data.data.token;

      console.log("[SUCCESS] Superadmin logged in successfully");
      console.log(`   Admin Token: ${adminToken.substring(0, 20)}...`);
    });

    // ============================================
    // 4. LOGIN WITH WRONG PASSWORD (SHOULD FAIL)
    // ============================================
    await t.step("4. Login with wrong password (should fail)", async () => {
      const { status, data } = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: "testuser@example.com",
          password: "WrongPassword123!",
        }),
      });

      assertEquals(status, 401);
      assertEquals(data.status, "error");
      console.log("[SUCCESS] Invalid credentials blocked correctly");
    });

    // ============================================
    // 5. GET CURRENT USER (PROTECTED ROUTE)
    // ============================================
    await t.step("5. Get current user info", async () => {
      const { status, data } = await apiRequest("/auth/me", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      assertEquals(status, 200);
      assertEquals(data.status, "success");
      assertEquals(data.data.email, "testuser@example.com");
      assertEquals(data.data.username, "testuser");
      // Password should not be returned
      assertEquals(data.data.password, undefined);

      console.log("[SUCCESS] Current user retrieved successfully");
    });

    // ============================================
    // 6. ACCESS PROTECTED ROUTE WITHOUT TOKEN (SHOULD FAIL)
    // ============================================
    await t.step(
      "6. Access protected route without token (should fail)",
      async () => {
        const { status, data } = await apiRequest("/auth/me", {
          method: "GET",
        });

        assertEquals(status, 401);
        assertEquals(data.status, "error");
        console.log("[SUCCESS] Unauthorized access blocked correctly");
      },
    );

    // ============================================
    // 7. ACCESS PROTECTED ROUTE WITH INVALID TOKEN (SHOULD FAIL)
    // ============================================
    await t.step(
      "7. Access protected route with invalid token (should fail)",
      async () => {
        const { status, data } = await apiRequest("/auth/me", {
          method: "GET",
          headers: {
            Authorization: "Bearer invalid-token-12345",
          },
        });

        assertEquals(status, 401);
        assertEquals(data.status, "error");
        console.log("[SUCCESS] Invalid token blocked correctly");
      },
    );

    // ============================================
    // 8. CHANGE PASSWORD
    // ============================================
    await t.step("8. Change password", async () => {
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
      console.log("[SUCCESS] Password changed successfully");
    });

    // ============================================
    // 9. LOGIN WITH OLD PASSWORD (SHOULD FAIL)
    // ============================================
    await t.step("9. Login with old password (should fail)", async () => {
      const { status, data } = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: "testuser@example.com",
          password: "TestPass123!",
        }),
      });

      assertEquals(status, 401);
      assertEquals(data.status, "error");
      console.log("[SUCCESS] Old password rejected after change");
    });

    // ============================================
    // 10. LOGIN WITH NEW PASSWORD
    // ============================================
    await t.step("10. Login with new password", async () => {
      const { status, data } = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: "testuser@example.com",
          password: "NewTestPass123!",
        }),
      });

      assertEquals(status, 200);
      assertEquals(data.status, "success");
      assertExists(data.data.token);

      // Update token
      authToken = data.data.token;

      console.log("[SUCCESS] Login with new password successful");
    });

    // ============================================
    // 11. CREATE ADMIN USER (ADMIN ONLY)
    // ============================================
    await t.step("11. Create admin user", async () => {
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
      assertExists(data.data.id);
      assertEquals(data.data.email, "admin1@example.com");

      testAdminId = data.data.id;

      console.log("[SUCCESS] Admin user created successfully");
      console.log(`   Admin ID: ${testAdminId}`);
    });

    // ============================================
    // 12. GET ALL USERS (ADMIN ONLY)
    // ============================================
    await t.step("12. Get all users (paginated)", async () => {
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
      assertExists(data.data.page);
      assertExists(data.data.totalPages);

      console.log("[SUCCESS] Users list retrieved successfully");
      console.log(`   Total users: ${data.data.total}`);
    });

    // ============================================
    // 13. GET USER BY ID (ADMIN ONLY)
    // ============================================
    await t.step("13. Get user by ID", async () => {
      const { status, data } = await apiRequest(`/admin/users/${testUserId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      assertEquals(status, 200);
      assertEquals(data.status, "success");
      assertEquals(data.data.id, testUserId);
      assertEquals(data.data.email, "testuser@example.com");

      console.log("[SUCCESS] User retrieved by ID successfully");
    });

    // ============================================
    // 14. UPDATE USER (ADMIN ONLY)
    // ============================================
    await t.step("14. Update user", async () => {
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

      console.log("[SUCCESS] User updated successfully");
    });

    // ============================================
    // 15. REGULAR USER CANNOT ACCESS ADMIN ROUTES
    // ============================================
    await t.step(
      "15. Regular user cannot create admin (should work but create regular user)",
      async () => {
        // Note: In current implementation, any authenticated user can call admin endpoints
        // You may want to add role-based access control (RBAC) in v1.1
        const { status } = await apiRequest("/admin/users", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            email: "unauthorized@example.com",
            username: "unauthorized",
            password: "UnauthorizedPass123!",
          }),
        });

        // Currently this will succeed - add RBAC in future to restrict
        console.log(
          `[WARNING]  Note: RBAC not implemented yet. Status: ${status}`,
        );
      },
    );

    // ============================================
    // 16. DELETE USER (ADMIN ONLY)
    // ============================================
    await t.step("16. Delete user (soft delete)", async () => {
      const { status, data } = await apiRequest(`/admin/users/${testAdminId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      assertEquals(status, 200);
      assertEquals(data.status, "success");

      console.log("[SUCCESS] User deleted successfully (soft delete)");
    });

    // ============================================
    // 17. VERIFY USER IS DEACTIVATED
    // ============================================
    await t.step("17. Verify deleted user is deactivated", async () => {
      const { status, data } = await apiRequest(`/admin/users/${testAdminId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      assertEquals(status, 200);
      assertEquals(data.data.isActive, false);

      console.log("[SUCCESS] User is deactivated (soft delete confirmed)");
    });

    // ============================================
    // 18. LOGOUT
    // ============================================
    await t.step("18. Logout user", async () => {
      const { status, data } = await apiRequest("/auth/logout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      assertEquals(status, 200);
      assertEquals(data.status, "success");

      console.log("[SUCCESS] User logged out successfully");
    });

    // ============================================
    // 19. ACCESS WITH REVOKED TOKEN (SHOULD FAIL)
    // ============================================
    await t.step("19. Access with revoked token (should fail)", async () => {
      const { status, data } = await apiRequest("/auth/me", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      assertEquals(status, 401);
      assertEquals(data.status, "error");

      console.log("[SUCCESS] Revoked token blocked correctly");
    });
  } finally {
    // Close database connections to prevent resource leaks
    try {
      await db.$client.end();
    } catch {
      // Ignore errors when closing
    }
  }
});
