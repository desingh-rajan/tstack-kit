/**
 * Brand Admin Panel API Tests (BDD Style)
 *
 * Tests admin panel routes for brand management.
 * Uses @tstack/admin v2.0.0+ JSON API interface.
 */

import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { assertEquals, assertExists } from "@std/assert";
import { app } from "../../main.ts";
import { db } from "../../config/database.ts";
import { brands } from "./brand.model.ts";
import { authTokens } from "../../auth/auth-token.model.ts";
import { users } from "../../auth/user.model.ts";
import { like } from "drizzle-orm";

// ============================================================================
// MODULE-LEVEL STATE
// ============================================================================

let superadminToken = "";
let adminToken = "";
let userToken = "";
let testBrandId = "";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function adminRequest(
  endpoint: string,
  token: string,
  options: RequestInit = {}
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
  role: "superadmin" | "admin" | "user" = "user"
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
// BRAND ADMIN API TEST SUITE
// ============================================================================

describe("Brand Admin Panel API", () => {
  const BASE_URL = "/ts-admin/brands";

  // --------------------------------------------------------------------------
  // SETUP & TEARDOWN
  // --------------------------------------------------------------------------

  beforeAll(async () => {
    // Clean up any leftover test data first
    await db.delete(brands);
    await db.delete(authTokens);
    await db.delete(users).where(like(users.email, "%@test.local"));

    // Create superadmin user
    const superadmin = await createTestUser(
      "superadmin@test.local",
      "Test Superadmin",
      "SuperSecure123!",
      "superadmin"
    );
    superadminToken = superadmin.token;

    // Create admin user
    const admin = await createTestUser(
      "admin@test.local",
      "Test Admin",
      "AdminSecure123!",
      "admin"
    );
    adminToken = admin.token;

    // Create regular user
    const user = await createTestUser(
      "user@test.local",
      "Test User",
      "UserSecure123!",
      "user"
    );
    userToken = user.token;
  });

  afterAll(async () => {
    await db.delete(brands);
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

  describe("Authorization", () => {
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

  describe("List and Metadata", () => {
    it("should return JSON list with pagination metadata", async () => {
      const response = await adminRequest(BASE_URL, superadminToken);

      assertEquals(response.status, 200);
      assertEquals(
        response.headers.get("content-type")?.split(";")[0],
        "application/json"
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
        superadminToken
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

  describe("Create Operations", () => {
    it("should create brand via JSON API", async () => {
      const response = await adminRequest(BASE_URL, superadminToken, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Test Brand",
          slug: "test-brand",
          description: "A test brand for testing",
          isActive: true,
        }),
      });

      assertEquals(response.status, 201);

      const json = await response.json();
      assertExists(json.id);
      testBrandId = json.id;
    });

    it("should support search functionality", async () => {
      const response = await adminRequest(
        `${BASE_URL}?search=Test`,
        superadminToken
      );

      assertEquals(response.status, 200);

      const json = await response.json();
      assertEquals(json.data.length > 0, true);
    });

    it("should support sorting parameters", async () => {
      const response = await adminRequest(
        `${BASE_URL}?sortBy=createdAt&sortOrder=desc`,
        superadminToken
      );

      assertEquals(response.status, 200);

      const json = await response.json();
      assertExists(json.data);
    });
  });

  // --------------------------------------------------------------------------
  // READ OPERATIONS
  // --------------------------------------------------------------------------

  describe("Read Operations", () => {
    it("should return single brand as JSON", async () => {
      const response = await adminRequest(
        `${BASE_URL}/${testBrandId}`,
        superadminToken
      );

      assertEquals(response.status, 200);

      const json = await response.json();
      assertEquals(json.name, "Test Brand");
    });

    it("should return entity metadata with data for edit form", async () => {
      const response = await adminRequest(
        `${BASE_URL}/${testBrandId}/edit`,
        superadminToken
      );

      assertEquals(response.status, 200);

      const json = await response.json();
      assertExists(json.entityName);
      assertEquals(json.mode, "edit");
      assertExists(json.data);
      assertEquals(json.data.name, "Test Brand");
    });
  });

  // --------------------------------------------------------------------------
  // UPDATE OPERATIONS
  // --------------------------------------------------------------------------

  describe("Update Operations", () => {
    it("should update brand via JSON API", async () => {
      const response = await adminRequest(
        `${BASE_URL}/${testBrandId}`,
        superadminToken,
        {
          method: "PUT",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: "Updated Brand",
            slug: "test-brand",
            description: "Updated description",
            isActive: true,
          }),
        }
      );

      assertEquals(response.status, 200);

      const json = await response.json();
      assertEquals(json.name, "Updated Brand");
    });
  });

  // --------------------------------------------------------------------------
  // DELETE OPERATIONS
  // --------------------------------------------------------------------------

  describe("Delete Operations", () => {
    it("should delete single brand", async () => {
      // Create brand to delete
      const createRes = await adminRequest(BASE_URL, superadminToken, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Brand to Delete",
          slug: "brand-to-delete",
          isActive: true,
        }),
      });

      const created = await createRes.json();
      const deleteId = created.id;

      // Delete it
      const deleteRes = await adminRequest(
        `${BASE_URL}/${deleteId}`,
        superadminToken,
        { method: "DELETE" }
      );

      assertEquals(deleteRes.status, 200);

      // Verify deletion
      const getRes = await adminRequest(
        `${BASE_URL}/${deleteId}`,
        superadminToken
      );
      assertEquals(getRes.status, 404);
    });

    it("should support bulk delete", async () => {
      // Create brands to delete
      const ids: string[] = [];
      for (let i = 0; i < 2; i++) {
        const res = await adminRequest(BASE_URL, superadminToken, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: `Bulk Delete Brand ${i}`,
            slug: `bulk-delete-brand-${i}`,
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
        }
      );

      assertEquals(deleteRes.status, 200);
    });
  });
});
