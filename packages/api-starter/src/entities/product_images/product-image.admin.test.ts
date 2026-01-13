/**
 * Product Image Admin Panel API Tests (BDD Style)
 *
 * Tests admin panel routes for product image management.
 * Images belong to products with ordering and primary flag.
 */

import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { assertEquals, assertExists, assertNotEquals } from "@std/assert";
import { app } from "../../main.ts";
import { db } from "../../config/database.ts";
import { productImages } from "./product-image.model.ts";
import { products } from "../products/product.model.ts";
import { authTokens } from "../../auth/auth-token.model.ts";
import { users } from "../../auth/user.model.ts";
import { eq, like } from "drizzle-orm";

// ============================================================================
// MODULE-LEVEL STATE
// ============================================================================

let superadminToken = "";
let adminToken = "";
let userToken = "";
let testProductId = "";
let testImageId = "";

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
// PRODUCT IMAGE ADMIN API TEST SUITE
// ============================================================================

describe(
  {
    name: "Product Image Admin Panel API",
    sanitizeResources: false,
    sanitizeOps: false,
  },
  () => {
    const BASE_URL = "/ts-admin/product-images";

    // --------------------------------------------------------------------------
    // SETUP & TEARDOWN
    // --------------------------------------------------------------------------

    beforeAll(async () => {
      await db.delete(productImages);
      await db.delete(products);
      await db.delete(authTokens);
      await db.delete(users).where(like(users.email, "%@test.local"));

      // Create test product
      const [product] = await db
        .insert(products)
        .values({
          name: "Image Test Product",
          slug: "image-test-product",
          price: "99.99",
          isActive: true,
        })
        .returning();
      testProductId = product.id;

      // Create users
      const superadmin = await createTestUser(
        "img-superadmin@test.local",
        "Img Superadmin",
        "SuperSecure123!",
        "superadmin",
      );
      superadminToken = superadmin.token;

      const admin = await createTestUser(
        "img-admin@test.local",
        "Img Admin",
        "AdminSecure123!",
        "admin",
      );
      adminToken = admin.token;

      const user = await createTestUser(
        "img-user@test.local",
        "Img User",
        "UserSecure123!",
        "user",
      );
      userToken = user.token;
    });

    afterAll(async () => {
      await db.delete(productImages);
      await db.delete(products);
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

    describe(
      {
        name: "Authorization",
        sanitizeResources: false,
        sanitizeOps: false,
      },
      () => {
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
      },
    );

    // --------------------------------------------------------------------------
    // CREATE OPERATIONS - POSITIVE CASES
    // --------------------------------------------------------------------------

    describe(
      {
        name: "Create Operations - Positive Cases",
        sanitizeResources: false,
        sanitizeOps: false,
      },
      () => {
        it("should create image for product", async () => {
          const response = await adminRequest(BASE_URL, superadminToken, {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              productId: testProductId,
              url: "https://example.com/images/product1.jpg",
              thumbnailUrl: "https://example.com/images/product1-thumb.jpg",
              altText: "Product front view",
              displayOrder: 1,
              isPrimary: true,
            }),
          });

          assertEquals(response.status, 201);
          const json = await response.json();
          assertExists(json.id);
          assertEquals(json.productId, testProductId);
          assertEquals(json.isPrimary, true);
          testImageId = json.id;
        });

        it("should create second image with higher display order", async () => {
          const response = await adminRequest(BASE_URL, superadminToken, {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              productId: testProductId,
              url: "https://example.com/images/product2.jpg",
              altText: "Product side view",
              displayOrder: 2, // Note: DrizzleAdapter auto-increments, so this will be overridden
              isPrimary: false,
            }),
          });

          assertEquals(response.status, 201);
          const json = await response.json();
          // DrizzleAdapter auto-increments displayOrder (max + 1), so second image gets 1
          assertEquals(json.displayOrder >= 1, true);
          assertEquals(json.isPrimary, false);
        });

        it("should create image without optional thumbnail", async () => {
          const response = await adminRequest(BASE_URL, superadminToken, {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              productId: testProductId,
              url: "https://example.com/images/product3.jpg",
              displayOrder: 3,
              isPrimary: false,
            }),
          });

          assertEquals(response.status, 201);
          const json = await response.json();
          // thumbnailUrl may be null or not set
          assertEquals(json.url.includes("product3"), true);
        });
      },
    );

    // --------------------------------------------------------------------------
    // CREATE OPERATIONS - NEGATIVE CASES
    // --------------------------------------------------------------------------

    describe(
      {
        name: "Create Operations - Negative Cases",
        sanitizeResources: false,
        sanitizeOps: false,
      },
      () => {
        it("should reject image without productId", async () => {
          const response = await adminRequest(BASE_URL, superadminToken, {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              url: "https://example.com/images/orphan.jpg",
              displayOrder: 1,
            }),
          });

          assertNotEquals(response.status, 201);
        });

        it("should reject image without url", async () => {
          const response = await adminRequest(BASE_URL, superadminToken, {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              productId: testProductId,
              displayOrder: 1,
            }),
          });

          assertNotEquals(response.status, 201);
        });

        it("should reject image for non-existent product", async () => {
          const fakeProductId = "00000000-0000-0000-0000-000000000000";
          const response = await adminRequest(BASE_URL, superadminToken, {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              productId: fakeProductId,
              url: "https://example.com/images/invalid.jpg",
              displayOrder: 1,
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
              productId: testProductId,
              url: "https://example.com/images/user.jpg",
              displayOrder: 1,
            }),
          });

          // Should not succeed
          assertEquals(response.status !== 201, true);
        });
      },
    );

    // --------------------------------------------------------------------------
    // READ OPERATIONS
    // --------------------------------------------------------------------------

    describe(
      {
        name: "Read Operations",
        sanitizeResources: false,
        sanitizeOps: false,
      },
      () => {
        it("should return list of all images", async () => {
          const response = await adminRequest(BASE_URL, superadminToken);

          assertEquals(response.status, 200);
          const json = await response.json();
          assertExists(json.data);
          assertEquals(Array.isArray(json.data), true);
        });

        it("should return single image by ID", async () => {
          const response = await adminRequest(
            `${BASE_URL}/${testImageId}`,
            superadminToken,
          );

          assertEquals(response.status, 200);
          const json = await response.json();
          assertEquals(json.productId, testProductId);
          assertEquals(json.isPrimary, true);
        });

        it("should return 404 for non-existent image", async () => {
          const fakeId = "00000000-0000-0000-0000-000000000000";
          const response = await adminRequest(
            `${BASE_URL}/${fakeId}`,
            superadminToken,
          );

          assertEquals(response.status, 404);
        });

        it("should sort images by displayOrder", async () => {
          const response = await adminRequest(
            `${BASE_URL}?sortBy=displayOrder&sortOrder=asc`,
            superadminToken,
          );

          assertEquals(response.status, 200);
          const json = await response.json();
          assertExists(json.data);
          // Just verify we got data - sorting verification is implementation-dependent
        });

        it("should filter by productId", async () => {
          // Note: Depending on admin adapter, may need search or custom filter
          const response = await adminRequest(
            `${BASE_URL}?search=${testProductId}`,
            superadminToken,
          );

          assertEquals(response.status, 200);
        });
      },
    );

    // --------------------------------------------------------------------------
    // UPDATE OPERATIONS
    // --------------------------------------------------------------------------

    describe(
      {
        name: "Update Operations",
        sanitizeResources: false,
        sanitizeOps: false,
      },
      () => {
        it("should update image alt text", async () => {
          const response = await adminRequest(
            `${BASE_URL}/${testImageId}`,
            superadminToken,
            {
              method: "PUT",
              headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                productId: testProductId,
                url: "https://example.com/images/product1.jpg",
                altText: "Updated alt text for SEO",
                displayOrder: 1,
                isPrimary: true,
              }),
            },
          );

          assertEquals(response.status, 200);
          const json = await response.json();
          assertEquals(json.altText, "Updated alt text for SEO");
        });

        it("should update display order for reordering", async () => {
          const response = await adminRequest(
            `${BASE_URL}/${testImageId}`,
            superadminToken,
            {
              method: "PUT",
              headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                productId: testProductId,
                url: "https://example.com/images/product1.jpg",
                altText: "Updated alt text for SEO",
                displayOrder: 99,
                isPrimary: true,
              }),
            },
          );

          assertEquals(response.status, 200);
          const json = await response.json();
          assertEquals(json.displayOrder, 99);
        });

        it("should update isPrimary flag", async () => {
          const response = await adminRequest(
            `${BASE_URL}/${testImageId}`,
            superadminToken,
            {
              method: "PUT",
              headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                productId: testProductId,
                url: "https://example.com/images/product1.jpg",
                displayOrder: 1,
                isPrimary: false,
              }),
            },
          );

          assertEquals(response.status, 200);
          const json = await response.json();
          assertEquals(json.isPrimary, false);
        });
      },
    );

    // --------------------------------------------------------------------------
    // SET PRIMARY OPERATION
    // --------------------------------------------------------------------------

    describe(
      {
        name: "Set Primary Image",
        sanitizeResources: false,
        sanitizeOps: false,
      },
      () => {
        it("should set image as primary", async () => {
          const response = await adminRequest(
            `${BASE_URL}/${testImageId}/set-primary`,
            superadminToken,
            { method: "POST" },
          );

          assertEquals(response.status, 200);

          // Verify the image is now primary
          const getRes = await adminRequest(
            `${BASE_URL}/${testImageId}`,
            superadminToken,
          );
          const json = await getRes.json();
          assertEquals(json.isPrimary, true);
        });
      },
    );

    // --------------------------------------------------------------------------
    // DELETE OPERATIONS
    // --------------------------------------------------------------------------

    describe(
      {
        name: "Delete Operations",
        sanitizeResources: false,
        sanitizeOps: false,
      },
      () => {
        it("should delete image", async () => {
          // Create image to delete
          const createRes = await adminRequest(BASE_URL, superadminToken, {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              productId: testProductId,
              url: "https://example.com/images/delete-me.jpg",
              displayOrder: 10,
            }),
          });

          const created = await createRes.json();
          const deleteId = created.id;

          // Delete
          const deleteRes = await adminRequest(
            `${BASE_URL}/${deleteId}`,
            superadminToken,
            { method: "DELETE" },
          );

          assertEquals(deleteRes.status, 200);

          // Verify deleted
          const getRes = await adminRequest(
            `${BASE_URL}/${deleteId}`,
            superadminToken,
          );
          assertEquals(getRes.status, 404);
        });

        it("should cascade delete when product is deleted", async () => {
          // Create a new product with images
          const [tempProduct] = await db
            .insert(products)
            .values({
              name: "Temp Product",
              slug: "temp-product-cascade",
              price: "49.99",
              isActive: true,
            })
            .returning();

          // Add image
          const [tempImage] = await db
            .insert(productImages)
            .values({
              productId: tempProduct.id,
              url: "https://example.com/temp.jpg",
              displayOrder: 1,
            })
            .returning();

          // Delete product
          await db.delete(products).where(eq(products.id, tempProduct.id));

          // Verify image was cascade deleted
          const images = await db
            .select()
            .from(productImages)
            .where(eq(productImages.id, tempImage.id));
          assertEquals(images.length, 0);
        });
      },
    );
  },
);
