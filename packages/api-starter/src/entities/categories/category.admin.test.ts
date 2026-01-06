/**
 * Category Admin Panel API Tests (BDD Style)
 *
 * Tests admin panel routes for category management.
 * Uses @tstack/admin v2.0.0+ JSON API interface.
 */

import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { assertEquals, assertExists } from "@std/assert";
import { app } from "../../main.ts";
import { db } from "../../config/database.ts";
import { categories } from "./category.model.ts";
import { authTokens } from "../../auth/auth-token.model.ts";
import { users } from "../../auth/user.model.ts";
import { like } from "drizzle-orm";

// ============================================================================
// MODULE-LEVEL STATE
// ============================================================================

let superadminToken = "";
let adminToken = "";
let userToken = "";
let testCategoryId = "";
let parentCategoryId = "";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

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

async function createTestUser(
  email: string,
  name: string,
  password: string,
  role: "superadmin" | "admin" | "user" = "user",
): Promise<{ token: string; userId: number }> {
  const { hashPassword } = await import("../../shared/utils/password.ts");

  const [user] = await db
    .insert(users)
    .values({
      email,
      username: name.replace(/\s+/g, "").toLowerCase(),
      password: await hashPassword(password),
      role,
      isActive: true,
      isEmailVerified: true,
    })
    .returning();

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
// CATEGORY ADMIN API TEST SUITE
// ============================================================================

describe({
  name: "Category Admin Panel API",
  sanitizeResources: false,
  sanitizeOps: false,
}, () => {
  const BASE_URL = "/ts-admin/categories";

  // --------------------------------------------------------------------------
  // SETUP & TEARDOWN
  // --------------------------------------------------------------------------

  beforeAll(async () => {
    // Clean up any leftover test data first
    await db.delete(categories);
    await db.delete(authTokens);
    await db.delete(users).where(like(users.email, "%@test.local"));

    // Create superadmin user
    const superadmin = await createTestUser(
      "cat-superadmin@test.local",
      "Cat Superadmin",
      "SuperSecure123!",
      "superadmin",
    );
    superadminToken = superadmin.token;

    // Create admin user
    const admin = await createTestUser(
      "cat-admin@test.local",
      "Cat Admin",
      "AdminSecure123!",
      "admin",
    );
    adminToken = admin.token;

    // Create regular user
    const user = await createTestUser(
      "cat-user@test.local",
      "Cat User",
      "UserSecure123!",
      "user",
    );
    userToken = user.token;
  });

  afterAll(async () => {
    await db.delete(categories);
    await db.delete(authTokens);
    await db.delete(users).where(like(users.email, "%@test.local"));

    try {
      await db.$client.end();
    } catch {
      // Ignore
    }
  });

  // --------------------------------------------------------------------------
  // AUTHORIZATION TESTS
  // --------------------------------------------------------------------------

  describe({
    name: "Authorization",
    sanitizeResources: false,
    sanitizeOps: false,
  }, () => {
    it("should deny access without authentication", async () => {
      const response = await app.request(BASE_URL);
      assertEquals(response.status, 401);
    });

    it("should deny access to regular users", async () => {
      const response = await adminRequest(BASE_URL, userToken);
      // May return 403 (Forbidden) or other non-200 error
      assertEquals(response.status !== 200, true);
    });

    it("should allow admin access", async () => {
      const response = await adminRequest(BASE_URL, adminToken);
      assertEquals(response.status, 200);
    });

    it("should allow superadmin access", async () => {
      const response = await adminRequest(BASE_URL, superadminToken);
      assertEquals(response.status, 200);
    });
  });

  // --------------------------------------------------------------------------
  // LIST & METADATA ENDPOINTS
  // --------------------------------------------------------------------------

  describe({
    name: "List and Metadata",
    sanitizeResources: false,
    sanitizeOps: false,
  }, () => {
    it("should return JSON list with pagination metadata", async () => {
      const response = await adminRequest(BASE_URL, superadminToken);

      assertEquals(response.status, 200);
      assertEquals(
        response.headers.get("content-type")?.split(";")[0],
        "application/json",
      );

      const json = await response.json();
      assertExists(json.data);
      assertEquals(Array.isArray(json.data), true);
      assertExists(json.page);
      assertExists(json.total);
    });

    it("should return entity metadata for create form", async () => {
      const response = await adminRequest(`${BASE_URL}/new`, superadminToken);

      assertEquals(response.status, 200);

      const json = await response.json();
      assertExists(json.entityName);
      assertEquals(json.mode, "create");
      assertExists(json.columns);
    });

    it("should support pagination parameters", async () => {
      const response = await adminRequest(
        `${BASE_URL}?page=1&limit=10`,
        superadminToken,
      );

      assertEquals(response.status, 200);

      const json = await response.json();
      assertEquals(json.page, 1);
      assertEquals(json.limit, 10);
    });
  });

  // --------------------------------------------------------------------------
  // CREATE OPERATIONS
  // --------------------------------------------------------------------------

  describe({
    name: "Create Operations",
    sanitizeResources: false,
    sanitizeOps: false,
  }, () => {
    it("should create parent category via JSON API", async () => {
      const response = await adminRequest(BASE_URL, superadminToken, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Parent Category",
          slug: "parent-category",
          description: "A parent category",
          displayOrder: 1,
          isActive: true,
        }),
      });

      assertEquals(response.status, 201);

      const json = await response.json();
      assertExists(json.id);
      parentCategoryId = json.id;
    });

    it("should create child category with parent reference", async () => {
      const response = await adminRequest(BASE_URL, superadminToken, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Child Category",
          slug: "child-category",
          description: "A child category",
          parentId: parentCategoryId,
          displayOrder: 1,
          isActive: true,
        }),
      });

      assertEquals(response.status, 201);

      const json = await response.json();
      assertExists(json.id);
      testCategoryId = json.id;
      assertEquals(json.parentId, parentCategoryId);
    });

    it("should support search functionality", async () => {
      const response = await adminRequest(
        `${BASE_URL}?search=Parent`,
        superadminToken,
      );

      assertEquals(response.status, 200);

      const json = await response.json();
      assertEquals(json.data.length > 0, true);
    });

    it("should support sorting parameters", async () => {
      const response = await adminRequest(
        `${BASE_URL}?sortBy=displayOrder&sortOrder=asc`,
        superadminToken,
      );

      assertEquals(response.status, 200);

      const json = await response.json();
      assertExists(json.data);
    });
  });

  // --------------------------------------------------------------------------
  // READ OPERATIONS
  // --------------------------------------------------------------------------

  describe({
    name: "Read Operations",
    sanitizeResources: false,
    sanitizeOps: false,
  }, () => {
    it("should return single category as JSON", async () => {
      const response = await adminRequest(
        `${BASE_URL}/${testCategoryId}`,
        superadminToken,
      );

      assertEquals(response.status, 200);

      const json = await response.json();
      assertEquals(json.name, "Child Category");
    });

    it("should return entity metadata with data for edit form", async () => {
      const response = await adminRequest(
        `${BASE_URL}/${testCategoryId}/edit`,
        superadminToken,
      );

      assertEquals(response.status, 200);

      const json = await response.json();
      assertExists(json.entityName);
      assertEquals(json.mode, "edit");
      assertExists(json.data);
      assertEquals(json.data.name, "Child Category");
    });
  });

  // --------------------------------------------------------------------------
  // UPDATE OPERATIONS
  // --------------------------------------------------------------------------

  describe({
    name: "Update Operations",
    sanitizeResources: false,
    sanitizeOps: false,
  }, () => {
    it("should update category via JSON API", async () => {
      const response = await adminRequest(
        `${BASE_URL}/${testCategoryId}`,
        superadminToken,
        {
          method: "PUT",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: "Updated Child Category",
            slug: "child-category",
            description: "Updated description",
            parentId: parentCategoryId,
            displayOrder: 2,
            isActive: true,
          }),
        },
      );

      assertEquals(response.status, 200);

      const json = await response.json();
      assertEquals(json.name, "Updated Child Category");
    });
  });

  // --------------------------------------------------------------------------
  // DELETE OPERATIONS
  // --------------------------------------------------------------------------

  describe({
    name: "Delete Operations",
    sanitizeResources: false,
    sanitizeOps: false,
  }, () => {
    it("should delete single category", async () => {
      // Create category to delete
      const createRes = await adminRequest(BASE_URL, superadminToken, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Category to Delete",
          slug: "category-to-delete",
          isActive: true,
        }),
      });

      const created = await createRes.json();
      const deleteId = created.id;

      // Delete it
      const deleteRes = await adminRequest(
        `${BASE_URL}/${deleteId}`,
        superadminToken,
        { method: "DELETE" },
      );

      assertEquals(deleteRes.status, 200);

      // Verify deletion
      const getRes = await adminRequest(
        `${BASE_URL}/${deleteId}`,
        superadminToken,
      );
      assertEquals(getRes.status, 404);
    });

    it("should support bulk delete", async () => {
      // Create categories to delete
      const ids: string[] = [];
      for (let i = 0; i < 2; i++) {
        const res = await adminRequest(BASE_URL, superadminToken, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: `Bulk Delete Category ${i}`,
            slug: `bulk-delete-category-${i}`,
            isActive: true,
          }),
        });
        const json = await res.json();
        ids.push(json.id);
      }

      // Bulk delete
      const deleteRes = await adminRequest(
        `${BASE_URL}/bulk-delete`,
        superadminToken,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ids }),
        },
      );

      assertEquals(deleteRes.status, 200);
    });
  });
});
