import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.224.0/assert/mod.ts";

/**
 * Authentication API Tests
 *
 * Prerequisites:
 * 1. Server must be running: deno task dev
 * 2. Database must be migrated: deno task migrate:run
 * 3. Superadmin must be seeded: deno task db:seed
 *
 * Run: deno test --allow-all tests/auth.test.ts
 */

const BASE_URL = "http://localhost:8000/api";
let authToken = "";
let adminToken = "";
let testUserId = 0;
let testAdminId = 0;

/**
 * Helper function to make API requests
 */
async function apiRequest(
  endpoint: string,
  options: RequestInit = {},
  // deno-lint-ignore no-explicit-any
): Promise<{ status: number; data: any }> {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await response.json();
  return { status: response.status, data };
}

Deno.test("Auth API Tests", async (t) => {
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

    console.log("✅ User registered successfully");
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
    console.log("✅ Duplicate registration blocked correctly");
  });

  // ============================================
  // 3. LOGIN WITH SUPERADMIN
  // ============================================
  await t.step("3. Login with superadmin", async () => {
    const { status, data } = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: "superadmin@tstack.in",
        password: "TonyStack@2025!",
      }),
    });

    assertEquals(status, 200);
    assertEquals(data.status, "success");
    assertExists(data.data.token);
    assertEquals(data.data.user.email, "superadmin@tstack.in");

    // Save admin token for admin API tests
    adminToken = data.data.token;

    console.log("✅ Superadmin logged in successfully");
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
    console.log("✅ Invalid credentials blocked correctly");
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

    console.log("✅ Current user retrieved successfully");
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
      console.log("✅ Unauthorized access blocked correctly");
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
      console.log("✅ Invalid token blocked correctly");
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
    console.log("✅ Password changed successfully");
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
    console.log("✅ Old password rejected after change");
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

    console.log("✅ Login with new password successful");
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

    console.log("✅ Admin user created successfully");
    console.log(`   Admin ID: ${testAdminId}`);
  });

  // ============================================
  // 12. GET ALL USERS (ADMIN ONLY)
  // ============================================
  await t.step("12. Get all users (paginated)", async () => {
    const { status, data } = await apiRequest("/admin/users?page=1&limit=10", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });

    assertEquals(status, 200);
    assertEquals(data.status, "success");
    assertExists(data.data.users);
    assertExists(data.data.total);
    assertExists(data.data.page);
    assertExists(data.data.totalPages);

    console.log("✅ Users list retrieved successfully");
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

    console.log("✅ User retrieved by ID successfully");
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

    console.log("✅ User updated successfully");
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
      console.log(`⚠️  Note: RBAC not implemented yet. Status: ${status}`);
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

    console.log("✅ User deleted successfully (soft delete)");
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

    console.log("✅ User is deactivated (soft delete confirmed)");
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

    console.log("✅ User logged out successfully");
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

    console.log("✅ Revoked token blocked correctly");
  });
});
