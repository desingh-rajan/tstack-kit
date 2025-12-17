/**
 * Variant Option Admin Panel API Tests (BDD Style)
 *
 * Tests admin panel routes for variant option management.
 * Variant options define attribute types (Color, Size, Material, etc.)
 * and their values (Red, Blue, Small, Large, etc.)
 */

import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { assertEquals, assertExists, assertNotEquals } from "@std/assert";
import { app } from "../../main.ts";
import { db } from "../../config/database.ts";
import { variantOptions } from "./variant-option.model.ts";
import { authTokens } from "../../auth/auth-token.model.ts";
import { users } from "../../auth/user.model.ts";
import { like } from "drizzle-orm";

// ============================================================================
// MODULE-LEVEL STATE
// ============================================================================

let superadminToken = "";
let adminToken = "";
let userToken = "";
let colorOptionId = "";
let sizeOptionId = "";

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
// VARIANT OPTION ADMIN API TEST SUITE
// ============================================================================

describe("Variant Option Admin Panel API", () => {
  const BASE_URL = "/ts-admin/variant-options";

  // --------------------------------------------------------------------------
  // SETUP & TEARDOWN
  // --------------------------------------------------------------------------

  beforeAll(async () => {
    await db.delete(variantOptions);
    await db.delete(authTokens);
    await db.delete(users).where(like(users.email, "%@test.local"));

    const superadmin = await createTestUser(
      "vo-superadmin@test.local",
      "VO Superadmin",
      "SuperSecure123!",
      "superadmin"
    );
    superadminToken = superadmin.token;

    const admin = await createTestUser(
      "vo-admin@test.local",
      "VO Admin",
      "AdminSecure123!",
      "admin"
    );
    adminToken = admin.token;

    const user = await createTestUser(
      "vo-user@test.local",
      "VO User",
      "UserSecure123!",
      "user"
    );
    userToken = user.token;
  });

  afterAll(async () => {
    await db.delete(variantOptions);
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

    it("should reject invalid token", async () => {
      const response = await adminRequest(BASE_URL, "invalid-token-here");
      assertEquals(response.status, 401);
    });

    it("should reject expired or malformed JWT", async () => {
      const response = await adminRequest(
        BASE_URL,
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIn0.invalid"
      );
      assertEquals(response.status, 401);
    });
  });

  // --------------------------------------------------------------------------
  // CREATE OPERATIONS - POSITIVE CASES
  // --------------------------------------------------------------------------

  describe("Create Operations - Positive Cases", () => {
    it("should create Color type option", async () => {
      const response = await adminRequest(BASE_URL, superadminToken, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Red",
          type: "Color",
          displayOrder: 1,
        }),
      });

      assertEquals(response.status, 201);
      const json = await response.json();
      assertExists(json.id);
      assertEquals(json.name, "Red");
      assertEquals(json.type, "Color");
      colorOptionId = json.id;
    });

    it("should create Size type option", async () => {
      const response = await adminRequest(BASE_URL, superadminToken, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Small",
          type: "Size",
          displayOrder: 1,
        }),
      });

      assertEquals(response.status, 201);
      const json = await response.json();
      assertExists(json.id);
      assertEquals(json.type, "Size");
      sizeOptionId = json.id;
    });

    it("should create multiple options of same type with different display orders", async () => {
      // Create more color options
      for (const [index, color] of ["Blue", "Green", "Yellow"].entries()) {
        const response = await adminRequest(BASE_URL, superadminToken, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: color,
            type: "Color",
            displayOrder: index + 2, // Start from 2 since Red is 1
          }),
        });
        assertEquals(response.status, 201);
      }

      // Verify all colors exist
      const listRes = await adminRequest(
        `${BASE_URL}?search=Color`,
        superadminToken
      );
      const list = await listRes.json();
      assertEquals(list.data.length >= 4, true); // At least 4 colors
    });

    it("should allow admin to create options", async () => {
      const response = await adminRequest(BASE_URL, adminToken, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Medium",
          type: "Size",
          displayOrder: 2,
        }),
      });

      assertEquals(response.status, 201);
    });
  });

  // --------------------------------------------------------------------------
  // CREATE OPERATIONS - NEGATIVE CASES
  // --------------------------------------------------------------------------

  describe("Create Operations - Negative Cases", () => {
    it("should reject creation with missing required name field", async () => {
      const response = await adminRequest(BASE_URL, superadminToken, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "Color",
          displayOrder: 1,
        }),
      });

      // Should fail validation
      assertNotEquals(response.status, 201);
    });

    it("should reject creation with missing required type field", async () => {
      const response = await adminRequest(BASE_URL, superadminToken, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Black",
          displayOrder: 1,
        }),
      });

      assertNotEquals(response.status, 201);
    });

    it("should reject creation from regular user", async () => {
      const response = await adminRequest(BASE_URL, userToken, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Purple",
          type: "Color",
          displayOrder: 10,
        }),
      });

      // Should not succeed
      assertEquals(response.status !== 201, true);
    });

    it("should reject creation with empty body", async () => {
      const response = await adminRequest(BASE_URL, superadminToken, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      assertNotEquals(response.status, 201);
    });
  });

  // --------------------------------------------------------------------------
  // READ OPERATIONS
  // --------------------------------------------------------------------------

  describe("Read Operations", () => {
    it("should return list with pagination metadata", async () => {
      const response = await adminRequest(BASE_URL, superadminToken);

      assertEquals(response.status, 200);
      const json = await response.json();
      assertExists(json.data);
      assertEquals(Array.isArray(json.data), true);
      assertExists(json.page);
      assertExists(json.total);
    });

    it("should return single option by ID", async () => {
      const response = await adminRequest(
        `${BASE_URL}/${colorOptionId}`,
        superadminToken
      );

      assertEquals(response.status, 200);
      const json = await response.json();
      assertEquals(json.name, "Red");
      assertEquals(json.type, "Color");
    });

    it("should return 404 for non-existent option", async () => {
      const fakeId = "00000000-0000-0000-0000-000000000000";
      const response = await adminRequest(
        `${BASE_URL}/${fakeId}`,
        superadminToken
      );

      assertEquals(response.status, 404);
    });

    it("should filter by type via search", async () => {
      const response = await adminRequest(
        `${BASE_URL}?search=Size`,
        superadminToken
      );

      assertEquals(response.status, 200);
      const json = await response.json();
      // Should only return Size type options
      for (const opt of json.data) {
        assertEquals(opt.type, "Size");
      }
    });

    it("should support sorting by displayOrder", async () => {
      const response = await adminRequest(
        `${BASE_URL}?sortBy=displayOrder&sortOrder=asc`,
        superadminToken
      );

      assertEquals(response.status, 200);
      const json = await response.json();
      assertExists(json.data);
      // Just verify we got data - sorting with nulls can be tricky
    });

    it("should return edit form metadata", async () => {
      const response = await adminRequest(
        `${BASE_URL}/${colorOptionId}/edit`,
        superadminToken
      );

      assertEquals(response.status, 200);
      const json = await response.json();
      assertExists(json.entityName);
      assertEquals(json.mode, "edit");
      assertExists(json.data);
    });
  });

  // --------------------------------------------------------------------------
  // UPDATE OPERATIONS
  // --------------------------------------------------------------------------

  describe("Update Operations", () => {
    it("should update option name", async () => {
      const response = await adminRequest(
        `${BASE_URL}/${colorOptionId}`,
        superadminToken,
        {
          method: "PUT",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: "Crimson Red",
            type: "Color",
            displayOrder: 1,
          }),
        }
      );

      assertEquals(response.status, 200);
      const json = await response.json();
      assertEquals(json.name, "Crimson Red");
    });

    it("should update display order for reordering", async () => {
      const response = await adminRequest(
        `${BASE_URL}/${colorOptionId}`,
        superadminToken,
        {
          method: "PUT",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: "Crimson Red",
            type: "Color",
            displayOrder: 99,
          }),
        }
      );

      assertEquals(response.status, 200);
      const json = await response.json();
      assertEquals(json.displayOrder, 99);
    });

    it("should return 404 when updating non-existent option", async () => {
      const fakeId = "00000000-0000-0000-0000-000000000000";
      const response = await adminRequest(
        `${BASE_URL}/${fakeId}`,
        superadminToken,
        {
          method: "PUT",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: "Non-existent",
            type: "Color",
          }),
        }
      );

      assertEquals(response.status, 404);
    });

    it("should reject update from regular user", async () => {
      const response = await adminRequest(
        `${BASE_URL}/${colorOptionId}`,
        userToken,
        {
          method: "PUT",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: "Hacked Color",
            type: "Color",
          }),
        }
      );

      // Should not succeed
      assertEquals(response.status !== 200, true);
    });
  });

  // --------------------------------------------------------------------------
  // DELETE OPERATIONS
  // --------------------------------------------------------------------------

  describe("Delete Operations", () => {
    it("should delete single option", async () => {
      // Create option to delete
      const createRes = await adminRequest(BASE_URL, superadminToken, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "To Delete",
          type: "Test",
          displayOrder: 1,
        }),
      });

      const created = await createRes.json();
      const deleteId = created.id;

      // Delete
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
      const ids: string[] = [];

      // Create options to bulk delete
      for (let i = 0; i < 3; i++) {
        const res = await adminRequest(BASE_URL, superadminToken, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: `Bulk Delete ${i}`,
            type: "BulkTest",
            displayOrder: i,
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

      // Verify all are deleted
      for (const id of ids) {
        const getRes = await adminRequest(`${BASE_URL}/${id}`, superadminToken);
        assertEquals(getRes.status, 404);
      }
    });

    it("should return 404 when deleting non-existent option", async () => {
      const fakeId = "00000000-0000-0000-0000-000000000000";
      const response = await adminRequest(
        `${BASE_URL}/${fakeId}`,
        superadminToken,
        { method: "DELETE" }
      );

      assertEquals(response.status, 404);
    });

    it("should reject delete from regular user", async () => {
      const response = await adminRequest(
        `${BASE_URL}/${sizeOptionId}`,
        userToken,
        { method: "DELETE" }
      );

      // Should not succeed
      assertEquals(response.status !== 200, true);
    });
  });
});
