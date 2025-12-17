/**
 * Product Admin Panel API Tests (BDD Style)
 *
 * Tests admin panel routes for product management.
 * Products have relationships with brands, categories, and support soft delete.
 */

import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { assertEquals, assertExists, assertNotEquals } from "@std/assert";
import { app } from "../../main.ts";
import { db } from "../../config/database.ts";
import { products } from "./product.model.ts";
import { brands } from "../brands/brand.model.ts";
import { categories } from "../categories/category.model.ts";
import { authTokens } from "../../auth/auth-token.model.ts";
import { users } from "../../auth/user.model.ts";
import { like } from "drizzle-orm";

// ============================================================================
// MODULE-LEVEL STATE
// ============================================================================

let superadminToken = "";
let adminToken = "";
let userToken = "";
let testProductId = "";
let testBrandId = "";
let testCategoryId = "";

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
// PRODUCT ADMIN API TEST SUITE
// ============================================================================

describe("Product Admin Panel API", () => {
  const BASE_URL = "/ts-admin/products";

  // --------------------------------------------------------------------------
  // SETUP & TEARDOWN
  // --------------------------------------------------------------------------

  beforeAll(async () => {
    // Clean up in correct order (products reference brands/categories)
    await db.delete(products);
    await db.delete(brands);
    await db.delete(categories);
    await db.delete(authTokens);
    await db.delete(users).where(like(users.email, "%@test.local"));

    // Create test brand
    const [brand] = await db
      .insert(brands)
      .values({
        name: "Test Brand",
        slug: "test-brand",
        isActive: true,
      })
      .returning();
    testBrandId = brand.id;

    // Create test category
    const [category] = await db
      .insert(categories)
      .values({
        name: "Test Category",
        slug: "test-category",
        isActive: true,
      })
      .returning();
    testCategoryId = category.id;

    // Create users
    const superadmin = await createTestUser(
      "prod-superadmin@test.local",
      "Prod Superadmin",
      "SuperSecure123!",
      "superadmin",
    );
    superadminToken = superadmin.token;

    const admin = await createTestUser(
      "prod-admin@test.local",
      "Prod Admin",
      "AdminSecure123!",
      "admin",
    );
    adminToken = admin.token;

    const user = await createTestUser(
      "prod-user@test.local",
      "Prod User",
      "UserSecure123!",
      "user",
    );
    userToken = user.token;
  });

  afterAll(async () => {
    await db.delete(products);
    await db.delete(brands);
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
  // CREATE OPERATIONS - POSITIVE CASES
  // --------------------------------------------------------------------------

  describe("Create Operations - Positive Cases", () => {
    it("should create product with required fields only", async () => {
      const response = await adminRequest(BASE_URL, superadminToken, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Basic Product",
          slug: "basic-product",
          price: "99.99",
        }),
      });

      assertEquals(response.status, 201);
      const json = await response.json();
      assertExists(json.id);
      assertEquals(json.name, "Basic Product");
      assertEquals(json.price, "99.99");
      testProductId = json.id;
    });

    it("should create product with brand and category references", async () => {
      const response = await adminRequest(BASE_URL, superadminToken, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Full Product",
          slug: "full-product",
          description: "A product with all fields",
          brandId: testBrandId,
          categoryId: testCategoryId,
          price: "199.99",
          compareAtPrice: "249.99",
          sku: "FULL-001",
          stockQuantity: 100,
          specifications: { weight: "500g", material: "Steel" },
          isActive: true,
        }),
      });

      assertEquals(response.status, 201);
      const json = await response.json();
      assertEquals(json.brandId, testBrandId);
      assertEquals(json.categoryId, testCategoryId);
      assertEquals(json.sku, "FULL-001");
      assertEquals(json.stockQuantity, 100);
    });

    it("should create product with sale price (compareAtPrice)", async () => {
      const response = await adminRequest(BASE_URL, superadminToken, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Sale Product",
          slug: "sale-product",
          price: "79.99",
          compareAtPrice: "99.99", // Was $99.99, now $79.99
          isActive: true,
        }),
      });

      assertEquals(response.status, 201);
      const json = await response.json();
      assertEquals(json.price, "79.99");
      assertEquals(json.compareAtPrice, "99.99");
    });

    it("should create product with JSON specifications", async () => {
      const specs = {
        dimensions: { width: 10, height: 20, depth: 5 },
        features: ["waterproof", "shockproof"],
        warranty: "2 years",
      };

      const response = await adminRequest(BASE_URL, superadminToken, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Spec Product",
          slug: "spec-product",
          price: "149.99",
          specifications: specs,
        }),
      });

      assertEquals(response.status, 201);
      const json = await response.json();
      assertExists(json.specifications);
    });
  });

  // --------------------------------------------------------------------------
  // CREATE OPERATIONS - NEGATIVE CASES
  // --------------------------------------------------------------------------

  describe("Create Operations - Negative Cases", () => {
    it("should reject duplicate slug", async () => {
      const response = await adminRequest(BASE_URL, superadminToken, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Duplicate Slug Product",
          slug: "basic-product", // Already exists
          price: "49.99",
        }),
      });

      // Should fail due to unique constraint
      assertNotEquals(response.status, 201);
    });

    it("should reject duplicate SKU", async () => {
      const response = await adminRequest(BASE_URL, superadminToken, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Duplicate SKU Product",
          slug: "duplicate-sku-product",
          price: "49.99",
          sku: "FULL-001", // Already exists
        }),
      });

      assertNotEquals(response.status, 201);
    });

    it("should reject missing required name", async () => {
      const response = await adminRequest(BASE_URL, superadminToken, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          slug: "no-name-product",
          price: "49.99",
        }),
      });

      assertNotEquals(response.status, 201);
    });

    it("should reject missing required price", async () => {
      const response = await adminRequest(BASE_URL, superadminToken, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "No Price Product",
          slug: "no-price-product",
        }),
      });

      assertNotEquals(response.status, 201);
    });

    it("should reject invalid brandId reference", async () => {
      const response = await adminRequest(BASE_URL, superadminToken, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Invalid Brand Product",
          slug: "invalid-brand-product",
          price: "49.99",
          brandId: "00000000-0000-0000-0000-000000000000", // Non-existent
        }),
      });

      // Foreign key violation
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
          name: "User Product",
          slug: "user-product",
          price: "49.99",
        }),
      });

      // Should not succeed
      assertEquals(response.status !== 201, true);
    });
  });

  // --------------------------------------------------------------------------
  // READ OPERATIONS
  // --------------------------------------------------------------------------

  describe("Read Operations", () => {
    it("should return list with pagination", async () => {
      const response = await adminRequest(BASE_URL, superadminToken);

      assertEquals(response.status, 200);
      const json = await response.json();
      assertExists(json.data);
      assertEquals(Array.isArray(json.data), true);
      assertExists(json.page);
      assertExists(json.total);
    });

    it("should return single product by ID", async () => {
      const response = await adminRequest(
        `${BASE_URL}/${testProductId}`,
        superadminToken,
      );

      assertEquals(response.status, 200);
      const json = await response.json();
      assertEquals(json.name, "Basic Product");
    });

    it("should return 404 for non-existent product", async () => {
      const fakeId = "00000000-0000-0000-0000-000000000000";
      const response = await adminRequest(
        `${BASE_URL}/${fakeId}`,
        superadminToken,
      );

      assertEquals(response.status, 404);
    });

    it("should search by product name", async () => {
      const response = await adminRequest(
        `${BASE_URL}?search=Full`,
        superadminToken,
      );

      assertEquals(response.status, 200);
      const json = await response.json();
      assertEquals(json.data.length > 0, true);
      assertEquals(json.data[0].name.includes("Full"), true);
    });

    it("should search by SKU", async () => {
      const response = await adminRequest(
        `${BASE_URL}?search=FULL-001`,
        superadminToken,
      );

      assertEquals(response.status, 200);
      const json = await response.json();
      assertEquals(json.data.length > 0, true);
    });

    it("should sort by price ascending", async () => {
      const response = await adminRequest(
        `${BASE_URL}?sortBy=price&sortOrder=asc`,
        superadminToken,
      );

      assertEquals(response.status, 200);
      const json = await response.json();
      assertExists(json.data);
    });

    it("should sort by price descending", async () => {
      const response = await adminRequest(
        `${BASE_URL}?sortBy=price&sortOrder=desc`,
        superadminToken,
      );

      assertEquals(response.status, 200);
      const json = await response.json();
      assertExists(json.data);
    });
  });

  // --------------------------------------------------------------------------
  // UPDATE OPERATIONS
  // --------------------------------------------------------------------------

  describe("Update Operations", () => {
    it("should update product name and price", async () => {
      const response = await adminRequest(
        `${BASE_URL}/${testProductId}`,
        superadminToken,
        {
          method: "PUT",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: "Updated Basic Product",
            slug: "basic-product",
            price: "109.99",
          }),
        },
      );

      assertEquals(response.status, 200);
      const json = await response.json();
      assertEquals(json.name, "Updated Basic Product");
      assertEquals(json.price, "109.99");
    });

    it("should update stock quantity", async () => {
      const response = await adminRequest(
        `${BASE_URL}/${testProductId}`,
        superadminToken,
        {
          method: "PUT",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: "Updated Basic Product",
            slug: "basic-product",
            price: "109.99",
            stockQuantity: 50,
          }),
        },
      );

      assertEquals(response.status, 200);
      const json = await response.json();
      assertEquals(json.stockQuantity, 50);
    });

    it("should toggle isActive status", async () => {
      const response = await adminRequest(
        `${BASE_URL}/${testProductId}`,
        superadminToken,
        {
          method: "PUT",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: "Updated Basic Product",
            slug: "basic-product",
            price: "109.99",
            isActive: false,
          }),
        },
      );

      assertEquals(response.status, 200);
      const json = await response.json();
      assertEquals(json.isActive, false);

      // Re-enable for other tests
      await adminRequest(`${BASE_URL}/${testProductId}`, superadminToken, {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Updated Basic Product",
          slug: "basic-product",
          price: "109.99",
          isActive: true,
        }),
      });
    });

    it("should reject update with duplicate slug", async () => {
      const response = await adminRequest(
        `${BASE_URL}/${testProductId}`,
        superadminToken,
        {
          method: "PUT",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: "Updated Basic Product",
            slug: "full-product", // Already taken by another product
            price: "109.99",
          }),
        },
      );

      assertNotEquals(response.status, 200);
    });
  });

  // --------------------------------------------------------------------------
  // SOFT DELETE & RESTORE
  // --------------------------------------------------------------------------

  describe("Soft Delete & Restore", () => {
    let softDeleteProductId = "";

    it("should soft delete a product", async () => {
      // Create product to soft delete
      const createRes = await adminRequest(BASE_URL, superadminToken, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Soft Delete Product",
          slug: "soft-delete-product",
          price: "29.99",
          isActive: true,
        }),
      });

      const created = await createRes.json();
      softDeleteProductId = created.id;

      // Soft delete
      const deleteRes = await adminRequest(
        `${BASE_URL}/${softDeleteProductId}/soft`,
        superadminToken,
        { method: "DELETE" },
      );

      assertEquals(deleteRes.status, 200);

      // Verify deletedAt is set (product still exists in DB)
      const [product] = await db
        .select()
        .from(products)
        .where(like(products.slug, "soft-delete-product"));
      assertExists(product.deletedAt);
    });

    it("should restore a soft-deleted product", async () => {
      // Restore
      const restoreRes = await adminRequest(
        `${BASE_URL}/${softDeleteProductId}/restore`,
        superadminToken,
        { method: "POST" },
      );

      assertEquals(restoreRes.status, 200);

      // Verify deletedAt is null
      const [product] = await db
        .select()
        .from(products)
        .where(like(products.slug, "soft-delete-product"));
      assertEquals(product.deletedAt, null);
    });
  });

  // --------------------------------------------------------------------------
  // HARD DELETE & BULK DELETE
  // --------------------------------------------------------------------------

  describe("Delete Operations", () => {
    it("should hard delete a product", async () => {
      // Create product to delete
      const createRes = await adminRequest(BASE_URL, superadminToken, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Delete Me Product",
          slug: "delete-me-product",
          price: "9.99",
        }),
      });

      const created = await createRes.json();
      const deleteId = created.id;

      // Hard delete
      const deleteRes = await adminRequest(
        `${BASE_URL}/${deleteId}`,
        superadminToken,
        { method: "DELETE" },
      );

      assertEquals(deleteRes.status, 200);

      // Verify completely removed
      const getRes = await adminRequest(
        `${BASE_URL}/${deleteId}`,
        superadminToken,
      );
      assertEquals(getRes.status, 404);
    });

    it("should bulk delete multiple products", async () => {
      const ids: string[] = [];

      // Create products
      for (let i = 0; i < 3; i++) {
        const res = await adminRequest(BASE_URL, superadminToken, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: `Bulk Product ${i}`,
            slug: `bulk-product-${i}`,
            price: "19.99",
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

      // Verify all deleted
      for (const id of ids) {
        const getRes = await adminRequest(`${BASE_URL}/${id}`, superadminToken);
        assertEquals(getRes.status, 404);
      }
    });
  });
});
